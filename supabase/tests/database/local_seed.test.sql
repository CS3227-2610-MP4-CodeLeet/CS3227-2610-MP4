begin;
select plan(15);

select is((select count(*)::int from auth.users where raw_app_meta_data ->> 'local_seed' = 'codeleet-v1'), 13, '13 synthetic auth accounts');
select is((select count(*)::int from public.user_roles where user_id::text like 'c0de0000-%' and role = 'student'), 10, '10 students');
select is((select count(*)::int from public.user_roles where user_id::text like 'c0de0000-%' and role = 'instructor'), 3, '3 trusted instructors');
select is((select count(*)::int from auth.identities where user_id::text like 'c0de0000-%' and provider = 'email'), 13, 'email identities support password sign-in');
select is((select count(*)::int from public.assignments where id::text like 'c0de1000-%'), 10, '10 local assignments');
select is((select count(distinct language)::int from public.assignments where id::text like 'c0de1000-%'), 2, 'both languages');
select is((select count(*)::int from public.assignments where id::text like 'c0de1000-%' and publication_status = 'draft'), 2, 'two instructor drafts');
select is((select count(*)::int from public.assignment_rubrics where assignment_id::text like 'c0de1000-%'), 10, 'private rubrics');
select is((select count(*)::int from public.submissions where id::text like 'c0de2000-%'), 288, 'four revisions for nine students on eight assignments');
select is((select count(*)::int from public.submissions where student_id = 'c0de0000-0000-4000-8000-000000000010'), 0, 'student 10 has empty history');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0de0000-0000-4000-8000-000000000001', true);
select is((select count(*)::int from public.submissions), 32, 'student sees own history across both languages and pages');
select is((select count(*)::int from public.assignment_rubrics), 0, 'student cannot read private rubrics');
select is((select count(*)::int from public.grades), 8, 'student sees only own eight published grades');
select is((select count(*)::int from public.assignments where id::text like 'c0de1000-%'), 8, 'student cannot read seed draft assignments');
select set_config('request.jwt.claim.sub', 'c0de0000-0000-4000-8000-000000000011', true);
select is((select count(*)::int from public.assignments where id::text like 'c0de1000-%'), 4, 'instructor sees only four owned assignments');

select * from finish();
rollback;
