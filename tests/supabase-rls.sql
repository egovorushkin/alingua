-- Run only against an empty, disposable PostgreSQL database as its administrator.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
insert into auth.users values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
\ir ../supabase/migrations/202611180001_user_progress.sql
\ir ../supabase/migrations/202611190001_map_chests.sql
\ir ../supabase/migrations/202611190002_chapter_bosses.sql
\ir ../supabase/migrations/202611190003_parent_curriculum.sql

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
insert into public.user_progress (user_id, stars) values (auth.uid(), 10);
insert into public.user_curricula (user_id, content) values
  (auth.uid(), '{"chapters":[],"topics":[],"hiddenChapters":[],"hiddenTopics":[]}');
update public.user_curricula set content = '{"chapters":[],"topics":[],"hiddenChapters":["forest"],"hiddenTopics":[]}'
  where user_id = auth.uid() and revision = 1;
do $$
declare affected integer;
begin
  update public.user_curricula set content = '{}' where user_id = auth.uid() and revision = 1;
  get diagnostics affected = row_count;
  if affected <> 0 or (select revision from public.user_curricula where user_id = auth.uid()) <> 2 then
    raise exception 'Stale curriculum writes must be rejected';
  end if;
  begin
    update public.user_curricula set content = '{}' where user_id = auth.uid();
    raise exception 'Malformed curriculum JSON must be rejected';
  exception when check_violation then null;
  end;
  begin
    update public.user_curricula set revision = 99 where user_id = auth.uid();
    raise exception 'Clients must not set curriculum revision';
  exception when insufficient_privilege then null;
  end;
end $$;
update public.user_progress set stars = 20, claimed_map_chests = '{forest}', completed_bosses = '{forest}' where user_id = auth.uid() and revision = 1;
do $$
declare affected integer;
begin
  update public.user_progress set stars = 999 where user_id = auth.uid() and revision = 1;
  get diagnostics affected = row_count;
  if affected <> 0 or (select stars <> 20 or revision <> 2 from public.user_progress where user_id = auth.uid()) then
    raise exception 'Stale revisions must not overwrite progress';
  end if;
  if (select claimed_map_chests <> '{forest}'::text[] from public.user_progress where user_id = auth.uid()) then
    raise exception 'Chest claims must be stored with rewards';
  end if;
  if (select completed_bosses <> '{forest}'::text[] from public.user_progress where user_id = auth.uid()) then
    raise exception 'Boss crowns must be stored with rewards';
  end if;
  begin
    update public.user_progress set revision = 999 where user_id = auth.uid();
    raise exception 'Client must not set revision';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.user_progress where user_id = auth.uid();
    raise exception 'Client must not delete progress';
  exception when insufficient_privilege then null;
  end;
end $$;

set request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
do $$
declare affected integer;
begin
  if exists (select 1 from public.user_curricula) then raise exception 'Another account can read private curriculum'; end if;
  update public.user_curricula set content = '{"chapters":[],"topics":[],"hiddenChapters":[],"hiddenTopics":[]}'
    where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Another account can update curriculum'; end if;
  begin
    insert into public.user_curricula (user_id, content) values
      ('11111111-1111-4111-8111-111111111111', '{"chapters":[],"topics":[],"hiddenChapters":[],"hiddenTopics":[]}');
    raise exception 'Another account can insert curriculum';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from public.user_progress) then raise exception 'Another account can read private progress'; end if;
  update public.user_progress set stars = 999 where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Another account can update private progress'; end if;
  begin
    insert into public.user_progress (user_id) values ('11111111-1111-4111-8111-111111111111');
    raise exception 'Another account can insert private progress';
  exception when insufficient_privilege then null;
  end;
end $$;
insert into public.user_progress (user_id, stars) values (auth.uid(), 5);
do $$ begin
  if (select count(*) from public.user_progress) <> 1 then raise exception 'Account isolation failed'; end if;
end $$;

reset role;
set role anon;
do $$ begin
  begin
    perform 1 from public.user_curricula;
    raise exception 'Anonymous curriculum reads must be denied';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.user_progress;
    raise exception 'Anonymous reads must be denied';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo 'PASS: owner isolation, anonymous denial, protected metadata, and revision compare-and-swap'
