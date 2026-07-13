-- AI Innovation Hub — профили, роли и права за достъп
-- Изпълнете целия файл в Supabase > SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Създава профил при всяка нова регистрация.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Добавя профили за вече регистрираните потребители.
insert into public.profiles (id, full_name, email, role, created_at)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(coalesce(email, ''), '@', 1)),
  coalesce(email, ''),
  'member',
  created_at
from auth.users
on conflict (id) do update
set email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;

-- Първият създаден акаунт е собственикът на платформата.
update public.profiles
set role = 'admin', updated_at = now()
where id = (select id from auth.users order by created_at asc limit 1);

-- Проверка за администратор, използвана от RLS политиките.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins can read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "Admins can update profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Всички влезли потребители четат съдържанието; само администраторите го променят.
do $$
declare
  table_name text;
  policy_row record;
begin
  foreach table_name in array array['ai_tools', 'ai_news', 'experiments', 'knowledge_items']
  loop
    if to_regclass('public.' || table_name) is not null then
      for policy_row in
        select policyname from pg_policies where schemaname = 'public' and tablename = table_name
      loop
        execute format('drop policy if exists %I on public.%I', policy_row.policyname, table_name);
      end loop;

      execute format(
        'create policy %I on public.%I for select to authenticated using (true)',
        'Authenticated users can read ' || table_name, table_name
      );
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
        'Admins can insert ' || table_name, table_name
      );
      execute format(
        'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
        'Admins can update ' || table_name, table_name
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
        'Admins can delete ' || table_name, table_name
      );
    end if;
  end loop;
end $$;

