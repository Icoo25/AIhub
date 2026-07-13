-- AI Innovation Hub — Supabase schema
create extension if not exists "pgcrypto";

create table if not exists public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null default '',
  website_url text not null,
  status text not null default 'В тестване' check (status in ('Активен', 'В тестване', 'Архивиран')),
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  source_url text not null,
  category text not null,
  published_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  model_used text not null,
  result text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ai_tools_category_idx on public.ai_tools(category);
create index if not exists ai_tools_created_at_idx on public.ai_tools(created_at desc);
create index if not exists ai_news_published_date_idx on public.ai_news(published_date desc);
create index if not exists experiments_created_at_idx on public.experiments(created_at desc);

alter table public.ai_tools enable row level security;
alter table public.ai_news enable row level security;
alter table public.experiments enable row level security;

create policy "Authenticated users can read tools" on public.ai_tools for select to authenticated using (true);
create policy "Authenticated users can insert tools" on public.ai_tools for insert to authenticated with check (true);
create policy "Authenticated users can update tools" on public.ai_tools for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete tools" on public.ai_tools for delete to authenticated using (true);
create policy "Authenticated users can read news" on public.ai_news for select to authenticated using (true);
create policy "Authenticated users can insert news" on public.ai_news for insert to authenticated with check (true);
create policy "Authenticated users can update news" on public.ai_news for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete news" on public.ai_news for delete to authenticated using (true);
create policy "Authenticated users can read experiments" on public.experiments for select to authenticated using (true);
create policy "Authenticated users can insert experiments" on public.experiments for insert to authenticated with check (true);
create policy "Authenticated users can update experiments" on public.experiments for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete experiments" on public.experiments for delete to authenticated using (true);
