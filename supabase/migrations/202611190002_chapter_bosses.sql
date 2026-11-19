begin;

alter table public.user_progress
  add column completed_bosses text[] not null default '{}';

grant insert (completed_bosses), update (completed_bosses)
  on public.user_progress to authenticated;

commit;
