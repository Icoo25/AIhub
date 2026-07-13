-- AI Компас — server-side регистрация само с валидна фирмена покана
-- След изпълнение: Supabase > Authentication > Hooks > Before User Created
-- изберете Postgres функция public.hook_require_valid_invite.

create or replace function public.hook_require_valid_invite(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  requested_email text := lower(event->'user'->>'email');
  invite_token text := event->'user'->'user_metadata'->>'invite_token';
  valid_invite boolean := false;
begin
  if invite_token is not null and invite_token <> '' then
    select exists (
      select 1 from public.team_invites
      where token::text = invite_token
        and lower(email) = requested_email
        and used_at is null
        and expires_at > now()
    ) into valid_invite;
  end if;

  if not valid_invite then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Регистрацията е достъпна само с валидна фирмена покана.'
    ));
  end if;

  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on table public.team_invites to supabase_auth_admin;
grant execute on function public.hook_require_valid_invite(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_require_valid_invite(jsonb) from authenticated, anon, public;

drop policy if exists "Auth hook can validate invites" on public.team_invites;
create policy "Auth hook can validate invites" on public.team_invites
  for select to supabase_auth_admin using (true);
