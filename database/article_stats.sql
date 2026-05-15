-- =============================================
-- ARTICLE STATS — Jalankan di Supabase SQL Editor
-- Menyimpan views, likes, saves dari semua visitor
-- =============================================

-- Tabel utama: satu baris per artikel, counter aggregat
create table if not exists article_stats (
  article_id   integer primary key,
  views        bigint default 0,
  likes        bigint default 0,
  saves        bigint default 0,
  updated_at   timestamptz default now()
);

-- Tabel detail: satu baris per user per artikel (untuk toggle like/save)
create table if not exists article_interactions (
  id           uuid default gen_random_uuid() primary key,
  article_id   integer not null,
  user_id      text not null,
  liked        boolean default false,
  saved        boolean default false,
  updated_at   timestamptz default now(),
  unique(article_id, user_id)
);

-- RLS
alter table article_stats        enable row level security;
alter table article_interactions enable row level security;

create policy "Public read article_stats"        on article_stats for select using (true);
create policy "Public upsert article_stats"      on article_stats for all using (true) with check (true);
create policy "Public read article_interactions" on article_interactions for select using (true);
create policy "Public upsert article_interactions" on article_interactions for all using (true) with check (true);

-- =============================================
-- RPC: increment_views
-- Dipanggil setiap kali artikel dibuka
-- =============================================
create or replace function increment_views(p_article_id integer)
returns void language plpgsql as $$
begin
  insert into article_stats (article_id, views, likes, saves)
    values (p_article_id, 1, 0, 0)
  on conflict (article_id) do update
    set views = article_stats.views + 1,
        updated_at = now();
end;
$$;

-- =============================================
-- RPC: toggle_interaction
-- Dipanggil saat user like/unlike atau save/unsave
-- =============================================
create or replace function toggle_interaction(
  p_article_id integer,
  p_user_id    text,
  p_field      text,    -- 'liked' atau 'saved'
  p_value      boolean
) returns void language plpgsql as $$
declare
  old_val boolean := false;
  delta   integer;
begin
  -- Ambil nilai lama
  select
    case when p_field = 'liked' then liked else saved end
  into old_val
  from article_interactions
  where article_id = p_article_id and user_id = p_user_id;

  -- Upsert interaksi
  insert into article_interactions (article_id, user_id, liked, saved, updated_at)
    values (
      p_article_id, p_user_id,
      case when p_field = 'liked' then p_value else false end,
      case when p_field = 'saved' then p_value else false end,
      now()
    )
  on conflict (article_id, user_id) do update set
    liked      = case when p_field = 'liked' then p_value else article_interactions.liked end,
    saved      = case when p_field = 'saved' then p_value else article_interactions.saved end,
    updated_at = now();

  -- Hitung delta (+1 atau -1)
  delta := case when p_value then 1 else -1 end;
  if old_val = p_value then delta := 0; end if;

  -- Update counter di article_stats
  insert into article_stats (article_id, views, likes, saves)
    values (p_article_id, 0, 0, 0)
  on conflict (article_id) do nothing;

  if p_field = 'liked' then
    update article_stats set
      likes = greatest(0, likes + delta), updated_at = now()
    where article_id = p_article_id;
  else
    update article_stats set
      saves = greatest(0, saves + delta), updated_at = now()
    where article_id = p_article_id;
  end if;
end;
$$;

-- Aktifkan Realtime untuk article_stats
-- Lakukan di: Supabase Dashboard → Database → Replication → article_stats → ON
