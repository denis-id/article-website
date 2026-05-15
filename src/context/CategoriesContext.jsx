import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

/* eslint-disable react-refresh/only-export-components */

// Ikon fallback berdasarkan slug — kalau admin tambah kategori baru
// yang slugnya belum ada di sini, pakai icon default
const ICON_MAP = {
  teknologi:      'fa-microchip',
  bisnis:         'fa-chart-line',
  lifestyle:      'fa-heart',
  nasional:       'fa-flag',
  internasional:  'fa-globe',
  film:           'fa-film',
  novel:          'fa-book-open',
  health:         'fa-heartbeat',
  otomotif:       'fa-car',
  olahraga:       'fa-futbol',
  politik:        'fa-landmark',
  hiburan:        'fa-music',
  sains:          'fa-flask',
  pendidikan:     'fa-graduation-cap',
  lainnya:        'fa-th-large',
};

const DEFAULT_ICON = 'fa-tag';

const CategoriesContext = createContext();

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('admin_categories')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      // Tambahkan icon ke setiap kategori berdasarkan slug
      const enriched = data.map((cat) => ({
        ...cat,
        icon: ICON_MAP[cat.slug?.toLowerCase()] || DEFAULT_ICON,
      }));
      setCategories(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();

    // Realtime: kalau admin tambah/edit/hapus kategori, Denscope ikut update
    const channel = supabase
      .channel('admin_categories_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_categories' },
        () => fetchCategories()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Helper: cari satu kategori berdasarkan slug
  const findBySlug = (slug) =>
    categories.find(
      (c) => c.slug?.toLowerCase() === slug?.toLowerCase()
    ) || null;

  const value = {
    categories,
    loading,
    findBySlug,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
