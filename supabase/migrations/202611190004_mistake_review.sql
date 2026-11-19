begin;

alter table public.user_progress
  add column mistake_word_ids text[] not null default '{}'
  check (cardinality(mistake_word_ids) <= 10000 and array_position(mistake_word_ids, null) is null);

grant insert (mistake_word_ids), update (mistake_word_ids)
  on public.user_progress to authenticated;

commit;
