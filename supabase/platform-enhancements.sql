-- AI Компас — фирмени покани, любими инструменти, активност и профилни функции
-- Изпълнете целия файл в Supabase > SQL Editor след roles-and-permissions.sql.
-- Миграцията е idempotent и може да бъде изпълнена повторно.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Фирмени покани
-- ---------------------------------------------------------------------------

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  email text not null,
  role text not null default 'viewer',
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.team_invites
  add column if not exists token uuid default gen_random_uuid(),
  add column if not exists email text,
  add column if not exists role text default 'viewer',
  add column if not exists expires_at timestamptz default (now() + interval '7 days'),
  add column if not exists used_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists created_at timestamptz default now();

update public.team_invites
set expires_at = coalesce(expires_at, created_at + interval '7 days'),
    role = coalesce(role, 'viewer');

alter table public.team_invites drop constraint if exists team_invites_role_check;
alter table public.team_invites
  add constraint team_invites_role_check
  check (role in ('admin', 'editor', 'researcher', 'viewer', 'member'));

create index if not exists team_invites_email_idx
  on public.team_invites (lower(email));
create index if not exists team_invites_active_idx
  on public.team_invites (expires_at)
  where used_at is null;

alter table public.team_invites enable row level security;

drop policy if exists "Admins can read team invites" on public.team_invites;
drop policy if exists "Admins can create team invites" on public.team_invites;
drop policy if exists "Admins can update team invites" on public.team_invites;
drop policy if exists "Admins can delete team invites" on public.team_invites;

create policy "Admins can read team invites"
  on public.team_invites for select to authenticated
  using (public.is_admin());

create policy "Admins can create team invites"
  on public.team_invites for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update team invites"
  on public.team_invites for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete team invites"
  on public.team_invites for delete to authenticated
  using (public.is_admin());

-- Публичната register страница получава само валидната покана чрез security
-- definer функция. Няма директен anonymous select върху таблицата.
create or replace function public.validate_team_invite(invite_token text)
returns table (
  id uuid,
  token text,
  email text,
  role text,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invitation.id,
    invitation.token::text,
    invitation.email,
    invitation.role,
    invitation.expires_at,
    invitation.used_at,
    invitation.created_at
  from public.team_invites as invitation
  where invitation.token::text = invite_token
    and invitation.used_at is null
    and invitation.expires_at > now()
  limit 1;
$$;

revoke all on function public.validate_team_invite(text) from public;
grant execute on function public.validate_team_invite(text) to anon, authenticated;

-- Създава профила с ролята от поканата и маркира поканата като използвана.
-- Замества първоначалната handle_new_user() от roles-and-permissions.sql.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_token text := new.raw_user_meta_data ->> 'invite_token';
  invited_role text;
begin
  select invitation.role
  into invited_role
  from public.team_invites as invitation
  where invitation.token::text = invite_token
    and lower(invitation.email) = lower(coalesce(new.email, ''))
    and invitation.used_at is null
    and invitation.expires_at > now()
  limit 1
  for update;

  -- Първият профил става собственик. След него регистрацията без покана
  -- получава viewer fallback, но invite-only hook-ът я блокира в production.
  if not exists (select 1 from public.profiles) then
    invited_role := 'admin';
  else
    invited_role := coalesce(invited_role, 'viewer');
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.email, ''),
    invited_role
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      role = excluded.role,
      updated_at = now();

  if invite_token is not null and invite_token <> '' then
    update public.team_invites
    set used_at = now()
    where token::text = invite_token
      and lower(email) = lower(coalesce(new.email, ''))
      and used_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Персонални любими AI инструменти
-- ---------------------------------------------------------------------------

create table if not exists public.tool_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id uuid not null references public.ai_tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create index if not exists tool_favorites_tool_idx
  on public.tool_favorites(tool_id);
create unique index if not exists tool_favorites_user_tool_idx
  on public.tool_favorites(user_id, tool_id);

alter table public.tool_favorites enable row level security;

drop policy if exists "Users can read own tool favorites" on public.tool_favorites;
drop policy if exists "Users can add own tool favorites" on public.tool_favorites;
drop policy if exists "Users can remove own tool favorites" on public.tool_favorites;

create policy "Users can read own tool favorites"
  on public.tool_favorites for select to authenticated
  using (user_id = auth.uid());

create policy "Users can add own tool favorites"
  on public.tool_favorites for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove own tool favorites"
  on public.tool_favorites for delete to authenticated
  using (user_id = auth.uid());

-- Пренася legacy глобалните favorites към първия администратор, ако колоната
-- от първоначалната schema все още съществува.
do $$
declare
  owner_id uuid;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_tools'
      and column_name = 'is_favorite'
  ) then
    select profiles.id
    into owner_id
    from public.profiles
    where profiles.role = 'admin'
    order by profiles.created_at
    limit 1;

    if owner_id is not null then
      insert into public.tool_favorites (user_id, tool_id)
      select owner_id, tools.id
      from public.ai_tools as tools
      where tools.is_favorite = true
      on conflict do nothing;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Настройки на личния профил
-- ---------------------------------------------------------------------------

create or replace function public.update_my_profile(new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(coalesce(new_name, ''))) < 2 then
    raise exception 'Name is too short';
  end if;

  update public.profiles
  set full_name = trim(new_name),
      updated_at = now()
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.update_my_profile(text) from public;
grant execute on function public.update_my_profile(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Журнал на активността
-- ---------------------------------------------------------------------------

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx
  on public.activity_log(created_at desc);
create index if not exists activity_log_entity_idx
  on public.activity_log(entity_type, entity_id);

alter table public.activity_log enable row level security;

drop policy if exists "Authenticated users can read activity" on public.activity_log;
drop policy if exists "Admins can delete activity" on public.activity_log;

create policy "Authenticated users can read activity"
  on public.activity_log for select to authenticated
  using (true);

create policy "Admins can delete activity"
  on public.activity_log for delete to authenticated
  using (public.is_admin());

create or replace function public.log_platform_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  record_data jsonb;
  record_id uuid;
  record_summary text;
begin
  record_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  record_id := nullif(record_data ->> 'id', '')::uuid;
  record_summary := coalesce(
    nullif(record_data ->> 'name', ''),
    nullif(record_data ->> 'title', ''),
    'Запис'
  );

  insert into public.activity_log (
    entity_type,
    entity_id,
    action,
    summary,
    metadata,
    user_id
  )
  values (
    tg_table_name,
    record_id,
    lower(tg_op),
    record_summary,
    case
      when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
      else record_data
    end,
    auth.uid()
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['ai_tools', 'ai_news', 'experiments', 'knowledge_items']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'drop trigger if exists platform_activity_trigger on public.%I',
        table_name
      );
      execute format(
        'create trigger platform_activity_trigger after insert or update or delete on public.%I for each row execute procedure public.log_platform_activity()',
        table_name
      );
    end if;
  end loop;
end $$;
