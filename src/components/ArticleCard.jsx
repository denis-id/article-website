import { useNavigate } from 'react-router-dom';
import { formatDate, formatNumber, getArticleUrl } from '../utils/helpers';
import { useArticleStats } from '../hooks/useArticleStats';

export default function ArticleCard({ article, listView = false, getViews: getViewsProp, getLikes: getLikesProp }) {
  const navigate = useNavigate();

  const standalone = useArticleStats(getViewsProp ? [] : [article]);
  const getViews  = getViewsProp  || standalone.getViews;
  const getLikes  = getLikesProp  || standalone.getLikes;

  return (
    <div
      className="article-card"
      onClick={() => navigate(getArticleUrl(article))}
      style={{ cursor: 'pointer' }}
    >
      <img
        src={article.image} alt={article.title}
        onError={e => e.target.src = 'https://placehold.co/400x200?text=No+Image'}
      />
      <div className="card-content">
        <div className="card-category">{article.category}</div>
        <h3>{article.title}</h3>
        <p>{(article.summary || '').substring(0, 100)}...</p>
        <div className="article-meta">
          <span><i className="fas fa-calendar"></i> {formatDate(article.date)}</span>
          {/* <span><i className="fas fa-eye"></i> {formatNumber(getViews(article))}</span>
          <span><i className="fas fa-heart"></i> {formatNumber(getLikes(article))}</span> */}
        </div>
      </div>
    </div>
  );
}