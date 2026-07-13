-- AI Innovation Hub — гъвкава работна среда и разширени роли
-- Изпълнете целия файл в Supabase > SQL Editor след предишните миграции.

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'viewer' where role = 'member';
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'editor', 'researcher', 'viewer'));
alter table public.profiles alter column role set default 'viewer';

alter table public.team_invites drop constraint if exists team_invites_role_check;
update public.team_invites set role = 'viewer' where role = 'member';
alter table public.team_invites add constraint team_invites_role_check
  check (role in ('admin', 'editor', 'researcher', 'viewer'));
alter table public.team_invites alter column role set default 'viewer';

create or replace function public.can_edit_content()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'));
$$;

create or replace function public.can_contribute_knowledge()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor', 'researcher'));
$$;

revoke all on function public.can_edit_content() from public;
revoke all on function public.can_contribute_knowledge() from public;
grant execute on function public.can_edit_content() to authenticated;
grant execute on function public.can_contribute_knowledge() to authenticated;

do $$
declare table_name text; policy_row record;
begin
  foreach table_name in array array['ai_tools', 'ai_news', 'experiments'] loop
    if to_regclass('public.' || table_name) is not null then
      for policy_row in select policyname from pg_policies where schemaname = 'public' and tablename = table_name loop
        execute format('drop policy if exists %I on public.%I', policy_row.policyname, table_name);
      end loop;
      execute format('create policy %I on public.%I for select to authenticated using (true)', 'Read ' || table_name, table_name);
      execute format('create policy %I on public.%I for insert to authenticated with check (public.can_edit_content())', 'Edit insert ' || table_name, table_name);
      execute format('create policy %I on public.%I for update to authenticated using (public.can_edit_content()) with check (public.can_edit_content())', 'Edit update ' || table_name, table_name);
      execute format('create policy %I on public.%I for delete to authenticated using (public.can_edit_content())', 'Edit delete ' || table_name, table_name);
    end if;
  end loop;
end $$;

drop policy if exists "Users can read shared or own knowledge" on public.knowledge_items;
drop policy if exists "Authenticated users can read knowledge_items" on public.knowledge_items;
drop policy if exists "Authenticated users can insert knowledge_items" on public.knowledge_items;
drop policy if exists "Authenticated users can update knowledge_items" on public.knowledge_items;
drop policy if exists "Authenticated users can delete knowledge_items" on public.knowledge_items;
drop policy if exists "Admins can insert knowledge_items" on public.knowledge_items;
drop policy if exists "Admins can update knowledge_items" on public.knowledge_items;
drop policy if exists "Admins can delete knowledge_items" on public.knowledge_items;

create policy "Read shared or own knowledge" on public.knowledge_items for select to authenticated
  using (visibility = 'shared' or owner_id = auth.uid());
create policy "Contributors insert knowledge" on public.knowledge_items for insert to authenticated
  with check (public.can_contribute_knowledge());
create policy "Contributors update knowledge" on public.knowledge_items for update to authenticated
  using (public.can_contribute_knowledge()) with check (public.can_contribute_knowledge());
create policy "Editors delete knowledge" on public.knowledge_items for delete to authenticated
  using (public.can_edit_content());

alter table public.knowledge_items
  add column if not exists content_type text not null default 'resource',
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists due_date date,
  add column if not exists pinned boolean not null default false,
  add column if not exists read_state text not null default 'unread',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.knowledge_items drop constraint if exists knowledge_items_content_type_check;
alter table public.knowledge_items add constraint knowledge_items_content_type_check
  check (content_type in ('resource', 'note', 'tool', 'news', 'experiment', 'tip', 'idea'));
alter table public.knowledge_items drop constraint if exists knowledge_items_read_state_check;
alter table public.knowledge_items add constraint knowledge_items_read_state_check
  check (read_state in ('unread', 'reading', 'done'));

create table if not exists public.saved_views (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null default 'personal' check (scope in ('personal', 'shared')),
  filters jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.saved_views enable row level security;
drop policy if exists "Read saved views" on public.saved_views;
drop policy if exists "Manage own saved views" on public.saved_views;
create policy "Read saved views" on public.saved_views for select to authenticated using (scope = 'shared' or created_by = auth.uid());
create policy "Manage own saved views" on public.saved_views for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create table if not exists public.knowledge_links (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.knowledge_items(id) on delete cascade,
  target_id uuid not null references public.knowledge_items(id) on delete cascade,
  relation text not null default 'related',
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(source_id, target_id, relation),
  check (source_id <> target_id)
);
alter table public.knowledge_links enable row level security;
drop policy if exists "Read knowledge links" on public.knowledge_links;
drop policy if exists "Contributors manage knowledge links" on public.knowledge_links;
create policy "Read knowledge links" on public.knowledge_links for select to authenticated using (true);
create policy "Contributors manage knowledge links" on public.knowledge_links for all to authenticated
  using (public.can_contribute_knowledge()) with check (public.can_contribute_knowledge());

create index if not exists knowledge_items_assigned_idx on public.knowledge_items(assigned_to);
create index if not exists knowledge_items_due_date_idx on public.knowledge_items(due_date);
create index if not exists knowledge_items_type_idx on public.knowledge_items(content_type);
