-- PROJ-1 Konto & Anmeldung: Kurzprofil, Anlage-Trigger, Sitzungsprüfung und Zugriffsregeln.
-- Design: features/PROJ-1-konto-anmeldung/design.md → Datenmodell.

-- Functions that must not be reachable through the public API live in their own schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Kurzprofil: exactly one row per account, removed together with the account.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age_band_at_signup text not null
    constraint profiles_age_band_check check (age_band_at_signup in ('12_15', '16_plus')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'PROJ-1 Kurzprofil. Age band is a self-declaration at signup; PROJ-3 adds goal and training options.';

alter table public.profiles enable row level security;

-- Nothing in PROJ-1 lets anonymous visitors near this table.
revoke all on table public.profiles from anon;

-- True only while the session named in the caller's access token still exists and has not
-- expired. Closes the gap between a sign-out / password change / account deletion and the
-- natural expiry of an already issued access token (AC-9, AC-11, AC-12, EC-5).
create function private.has_active_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions s
    where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
      and s.user_id = auth.uid()
      and (s.not_after is null or s.not_after > now())
  );
$$;

revoke all on function private.has_active_session() from public;
grant execute on function private.has_active_session() to authenticated;

-- Owners read their own profile, and only with a live session (AC-1, AC-12, AC-14).
-- There are deliberately no insert/update/delete policies: the profile is created by the
-- trigger below and removed by the cascade from auth.users.
create policy profiles_select_own_with_active_session
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
  );

-- Creates the profile in the same transaction as the account. A missing or invalid age band
-- aborts the whole signup, so no account exists without a profile — also for direct calls to
-- Supabase Auth that bypass the app's form (AC-2, AC-3, AC-13; EC-1, EC-4).
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  band text := new.raw_user_meta_data ->> 'age_band';
begin
  if band is null or band not in ('12_15', '16_plus') then
    raise exception 'age_band missing or invalid'
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (user_id, age_band_at_signup)
  values (new.id, band);

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();
