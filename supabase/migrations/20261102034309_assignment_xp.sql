-- Existing published grades intentionally have no invented historical basis.
alter table public.assignments add column max_xp integer not null default 0 check(max_xp between 0 and 100000);
-- Preserve values accepted by the existing numeric validator rather than rounding a new publication.
alter table public.grades alter column total_score type numeric;
grant select(max_xp) on public.assignments to authenticated;
create schema xp_private;
revoke all on schema xp_private from public,anon,authenticated;
create table xp_private.grade_basis(
  grade_id uuid primary key references public.grades(id) on delete cascade,
  grade_version integer not null check(grade_version>0),
  score numeric not null check(score between 0 and 2000),
  maximum_score numeric not null check(maximum_score between 1 and 2000 and score<=maximum_score)
);
alter table xp_private.grade_basis enable row level security;
revoke all on xp_private.grade_basis from public,anon,authenticated;
create table public.xp_awards(
  student_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  amount integer not null check(amount between 0 and 100000),
  grade_id uuid references public.grades(id) on delete set null,
  grade_version integer,
  updated_at timestamptz not null default clock_timestamp(),
  primary key(student_id,assignment_id)
);
create index xp_awards_assignment_idx on public.xp_awards(assignment_id,student_id);
create table public.xp_ledger(
  id bigint generated always as identity primary key,
  student_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  previous_xp integer not null check(previous_xp between 0 and 100000),
  new_xp integer not null check(new_xp between 0 and 100000),
  delta integer not null check(delta=new_xp-previous_xp and delta<>0),
  reason text not null check(reason in ('grade_change','assignment_xp_change')),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);
create index xp_ledger_student_idx on public.xp_ledger(student_id,created_at desc,id desc);
alter table public.xp_awards enable row level security;
alter table public.xp_ledger enable row level security;
revoke all on public.xp_awards,public.xp_ledger from anon,authenticated;
grant select(student_id,assignment_id,amount,updated_at) on public.xp_awards to authenticated;
grant select(id,student_id,assignment_id,previous_xp,new_xp,delta,reason,created_at) on public.xp_ledger to authenticated;
grant all on public.xp_awards,public.xp_ledger to service_role;
grant usage,select on sequence public.xp_ledger_id_seq to service_role;
create policy own_xp_awards on public.xp_awards for select to authenticated using(
 student_id=(select auth.uid()) and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role='student'));
create policy own_xp_ledger on public.xp_ledger for select to authenticated using(
 student_id=(select auth.uid()) and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role='student'));

-- All product callers hold the assignment row lock before grade/basis/award work.
create function xp_private.proposed_awards(p_assignment_id uuid,p_student_id uuid)
returns table(student_id uuid,amount integer,grade_id uuid,grade_version integer)
language sql set search_path='' as $$
 with best as (
  select distinct on(s.student_id) s.student_id,
    floor(b.score*a.max_xp/b.maximum_score)::integer amount,g.id grade_id,g.version grade_version
  from public.submissions s join public.grades g on g.submission_id=s.id
  join xp_private.grade_basis b on b.grade_id=g.id and b.grade_version=g.version and b.score=g.total_score
  join public.assignments a on a.id=s.assignment_id
  where s.assignment_id=p_assignment_id and g.published_at is not null
    and (p_student_id is null or s.student_id=p_student_id)
  order by s.student_id,b.score/b.maximum_score desc,s.revision desc,g.id
 ), targets as (
  select b.student_id from best b union select w.student_id from public.xp_awards w
   where w.assignment_id=p_assignment_id and (p_student_id is null or w.student_id=p_student_id)
 ) select t.student_id,coalesce(b.amount,0),b.grade_id,b.grade_version from targets t left join best b using(student_id);
