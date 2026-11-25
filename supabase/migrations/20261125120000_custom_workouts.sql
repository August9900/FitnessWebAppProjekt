-- PROJ-10 Eigene Trainingspläne: a person's own workouts — a named sequence of library exercises.
-- Design: features/PROJ-10-eigene-trainingsplaene/design.md → Datenmodell.
-- Personal data: each row belongs to exactly one person, is visible only to them, is part of the
-- data export and is removed with the account (AC-12 to AC-14).

-- Shape of the sequence: 1–12 steps, each exactly {exercise_id, mode, amount}; seconds 10–180 in
-- steps of 5, repetitions 1–30 (AC-6). Written as a loop so no check runs on a value of the wrong type.
create function private.custom_workout_steps_valid(steps jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  step jsonb;
  amount integer;
begin
  if jsonb_typeof(steps) is distinct from 'array' or jsonb_array_length(steps) not between 1 and 12 then
    return false;
  end if;

  for step in select value from jsonb_array_elements(steps) loop
    if jsonb_typeof(step) is distinct from 'object' then
      return false;
    end if;
    if (select count(*) from jsonb_object_keys(step)) <> 3 then
      return false;
    end if;
    if jsonb_typeof(step -> 'exercise_id') is distinct from 'string'
      or (step ->> 'exercise_id') !~ '^[a-z0-9_]{3,40}$' then
      return false;
    end if;
    if jsonb_typeof(step -> 'amount') is distinct from 'number' or (step ->> 'amount') !~ '^[0-9]{1,4}$' then
      return false;
    end if;

    amount := (step ->> 'amount')::integer;
    if step ->> 'mode' = 'time' then
      if amount not between 10 and 180 or amount % 5 <> 0 then
        return false;
      end if;
    elsif step ->> 'mode' = 'reps' then
      if amount not between 1 and 30 then
        return false;
      end if;
    else
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function private.custom_workout_steps_valid(jsonb) from public;
grant execute on function private.custom_workout_steps_valid(jsonb) to authenticated, service_role;

create table public.custom_workouts (
  -- Chosen by the editor when it opens, so a double "Speichern" never creates two (EC-4).
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Free text; same names allowed (EC-7). Stored trimmed.
  name text not null
    constraint custom_workouts_name_check check (name = btrim(name) and char_length(name) between 2 and 40),
  -- Ordered: the first entry is the first exercise. Replaced as a whole on every save (EC-1).
  steps jsonb not null
    constraint custom_workouts_steps_check check (private.custom_workout_steps_valid(steps)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.custom_workouts is
  'PROJ-10 own workouts: name and ordered exercise sequence. Owner only; name and steps change together.';

-- Overview and the 20-workouts limit (AC-1, AC-11).
create index custom_workouts_user_idx on public.custom_workouts (user_id);

-- Every step names an exercise of the library (AC-6). Runs with the caller's rights; the library
-- is readable for every signed-in person.
create function private.check_custom_workout_exercises()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from jsonb_array_elements(new.steps) as step
    where not exists (select 1 from public.exercises e where e.id = step ->> 'exercise_id')
  ) then
    raise exception 'custom workout names an unknown exercise' using errcode = 'PW001';
  end if;
  return new;
end;
$$;

create trigger custom_workouts_check_exercises
  before insert or update of steps on public.custom_workouts
  for each row
  execute function private.check_custom_workout_exercises();

-- At most 20 own workouts, also when two devices create one at the same moment (AC-11, EC-3):
-- a short lock per person, then count. Runs with the owner's rights so the count never depends on
-- the caller's access rules.
create function private.limit_custom_workouts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('custom_workouts:' || new.user_id::text, 0));
  if (select count(*) from public.custom_workouts where user_id = new.user_id) >= 20 then
    raise exception 'custom workout limit reached' using errcode = 'PW002';
  end if;
  return new;
end;
$$;

revoke all on function private.limit_custom_workouts() from public;

create trigger custom_workouts_limit
  before insert on public.custom_workouts
  for each row
  execute function private.limit_custom_workouts();

create trigger custom_workouts_touch_updated_at
  before update on public.custom_workouts
  for each row
  execute function private.touch_updated_at();

-- Row Level Security: only the owner, only with a live session (same pattern as PROJ-1, 6, 7).
alter table public.custom_workouts enable row level security;

create policy custom_workouts_select_own
  on public.custom_workouts
  for select
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()));

create policy custom_workouts_insert_own
  on public.custom_workouts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id and (select private.has_active_session()));

create policy custom_workouts_update_own
  on public.custom_workouts
  for update
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()))
  with check ((select auth.uid()) = user_id and (select private.has_active_session()));

create policy custom_workouts_delete_own
  on public.custom_workouts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()));

-- Table privileges as a second line behind RLS: nothing for anonymous visitors; signed-in people
-- read and delete their own rows, add one with id, person, name and steps, and change only name
-- and steps. Times are set by the database.
revoke all on table public.custom_workouts from anon, authenticated;
grant select, delete on table public.custom_workouts to authenticated;
grant insert (id, user_id, name, steps) on table public.custom_workouts to authenticated;
grant update (name, steps) on table public.custom_workouts to authenticated;
