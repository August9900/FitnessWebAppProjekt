-- PROJ-6 Tagesentscheidung: check-ins with their suggestion, and the actions begun from them.
-- Design: features/PROJ-6-tagesentscheidung/design.md → Datenmodell.
-- Personal data: each row belongs to exactly one person, is visible only to them, is part of the
-- data export and is removed together with the account (AC-17 to AC-19).

-- Tages-Check-in mit Tagesvorschlag: the answers of one decision and the ranked suggestion (AC-11).
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null
    constraint check_ins_kind_check check (kind in ('move', 'eat')),
  minutes integer
    constraint check_ins_minutes_check check (minutes in (5, 10, 15)),
  energy text
    constraint check_ins_energy_check check (energy in ('low', 'medium', 'high')),
  place text
    constraint check_ins_place_check check (place in ('home', 'outdoors', 'gym')),
  effort text
    constraint check_ins_effort_check check (effort in ('no_cook', 'quick', 'up_to_20')),
  -- Rank order: first entry is the main suggestion. Workout ids for "move", meal ids for "eat".
  -- Empty = nothing fitted (EC-1).
  suggested_ids text[] not null default '{}'
    constraint check_ins_suggested_ids_check check (
      cardinality(suggested_ids) <= 3
      and private.array_is_distinct(suggested_ids)
    ),
  created_at timestamptz not null default now(),
  -- Exactly the answers of the chosen kind (AC-2, AC-3).
  constraint check_ins_answers_check check (
    (kind = 'move' and minutes is not null and energy is not null and place is not null and effort is null)
    or (kind = 'eat' and effort is not null and minutes is null and energy is null and place is null)
  )
);

comment on table public.check_ins is 'PROJ-6 check-in answers with the ranked suggestion. Owner only; never changed after insert.';

-- Last answers per kind and the "Rückgängig" check (AC-5, AC-15).
create index check_ins_user_kind_created_idx on public.check_ins (user_id, kind, created_at desc);

-- Aktionsverlauf: one action begun from a check-in, with its state (AC-12 to AC-16).
create table public.actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- At most one action per check-in: a second start returns the existing one (EC-4).
  check_in_id uuid not null unique references public.check_ins (id) on delete cascade,
  kind text not null
    constraint actions_kind_check check (kind in ('move', 'eat')),
  workout_id text references public.workouts (id) on delete restrict,
  meal_id text references public.meals (id) on delete restrict,
  status text not null default 'started'
    constraint actions_status_check check (status in ('started', 'done', 'skipped')),
  started_at timestamptz not null default now(),
  concluded_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint actions_target_check check (
    (kind = 'move' and workout_id is not null and meal_id is null)
    or (kind = 'eat' and meal_id is not null and workout_id is null)
  ),
  constraint actions_concluded_check check ((status = 'started') = (concluded_at is null))
);

comment on table public.actions is 'PROJ-6 actions begun from a suggestion. Owner only; only status and concluded_at change.';

-- Open actions (12 h) and recently begun content (72 h) (AC-7, AC-8, AC-13).
create index actions_user_started_idx on public.actions (user_id, started_at desc);
-- Foreign keys are not indexed automatically; these guard the "restrict" checks on content.
create index actions_workout_id_idx on public.actions (workout_id) where workout_id is not null;
create index actions_meal_id_idx on public.actions (meal_id) where meal_id is not null;

create trigger actions_touch_updated_at
  before update on public.actions
  for each row
  execute function private.touch_updated_at();

-- Row Level Security: only the owner, and only with a live session (same pattern as profiles).
alter table public.check_ins enable row level security;
alter table public.actions enable row level security;

create policy check_ins_select_own
  on public.check_ins
  for select
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()));

create policy check_ins_insert_own
  on public.check_ins
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id and (select private.has_active_session()));

create policy actions_select_own
  on public.actions
  for select
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()));

-- A new action starts "begonnen", from the person's own check-in of the same kind, for content
-- that stands in that check-in's suggestion and is still offered (the content tables' own RLS
-- hides content that is no longer offered) (AC-12, EC-6).
create policy actions_insert_own_suggested
  on public.actions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and status = 'started'
    and concluded_at is null
    and exists (
      select 1
      from public.check_ins c
      where c.id = actions.check_in_id
        and c.user_id = (select auth.uid())
        and c.kind = actions.kind
        and coalesce(actions.workout_id, actions.meal_id) = any (c.suggested_ids)
    )
    and (actions.workout_id is null or exists (select 1 from public.workouts w where w.id = actions.workout_id))
    and (actions.meal_id is null or exists (select 1 from public.meals m where m.id = actions.meal_id))
  );

create policy actions_update_own
  on public.actions
  for update
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()))
  with check ((select auth.uid()) = user_id and (select private.has_active_session()));

-- Table privileges as a second line behind RLS: nothing for anonymous visitors; signed-in people
-- read and add their own rows and may change only an action's state. No deletes through the API —
-- rows go with the account (AC-17, AC-19).
revoke all on table public.check_ins, public.actions from anon, authenticated;
grant select, insert on table public.check_ins to authenticated;
grant select, insert on table public.actions to authenticated;
grant update (status, concluded_at) on table public.actions to authenticated;
