-- Public cases never share a selectable row with private instructor drafts.
create function public.valid_practice_cases(p_cases jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; ids uuid[] := '{}'; case_id uuid; case_name text;
  trim_characters constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if p_cases is null or jsonb_typeof(p_cases) <> 'array' then return false; end if;
  if jsonb_array_length(p_cases) > 5 then return false; end if;
  for item in select value from jsonb_array_elements(p_cases) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(item)) <> 4 then return false; end if;
    if jsonb_typeof(item->'id') is distinct from 'string'
       or jsonb_typeof(item->'name') is distinct from 'string'
       or jsonb_typeof(item->'stdin') is distinct from 'string'
       or jsonb_typeof(item->'expected_stdout') is distinct from 'string' then return false; end if;
    if (item->>'id') !~* '^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$' then return false; end if;
    case_id := (item->>'id')::uuid;
    if case_id = any(ids) then return false; end if;
    ids := array_append(ids,case_id);
    case_name := btrim(item->>'name',trim_characters);
    if length(case_name) < 1 or length(case_name) > 120
       or octet_length(item->>'stdin') > 4096 or octet_length(item->>'expected_stdout') > 8192 then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;
revoke all on function public.valid_practice_cases(jsonb) from public,anon,authenticated;

create table public.assignment_practice_drafts (
  assignment_id uuid primary key references public.assignments(id) on delete cascade,
  cases jsonb not null default '[]' check (public.valid_practice_cases(cases)),
  version integer not null check(version > 0),
  updated_at timestamptz not null default clock_timestamp()
);
create table public.assignment_practice_sets (
  assignment_id uuid primary key references public.assignments(id) on delete cascade,
  cases jsonb not null default '[]' check (public.valid_practice_cases(cases)),
  published_revision integer not null check(published_revision > 0),
  published_at timestamptz
);
alter table public.assignment_practice_drafts enable row level security;
alter table public.assignment_practice_sets enable row level security;
revoke all on public.assignment_practice_drafts, public.assignment_practice_sets from anon,authenticated;
grant select on public.assignment_practice_drafts, public.assignment_practice_sets to authenticated;
grant all on public.assignment_practice_drafts, public.assignment_practice_sets to service_role;
create policy practice_draft_owner on public.assignment_practice_drafts for select to authenticated using (
  public.owns_assignment(assignment_id)
);
create policy practice_public_reader on public.assignment_practice_sets for select to authenticated using (
  public.owns_assignment(assignment_id) or (
    exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role='student')
    and exists(select 1 from public.assignments a where a.id=assignment_id and a.publication_status='published'))
);

create function public.save_practice_tests(p_assignment_id uuid,p_expected_version integer,p_action text,p_cases jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare owner_id uuid; current_version integer; next_revision integer;
begin
  if auth.uid() is null then raise exception 'practice_owner_required' using errcode='42501'; end if;
  select a.instructor_id into owner_id from public.assignments a where a.id=p_assignment_id for share;
  if owner_id is distinct from auth.uid() or not exists (
    select 1 from public.user_roles r where r.user_id=auth.uid() and r.role in ('instructor','admin')
  ) then raise exception 'practice_owner_required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('practice-tests:'||p_assignment_id::text,0));
  select d.version into current_version from public.assignment_practice_drafts d where d.assignment_id=p_assignment_id;
  if p_expected_version is distinct from coalesce(current_version,0) then
    raise exception 'practice_version_conflict' using errcode='40001';
  end if;
  if p_action is null or p_action not in ('save','publish','unpublish') then
    raise exception 'invalid_practice_cases' using errcode='22023';
  end if;
  if p_action='unpublish' then
    if p_cases is not null then raise exception 'invalid_practice_cases' using errcode='22023'; end if;
  else
    if not public.valid_practice_cases(p_cases) then raise exception 'invalid_practice_cases' using errcode='22023'; end if;
    if p_action='publish' and jsonb_array_length(p_cases)=0 then raise exception 'invalid_practice_cases' using errcode='22023'; end if;
  end if;
  insert into public.assignment_practice_drafts(assignment_id,cases,version)
    values(p_assignment_id,coalesce(p_cases,'[]'::jsonb),coalesce(current_version,0)+1)
    on conflict(assignment_id) do update set
      cases=case when p_action='unpublish' then assignment_practice_drafts.cases else excluded.cases end,
      version=excluded.version,updated_at=clock_timestamp();
  if p_action in ('publish','unpublish') then
    insert into public.assignment_practice_sets(assignment_id,cases,published_revision,published_at)
      values(p_assignment_id,case when p_action='publish' then p_cases else '[]'::jsonb end,1,
        case when p_action='publish' then clock_timestamp() else null end)
      on conflict(assignment_id) do update set cases=excluded.cases,
        published_revision=assignment_practice_sets.published_revision+1,published_at=excluded.published_at;
  end if;
  select s.published_revision into next_revision from public.assignment_practice_sets s where s.assignment_id=p_assignment_id;
  return jsonb_build_object('version',coalesce(current_version,0)+1,'published_revision',coalesce(next_revision,0));
end $$;
revoke all on function public.save_practice_tests(uuid,integer,text,jsonb) from public,anon;
grant execute on function public.save_practice_tests(uuid,integer,text,jsonb) to authenticated;
