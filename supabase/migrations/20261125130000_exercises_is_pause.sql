-- PROJ-9 Übungsbibliothek, Refine 2026-11-25 (AC-11): an exercise can be marked as a pause.
-- Design: features/PROJ-9-uebungsbibliothek/design.md → Pausen.
-- Pauses are not shown in the exercise library and their names are not linked there; the PROJ-10
-- picker still offers them. Rights and Row Level Security of `exercises` stay unchanged: signed-in
-- people read (table-level select grant covers the new column), nobody writes through the API.

alter table public.exercises
  add column is_pause boolean not null default false;

comment on column public.exercises.is_pause is 'PROJ-9 AC-11: true for pauses such as „Kurze Pause“ — not a library exercise.';

update public.exercises
set is_pause = true, updated_at = now()
where id = 'kurze_pause';
