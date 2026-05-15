import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export function useArticleStats(articles = []) {
  const [statsMap, setStatsMap] = useState({});

  const ids = articles.map(a => String(a.id));

  useEffect(() => {
    if (ids.length === 0) return;
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
  }, [ids.join(',')]);

  const getViews = (article) => {
    const s = statsMap[String(article.id)];
    return s ? Number(s.views) : (article.views || 0);
  };

  const getLikes = (article) => {
    const s = statsMap[String(article.id)];
    return s ? Number(s.likes) : (article.likes || 0);
  };

  const getSaves = (article) => {
    const s = statsMap[String(article.id)];
    return s ? Number(s.saves) : 0;
  };

  return { statsMap, getViews, getLikes, getSaves };
}
