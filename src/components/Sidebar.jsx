import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showToast, getArticleUrl } from '../utils/helpers';
import { useArticles } from '../context/ArticlesContext';

// Kategori statis sebagai fallback jika CategoriesContext belum dipasang
const STATIC_CATEGORIES = [
  { id: 'teknologi',     slug: 'teknologi',    name: 'Teknologi',    icon: 'fa-microchip',   color: '#6c63ff' },
  { id: 'bisnis',        slug: 'bisnis',       name: 'Bisnis',       icon: 'fa-chart-line',  color: '#38bdf8' },
  { id: 'lifestyle',     slug: 'lifestyle',    name: 'Lifestyle',    icon: 'fa-heart',       color: '#22c55e' },
  { id: 'nasional',      slug: 'nasional',     name: 'Nasional',     icon: 'fa-flag',        color: '#f59e0b' },
  { id: 'internasional', slug: 'internasional',name: 'Internasional',icon: 'fa-globe',       color: '#ef4444' },
  { id: 'film',          slug: 'film',         name: 'Film',         icon: 'fa-film',        color: '#a78bfa' },
  { id: 'novel',         slug: 'novel',        name: 'Novel',        icon: 'fa-book-open',   color: '#34d399' },
  { id: 'health',        slug: 'health',       name: 'Kesehatan',    icon: 'fa-heartbeat',   color: '#fb923c' },
  { id: 'otomotif',      slug: 'otomotif',     name: 'Otomotif',     icon: 'fa-car',         color: '#60a5fa' },
];

// Coba import CategoriesContext — tidak crash jika belum ada
let useCategoriesHook = null;
try {
  // eslint-disable-next-line
  useCategoriesHook = require('../context/CategoriesContext').useCategories;
} catch { /* belum ada */ }

function useSafeCategories() {
  if (useCategoriesHook) {
    try {
      const ctx = useCategoriesHook();
      if (ctx?.categories?.length > 0) return ctx.categories;
    } catch { /* ignore */ }
  }
  return STATIC_CATEGORIES;
}

export default function Sidebar() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { allArticles, getPopular } = useArticles();
  const popular = getPopular();
  const cats = useSafeCategories();

  // Trending tags — dihitung dari semua artikel (statis + admin DB)
  const tagCount = {};
  (allArticles || []).forEach(a => {
    (a.tags || []).forEach(t => {
      const key = String(t).trim();
      if (key) tagCount[key] = (tagCount[key] || 0) + 1;
    });
  });
  const trendingTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email) return;
    let subscribers = [];
    try {
      subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
    } catch { /* ignore */ }
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
      showToast('Berhasil berlangganan newsletter!', 'success');
    } else {
      showToast('Email sudah terdaftar', 'info');
    }
    setEmail('');
  };

  return (
    <aside className="sidebar-main">

      {/* Newsletter */}
      <div className="widget newsletter-widget">
        <h3><i className="fas fa-envelope"></i> Newsletter</h3>
        <p>Dapatkan update terbaru langsung ke email Anda</p>
        <form id="newsletterForm" onSubmit={handleNewsletter}>
          <input
            type="email"
            placeholder="Email Anda"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button type="submit">Berlangganan</button>
        </form>
      </div>

      {/* Paling Populer */}
      <div className="widget popular-widget">
        <h3><i className="fas fa-fire"></i> Paling Populer</h3>
        <div className="popular-list">
          {popular.length === 0
            ? <p className="empty-state">Belum ada artikel populer</p>
            : popular.map(article => (
              <div
                key={String(article.id)}
                className="popular-item"
                onClick={() => navigate(getArticleUrl(article))}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={article.image}
                  alt={article.title}
                  onError={e => e.target.src = 'https://placehold.co/60x60?text=No+Img'}
                />
                <div>
                  <div className="popular-title">
                    {article.title.substring(0, 50)}{article.title.length > 50 ? '...' : ''}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Kategori */}
      <div className="widget categories-widget">
        <h3><i className="fas fa-layer-group"></i> Kategori</h3>
        <div className="categories-cloud">
          {cats.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              title={cat.description || cat.name}
              style={{ borderColor: cat.color || 'var(--accent)' }}
            >
              <i
                className={`fas ${cat.icon || 'fa-tag'}`}
                style={{ marginRight: 5, color: cat.color || 'var(--accent)', fontSize: '0.75em' }}
              ></i>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Tags Populer */}
      <div className="widget tags-widget">
        <h3><i className="fas fa-tags"></i> Tags Populer</h3>
        <div className="categories-cloud">
          {trendingTags.length === 0
            ? <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Belum ada tag</span>
            : trendingTags.map(tag => (
              <Link
                key={tag}
                to={`/search?q=${encodeURIComponent(tag)}`}
                style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
              >
                #{tag}
              </Link>
            ))
          }
        </div>
      </div>

      {/* Sosial */}
      <div className="widget social-widget">
        <h3><i className="fas fa-share-alt"></i> Get In Touch</h3>
        <div className="social-icons">
          <a href="https://denis-portofolio.netlify.app/" target="_blank" rel="noreferrer">
            <img src="/denis-logo.png" alt="Denis Logo" className="custom-icon" />
          </a>
          <a href="https://www.instagram.com/denscope_/" target="_blank" rel="noreferrer">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="https://api.whatsapp.com/send/?phone=6282340987518" target="_blank" rel="noreferrer">
            <i className="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>

    </aside>
  );
}