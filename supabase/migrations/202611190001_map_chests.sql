begin;

alter table public.user_progress
  add column claimed_map_chests text[] not null default '{}';

grant insert (claimed_map_chests), update (claimed_map_chests)
  on public.user_progress to authenticated;

commit;