$$;
create function xp_private.recompute(p_assignment_id uuid,p_student_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.xp_ledger(student_id,assignment_id,previous_xp,new_xp,delta,reason,actor_id)
 select n.student_id,p_assignment_id,coalesce(w.amount,0),n.amount,n.amount-coalesce(w.amount,0),p_reason,auth.uid()
 from xp_private.proposed_awards(p_assignment_id,p_student_id) n
 left join public.xp_awards w on w.assignment_id=p_assignment_id and w.student_id=n.student_id
 where n.amount<>coalesce(w.amount,0);
 insert into public.xp_awards(student_id,assignment_id,amount,grade_id,grade_version)
 select n.student_id,p_assignment_id,n.amount,n.grade_id,n.grade_version from xp_private.proposed_awards(p_assignment_id,p_student_id) n
 on conflict(student_id,assignment_id) do update set amount=excluded.amount,grade_id=excluded.grade_id,
   grade_version=excluded.grade_version,updated_at=clock_timestamp();
end $$;
create function xp_private.assignment_changed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.max_xp is distinct from old.max_xp then perform xp_private.recompute(new.id,null,'assignment_xp_change'); end if;
 return new;
end $$;
create trigger assignment_xp_changed after update of max_xp on public.assignments
 for each row execute function xp_private.assignment_changed();

-- Preserve the mature grading validator as an inaccessible private core.
alter function public.save_grade(uuid,jsonb,text,numeric,boolean,integer) set schema xp_private;
alter function xp_private.save_grade(uuid,jsonb,text,numeric,boolean,integer) rename to save_grade_core;
create function public.save_grade(p_submission_id uuid,p_scores jsonb,p_feedback text,p_total numeric,p_publish boolean,p_expected_version integer)
returns public.grades language plpgsql security definer set search_path='' as $$
declare assignment_key uuid; student_key uuid; saved public.grades; maximum numeric;
begin
 if auth.uid() is null or not exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role in ('instructor','admin')) then
  raise exception 'instructor_required' using errcode='42501'; end if;
 select s.assignment_id,s.student_id into assignment_key,student_key from public.submissions s where s.id=p_submission_id;
 if assignment_key is null or not public.owns_assignment(assignment_key) then
  raise exception 'submission_not_owned' using errcode='42501'; end if;
 perform 1 from public.assignments a where a.id=assignment_key for update;
 if not public.owns_assignment(assignment_key) then raise exception 'submission_not_owned' using errcode='42501'; end if;
 saved:=xp_private.save_grade_core(p_submission_id,p_scores,p_feedback,p_total,p_publish,p_expected_version);
 -- Core validates the caller total against every rubric score. Persist the exact
 -- numeric criterion sum rather than tolerated JavaScript addition noise.
 update public.grades set total_score=(
   select sum((p_scores->>(c.value->>'id'))::numeric)
   from public.assignment_rubrics r,lateral jsonb_array_elements(r.criteria) c
   where r.assignment_id=assignment_key)
  where id=saved.id returning * into saved;
 if saved.published_at is not null then
  select sum((c.value->>'maxScore')::numeric) into maximum from public.assignment_rubrics r,
    lateral jsonb_array_elements(r.criteria) c where r.assignment_id=assignment_key;
  insert into xp_private.grade_basis(grade_id,grade_version,score,maximum_score) values(saved.id,saved.version,saved.total_score,maximum)
   on conflict(grade_id) do update set grade_version=excluded.grade_version,score=excluded.score,maximum_score=excluded.maximum_score;
 end if;
 perform xp_private.recompute(assignment_key,student_key,'grade_change');
 return saved;
end $$;
revoke all on function public.save_grade(uuid,jsonb,text,numeric,boolean,integer) from public,anon;
grant execute on function public.save_grade(uuid,jsonb,text,numeric,boolean,integer) to authenticated;

create function public.save_assignment_with_xp(p_assignment_id uuid,p_expected_version integer,p_title text,p_instructions text,
 p_criteria jsonb,p_publication_status text,p_language text,p_max_xp integer,p_due_at timestamptz default null,p_update_due_at boolean default false)
returns public.assignments language plpgsql security definer set search_path='' as $$
declare saved public.assignments;
begin
 if p_max_xp is null or p_max_xp not between 0 and 100000 then raise exception 'invalid_max_xp' using errcode='22023'; end if;
 if p_update_due_at then
  saved:=public.save_assignment(p_assignment_id,p_expected_version,p_title,p_instructions,p_criteria,p_publication_status,p_language,p_due_at);
 else
  saved:=public.save_assignment(p_assignment_id,p_expected_version,p_title,p_instructions,p_criteria,p_publication_status,p_language);
 end if;
 update public.assignments set max_xp=p_max_xp where id=saved.id returning * into saved;
 return saved;
end $$;
revoke all on function public.save_assignment_with_xp(uuid,integer,text,text,jsonb,text,text,integer,timestamptz,boolean) from public,anon;
grant execute on function public.save_assignment_with_xp(uuid,integer,text,text,jsonb,text,text,integer,timestamptz,boolean) to authenticated;
revoke all on all functions in schema xp_private from public,anon,authenticated;

create function public.get_my_xp(p_page integer default 1) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role='student') then
  raise exception 'student_required' using errcode='42501'; end if;
 if p_page is null or p_page not between 1 and 10000 then raise exception 'invalid_page' using errcode='22023'; end if;
 with page_rows as (
  select w.assignment_id,a.title assignment_title,w.amount awarded_xp,a.max_xp,w.updated_at
  from public.xp_awards w left join public.assignments a on a.id=w.assignment_id
  where w.student_id=auth.uid() order by w.updated_at desc,w.assignment_id limit 26 offset (p_page-1)*25
 ) select jsonb_build_object('total_xp',(select coalesce(sum(w.amount),0)::text from public.xp_awards w where w.student_id=auth.uid()),
   'page',p_page,'has_more',(select count(*)>25 from page_rows),'awards',
   (select coalesce(jsonb_agg(to_jsonb(r) order by r.updated_at desc,r.assignment_id),'[]'::jsonb) from(select * from page_rows order by updated_at desc,assignment_id limit 25) r)) into result;
 return result;
end $$;
revoke all on function public.get_my_xp(integer) from public,anon;
grant execute on function public.get_my_xp(integer) to authenticated;
notify pgrst,'reload schema';
