import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDate, formatNumber, timeAgo, showToast, getArticleUrl } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticlesContext';
import { supabase } from '../utils/supabase';
import Sidebar from '../components/Sidebar';

function getUserId() {
  let uid = localStorage.getItem('_uid');
  if (!uid) {
    uid = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('_uid', uid);
  }
  return uid;
}

export default function ArticlePage() {
  // Parameter bisa berupa: ID, slug, atau title
  const { id } = useParams();
  const navigate = useNavigate();
  const { findByIdOrSlugOrTitle, allArticles } = useArticles();
  const { isLoggedIn, userData } = useAuth();

  // Gunakan fungsi baru yang support ID, slug, atau title
  const article = findByIdOrSlugOrTitle(id);

  const [liked, setLiked]     = useState(false);
  const [saved, setSaved]     = useState(() => {
    if (!article) return false;
    const savedLocal = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    return savedLocal.includes(String(article.id));
  });
  const [stats, setStats]     = useState({ views: 0, likes: 0, saves: 0 });
  const [comments, setComments]               = useState([]);
  const [commentText, setCommentText]         = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const channelRef      = useRef(null);
  const statsChannelRef = useRef(null);

  // ID yang dipakai ke Supabase — selalu string
  // Artikel statis: "1", "2", dst. Artikel admin: UUID string
  const statsId = article ? String(article.id) : null;

  // ── Stats & interaksi ──
  useEffect(() => {
    if (!article || statsId === null) return;
    const uid = getUserId();

    const initStats = async () => {
      await supabase.rpc('increment_views', { p_article_id: statsId });

      const { data: s } = await supabase
        .from('article_stats')
        .select('views, likes, saves')
        .eq('article_id', statsId)
        .single();
      if (s) setStats(s);

      const { data: interaction } = await supabase
        .from('article_interactions')
        .select('liked, saved')
        .eq('article_id', statsId)
        .eq('user_id', uid)
        .single();
      if (interaction) {
        setLiked(interaction.liked);
        setSaved(interaction.saved);
      }
    };

    initStats();

    statsChannelRef.current = supabase
      .channel(`stats_${statsId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'article_stats',
        filter: `article_id=eq.${statsId}`,
      }, payload => { if (payload.new) setStats(payload.new); })
      .subscribe();

    return () => {
      if (statsChannelRef.current) supabase.removeChannel(statsChannelRef.current);
    };
  }, [statsId]);

  // ── Komentar ──
  useEffect(() => {
    if (!statsId) return;

    const fetchComments = async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', statsId)
        .order('created_at', { ascending: false });
      if (!error) setComments(data || []);
      setLoadingComments(false);
    };
    fetchComments();

    channelRef.current = supabase
      .channel(`comments_article_${statsId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_id=eq.${statsId}` },
        payload => setComments(prev => [payload.new, ...prev]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments', filter: `article_id=eq.${statsId}` },
        payload => setComments(prev => prev.filter(c => c.id !== payload.old.id)))
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [statsId]);

  // ── Setup halaman ──
  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} | Denscope`;

    // Simpan ke riwayat — gunakan String(article.id) agar konsisten
    const articleIdStr = String(article.id);
    let history = JSON.parse(localStorage.getItem('readingHistory') || '[]');
    // Migrasi format lama
    history = history.map(h => typeof h === 'object' ? h : { id: String(h), readAt: null });
    history = history.filter(h => String(h.id) !== articleIdStr);
    history.unshift({ id: articleIdStr, readAt: new Date().toISOString() });
    localStorage.setItem('readingHistory', JSON.stringify(history.slice(0, 20)));

    window.scrollTo({ top: 0 });
  }, [article?.id]);

  if (!article) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <i className="fas fa-newspaper" style={{ fontSize: '3rem', color: '#ccc' }}></i>
        <h2 style={{ margin: 0 }}>Artikel tidak ditemukan</h2>
        <p style={{ color: '#888' }}>Artikel yang kamu cari tidak tersedia.</p>
        <button onClick={() => navigate('/')} style={{ padding: '0.6rem 1.5rem', background: '#0f2b3d', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const handleLike = async () => {
    const uid = getUserId();
    const newLiked = !liked;
    setLiked(newLiked);
    setStats(prev => ({ ...prev, likes: Math.max(0, prev.likes + (newLiked ? 1 : -1)) }));
    await supabase.rpc('toggle_interaction', {
      p_article_id: statsId, p_user_id: uid, p_field: 'liked', p_value: newLiked,
    });
    showToast(newLiked ? 'Artikel disukai!' : 'Batal suka', newLiked ? 'success' : 'info');
  };

  const handleSave = async () => {
    const uid = getUserId();
    const newSaved = !saved;
    setSaved(newSaved);
    setStats(prev => ({ ...prev, saves: Math.max(0, prev.saves + (newSaved ? 1 : -1)) }));

    await supabase.rpc('toggle_interaction', {
      p_article_id: statsId, p_user_id: uid, p_field: 'saved', p_value: newSaved,
    });

    // Simpan ID artikel (sebagai string) ke localStorage untuk ProfilePage
    const savedLocal = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    const articleIdStr = String(article.id);
    if (newSaved) {
      if (!savedLocal.includes(articleIdStr)) savedLocal.push(articleIdStr);
    } else {
      const idx = savedLocal.indexOf(articleIdStr);
      if (idx > -1) savedLocal.splice(idx, 1);
    }
    localStorage.setItem('savedArticles', JSON.stringify(savedLocal));

    showToast(newSaved ? 'Artikel disimpan!' : 'Artikel dihapus dari bookmark', newSaved ? 'success' : 'info');
  };

  // Cek saved state dari localStorage saat load
  useEffect(() => {
    if (!article) return;
    const savedLocal = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    const articleIdStr = String(article.id);
    if (savedLocal.includes(articleIdStr)) setSaved(true);
  }, [article?.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article.title, url: window.location.href })
        .catch(() => navigator.clipboard.writeText(window.location.href).then(() => showToast('Link disalin!', 'success')));
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => showToast('Link berhasil disalin!', 'success'));
    }
  };

  const related = allArticles
    .filter(a => {
      if (String(a.id) === String(article.id)) return false;
      if (a.category === article.category) return true;
      return a.tags?.some(t => article.tags?.includes(t));
    })
    .slice(0, 3);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      article_id: statsId,
      author: userData.name || 'User',
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=0f2b3d&color=fff&size=64`,
      text: commentText.trim(),
    });
    if (error) {
  console.error(error);
  showToast(error.message, 'error');
}
    else { setCommentText(''); showToast('Komentar berhasil dikirim!', 'success'); }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) showToast('Gagal menghapus komentar', 'error');
    else showToast('Komentar dihapus', 'info');
  };

  return (
    <main>
      <div className="container">
        <div className="article-layout">
          <article className="article-main">

            {/* Breadcrumb */}
            <nav className="breadcrumb">
              <Link to="/">Home</Link>
              <i className="fas fa-chevron-right"></i>
              <Link to={`/category/${article.category}`}>
                {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
              </Link>
              <i className="fas fa-chevron-right"></i>
              <span>{article.title.substring(0, 40)}{article.title.length > 40 ? '...' : ''}</span>
            </nav>

            {/* Header */}
            <div className="article-header">
              <div className="card-category">
                {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
              </div>
              <h1>{article.title}</h1>
              <div className="article-meta-full">
                <div className="author-info">
                  <img src={article.authorAvatar} alt={article.author}
                    onError={e => e.target.src = '/author.jpg'} />
                  <div>
                    <span className="author-name">{article.author}</span>
                    <span className="publish-date">{formatDate(article.date)}</span>
                  </div>
                </div>
                {/* <div className="article-stats">
                  <span title="Views"><i className="fas fa-eye"></i> {formatNumber(stats.views)}</span>
                  <span title="Likes"><i className="fas fa-heart"></i> {formatNumber(stats.likes)}</span>
                  <span title="Disimpan"><i className="fas fa-bookmark"></i> {formatNumber(stats.saves)}</span>
                </div> */}
              </div>
            </div>

            {/* Hero Image */}
            <div className="article-hero-img">
              <img src={article.image} alt={article.title} />
            </div>

            {/* Content */}
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />

            {/* Tags */}
            <div className="article-tags">
              {article.tags?.map(tag => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="tag-pill">#{tag}</Link>
              ))}
            </div>

            {/* Actions */}
            <div className="article-actions">
              <button className={`action-btn like-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
                <i className="fas fa-heart"></i> Suka
              </button>
              <button className={`action-btn save-btn ${saved ? 'active' : ''}`} onClick={handleSave}>
                <i className="fas fa-bookmark"></i> {saved ? 'Tersimpan' : 'Simpan'}
              </button>
              <button className="action-btn share-btn" onClick={handleShare}>
                <i className="fas fa-share-alt"></i> Bagikan
              </button>
            </div>

            {/* Related */}
            <div className="related-section">
              <h3><i className="fas fa-layer-group"></i> Artikel Terkait</h3>
              <div className="related-grid">
                {related.length === 0
                  ? <p className="empty-state">Tidak ada artikel terkait</p>
                  : related.map(a => (
                    <div key={String(a.id)} className="related-card"
                      onClick={() => navigate(getArticleUrl(a))} style={{ cursor: 'pointer' }}>
                      <img src={a.image} alt={a.title} />
                      <div className="related-info">
                        <div className="card-category">{a.category}</div>
                        <h4>{a.title}</h4>
                        <small><i className="fas fa-calendar"></i> {formatDate(a.date)}</small>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Komentar */}
            <div className="comments-section">
              <h3><i className="fas fa-comments"></i> Komentar ({comments.length})</h3>

              {isLoggedIn ? (
                <div className="comment-form">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <img
                      src={userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=0f2b3d&color=fff&size=64`}
                      alt={userData.name}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={e => e.target.src = `https://ui-avatars.com/api/?name=User&background=0f2b3d&color=fff&size=64`}
                    />
                    <textarea
                      placeholder={`Tulis komentar sebagai ${userData.name || 'kamu'}...`}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitComment(); }}
                      rows={3} style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={handleSubmitComment} disabled={submitting || !commentText.trim()}>
                      {submitting
                        ? <><i className="fas fa-spinner fa-spin"></i> Mengirim...</>
                        : <><i className="fas fa-paper-plane"></i> Kirim</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="comment-login-prompt">
                  <i className="fas fa-lock"></i>
                  <p>Kamu harus <Link to="/login">login</Link> untuk berkomentar.</p>
                </div>
              )}

              <div className="comment-list">
                {loadingComments
                  ? <p className="empty-state"><i className="fas fa-spinner fa-spin"></i> Memuat komentar...</p>
                  : comments.length === 0
                    ? <p className="empty-state"><i className="fas fa-comment-slash"></i> Belum ada komentar. Jadilah yang pertama!</p>
                    : comments.map(c => (
                      <div key={c.id} className="comment-item">
                        <img src={c.avatar} alt={c.author}
                          onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author)}&background=0f2b3d&color=fff&size=64`} />
                        <div className="comment-body">
                          <div className="comment-header">
                            <strong>{c.author}</strong>
                            <span className="comment-time">{timeAgo(c.created_at)}</span>
                            {isLoggedIn && userData.name === c.author && (
                              <button className="comment-delete" onClick={() => handleDeleteComment(c.id)} title="Hapus">
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                          <p className="comment-text">{c.text}</p>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>

          </article>
          <Sidebar />
        </div>
      </div>
    </main>
  );
}