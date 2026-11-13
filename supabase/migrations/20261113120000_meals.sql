-- PROJ-5 Einfache Mahlzeiten: shared, read-only meal content.
-- Design: features/PROJ-5-einfache-mahlzeiten/design.md → Datenmodell.
-- No personal data. The team maintains the content through migrations; nobody writes through the API.

-- True when every entry of the list is between min_length and max_length characters long.
-- Check constraints may not contain subqueries, so the per-entry length check lives here.
create function private.array_lengths_between(values_to_check text[], min_length integer, max_length integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(char_length(value) between min_length and max_length), true)
  from unnest(values_to_check) as value;
$$;

revoke all on function private.array_lengths_between(text[], integer, integer) from public;
grant execute on function private.array_lengths_between(text[], integer, integer) to authenticated, service_role;

-- Mahlzeit: one simple meal for one person (AC-5 to AC-7, AC-9).
create table public.meals (
  id text primary key
    constraint meals_id_check check (id ~ '^[a-z0-9_]{3,40}$'),
  title text not null
    constraint meals_title_check check (char_length(title) between 2 and 60),
  diet text not null
    constraint meals_diet_check check (diet in ('vegan', 'vegetarian', 'meat_fish')),
  effort text not null
    constraint meals_effort_check check (effort in ('no_cook', 'quick', 'up_to_20')),
  minutes integer not null,
  -- One line each: amount and ingredient for one person.
  ingredients text[] not null
    constraint meals_ingredients_check check (
      cardinality(ingredients) between 1 and 6
      and private.array_lengths_between(ingredients, 2, 80)
      and private.array_is_distinct(ingredients)
    ),
  -- In order; at most two short sentences each.
  steps text[] not null
    constraint meals_steps_check check (
      cardinality(steps) between 1 and 5
      and private.array_lengths_between(steps, 5, 200)
    ),
  easier_hint text not null
    constraint meals_easier_hint_check check (char_length(easier_hint) between 10 and 200),
  -- No default on purpose: "none of the 14" must be stated, never forgotten (EC-4).
  allergens text[] not null
    constraint meals_allergens_check check (
      allergens <@ array[
        'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk',
        'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
      ]::text[]
      and private.array_is_distinct(allergens)
    ),
  -- Sample content stays marked until experts have reviewed it (AC-8).
  review_status text not null default 'unreviewed'
    constraint meals_review_status_check check (review_status in ('unreviewed', 'reviewed')),
  -- Meals taken off the offer are invisible to users (EC-2).
  is_offered boolean not null default true,
  sort_order integer not null default 0
    constraint meals_sort_order_check check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Effort level and minutes never contradict each other (AC-3).
  constraint meals_effort_minutes_check check (
    (effort in ('no_cook', 'quick') and minutes between 1 and 10)
    or (effort = 'up_to_20' and minutes between 11 and 20)
  ),
  -- Obvious content mistakes ("vegan with milk") are refused when the content is loaded.
  constraint meals_diet_allergens_check check (
    (diet <> 'vegan' or not allergens && array['milk', 'eggs', 'fish', 'crustaceans', 'molluscs']::text[])
    and (diet <> 'vegetarian' or not allergens && array['fish', 'crustaceans', 'molluscs']::text[])
  )
);

comment on table public.meals is 'PROJ-5 shared meal content. Read-only for users; only offered meals are visible.';

create index meals_offered_sort_order_idx on public.meals (sort_order) where is_offered;

create trigger meals_touch_updated_at
  before update on public.meals
  for each row
  execute function private.touch_updated_at();

-- Row Level Security: signed-in people read offered meals; nobody writes through the API (AC-10).
alter table public.meals enable row level security;

create policy meals_select_offered
  on public.meals
  for select
  to authenticated
  using (is_offered);

-- Table privileges as a second line behind RLS: anonymous visitors get nothing, signed-in people
-- may only read. Insert, update, delete and truncate are not granted to anyone but the team's
-- migrations (AC-10).
revoke all on table public.meals from anon, authenticated;
grant select on table public.meals to authenticated;
