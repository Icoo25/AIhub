-- AI Компас — Етап 2.4–2.5: Център за източници и свързано съдържание
-- Поддържа сайтове, блогове, YouTube, TikTok, бюлетини, RSS и вътрешни източници.

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  handle text not null default '',
  source_type text not null default 'Сайт',
  category text not null default 'Общи',
  description text not null default '',
  reliability integer not null default 3 check (reliability between 1 and 5),
  status text not null default 'Активен',
  last_checked_at date,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_sources_type_check check (source_type in ('Сайт', 'Блог', 'YouTube', 'TikTok', 'Бюлетин', 'RSS', 'Вътрешен')),
  constraint content_sources_status_check check (status in ('Активен', 'Пауза', 'Архивиран'))
);

alter table public.ai_tools add column if not exists source_id uuid references public.content_sources(id) on delete set null;
alter table public.ai_news add column if not exists source_id uuid references public.content_sources(id) on delete set null;
alter table public.knowledge_items add column if not exists source_id uuid references public.content_sources(id) on delete set null;
alter table public.experiments add column if not exists source_id uuid references public.content_sources(id) on delete set null;

create index if not exists content_sources_type_idx on public.content_sources(source_type, status);
create index if not exists content_sources_category_idx on public.content_sources(category);
create index if not exists ai_tools_source_id_idx on public.ai_tools(source_id);
create index if not exists ai_news_source_id_idx on public.ai_news(source_id);
create index if not exists knowledge_items_source_id_idx on public.knowledge_items(source_id);
create index if not exists experiments_source_id_idx on public.experiments(source_id);

alter table public.content_sources enable row level security;

drop policy if exists "sources_read_authenticated" on public.content_sources;
create policy "sources_read_authenticated" on public.content_sources
  for select to authenticated using (true);

drop policy if exists "sources_manage_editors" on public.content_sources;
create policy "sources_manage_editors" on public.content_sources
  for all to authenticated
  using (public.can_edit_content())
  with check (public.can_edit_content());

create or replace function public.set_content_sources_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_sources_set_updated_at on public.content_sources;
create trigger content_sources_set_updated_at
before update on public.content_sources
for each row execute function public.set_content_sources_updated_at();
