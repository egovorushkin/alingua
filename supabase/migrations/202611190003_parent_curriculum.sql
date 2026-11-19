begin;

create table public.user_curricula (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content jsonb not null check (
    jsonb_typeof(content) = 'object'
    and content ?& array['chapters', 'topics', 'hiddenChapters', 'hiddenTopics']
    and jsonb_typeof(content->'chapters') = 'array'
    and jsonb_typeof(content->'topics') = 'array'
    and jsonb_typeof(content->'hiddenChapters') = 'array'
    and jsonb_typeof(content->'hiddenTopics') = 'array'
    and octet_length(content::text) <= 4000000
  ),
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  updated_at timestamptz not null default now()
);

alter table public.user_curricula enable row level security;
create policy "Read own curriculum" on public.user_curricula
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own curriculum" on public.user_curricula
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own curriculum" on public.user_curricula
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.user_curricula from public, anon, authenticated;
grant select on public.user_curricula to authenticated;
grant insert (user_id, content), update (content) on public.user_curricula to authenticated;
create trigger bump_curriculum_revision before update on public.user_curricula
  for each row execute function public.bump_user_progress_revision();

commit;
