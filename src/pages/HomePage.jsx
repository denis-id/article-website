import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import Sidebar from '../components/Sidebar';
import ArticleCard from '../components/ArticleCard';
import { formatDate, formatNumber, getArticleUrl } from '../utils/helpers';
import { useArticles } from '../context/ArticlesContext';
import { useArticleStats } from '../hooks/useArticleStats';

const ARTICLES_PER_PAGE = 6;

const CATEGORY_TABS = [
  { label: 'Semua', cat: 'all' },
  { label: 'Teknologi', cat: 'teknologi' },
  { label: 'Lifestyle', cat: 'lifestyle' },
  { label: 'Bisnis', cat: 'bisnis' },
  { label: 'Novel', cat: 'novel' },
  { label: 'Kesehatan', cat: 'health' },
  { label: 'Otomotif', cat: 'otomotif' },
  { label: 'Film', cat: 'film' },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();
  const { getTrending, getByCategory, loading } = useArticles();

  const trending = getTrending();
  const allArticles = getByCategory(activeCategory)
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = allArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  // Fetch views dari Supabase untuk trending & paginated sekaligus
  const visibleArticles = [...trending, ...paginatedArticles];
  const { getViews, getLikes } = useArticleStats(visibleArticles);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const changePage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const buttons = [];
    buttons.push(
      <button key="prev" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>«</button>
    );
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        buttons.push(
          <button key={i} className={i === currentPage ? 'active' : ''} onClick={() => changePage(i)}>{i}</button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        buttons.push(<button key={`dots-${i}`} disabled>...</button>);
      }
    }
    buttons.push(
      <button key="next" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>»</button>
    );
    return buttons;
  };

  return (
    <main>
      <div className="container">
        <HeroSlider />
      </div>

      <div className="container">
        {/* Category Tabs */}
        <div className="category-tabs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.cat}
              className={`cat-tab ${activeCategory === tab.cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(tab.cat)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: 12, display: 'block' }}></i>
            Memuat artikel...
          </div>
        ) : (
          <>

        {/* Trending Section */}
        <div className="trending-section">
          <div className="section-header">
            <h2><i className="fas fa-chart-line"></i> Topik Trending</h2>
            <Link to="/category/all?filter=trending" className="view-all">
              Lihat Semua <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="trending-grid" id="trendingGrid">
            {trending.length === 0
              ? <p className="empty-state">Belum ada artikel trending</p>
              : trending.map((article, index) => (
                <div
                  key={article.id}
                  className="trending-card"
                  onClick={() => navigate(getArticleUrl(article))}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative' }}>
                    <div className="trending-number">{index + 1}</div>
                    <img src={article.image} alt={article.title} />
                  </div>
                  <div className="card-content">
                    <div className="card-category">{article.category}</div>
                    <h3>{article.title}</h3>
                    <p>{article.summary.substring(0, 80)}...</p>
                    <div className="article-meta">
                      <span><i className="fas fa-calendar"></i> {formatDate(article.date)}</span>
                      {/* <span><i className="fas fa-eye"></i> {formatNumber(getViews(article))}</span>
                      <span><i className="fas fa-heart"></i> {formatNumber(getLikes(article))}</span> */}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Main Layout */}
        <div className="main-layout">
          <div className="content-main">
            <div className="section-header">
              <h2><i className="fas fa-newspaper"></i> Artikel Terbaru</h2>
              <div className="view-options">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                  <i className="fas fa-th"></i>
                </button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>

            <div className={`articles-grid ${viewMode === 'list' ? 'list-view' : ''}`} id="articlesGrid">
              {paginatedArticles.length === 0
                ? <p className="empty-state">Belum ada artikel dalam kategori ini</p>
                : paginatedArticles.map(article => (
                  <ArticleCard key={String(article.id)} article={article} listView={viewMode === 'list'} getViews={getViews} getLikes={getLikes} />
                ))
              }
            </div>

            <div className="pagination" id="pagination">
              {renderPagination()}
            </div>
          </div>

          <Sidebar />
        </div>
        </>
        )}
      </div>
    </main>
  );
}