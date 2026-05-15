import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDate, getArticleUrl } from '../utils/helpers';
import { useArticles } from '../context/ArticlesContext';
import { useCategories } from '../context/CategoriesContext';

const ARTICLES_PER_PAGE = 9;

export default function CategoryPage() {
  const { cat } = useParams();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('latest');
  const [page, setPage] = useState(1);

  const { getByCategory, loading: articlesLoading } = useArticles();
  const { findBySlug, loading: catsLoading } = useCategories();

  useEffect(() => {
    setPage(1);
    window.scrollTo({ top: 0 });
  }, [cat]);

  // Ambil metadata kategori dari Supabase (via CategoriesContext)
  const catData = findBySlug(cat);

  const meta = catData
    ? {
        label: catData.name,
        desc: catData.description || '',
        icon: catData.icon,
        color: catData.color || 'var(--accent)',
      }
    : {
        label: cat
          ? cat.charAt(0).toUpperCase() + cat.slice(1)
          : 'Kategori',
        desc: '',
        icon: 'fa-tag',
        color: 'var(--accent)',
      };

  let articles = getByCategory(cat || 'all');

  if (filter === 'popular') {
    articles = [...articles].sort(
      (a, b) => (b.views || 0) - (a.views || 0)
    );
  } else if (filter === 'trending') {
    articles = [...articles]
      .filter((a) => a.trending)
      .concat([...articles].filter((a) => !a.trending));
  } else {
    articles = [...articles].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }

  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);

  const paginated = articles.slice(
    (page - 1) * ARTICLES_PER_PAGE,
    page * ARTICLES_PER_PAGE
  );

  if (articlesLoading || catsLoading) {
    return (
      <main>
        <div
          className="container"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <i
            className="fas fa-spinner fa-spin"
            style={{ fontSize: '2rem', marginBottom: 12, display: 'block' }}
          ></i>
          Memuat artikel...
        </div>
      </main>
    );
  }

  return (
    <main>
      <div
        className="container"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: 1280 }}>

          {/* Header — warna dari admin_categories.color */}
          <div
            className="category-hero"
            style={{
              margin: '24px 0 32px',
              padding: '40px 28px',
              background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
              borderRadius: 24,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <i
                className={`fas ${meta.icon}`}
                style={{ fontSize: '2.5rem', opacity: 0.9 }}
              ></i>
              <div>
                <h1
                  style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}
                >
                  {meta.label}
                </h1>
                {meta.desc && (
                  <p
                    style={{ marginTop: 8, opacity: 0.9, fontSize: '0.95rem' }}
                  >
                    {meta.desc}
                  </p>
                )}
              </div>
            </div>

            <div
              style={{ marginTop: 18, fontSize: '0.85rem', opacity: 0.8 }}
            >
              {articles.length} artikel ditemukan
            </div>
          </div>

          {/* Filter */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 28,
              flexWrap: 'wrap',
            }}
          >
            {[
              { key: 'latest',   label: 'Terbaru',    icon: 'fa-clock' },
              { key: 'popular',  label: 'Terpopuler', icon: 'fa-fire' },
              { key: 'trending', label: 'Trending',   icon: 'fa-chart-line' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(1); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filter === f.key ? 'var(--accent)' : 'var(--bg-surface)',
                  color:      filter === f.key ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${filter === f.key ? 'var(--accent)' : 'var(--border-light)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: '0.2s',
                }}
              >
                <i className={`fas ${f.icon}`}></i>
                {f.label}
              </button>
            ))}
          </div>

          {/* Artikel */}
          {paginated.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
              }}
            >
              <i
                className="fas fa-folder-open"
                style={{ fontSize: '3rem', marginBottom: 12, display: 'block' }}
              ></i>
              <p>Belum ada artikel di kategori ini</p>
            </div>
          ) : (
            <div
              className="articles-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
                marginBottom: 40,
              }}
            >
              {paginated.map((a) => (
                <div
                  key={String(a.id)}
                  className="article-card"
                  onClick={() => navigate(getArticleUrl(a))}
                  style={{
                    cursor: 'pointer',
                    background: 'var(--bg-surface)',
                    borderRadius: 18,
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ height: 190, overflow: 'hidden' }}>
                    <img
                      src={a.image}
                      alt={a.title}
                      onError={(e) =>
                        (e.target.src = 'https://placehold.co/400x200?text=No+Image')
                      }
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ padding: 18 }}>
                    <span className="card-category">{a.category}</span>

                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        lineHeight: 1.5,
                        margin: '10px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {a.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.6,
                        marginBottom: 16,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {a.summary}
                    </p>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <i className="fas fa-calendar" style={{ marginRight: 6 }}></i>
                      {formatDate(a.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginBottom: 50,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    background: page === p ? 'var(--accent)' : 'var(--bg-surface)',
                    color:      page === p ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: page === p ? 700 : 500,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}