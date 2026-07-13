-- AI Innovation Hub — гъвкава AI библиотека
-- Изпълнете целия файл в Supabase > SQL Editor.

create extension if not exists "pgcrypto";

-- Съществуващата колона status става свободна, за да поддържа собствени етапи.
alter table public.knowledge_items drop constraint if exists knowledge_items_status_check;
alter table public.knowledge_items
  add column if not exists collection_id uuid,
  add column if not exists visibility text not null default 'shared',
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz;

do $$ begin
  alter table public.knowledge_items
    add constraint knowledge_items_visibility_check check (visibility in ('shared', 'personal'));
exception when duplicate_object then null;
end $$;

create table if not exists public.knowledge_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  color text not null default '#52621c',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#52621c',
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_attachments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_item_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'archived', 'restored')),
  changes jsonb not null default '{}'::jsonb,
  changed_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.knowledge_items
    add constraint knowledge_items_collection_id_fkey
    foreign key (collection_id) references public.knowledge_collections(id) on delete set null;
exception when duplicate_object then null;
end $$;

create index if not exists knowledge_items_collection_idx on public.knowledge_items(collection_id);
create index if not exists knowledge_items_owner_idx on public.knowledge_items(owner_id);
create index if not exists knowledge_attachments_item_idx on public.knowledge_attachments(item_id);
create index if not exists knowledge_history_item_idx on public.knowledge_item_history(item_id, created_at desc);

insert into public.knowledge_stages (name, color, position) values
  ('Ново', '#67558d', 10),
  ('За преглед', '#a16b24', 20),
  ('За тестване', '#2563a6', 30),
  ('Полезно', '#52621c', 40),
  ('Архив', '#767869', 50)
on conflict (name) do nothing;

update public.knowledge_items
set owner_id = coalesce(owner_id, (select id from auth.users order by created_at asc limit 1));

create or replace function public.set_knowledge_item_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.owner_id is null then new.owner_id := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists set_knowledge_item_owner_trigger on public.knowledge_items;
create trigger set_knowledge_item_owner_trigger
before insert on public.knowledge_items
for each row execute procedure public.set_knowledge_item_owner();

create or replace function public.log_knowledge_item_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare event_name text;
begin
  if tg_op = 'INSERT' then
    event_name := 'created';
    insert into public.knowledge_item_history(item_id, action, changes, changed_by)
    values (new.id, event_name, to_jsonb(new), auth.uid());
  elsif tg_op = 'UPDATE' then
    event_name := case
      when old.archived_at is null and new.archived_at is not null then 'archived'
      when old.archived_at is not null and new.archived_at is null then 'restored'
      else 'updated'
    end;
    insert into public.knowledge_item_history(item_id, action, changes, changed_by)
    values (new.id, event_name, jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)), auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists knowledge_item_history_trigger on public.knowledge_items;
create trigger knowledge_item_history_trigger
after insert or update on public.knowledge_items
for each row execute procedure public.log_knowledge_item_change();

alter table public.knowledge_collections enable row level security;
alter table public.knowledge_stages enable row level security;
alter table public.knowledge_attachments enable row level security;
alter table public.knowledge_item_history enable row level security;

do $$
declare table_name text; policy_row record;
begin
  foreach table_name in array array['knowledge_collections','knowledge_stages','knowledge_attachments','knowledge_item_history'] loop
    for policy_row in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
      execute format('drop policy if exists %I on public.%I', policy_row.policyname, table_name);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (true)', 'Authenticated users can read ' || table_name, table_name);
  end loop;
end $$;

create policy "Admins can manage collections" on public.knowledge_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage stages" on public.knowledge_stages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage attachments" on public.knowledge_attachments for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Частните карти се виждат само от собственика; администраторите виждат всички.
drop policy if exists "Authenticated users can read knowledge_items" on public.knowledge_items;
drop policy if exists "Authenticated users can read knowledge" on public.knowledge_items;
create policy "Users can read shared or own knowledge" on public.knowledge_items
for select to authenticated
using (visibility = 'shared' or owner_id = auth.uid() or public.is_admin());

-- Частен Storage bucket за файловете на библиотеката.
insert into storage.buckets (id, name, public, file_size_limit)
values ('knowledge-files', 'knowledge-files', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

drop policy if exists "Authenticated users can read knowledge files" on storage.objects;
drop policy if exists "Admins can upload knowledge files" on storage.objects;
drop policy if exists "Admins can update knowledge files" on storage.objects;
drop policy if exists "Admins can delete knowledge files" on storage.objects;
create policy "Authenticated users can read knowledge files" on storage.objects
for select to authenticated using (bucket_id = 'knowledge-files');
create policy "Admins can upload knowledge files" on storage.objects
for insert to authenticated with check (bucket_id = 'knowledge-files' and public.is_admin());
create policy "Admins can update knowledge files" on storage.objects
for update to authenticated using (bucket_id = 'knowledge-files' and public.is_admin()) with check (bucket_id = 'knowledge-files' and public.is_admin());
create policy "Admins can delete knowledge files" on storage.objects
for delete to authenticated using (bucket_id = 'knowledge-files' and public.is_admin());

