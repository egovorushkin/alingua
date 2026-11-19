begin;

create table public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stars bigint not null default 0 check (stars between 0 and 9007199254740991),
  streak bigint not null default 0 check (streak between 0 and 9007199254740991),
  last_active_date date,
  completed_topics text[] not null default '{}',
  learned_words_count bigint not null default 0 check (learned_words_count between 0 and 9007199254740991),
  topic_results jsonb not null default '{}' check (jsonb_typeof(topic_results) = 'object'),
  best_streak bigint not null default 0 check (best_streak between streak and 9007199254740991),
  last_claimed_date date,
  consecutive_days bigint not null default 0 check (consecutive_days between 0 and 9007199254740991),
  daily_bonus_badge boolean not null default false,
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  updated_at timestamptz not null default now(),
  check ((last_active_date is null and streak = 0) or (last_active_date is not null and streak > 0)),
  check ((last_claimed_date is null and consecutive_days = 0) or (last_claimed_date is not null and consecutive_days > 0))
);

alter table public.user_progress enable row level security;

create policy "Read own progress" on public.user_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own progress" on public.user_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own progress" on public.user_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.user_progress from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.user_progress to authenticated;
grant insert (user_id, stars, streak, last_active_date, completed_topics, learned_words_count,
  topic_results, best_streak, last_claimed_date, consecutive_days, daily_bonus_badge)
  on public.user_progress to authenticated;
grant update (stars, streak, last_active_date, completed_topics, learned_words_count,
  topic_results, best_streak, last_claimed_date, consecutive_days, daily_bonus_badge)
  on public.user_progress to authenticated;

create function public.bump_user_progress_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function public.bump_user_progress_revision() from public;
create trigger bump_user_progress_revision before update on public.user_progress
  for each row execute function public.bump_user_progress_revision();

commit;
