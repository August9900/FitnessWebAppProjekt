-- PROJ-7 Abschlussfeedback: the optional feedback to an action marked "Geschafft".
-- Design: features/PROJ-7-abschlussfeedback/design.md → Datenmodell.
-- Personal data: each row belongs to exactly one person and one of their actions, is visible only
-- to them, is part of the data export and is removed with the account or the "Rückgängig" of its
-- action (AC-8, AC-16 to AC-18).

create table public.action_feedback (
  -- At most one feedback per action (EC-1).
  action_id uuid primary key references public.actions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  effort text
    constraint action_feedback_effort_check check (effort in ('too_little', 'just_right', 'too_much')),
  -- Set by the database whenever "effort" changes; the 14-day window counts from here (EC-8).
  effort_at timestamptz,
  suggest_again text
    constraint action_feedback_suggest_again_check check (suggest_again in ('yes', 'no')),
  -- Set by the database whenever "suggest_again" changes; "zuletzt gesagt" is decided by it (AC-9, AC-10).
  suggest_again_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_feedback_effort_at_check check ((effort is null) = (effort_at is null)),
  constraint action_feedback_suggest_again_at_check check ((suggest_again is null) = (suggest_again_at is null)),
  constraint action_feedback_not_empty_check check (effort is not null or suggest_again is not null)
);

comment on table public.action_feedback is
  'PROJ-7 feedback to a done action. Owner only; only the two answers change; times are set by the database.';

-- "Lieber nicht" per content and the latest effort feedback (AC-9 to AC-14).
create index action_feedback_user_suggest_again_idx
  on public.action_feedback (user_id, suggest_again_at desc)
  where suggest_again is not null;
create index action_feedback_user_effort_idx
  on public.action_feedback (user_id, effort_at desc)
  where effort is not null;

-- The time of each answer changes only when that answer changes; saving the same value again
-- keeps it (EC-8). Clients cannot write these columns at all (no column grant).
create function private.stamp_action_feedback_answers()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.effort_at := case when new.effort is null then null else now() end;
    new.suggest_again_at := case when new.suggest_again is null then null else now() end;
    return new;
  end if;

  if new.effort is distinct from old.effort then
    new.effort_at := case when new.effort is null then null else now() end;
  else
    new.effort_at := old.effort_at;
  end if;

  if new.suggest_again is distinct from old.suggest_again then
    new.suggest_again_at := case when new.suggest_again is null then null else now() end;
  else
    new.suggest_again_at := old.suggest_again_at;
  end if;

  return new;
end;
$$;

create trigger action_feedback_stamp_answers
  before insert or update on public.action_feedback
  for each row
  execute function private.stamp_action_feedback_answers();

create trigger action_feedback_touch_updated_at
  before update on public.action_feedback
  for each row
  execute function private.touch_updated_at();

-- "Rückgängig" takes the feedback with it, in the same change and from whichever device (AC-8).
-- Runs with the owner's rights because people themselves may not delete feedback.
create function private.delete_feedback_when_undone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.action_feedback where action_id = new.id;
  return new;
end;
$$;

revoke all on function private.delete_feedback_when_undone() from public;

create trigger actions_delete_feedback_when_undone
  after update of status on public.actions
  for each row
  when (old.status = 'done' and new.status is distinct from 'done')
  execute function private.delete_feedback_when_undone();

-- Row Level Security: only the owner, only with a live session (same pattern as PROJ-1 and PROJ-6).
alter table public.action_feedback enable row level security;

create policy action_feedback_select_own
  on public.action_feedback
  for select
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()));

-- Feedback can be given and changed only while the confirmation card shows: the action is the
-- person's own, marked "done", and they have not started a new check-in since (AC-7, AC-16, EC-4).
create policy action_feedback_insert_own_done
  on public.action_feedback
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and exists (
      select 1
      from public.actions a
      where a.id = action_feedback.action_id
        and a.user_id = (select auth.uid())
        and a.status = 'done'
        and not exists (
          select 1
          from public.check_ins c
          where c.user_id = (select auth.uid())
            and c.created_at > a.concluded_at
        )
    )
  );

create policy action_feedback_update_own_done
  on public.action_feedback
  for update
  to authenticated
  using ((select auth.uid()) = user_id and (select private.has_active_session()))
  with check (
    (select auth.uid()) = user_id
    and (select private.has_active_session())
    and exists (
      select 1
      from public.actions a
      where a.id = action_feedback.action_id
        and a.user_id = (select auth.uid())
        and a.status = 'done'
        and not exists (
          select 1
          from public.check_ins c
          where c.user_id = (select auth.uid())
            and c.created_at > a.concluded_at
        )
    )
  );

-- Table privileges as a second line behind RLS: nothing for anonymous visitors; signed-in people
-- read their rows, add one with its two answers and change only the answers. Times are set by the
-- database. No deletes through the API — rows go with the action's "Rückgängig" or the account.
revoke all on table public.action_feedback from anon, authenticated;
grant select on table public.action_feedback to authenticated;
grant insert (action_id, user_id, effort, suggest_again) on table public.action_feedback to authenticated;
grant update (effort, suggest_again) on table public.action_feedback to authenticated;
