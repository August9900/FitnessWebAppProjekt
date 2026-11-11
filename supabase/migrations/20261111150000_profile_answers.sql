-- PROJ-3 Kurzprofil & Einstieg: the person's answers on the existing profile row.
-- Design: features/PROJ-3-kurzprofil-einstieg/design.md → Datenmodell.

-- True when an array holds no value twice. Used by the check constraints below.
create function private.array_is_distinct(values_to_check text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(values_to_check) = (select count(distinct value) from unnest(values_to_check) as value);
$$;

revoke all on function private.array_is_distinct(text[]) from public;
grant execute on function private.array_is_distinct(text[]) to authenticated, service_role;

alter table public.profiles
  add column goal text,
  add column experience text,
  add column places text[],
  add column home_equipment text[],
  add column diet text;

-- Allowed values. Every column may stay empty until the person answers (EC-1); the database
-- refuses anything else, also for direct requests that bypass the app (EC-5).
alter table public.profiles
  add constraint profiles_goal_check
    check (goal is null or goal in ('move_more', 'fitness', 'strength', 'eat_better', 'wellbeing')),
  add constraint profiles_experience_check
    check (experience is null or experience in ('beginner', 'occasional', 'regular')),
  add constraint profiles_places_check
    check (
      places is null or (
        cardinality(places) >= 1
        and places <@ array['home', 'outdoors', 'gym']::text[]
        and private.array_is_distinct(places)
      )
    ),
  add constraint profiles_home_equipment_check
    check (
      home_equipment is null or (
        cardinality(home_equipment) >= 1
        and home_equipment <@ array['mat', 'dumbbells', 'resistance_band', 'pull_up_bar', 'kettlebell', 'none']::text[]
        and private.array_is_distinct(home_equipment)
        and (not ('none' = any (home_equipment)) or cardinality(home_equipment) = 1)
      )
    ),
  -- Equipment at home only exists together with "home" as a place (AC-14).
  add constraint profiles_home_equipment_needs_home_check
    check (home_equipment is null or (places is not null and 'home' = any (places))),
  add constraint profiles_diet_check
    check (diet is null or diet in ('omnivore', 'vegetarian', 'vegan'));

-- Owners change their own answers, and only with a live session (AC-16).
create policy profiles_update_own_with_active_session
  on public.profiles
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
  )
  with check (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
  );

-- Row Level Security decides which rows; these grants decide which columns. Only the five
-- answers are changeable — age band, owner and timestamps are not.
revoke insert, update, delete, truncate on table public.profiles from authenticated;
grant update (goal, experience, places, home_equipment, diet) on table public.profiles to authenticated;

-- Keeps updated_at current on every change.
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function private.touch_updated_at();
