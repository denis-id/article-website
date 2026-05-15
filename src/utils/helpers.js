import { articlesData } from '../data/articles';

export function getArticlesByCategory(category, articles = null) {
  const src = articles || articlesData.articles;
  if (category === 'all') return src;
  return src.filter(art => art.category === category);
}

export function getTrendingArticles(articles = null) {
  const src = articles || articlesData.articles;
  return src.filter(art => art.trending).slice(0, 4);
}

export function getPopularArticles(articles = null) {
  const src = articles || articlesData.articles;
  return src.filter(art => art.popular).slice(0, 5);
}

export function getArticleUrl(article) {
  return `/article/${article.slug || article.id}`;
}

export function getLatestArticles(limit = 6, articles = null) {
  const src = articles || articlesData.articles;
  return [...src].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

export function searchArticles(query, articles = null) {
  const src = articles || articlesData.articles;
  const lowerQuery = query.toLowerCase();
  return src.filter(art =>
    art.title?.toLowerCase().includes(lowerQuery) ||
    art.summary?.toLowerCase().includes(lowerQuery) ||
    art.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function timeAgo(isoString) {
  const now = Date.now();
  const diff = Math.floor((now - new Date(isoString).getTime()) / 1000); // seconds
  if (diff < 60)   return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(isoString);
}

export function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function showToast(message, type = 'info') {
  document.querySelector('.toast-notification')?.remove();
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== SWEET ALERT =====
export function swalConfirm({ title, text, confirmText = 'Ya, Hapus', cancelText = 'Batal', icon = 'warning', confirmColor = '#ef4444' }) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    || document.body.classList.contains('dark')
    || window.matchMedia('(prefers-color-scheme: dark)').matches;

  return window.Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#6b7280',
    background: isDark ? '#1a1a2e' : '#ffffff',
    color: isDark ? '#f0f0ff' : '#1a1a2e',
    customClass: {
      popup: 'swal-denscope',
    },
    buttonsStyling: true,
    reverseButtons: true,
  });
}