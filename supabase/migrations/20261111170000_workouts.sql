-- PROJ-4 Kurze Workouts: shared, read-only content — exercises, workouts and their steps.
-- Design: features/PROJ-4-kurze-workouts/design.md → Datenmodell.
-- No personal data. The team maintains the content through migrations; nobody writes through the API.

-- Übung: one exercise with exactly one easier variant (AC-7, AC-13).
create table public.exercises (
  id text primary key
    constraint exercises_id_check check (id ~ '^[a-z0-9_]{3,40}$'),
  name text not null
    constraint exercises_name_check check (char_length(name) between 2 and 60),
  instructions text not null
    constraint exercises_instructions_check check (char_length(instructions) between 10 and 300),
  easier_name text not null
    constraint exercises_easier_name_check check (char_length(easier_name) between 2 and 60),
  easier_instructions text not null
    constraint exercises_easier_instructions_check check (char_length(easier_instructions) between 10 and 300),
  -- Empty = no equipment. Same codes as the PROJ-3 answers, without "none".
  equipment text[] not null default '{}'
    constraint exercises_equipment_check check (
      equipment <@ array['mat', 'dumbbells', 'resistance_band', 'pull_up_bar', 'kettlebell']::text[]
      and private.array_is_distinct(equipment)
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.exercises is 'PROJ-4 shared exercise content with one easier variant each. Read-only for users.';

-- Workout: a short, doable sequence of exercises. The needed equipment is derived from its exercises.
create table public.workouts (
  id text primary key
    constraint workouts_id_check check (id ~ '^[a-z0-9_]{3,40}$'),
  title text not null
    constraint workouts_title_check check (char_length(title) between 2 and 60),
  description text not null
    constraint workouts_description_check check (char_length(description) between 10 and 240),
  duration_minutes integer not null
    constraint workouts_duration_check check (duration_minutes in (5, 10, 15)),
  intensity text not null
    constraint workouts_intensity_check check (intensity in ('gentle', 'moderate', 'vigorous')),
  places text[] not null
    constraint workouts_places_check check (
      cardinality(places) >= 1
      and places <@ array['home', 'outdoors', 'gym']::text[]
      and private.array_is_distinct(places)
    ),
  -- Sample content stays marked until experts have reviewed it (AC-12).
  review_status text not null default 'unreviewed'
    constraint workouts_review_status_check check (review_status in ('unreviewed', 'reviewed')),
  -- Workouts taken off the offer are invisible to users (EC-2).
  is_offered boolean not null default true,
  sort_order integer not null default 0
    constraint workouts_sort_order_check check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workouts is 'PROJ-4 shared workout content. Read-only for users; only offered workouts are visible.';

create index workouts_offered_sort_order_idx on public.workouts (sort_order) where is_offered;

-- Workout-Schritt: one exercise at one position, with seconds or repetitions.
create table public.workout_steps (
  workout_id text not null references public.workouts (id) on delete cascade,
  position integer not null
    constraint workout_steps_position_check check (position between 1 and 30),
  exercise_id text not null references public.exercises (id) on delete restrict,
  mode text not null
    constraint workout_steps_mode_check check (mode in ('time', 'reps')),
  amount integer not null,
  primary key (workout_id, position),
  constraint workout_steps_amount_check check (
    (mode = 'time' and amount between 10 and 300)
    or (mode = 'reps' and amount between 1 and 50)
  )
);

comment on table public.workout_steps is 'PROJ-4 ordered steps of a workout. Read-only for users.';

-- Foreign keys are not indexed automatically; this one guards the "restrict" check on exercise deletes.
create index workout_steps_exercise_id_idx on public.workout_steps (exercise_id);

create trigger exercises_touch_updated_at
  before update on public.exercises
  for each row
  execute function private.touch_updated_at();

create trigger workouts_touch_updated_at
  before update on public.workouts
  for each row
  execute function private.touch_updated_at();

-- Row Level Security: signed-in people read; nobody writes through the API (AC-14).
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_steps enable row level security;

create policy exercises_select_signed_in
  on public.exercises
  for select
  to authenticated
  using (true);

create policy workouts_select_offered
  on public.workouts
  for select
  to authenticated
  using (is_offered);

-- Steps are visible only together with a visible (offered) workout.
create policy workout_steps_select_offered_workout
  on public.workout_steps
  for select
  to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id));

-- Table privileges as a second line behind RLS: anonymous visitors get nothing, signed-in people
-- may only read. Insert, update, delete and truncate are not granted to anyone but the team's
-- migrations (AC-14).
revoke all on table public.exercises, public.workouts, public.workout_steps from anon, authenticated;
grant select on table public.exercises, public.workouts, public.workout_steps to authenticated;
