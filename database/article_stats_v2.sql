-- =============================================
-- ARTICLE STATS v2 — Jalankan di Supabase SQL Editor
-- Ganti article_id dari integer ke text agar
-- bisa handle ID statis (angka) dan UUID admin
-- =============================================

-- Drop tabel lama jika ada
drop table if exists article_interactions cascade;
drop table if exists article_stats cascade;

-- Drop RPC lama
drop function if exists increment_views(integer);
drop function if exists toggle_interaction(integer, text, text, boolean);

-- ── Tabel baru: article_id pakai TEXT ──
create table article_stats (
  article_id   text primary key,
  views        bigint default 0,
  likes        bigint default 0,
  saves        bigint default 0,
  updated_at   timestamptz default now()
);

create table article_interactions (
  id           uuid default gen_random_uuid() primary key,
  article_id   text not null,
  user_id      text not null,
  liked        boolean default false,
  saved        boolean default false,
  updated_at   timestamptz default now(),
  unique(article_id, user_id)
);

-- RLS
alter table article_stats        enable row level security;
alter table article_interactions enable row level security;

create policy "Public all article_stats"
  on article_stats for all using (true) with check (true);
create policy "Public all article_interactions"
  on article_interactions for all using (true) with check (true);

-- ── RPC: increment_views ──
create or replace function increment_views(p_article_id text)
returns void language plpgsql as $$
begin
  insert into article_stats (article_id, views, likes, saves)
    values (p_article_id, 1, 0, 0)
  on conflict (article_id) do update
    set views      = article_stats.views + 1,
        updated_at = now();
end;
$$;

-- ── RPC: toggle_interaction ──
create or replace function toggle_interaction(
  p_article_id text,
  p_user_id    text,
  p_field      text,
  p_value      boolean
) returns void language plpgsql as $$
declare
  old_val boolean := false;
  delta   integer;
begin
  select case when p_field = 'liked' then liked else saved end
  into old_val
  from article_interactions
  where article_id = p_article_id and user_id = p_user_id;

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

  delta := case when p_value = true then 1 else -1 end;
  if old_val is not distinct from p_value then delta := 0; end if;

  insert into article_stats (article_id, views, likes, saves)
    values (p_article_id, 0, 0, 0)
  on conflict (article_id) do nothing;

  if p_field = 'liked' then
    update article_stats
      set likes = greatest(0, likes + delta), updated_at = now()
      where article_id = p_article_id;
  else
    update article_stats
      set saves = greatest(0, saves + delta), updated_at = now()
      where article_id = p_article_id;
  end if;
end;
$$;

-- Aktifkan Realtime untuk article_stats
-- Supabase Dashboard → Database → Replication → article_stats → ON
