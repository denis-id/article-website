import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useArticles } from '../context/ArticlesContext';
import { formatDate, timeAgo, showToast, swalConfirm, getArticleUrl } from '../utils/helpers';
import { supabase } from '../utils/supabase';

const DEFAULT_AVATARS = [
  { url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix',  label: 'Felix' },
  { url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Luna',   label: 'Luna' },
  { url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Zara',   label: 'Zara' },
  { url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Max',    label: 'Max' },
  { url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Milo',   label: 'Milo' },
  { url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Abby',    label: 'Abby' },
  { url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Bear',    label: 'Bear' },
  { url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Cat',     label: 'Cat' },
  { url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Dog',     label: 'Dog' },
  { url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Panda',   label: 'Panda' },
  { url: 'https://api.dicebear.com/8.x/bottts/svg?seed=Robot1',     label: 'Robot' },
  { url: 'https://api.dicebear.com/8.x/bottts/svg?seed=Robot2',     label: 'Robo2' },
  { url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Pixel1',  label: 'Pixel' },
  { url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Pixel2',  label: 'Pixel2' },
  { url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Aria',      label: 'Aria' },
];

export default function ProfilePage() {
  const { isLoggedIn, userData, logout, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { findById } = useArticles();   // ← pakai ArticlesContext
  const navigate = useNavigate();

  const [activeTab,    setActiveTab]    = useState('saved');
  const [savedIds,     setSavedIds]     = useState([]);
  const [likedIds,     setLikedIds]     = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(new Set());
  const [historySelectMode, setHistorySelectMode] = useState(false);
  const [selectedSaved, setSelectedSaved] = useState(new Set());
  const [savedSelectMode, setSavedSelectMode] = useState(false);
  const [selectedLiked, setSelectedLiked] = useState(new Set());
  const [likedSelectMode, setLikedSelectMode] = useState(false);
  const [, setTick] = useState(0);
  const [emailNotif,   setEmailNotif]   = useState(() => localStorage.getItem('emailNotification') === 'true');

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName,      setEditName]      = useState('');
  const [editEmail,     setEditEmail]     = useState('');
  const [editAvatar,    setEditAvatar]    = useState('');

  // Avatar modal
  const [showAvatarModal,  setShowAvatarModal]  = useState(false);
  const [avatarPreview,    setAvatarPreview]    = useState('');
  const [pendingAvatar,    setPendingAvatar]    = useState('');
  const [avatarUrlInput,   setAvatarUrlInput]   = useState('');
  const [selectedDefault,  setSelectedDefault]  = useState(null);
  const [avatarLoading,    setAvatarLoading]    = useState(false);
  const [isDragging,       setIsDragging]       = useState(false);
  const fileInputRef = useRef(null);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=0f2b3d&color=fff&size=128`;

  // ── Load data ──
  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }

    // Sync saved dari Supabase, fallback ke localStorage
    const uid = localStorage.getItem('_uid');
    if (uid) {
      // Fetch saved
      supabase
        .from('article_interactions')
        .select('article_id')
        .eq('user_id', uid)
        .eq('saved', true)
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const ids = data.map(d => String(d.article_id));
            setSavedIds(ids);
            localStorage.setItem('savedArticles', JSON.stringify(ids));
          } else {
            const local = JSON.parse(localStorage.getItem('savedArticles') || '[]');
            setSavedIds(local.map(String));
          }
        });

      // Fetch liked
      supabase
        .from('article_interactions')
        .select('article_id')
        .eq('user_id', uid)
        .eq('liked', true)
        .then(({ data, error }) => {
          if (!error && data) {
            setLikedIds(data.map(d => String(d.article_id)));
          }
        });
    } else {
      const local = JSON.parse(localStorage.getItem('savedArticles') || '[]');
      setSavedIds(local.map(String));
    }

    // Load riwayat — normalisasi ke {id: string, readAt}
    const raw = JSON.parse(localStorage.getItem('readingHistory') || '[]');
    const normalized = raw.map(h =>
      typeof h === 'object'
        ? { id: String(h.id), readAt: h.readAt }
        : { id: String(h), readAt: null }
    );
    setHistoryItems(normalized);

    const hash = window.location.hash;
    if (hash === '#history') setActiveTab('history');
    else if (hash === '#liked') setActiveTab('liked');
    else if (hash === '#settings') setActiveTab('settings');

    // Auto-update timeAgo setiap menit
    const timer = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  // ── Derived data ──
  // Cari artikel dari ArticlesContext (statis + admin) pakai string ID
  // savedArticles — urut sesuai savedIds (sudah terbaru di depan dari Supabase)
  const savedArticles = savedIds.map(sid => findById(sid)).filter(Boolean);

  // likedArticles — urut sesuai likedIds (terbaru di depan)
  const likedArticles = likedIds.map(lid => findById(lid)).filter(Boolean);

  // historyArticles — sudah urut terbaru karena unshift saat baca
  const historyArticles = historyItems
    .map(h => ({ article: findById(h.id), readAt: h.readAt }))
    .filter(h => h.article)
    .slice(0, 20);

  // ── Handlers ──
  // ── SAVED handlers ──
  const removeSaved = async (articleId) => {
    const strId = String(articleId);
    const res = await swalConfirm({ title: 'Hapus dari Simpanan?', text: 'Artikel ini akan dihapus dari daftar tersimpan kamu.', confirmText: 'Ya, Hapus' });
    if (!res.isConfirmed) return;
    const updated = savedIds.filter(x => x !== strId);
    setSavedIds(updated);
    localStorage.setItem('savedArticles', JSON.stringify(updated));
    const uid = localStorage.getItem('_uid');
    if (uid) await supabase.rpc('toggle_interaction', { p_article_id: strId, p_user_id: uid, p_field: 'saved', p_value: false });
    showToast('Artikel dihapus dari bookmark', 'success');
  };

  const deleteSelectedSaved = async () => {
    if (selectedSaved.size === 0) return;
    const res = await swalConfirm({ title: `Hapus ${selectedSaved.size} artikel?`, text: 'Artikel yang dipilih akan dihapus dari simpanan.', confirmText: 'Ya, Hapus' });
    if (!res.isConfirmed) return;
    const uid = localStorage.getItem('_uid');
    const updated = savedIds.filter(x => !selectedSaved.has(x));
    setSavedIds(updated);
    localStorage.setItem('savedArticles', JSON.stringify(updated));
    if (uid) {
      for (const id of selectedSaved) {
        await supabase.rpc('toggle_interaction', { p_article_id: id, p_user_id: uid, p_field: 'saved', p_value: false });
      }
    }
    setSelectedSaved(new Set());
    setSavedSelectMode(false);
    showToast(`${selectedSaved.size} artikel dihapus dari simpanan`, 'success');
  };

  const toggleSelectSaved = (id) => setSelectedSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAllSaved = () => setSelectedSaved(prev => prev.size === savedArticles.length ? new Set() : new Set(savedArticles.map(a => String(a.id))));

  // ── LIKED handlers ──
  const removeLiked = async (articleId) => {
    const strId = String(articleId);
    const res = await swalConfirm({ title: 'Batal suka artikel ini?', text: 'Artikel ini akan dihapus dari daftar disukai kamu.', confirmText: 'Ya, Batal Suka', confirmColor: '#f97316', icon: 'question' });
    if (!res.isConfirmed) return;
    const updated = likedIds.filter(x => x !== strId);
    setLikedIds(updated);
    const uid = localStorage.getItem('_uid');
    if (uid) await supabase.rpc('toggle_interaction', { p_article_id: strId, p_user_id: uid, p_field: 'liked', p_value: false });
    showToast('Batal suka artikel', 'info');
  };

  const deleteSelectedLiked = async () => {
    if (selectedLiked.size === 0) return;
    const res = await swalConfirm({ title: `Batal suka ${selectedLiked.size} artikel?`, text: 'Artikel yang dipilih akan dihapus dari daftar disukai.', confirmText: 'Ya, Batal Suka', confirmColor: '#f97316', icon: 'question' });
    if (!res.isConfirmed) return;
    const uid = localStorage.getItem('_uid');
    const updated = likedIds.filter(x => !selectedLiked.has(x));
    setLikedIds(updated);
    if (uid) {
      for (const id of selectedLiked) {
        await supabase.rpc('toggle_interaction', { p_article_id: id, p_user_id: uid, p_field: 'liked', p_value: false });
      }
    }
    setSelectedLiked(new Set());
    setLikedSelectMode(false);
    showToast(`${selectedLiked.size} artikel dibatalkan`, 'info');
  };

  const toggleSelectLiked = (id) => setSelectedLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAllLiked = () => setSelectedLiked(prev => prev.size === likedArticles.length ? new Set() : new Set(likedArticles.map(a => String(a.id))));

  // ── HISTORY handlers ──
  const clearHistory = async () => {
    const res = await swalConfirm({ title: 'Hapus semua riwayat?', text: 'Semua riwayat bacaan kamu akan dihapus secara permanen.', confirmText: 'Ya, Hapus Semua' });
    if (!res.isConfirmed) return;
    localStorage.removeItem('readingHistory');
    setHistoryItems([]);
    setSelectedHistory(new Set());
    setHistorySelectMode(false);
    showToast('Riwayat berhasil dihapus', 'success');
  };

  const deleteSelectedHistory = async () => {
    if (selectedHistory.size === 0) return;
    const res = await swalConfirm({ title: `Hapus ${selectedHistory.size} riwayat?`, text: 'Riwayat yang dipilih akan dihapus.', confirmText: 'Ya, Hapus' });
    if (!res.isConfirmed) return;
    const updated = historyItems.filter(h => !selectedHistory.has(h.id));
    localStorage.setItem('readingHistory', JSON.stringify(updated));
    setHistoryItems(updated);
    setSelectedHistory(new Set());
    setHistorySelectMode(false);
    showToast(`${selectedHistory.size} riwayat dihapus`, 'success');
  };

  const toggleSelectHistory = (id) => setSelectedHistory(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelectedHistory(prev => prev.size === historyArticles.length ? new Set() : new Set(historyArticles.map(h => String(h.article.id))));

  // ── LOGOUT ──
  const handleLogout = async () => {
    const res = await swalConfirm({ title: 'Keluar dari akun?', text: 'Kamu akan logout dari sesi ini.', confirmText: 'Ya, Logout', confirmColor: '#ef4444', icon: 'question' });
    if (!res.isConfirmed) return;
    logout();
    navigate('/');
  };

  const openEdit = () => {
    setEditName(userData.name || '');
    setEditEmail(userData.email || '');
    setEditAvatar(userData.avatar || '');
    setShowEditModal(true);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editName || !editEmail) { showToast('Nama dan email wajib diisi', 'error'); return; }
    const upd = {
      name: editName, email: editEmail,
      avatar: editAvatar || fallbackAvatar,
      memberSince: userData.memberSince || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    };
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.email === userData.email);
    if (idx !== -1) { users[idx] = { ...users[idx], ...upd }; localStorage.setItem('users', JSON.stringify(users)); }
    updateUser(upd);
    setShowEditModal(false);
    showToast('Profil berhasil diperbarui!', 'success');
  };

  const openAvatarModal = () => {
    const cur = userData.avatar || fallbackAvatar;
    setAvatarPreview(cur); setPendingAvatar(cur);
    setAvatarUrlInput(''); setSelectedDefault(null);
    setShowAvatarModal(true);
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false); setPendingAvatar('');
    setAvatarUrlInput(''); setSelectedDefault(null);
  };

  const readFile = (file) => {
    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar!', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('Ukuran file maksimal 5 MB!', 'error'); return; }
    const r = new FileReader();
    r.onload = (e) => { setPendingAvatar(e.target.result); setAvatarPreview(e.target.result); showToast('Foto dipilih — klik Simpan', 'info'); };
    r.readAsDataURL(file);
  };

  const handleFileChange = (e) => { if (e.target.files[0]) readFile(e.target.files[0]); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) readFile(f); };

  const previewUrl = () => {
    const url = avatarUrlInput.trim();
    if (!url) { showToast('Masukkan URL foto', 'error'); return; }
    const img = new Image();
    img.onload  = () => { setPendingAvatar(url); setAvatarPreview(url); showToast('Preview berhasil', 'success'); };
    img.onerror = () => showToast('URL tidak valid', 'error');
    img.src = url;
  };

  const selectDefault = (idx) => {
    setSelectedDefault(idx);
    const url = DEFAULT_AVATARS[idx].url;
    setPendingAvatar(url); setAvatarPreview(url);
    showToast('Avatar dipilih — klik Simpan', 'info');
  };

  const saveAvatar = () => {
    if (!pendingAvatar) { showToast('Belum ada foto yang dipilih', 'error'); return; }
    setAvatarLoading(true);
    setTimeout(() => {
      const upd = { ...userData, avatar: pendingAvatar };
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const i = users.findIndex(x => x.email === userData.email);
      if (i !== -1) { users[i].avatar = pendingAvatar; localStorage.setItem('users', JSON.stringify(users)); }
      updateUser(upd);
      setAvatarLoading(false); closeAvatarModal();
      showToast('Foto profil berhasil diperbarui! ✅', 'success');
    }, 500);
  };

  const deleteAvatar = () => {
    if (!confirm('Hapus foto profil? Avatar akan diganti dengan inisial nama.')) return;
    const fb = fallbackAvatar;
    const upd = { ...userData, avatar: fb };
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const i = users.findIndex(x => x.email === userData.email);
    if (i !== -1) { users[i].avatar = fb; localStorage.setItem('users', JSON.stringify(users)); }
    updateUser(upd); closeAvatarModal();
    showToast('Foto profil berhasil dihapus', 'success');
  };

  const handleEmailNotif = (e) => {
    setEmailNotif(e.target.checked);
    localStorage.setItem('emailNotification', e.target.checked ? 'true' : 'false');
  };

  const headingStyle = {
    fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem',
    display: 'flex', alignItems: 'center', gap: 8,
    color: 'var(--text-primary)', paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-light)',
  };

  return (
    <main>
      <div className="container">
        <div className="profile-container">

          {/* ── SIDEBAR ── */}
          <div className="profile-sidebar">
            <div className="profile-avatar" title="Klik untuk ganti foto">
              <img
                id="profileAvatar"
                src={userData.avatar || fallbackAvatar}
                alt={userData.name || 'User'}
                onError={e => { e.target.src = fallbackAvatar; }}
              />
              <div
                id="avatarOverlay"
                onClick={openAvatarModal}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 4,
                  opacity: 0, transition: 'opacity 0.22s', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <i className="fas fa-camera" style={{ fontSize: '1.4rem', color: '#fff' }}></i>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Ganti Foto</span>
              </div>
              {avatarLoading && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fas fa-spinner" style={{ fontSize: '1.4rem', color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }}></i>
                </div>
              )}
              <button className="edit-avatar" onClick={e => { e.stopPropagation(); openAvatarModal(); }} title="Ubah foto profil">
                <i className="fas fa-camera"></i>
              </button>
            </div>

            <div className="profile-info">
              <h2 id="profileName">{userData.name || 'User Name'}</h2>
              <p id="profileEmail">{userData.email || 'user@example.com'}</p>
              <p className="member-since">
                <i className="fas fa-calendar-alt"></i> Bergabung <span id="memberSince">{userData.memberSince || 'Januari 2026'}</span>
              </p>
            </div>

            <div className="profile-stats">
              <div className="stat">
                <div className="stat-value" id="savedCount">{savedIds.length}</div>
                <div className="stat-label">Tersimpan</div>
              </div>
              <div className="stat">
                <div className="stat-value">{likedIds.length}</div>
                <div className="stat-label">Disukai</div>
              </div>
              <div className="stat">
                <div className="stat-value" id="readCount">{historyItems.length}</div>
                <div className="stat-label">Dibaca</div>
              </div>
            </div>

            <button onClick={openEdit} style={{
              width: '100%', marginTop: 16, padding: 10,
              background: 'var(--accent-soft)', border: '1.5px solid var(--border-light)',
              borderRadius: 12, color: 'var(--accent)', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <i className="fas fa-user-edit"></i> Edit Profil
            </button>
          </div>

          {/* ── TABS ── */}
          <div className="profile-content">
            <div className="profile-tabs">
              <button className={`tab-btn ${activeTab === 'saved'    ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
                <i className="fas fa-bookmark"></i> Tersimpan
              </button>
              <button className={`tab-btn ${activeTab === 'liked'    ? 'active' : ''}`} onClick={() => setActiveTab('liked')}>
                <i className="fas fa-heart"></i> Disukai
              </button>
              <button className={`tab-btn ${activeTab === 'history'  ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                <i className="fas fa-history"></i> Riwayat
              </button>
              <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                <i className="fas fa-sliders-h"></i> Pengaturan
              </button>
            </div>

            {/* TAB TERSIMPAN */}
            {activeTab === 'saved' && (
              <div className="tab-content active">
                <h3 style={headingStyle}><i className="fas fa-bookmark"></i> Artikel Tersimpan</h3>

                {savedArticles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => { setSavedSelectMode(m => !m); setSelectedSaved(new Set()); }}
                      style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border-light)',
                        background: savedSelectMode ? 'var(--accent)' : 'var(--bg-surface)',
                        color: savedSelectMode ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className={`fas ${savedSelectMode ? 'fa-times' : 'fa-check-square'}`}></i>
                      {savedSelectMode ? 'Batal Pilih' : 'Pilih'}
                    </button>
                    {savedSelectMode && (
                      <button onClick={toggleSelectAllSaved}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border-light)',
                          background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-check-double"></i>
                        {selectedSaved.size === savedArticles.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    )}
                    {savedSelectMode && selectedSaved.size > 0 && (
                      <button onClick={deleteSelectedSaved}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid #fecaca',
                          background: '#fee2e2', color: '#ef4444',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-trash"></i> Hapus ({selectedSaved.size})
                      </button>
                    )}
                  </div>
                )}

                <div className="saved-list">
                  {savedArticles.length === 0
                    ? <p className="empty-state">Belum ada artikel yang disimpan</p>
                    : savedArticles.map(a => {
                      const strId = String(a.id);
                      const isSelected = selectedSaved.has(strId);
                      return (
                        <div key={strId} className="saved-item"
                          onClick={() => savedSelectMode ? toggleSelectSaved(strId) : navigate(getArticleUrl(a))}
                          style={{ cursor: 'pointer',
                            background: isSelected ? 'rgba(108,99,255,0.1)' : undefined,
                            outline: isSelected ? '1.5px solid var(--accent)' : undefined }}>
                          <img src={a.image} alt={a.title}
                            onError={e => e.target.src = 'https://placehold.co/80x60?text=No+Img'} />
                          <div className="saved-info">
                            <h4>{a.title}</h4>
                            <small>{formatDate(a.date)}</small>
                            {a.fromAdmin && <span style={{ fontSize: '10px', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>Admin</span>}
                          </div>
                          {savedSelectMode
                            ? <i className="fas fa-check-circle" style={{ flexShrink: 0, fontSize: '1.1rem', color: isSelected ? 'var(--accent)' : 'var(--border-light)', transition: '0.15s' }}></i>
                            : <button className="remove-saved" onClick={e => { e.stopPropagation(); removeSaved(a.id); }}>
                                <i className="fas fa-trash"></i>
                              </button>
                          }
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* TAB DISUKAI */}
            {activeTab === 'liked' && (
              <div className="tab-content active">
                <h3 style={headingStyle}><i className="fas fa-heart"></i> Artikel Disukai</h3>

                {likedArticles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => { setLikedSelectMode(m => !m); setSelectedLiked(new Set()); }}
                      style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border-light)',
                        background: likedSelectMode ? 'var(--accent)' : 'var(--bg-surface)',
                        color: likedSelectMode ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className={`fas ${likedSelectMode ? 'fa-times' : 'fa-check-square'}`}></i>
                      {likedSelectMode ? 'Batal Pilih' : 'Pilih'}
                    </button>
                    {likedSelectMode && (
                      <button onClick={toggleSelectAllLiked}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border-light)',
                          background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-check-double"></i>
                        {selectedLiked.size === likedArticles.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    )}
                    {likedSelectMode && selectedLiked.size > 0 && (
                      <button onClick={deleteSelectedLiked}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid #fed7aa',
                          background: '#fff7ed', color: '#f97316',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-heart-broken"></i> Batal Suka ({selectedLiked.size})
                      </button>
                    )}
                  </div>
                )}

                <div className="saved-list">
                  {likedArticles.length === 0
                    ? <p className="empty-state">Belum ada artikel yang disukai</p>
                    : likedArticles.map(a => {
                      const strId = String(a.id);
                      const isSelected = selectedLiked.has(strId);
                      return (
                        <div key={strId} className="saved-item"
                          onClick={() => likedSelectMode ? toggleSelectLiked(strId) : navigate(getArticleUrl(a))}
                          style={{ cursor: 'pointer',
                            background: isSelected ? 'rgba(249,115,22,0.08)' : undefined,
                            outline: isSelected ? '1.5px solid #f97316' : undefined }}>
                          <img src={a.image} alt={a.title}
                            onError={e => e.target.src = 'https://placehold.co/80x60?text=No+Img'} />
                          <div className="saved-info">
                            <h4>{a.title}</h4>
                            <small>{formatDate(a.date)}</small>
                            {a.fromAdmin && <span style={{ fontSize: '10px', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>Admin</span>}
                          </div>
                          {likedSelectMode
                            ? <i className="fas fa-check-circle" style={{ flexShrink: 0, fontSize: '1.1rem', color: isSelected ? '#f97316' : 'var(--border-light)', transition: '0.15s' }}></i>
                            : <button className="remove-saved" style={{ color: '#ef4444' }} onClick={e => { e.stopPropagation(); removeLiked(a.id); }} title="Batal suka">
                                <i className="fas fa-heart-broken"></i>
                              </button>
                          }
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* TAB RIWAYAT */}
            {activeTab === 'history' && (
              <div className="tab-content active">
                <h3 style={headingStyle}><i className="fas fa-history"></i> Riwayat Bacaan</h3>

                {historyArticles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Tombol pilih / batal */}
                    <button
                      onClick={() => { setHistorySelectMode(m => !m); setSelectedHistory(new Set()); }}
                      style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border-light)',
                        background: historySelectMode ? 'var(--accent)' : 'var(--bg-surface)',
                        color: historySelectMode ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className={`fas ${historySelectMode ? 'fa-times' : 'fa-check-square'}`}></i>
                      {historySelectMode ? 'Batal Pilih' : 'Pilih'}
                    </button>

                    {/* Pilih semua — hanya tampil saat mode select */}
                    {historySelectMode && (
                      <button
                        onClick={toggleSelectAll}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border-light)',
                          background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-check-double"></i>
                        {selectedHistory.size === historyArticles.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    )}

                    {/* Hapus terpilih */}
                    {historySelectMode && selectedHistory.size > 0 && (
                      <button
                        onClick={deleteSelectedHistory}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid #fecaca',
                          background: '#fee2e2', color: '#ef4444',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-trash"></i> Hapus ({selectedHistory.size})
                      </button>
                    )}

                    {/* Hapus semua — selalu tampil */}
                    <button
                      onClick={clearHistory}
                      style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid #fecaca',
                        background: 'transparent', color: '#ef4444',
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        marginLeft: 'auto' }}>
                      <i className="fas fa-trash-alt"></i> Hapus Semua
                    </button>
                  </div>
                )}

                <div className="history-list">
                  {historyArticles.length === 0
                    ? <p className="empty-state">Belum ada riwayat bacaan</p>
                    : historyArticles.map(({ article: a, readAt }) => {
                      const strId = String(a.id);
                      const isSelected = selectedHistory.has(strId);
                      return (
                        <div
                          key={strId}
                          className="history-item"
                          onClick={() => historySelectMode ? toggleSelectHistory(strId) : navigate(getArticleUrl(a))}
                          style={{ cursor: 'pointer',
                            background: isSelected ? 'rgba(108,99,255,0.1)' : undefined,
                            outline: isSelected ? '1.5px solid var(--accent)' : undefined,
                            borderRadius: 10 }}
                        >
                          <i className="fas fa-clock" style={{ flexShrink: 0, color: isSelected ? 'var(--accent)' : 'var(--text-muted)', marginTop: 0 }}></i>

                          <div className="history-item-body">
                            <div className="history-item-title">{a.title}</div>
                            <small className="history-item-time">
                              {readAt ? timeAgo(readAt) : formatDate(a.date)}
                            </small>
                          </div>

                          {/* Tanda centang di kanan saat terpilih */}
                          {historySelectMode && (
                            <i className="fas fa-check-circle" style={{
                              flexShrink: 0, fontSize: '1.1rem',
                              color: isSelected ? 'var(--accent)' : 'var(--border-light)',
                              transition: '0.15s',
                            }}></i>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* TAB PENGATURAN */}
            {activeTab === 'settings' && (
              <div className="tab-content active">
                <h3 style={headingStyle}><i className="fas fa-sliders-h"></i> Pengaturan Akun</h3>
                <div className="settings-form">
                  <div className="setting-item">
                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: 3 }}>Dark Mode</label>
                      <small style={{ color: 'var(--text-muted)' }}>Ganti tampilan terang / gelap</small>
                    </div>
                    <button className="setting-btn" onClick={toggleTheme}>Ganti Mode</button>
                  </div>
                  <div className="setting-item">
                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: 3 }}>Edit Profil</label>
                      <small style={{ color: 'var(--text-muted)' }}>Ubah nama, email, atau foto</small>
                    </div>
                    <button className="setting-btn" onClick={openEdit}><i className="fas fa-user-edit"></i> Edit</button>
                  </div>
                  <div className="setting-item">
                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: 3 }}>Notifikasi Email</label>
                      <small style={{ color: 'var(--text-muted)' }}>Terima update artikel terbaru</small>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={emailNotif} onChange={handleEmailNotif} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-item" style={{ borderBottom: 'none', paddingTop: 20 }}>
                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: 3, color: '#ef4444' }}>Keluar Akun</label>
                      <small style={{ color: 'var(--text-muted)' }}>Logout dari sesi ini</small>
                    </div>
                    <button className="btn-danger" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AVATAR MODAL ── */}
      {showAvatarModal && (
        <div className="modal-overlay" id="avatarModal" style={{ display: 'flex' }}
          onClick={e => { if (e.target.id === 'avatarModal') closeAvatarModal(); }}>
          <div className="modal-content avatar-modal-content" style={{ maxWidth: 420, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <i className="fas fa-camera" style={{ color: 'var(--accent)' }}></i> Ubah Foto Profil
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>Upload foto atau masukkan URL gambar</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, margin: '16px 0' }}>
              <img src={avatarPreview || fallbackAvatar} alt="Preview"
                onError={e => { e.target.src = fallbackAvatar; }}
                style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-light)' }} />
            </div>
            <button onClick={() => fileInputRef.current?.click()} style={{
              width: '100%', padding: 12, marginBottom: 10,
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <i className="fas fa-image"></i> Pilih dari Galeri / File
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-light)'}`,
                borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                background: isDragging ? 'var(--accent-soft)' : 'transparent', transition: '0.2s',
              }}>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}></i>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                <strong style={{ color: 'var(--accent)' }}>Drag &amp; drop</strong> foto di sini
              </p>
              <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>JPG, PNG, GIF — maks. 5 MB</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.8rem', margin: '10px 0' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border-light)' }}></span>
              atau pakai URL
              <span style={{ flex: 1, height: 1, background: 'var(--border-light)' }}></span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="url" value={avatarUrlInput} onChange={e => setAvatarUrlInput(e.target.value)}
                placeholder="https://contoh.com/foto.jpg"
                style={{
                  flex: 1, padding: '10px 14px', border: '1.5px solid var(--border-light)',
                  borderRadius: 10, background: 'var(--bg-primary)', color: 'var(--text-primary)',
                  fontSize: '0.85rem', fontFamily: 'inherit', minWidth: 0, outline: 'none',
                }} />
              <button onClick={previewUrl} style={{
                padding: '10px 16px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>Preview</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.8rem', margin: '16px 0 10px' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border-light)' }}></span>
              atau pilih avatar default
              <span style={{ flex: 1, height: 1, background: 'var(--border-light)' }}></span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 4 }}>
              {DEFAULT_AVATARS.map((av, idx) => (
                <div key={idx} onClick={() => selectDefault(idx)} title={av.label} style={{
                  cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', aspectRatio: '1',
                  border: `2px solid ${selectedDefault === idx ? 'var(--accent)' : 'var(--border-light)'}`,
                  boxShadow: selectedDefault === idx ? '0 0 0 3px rgba(56,189,248,0.25)' : 'none',
                  transition: '0.2s', background: 'var(--bg-primary)',
                }}>
                  <img src={av.url} alt={av.label} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>
              Klik avatar untuk memilih
            </p>
            <div className="modal-buttons" style={{ marginTop: 4 }}>
              <button type="button" onClick={closeAvatarModal}>Batal</button>
              <button type="button" onClick={saveAvatar}><i className="fas fa-save"></i> Simpan Foto</button>
            </div>
            <button type="button" onClick={deleteAvatar} style={{
              width: '100%', marginTop: 10, padding: 10,
              background: 'transparent', border: '1.5px solid #fecaca',
              borderRadius: 12, color: '#ef4444', fontWeight: 600,
              fontSize: '0.88rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <i className="fas fa-trash"></i> Hapus Foto Profil
            </button>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <h3><i className="fas fa-user-edit"></i> Edit Profil</h3>
            <form onSubmit={saveEdit}>
              <label>Nama Lengkap</label>
              <input type="text" className="modal-input" value={editName} onChange={e => setEditName(e.target.value)} required />
              <label>Email</label>
              <input type="email" className="modal-input" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
              <label>Avatar URL (opsional)</label>
              <input type="url" className="modal-input" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="https://..." />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) { #avatarOverlay { opacity: 0.6 !important; } }
      `}</style>
    </main>
  );
}