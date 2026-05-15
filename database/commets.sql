create table comments (
  id uuid default gen_random_uuid() primary key,
  article_id integer not null,
  author text not null,
  avatar text,
  text text not null,
  created_at timestamptz default now()
);

alter table comments enable row level security;

create policy "Anyone can read comments"
  on comments for select using (true);

create policy "Anyone can insert comments"
  on comments for insert with check (true);

create policy "Anyone can delete own comments"
  on comments for delete using (true);