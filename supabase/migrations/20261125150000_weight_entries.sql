-- PROJ-11 Gewichtsverlauf: a person's own weight entries — at most one per calendar day — and the
-- account setting that shows or hides the area in the navigation.
-- Design: features/PROJ-11-gewichtsverlauf/design.md → Datenmodell.
-- Personal (body) data: each row belongs to exactly one person aged 16 or over, is visible only to
-- them, is part of the data export and is removed with the account (AC-15 to AC-17).

-- Account setting "Gewicht in der Navigation zeigen" (AC-14). On for everybody by default; changed
-- only by the person (the existing row rule "own profile, active session" applies).
alter table public.profiles
  add column show_weight_in_nav boolean not null default true;

comment on column public.profiles.show_weight_in_nav is
  'PROJ-11 AC-14: shows the area "Gewicht" in the navigation (only relevant for the age band 16_plus).';

grant update (show_weight_in_nav) on table public.profiles to authenticated;

-- True when the signed-in person's age band is "ab 16" (AC-2). Runs with the owner's rights and only
-- ever reads the caller's own profile row, so the access rules below do not depend on profile RLS.
create function private.is_sixteen_plus()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.age_band_at_signup = '16_plus'
  );
$$;

revoke all on function private.is_sixteen_plus() from public;
grant execute on function private.is_sixteen_plus() to authenticated;

create table public.weight_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- One calendar day; the app checks "not in the future" in the device's time zone (EC-5).
  entry_date date not null,
  -- Kilograms with at most one decimal (AC-5). Plain numeric so 72.45 is refused, not rounded.
  weight_kg numeric not null
    constraint weight_entries_weight_check check (weight_kg between 30 and 300 and weight_kg = round(weight_kg, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One entry per person and day, also when two devices save at the same moment (AC-6, EC-1).
  primary key (user_id, entry_date)
);

comment on table public.weight_entries is
  'PROJ-11 weight entries: one value in kg per person and calendar day. Owner only, age band 16_plus only.';

-- Coarse guard against dates in the future: today in UTC plus one day covers every time zone; the
-- exact check uses the device's time zone in the app (AC-5, EC-5).
create function private.check_weight_entry_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.entry_date > (now() at time zone 'utc')::date + 1 then
    raise exception 'weight entry date lies in the future' using errcode = 'WE001';
  end if;
  return new;
end;
$$;

revoke all on function private.check_weight_entry_date() from public;

create trigger weight_entries_check_date
  before insert or update of entry_date on public.weight_entries
  for each row
  execute function private.check_weight_entry_date();

create trigger weight_entries_touch_updated_at
  before update on public.weight_entries
  for each row
  execute function private.touch_updated_at();

-- Row Level Security: only the owner, only with a live session, only "ab 16" (AC-2, AC-15).
alter table public.weight_entries enable row level security;

create policy weight_entries_select_own
  on public.weight_entries
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and (select private.is_sixteen_plus())
  );

create policy weight_entries_insert_own
  on public.weight_entries
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and (select private.is_sixteen_plus())
  );

create policy weight_entries_update_own
  on public.weight_entries
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and (select private.is_sixteen_plus())
  )
  with check (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and (select private.is_sixteen_plus())
  );

create policy weight_entries_delete_own
  on public.weight_entries
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and (select private.is_sixteen_plus())
  );

-- Table privileges as a second line behind RLS: nothing for anonymous visitors; signed-in people
-- read and delete their own rows, add one with person, day and weight, and change only day and
-- weight. Times are set by the database.
revoke all on table public.weight_entries from anon, authenticated;
grant select, delete on table public.weight_entries to authenticated;
grant insert (user_id, entry_date, weight_kg) on table public.weight_entries to authenticated;
grant update (entry_date, weight_kg) on table public.weight_entries to authenticated;

-- Saves one entry in a single step (AC-4, AC-6, AC-11, EC-1 to EC-3). Runs with the caller's rights,
-- so every statement below is bound by the access rules above.
--   p_previous_date null  → new entry for p_entry_date
--   p_previous_date given → change that entry (value and possibly its day)
-- Result: {"status": "saved"} · {"status": "exists", "weight_kg": <value on that day>} · {"status": "gone"}
-- The same value already stored on the target day counts as saved (double taps, retries — EC-2).
create function public.save_weight_entry(
  p_entry_date date,
  p_weight_kg numeric,
  p_previous_date date default null,
  p_replace boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  existing numeric;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  if p_previous_date is not null then
    perform 1 from public.weight_entries
      where user_id = uid and entry_date = p_previous_date
      for update;
    if not found then
      return jsonb_build_object('status', 'gone');
    end if;
  end if;

  if p_previous_date is distinct from p_entry_date then
    select weight_kg into existing from public.weight_entries
      where user_id = uid and entry_date = p_entry_date
      for update;
    if found and existing <> p_weight_kg and not p_replace then
      return jsonb_build_object('status', 'exists', 'weight_kg', existing);
    end if;
  end if;

  if p_previous_date is null then
    insert into public.weight_entries (user_id, entry_date, weight_kg)
      values (uid, p_entry_date, p_weight_kg)
      on conflict (user_id, entry_date) do update set weight_kg = excluded.weight_kg;
  elsif p_previous_date = p_entry_date then
    update public.weight_entries set weight_kg = p_weight_kg
      where user_id = uid and entry_date = p_entry_date;
  else
    -- Moving to another day: the entry there (if any) is replaced, then the entry moves.
    delete from public.weight_entries where user_id = uid and entry_date = p_entry_date;
    update public.weight_entries set entry_date = p_entry_date, weight_kg = p_weight_kg
      where user_id = uid and entry_date = p_previous_date;
  end if;

  return jsonb_build_object('status', 'saved');
end;
$$;

revoke all on function public.save_weight_entry(date, numeric, date, boolean) from public, anon;
grant execute on function public.save_weight_entry(date, numeric, date, boolean) to authenticated;
