import { createContext, useContext, useEffect, useState } from 'react';
import { articlesData } from '../data/articles';
import { supabase } from '../utils/supabase';

/* eslint-disable react-refresh/only-export-components */

const ArticlesContext = createContext();

/**
 * Generate UUID konsisten untuk artikel statis
 * Format: 00000000-0000-0000-0000-{12-digit-id}
 * Contoh: ID 1 → "00000000-0000-0000-0000-000000000001"
 */
function generateStaticUUID(id) {
  const paddedId = String(id).padStart(12, '0');
  return `00000000-0000-0000-0000-${paddedId}`;
}

function normalizeAdminArticle(a) {
  return {
    id: a.id,                    // simpan ID asli (UUID string dari Supabase)
    title: a.title || '',
    summary: a.summary || '',
    content: a.content || '',
    category: (a.category || 'lainnya').toLowerCase(),
    author: a.author || 'Admin',
    authorAvatar: a.author
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(a.author)}&background=0f2b3d&color=fff`
      : '/author.jpg',
    date: a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    image: a.thumbnail || 'https://placehold.co/800x400?text=No+Image',
    views: a.views || 0,
    likes: a.likes || 0,
    comments: 0,
    tags: Array.isArray(a.tags) ? a.tags : [],
    trending: false,
    popular: false,
    slug: a.slug || '',
    fromAdmin: true,
  };
}

/**
 * Normalize artikel statis dengan UUID yang konsisten
 * Ini memastikan artikel statis bisa menerima komentar sama seperti artikel database
 */
function normalizeStaticArticle(a) {
  return {
    ...a,
    id: generateStaticUUID(a.id),  // Ubah ID integer ke UUID string
    category: (a.category || 'lainnya').toLowerCase(),
    fromStatic: true,
  };
}

/**
 * Konversi title atau slug menjadi URL-safe slug
 * Contoh: "Cara Membuat Website SEO Friendly" → "cara-membuat-website-seo-friendly"
 */
function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')                    // Hapus karakter spesial
    .replace(/[\s_]+/g, '-')                      // Ganti spasi/underscore dengan dash
    .replace(/^-+|-+$/g, '')                      // Hapus dash di awal/akhir
    .replace(/-+/g, '-');                         // Ganti multiple dashes dengan single dash
}

export function ArticlesProvider({ children }) {
  // Normalisasi artikel statis dengan UUID
  const staticArticles = articlesData.articles.map(normalizeStaticArticle);
  
  const [adminArticles, setAdminArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      const { data, error } = await supabase
        .from('admin_articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAdminArticles(data.map(normalizeAdminArticle));
      }
      setLoading(false);
    };

    fetchAdmin();

    const ch = supabase
      .channel('admin_articles_public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_articles' },
        () => fetchAdmin())
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // Admin artikel di depan agar muncul duluan (terbaru)
  const allArticles = [...adminArticles, ...staticArticles];

  /**
   * Cari artikel by ID
   * Sekarang semua ID sudah dalam format UUID string
   */
  const findById = (id) => {
    if (!id) return null;
    const strId = String(id);
    
    // Direct match pertama
    const directMatch = allArticles.find(a => String(a.id) === strId);
    if (directMatch) return directMatch;
    
    // Fallback: jika ID adalah integer string, generate UUID-nya dan cari lagi
    const num = parseInt(strId, 10);
    if (!isNaN(num)) {
      const generatedUUID = generateStaticUUID(num);
      return allArticles.find(a => String(a.id) === generatedUUID);
    }
    
    return null;
  };

  /**
   * Cari artikel by slug
   * Slug comparison case-insensitive dan trim
   */
  const findBySlug = (slug) => {
    if (!slug) return null;
    const normalizedSlug = slugify(String(slug));
    return allArticles.find(a => 
      slugify(a.slug) === normalizedSlug
    );
  };

  /**
   * Cari artikel by title (case-insensitive)
   * Useful jika title unik atau untuk fallback
   */
  const findByTitle = (title) => {
    if (!title) return null;
    const normalizedTitle = String(title).toLowerCase().trim();
    return allArticles.find(a => 
      a.title.toLowerCase().trim() === normalizedTitle
    );
  };

  /**
   * Cari artikel by ID, slug, atau title (dalam urutan prioritas tersebut)
   * Ini adalah fungsi utama yang digunakan ArticlePage
   * 
   * Contoh penggunaan:
   * - findByIdOrSlugOrTitle("123") → cari by ID
   * - findByIdOrSlugOrTitle("cara-membuat-website") → cari by slug
   * - findByIdOrSlugOrTitle("Cara Membuat Website") → cari by title
   */
  const findByIdOrSlugOrTitle = (identifier) => {
    if (!identifier) return null;
    
    // Coba by ID dulu
    let result = findById(identifier);
    if (result) return result;
    
    // Coba by slug
    result = findBySlug(identifier);
    if (result) return result;
    
    // Coba by title sebagai fallback
    result = findByTitle(identifier);
    if (result) return result;
    
    return null;
  };

  const value = {
    allArticles,
    staticArticles,
    adminArticles,
    loading,
    findById,
    findBySlug,
    findByTitle,
    findByIdOrSlugOrTitle,  // Fungsi baru - gunakan ini di ArticlePage
    slugify,                 // Helper function jika diperlukan
    getByCategory: (cat) =>
      cat === 'all'
        ? allArticles
        : allArticles.filter(a => a.category === cat.toLowerCase()),
    getTrending: () =>
      [...adminArticles.slice(0, 2), ...staticArticles.filter(a => a.trending)].slice(0, 4),
    getPopular: () =>
      [...adminArticles.slice(0, 2), ...staticArticles.filter(a => a.popular)].slice(0, 5),
    getLatest: (limit = 6) =>
      [...allArticles].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit),
    search: (query) => {
      if (!query) return [];
      const q = query.toLowerCase();
      return allArticles.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.tags?.some(t => String(t).toLowerCase().includes(q))
      );
    },
  };

  return (
    <ArticlesContext.Provider value={value}>
      {children}
    </ArticlesContext.Provider>
  );
}

export function useArticles() {
  return useContext(ArticlesContext);
}