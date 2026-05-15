import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { formatDate, formatNumber, getArticleUrl } from '../utils/helpers';
import { useArticles } from '../context/ArticlesContext';
import { supabase } from '../utils/supabase';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query    = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { search, loading } = useArticles();

  const [statsMap, setStatsMap] = useState({}); // { article_id: {views, likes, saves} }

  const results = query ? search(query) : [];

  // Fetch stats dari Supabase untuk semua hasil pencarian
  useEffect(() => {
    if (results.length === 0) return;

    const ids = results.map(a => String(a.id));
    supabase
      .from('article_stats')
      .select('article_id, views, likes, saves')
      .in('article_id', ids)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach(r => { map[String(r.article_id)] = r; });
        setStatsMap(map);
      });
  }, [query, loading]);

  const getViews = (a) => {
    const s = statsMap[String(a.id)];
    return s ? Number(s.views) : (a.views || 0);
  };

  return (
    <main>
      <div className="container">
        <div style={{ margin: '24px 0 28px' }}>
          <center>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
              <i className="fas fa-search" style={{ color: 'var(--accent)', marginRight: 10 }}></i>
              {query ? `Hasil untuk "${query}"` : 'Cari Artikel'}
            </h1>
            {query && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Ditemukan <strong>{results.length}</strong> artikel
              </p>
            )}
          </center>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: 12, display: 'block' }}></i>
            Memuat...
          </div>
        ) : !query ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: 12, display: 'block' }}></i>
            <p>Masukkan kata kunci untuk mencari artikel</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <i className="fas fa-search-minus" style={{ fontSize: '3rem', marginBottom: 12, display: 'block' }}></i>
            <p>Tidak ada artikel yang cocok dengan "<strong>{query}</strong>"</p>
            <Link to="/" style={{ color: 'var(--accent)', marginTop: 12, display: 'inline-block' }}>
              Kembali ke Beranda
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
            {results.map(a => (
              <div key={String(a.id)} onClick={() => navigate(getArticleUrl(a))}
                style={{ cursor: 'pointer', background: 'var(--bg-surface)', borderRadius: 16,
                  border: '1px solid var(--border-light)', overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ height: 180, overflow: 'hidden' }}>
                  <img src={a.image} alt={a.title}
                    onError={e => e.target.src = 'https://placehold.co/400x200?text=No+Image'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="card-category">{a.category}</span>
                    {a.fromAdmin && (
                      <span style={{ fontSize: '10px', background: 'var(--accent-soft)',
                        color: 'var(--accent)', padding: '1px 6px', borderRadius: 4 }}>Baru</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 8,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.summary}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span><i className="fas fa-calendar" style={{ marginRight: 4 }}></i>{formatDate(a.date)}</span>
                    {/* <span><i className="fas fa-eye" style={{ marginRight: 4 }}></i>{formatNumber(getViews(a))}</span> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}