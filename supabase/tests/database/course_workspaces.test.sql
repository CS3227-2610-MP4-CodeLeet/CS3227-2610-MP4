begin;
select no_plan();

select has_table('public','courses','course workspace table exists');
select has_table('public','course_memberships','per-course membership table exists');
select has_table('public','course_features','course feature table exists');
select has_table('public','course_invitations','email invitations are stored');
select has_table('public','course_join_codes','join codes are stored as hashes');
select has_column('public','courses','owner_id','course owner is represented');
select has_column('public','courses','lifecycle','course lifecycle is represented');
select has_column('public','assignments','course_id','assignments are scoped to a course');
select has_column('public','forum_threads','course_id','forum threads are scoped to a course');
select has_column('public','ai_usage','course_id','AI usage history is associated with the legacy workspace');
select is((select lifecycle from public.courses where is_legacy),'archived','the single Legacy workspace is archived');
select is((select owner_id from public.courses where is_legacy),null::uuid,'Legacy owner remains unassigned');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('8a500000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated',email,'',confirmed,'{}','{}',now(),now()
from (values(1,'course-owner@example.test',now()),(2,'course-co-instructor@example.test',now()),(3,'course-student@example.test',now()),(4,'course-outsider@example.test',now()),(5,'course-unverified@example.test',null::timestamptz),(6,'course-admin@example.test',now())) as u(n,email,confirmed);
update public.user_roles set role='instructor' where user_id in ('8a500000-0000-4000-8000-000000000001','8a500000-0000-4000-8000-000000000002');
update public.user_roles set role='admin' where user_id='8a500000-0000-4000-8000-000000000006';
insert into public.course_memberships(course_id,user_id,role)
select c.id,u.id,u.role from public.courses c
cross join (values('8a500000-0000-4000-8000-000000000001'::uuid,'instructor'),('8a500000-0000-4000-8000-000000000002'::uuid,'instructor'),('8a500000-0000-4000-8000-000000000003'::uuid,'student')) u(id,role)
where c.is_legacy;
insert into public.assignments(id,instructor_id,title,instructions,language,publication_status,course_id)
select '8a600000-0000-4000-8000-000000000001','8a500000-0000-4000-8000-000000000001','Legacy fixture','Synthetic history','python','published',id from public.courses where is_legacy;
insert into public.forum_threads(id,author_id,author_name,author_role,title,body,request_id,course_id)
select '8a700000-0000-4000-8000-000000000001','8a500000-0000-4000-8000-000000000003','Legacy student','student','Legacy thread','Synthetic history',gen_random_uuid(),id from public.courses where is_legacy;
create temporary table course_test_ids(name text primary key,id uuid not null);
create temporary table course_test_invites(name text primary key,id uuid not null);
grant select,insert on course_test_invites to authenticated;
grant select,insert on course_test_ids to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
insert into course_test_ids select 'main',public.create_course('Algorithms','Fall section');
select is((select role from public.course_memberships m join course_test_ids c on c.id=m.course_id where c.name='main' and m.user_id=auth.uid()),'instructor','creator becomes course owner and instructor');
select is((select count(*)::integer from public.course_features f join course_test_ids c on c.id=f.course_id where c.name='main' and enabled),5,'new course starts with shipped features enabled');
select is(public.update_course((select id from course_test_ids where name='main'),'Advanced Algorithms',null)->>'title','Advanced Algorithms','course staff can update validated course title');
select throws_ok($$select public.update_course((select id from course_test_ids where name='main'),'','bad')$$,'22023','invalid_course','course update rejects an empty title');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000005',true);
select throws_ok($$select public.create_course('Unverified','')$$,'42501','verified_account_required','only verified instructors can create courses');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);

select lives_ok($$select public.create_course_invitation((select id from course_test_ids where name='main'),' COURSE-CO-INSTRUCTOR@EXAMPLE.TEST ','instructor','synthetic-invite-token-2-xxxxxxxx',clock_timestamp()+interval '1 day')$$,'owner can invite an instructor by normalized email');
insert into course_test_invites select 'student',public.create_course_invitation((select id from course_test_ids where name='main'),'course-student@example.test','student','synthetic-invite-token-student-xxxxxxxx',clock_timestamp()+interval '1 day');
select is((select id is not null from course_test_invites where name='student'),true,'owner can invite a student by email');
select is((select count(*)::integer from public.list_course_invitations((select id from course_test_ids where name='main'))),2,'course staff can list pending invitations without exposing token hashes');
insert into course_test_invites select 'preexisting-student-enrollment',public.create_course_invitation((select id from course_test_ids where name='main'),'course-student@example.test','student','synthetic-invite-token-preexisting-xxxxxxxx',clock_timestamp()+interval '1 day');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000003',true);
select lives_ok($$select public.accept_course_invitation('synthetic-invite-token-preexisting-xxxxxxxx')$$,'student enrolls through verified email invitation');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
insert into course_test_invites select 'existing-student-promotion',public.create_course_invitation((select id from course_test_ids where name='main'),'course-student@example.test','instructor','synthetic-invite-token-promote-xxxxxxxx',clock_timestamp()+interval '1 day');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000003',true);
select throws_ok($$select public.accept_course_invitation('synthetic-invite-token-promote-xxxxxxxx')$$,'42501','invitation_unavailable','an existing member cannot accept a second invitation');
select is((select role from public.course_memberships where course_id=(select id from course_test_ids where name='main') and user_id=auth.uid()),'student','rejected invitation does not change an existing member role');
reset role;
select is((select accepted_at from public.course_invitations where id=(select id from course_test_invites where name='existing-student-promotion')),null::timestamptz,'rejected invitation remains pending for staff reconciliation');
set local role authenticated;
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
insert into course_test_invites select 'expired',public.create_course_invitation((select id from course_test_ids where name='main'),'course-outsider@example.test','student','synthetic-invite-token-expired-xxxxxxxx',clock_timestamp()+interval '1 day');
reset role;
update public.course_invitations set created_at=clock_timestamp()-interval '2 days',expires_at=clock_timestamp()-interval '1 second' where id=(select id from course_test_invites where name='expired');
set local role authenticated;
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.accept_course_invitation('synthetic-invite-token-expired-xxxxxxxx')$$,'42501','invitation_unavailable','expired invitation cannot grant membership');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.revoke_course_invitation((select id from course_test_invites where name='student'))$$,'staff can revoke a pending invitation');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000005',true);
select throws_ok($$select public.accept_course_invitation('synthetic-invite-token-2-xxxxxxxx')$$,'42501','invitation_unavailable','unverified accounts cannot accept invitations');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000003',true);
select throws_ok($$select public.accept_course_invitation('synthetic-invite-token-student-xxxxxxxx')$$,'42501','invitation_unavailable','revoked student invitation cannot grant membership');
select throws_ok($$select public.accept_course_invitation('synthetic-invite-token-2-xxxxxxxx')$$,'42501','invitation_unavailable','invitation cannot be claimed by a mismatched verified email');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000002',true);
select is(public.accept_course_invitation('synthetic-invite-token-2-xxxxxxxx'),(select id from course_test_ids where name='main'),'matching verified email receives only the invited course');
select is(public.accept_course_invitation('synthetic-invite-token-2-xxxxxxxx'),(select id from course_test_ids where name='main'),'same user can retry invitation acceptance');
select throws_ok($$select public.set_course_member((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000001',null)$$,'42501','course_owner_required','non-owner instructor cannot remove an instructor');
select is(public.create_course('Second course','Created after instructor invitation') is not null,true,'course instructor can create another course');

select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.delete_empty_course((select id from course_test_ids where name='main'),true)$$,'23514','course_not_empty','courses with members or academic records cannot be deleted');
select lives_ok($$select public.set_course_member((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000002',null)$$,'owner can remove an instructor');
select lives_ok($$select public.set_course_member((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000003','student')$$,'staff can update an existing student membership');
select throws_ok($$select public.set_course_member((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000004','student')$$,'42501','course_member_required','staff role updates cannot bypass invitation or join-code enrollment');
select is((select count(*)::integer from public.course_memberships where course_id=(select id from course_test_ids where name='main') and user_id='8a500000-0000-4000-8000-000000000004'),0,'failed role update does not create membership');
insert into course_test_invites select 'restore-co-instructor',public.create_course_invitation((select id from course_test_ids where name='main'),'course-co-instructor@example.test','instructor','synthetic-invite-token-restore-xxxxxxxx',clock_timestamp()+interval '1 day');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000002',true);
select lives_ok($$select public.accept_course_invitation('synthetic-invite-token-restore-xxxxxxxx')$$,'removed instructor rejoins through a verified invitation');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
insert into course_test_ids select 'assignment',(public.save_course_assignment(
 (select id from course_test_ids where name='main'),null,0,'Scoped assignment','Print one value.',
 '[{"id":"8a800000-0000-4000-8000-000000000001","title":"Output","description":"Exact output","maxScore":10}]'::jsonb,
 'published','python',null,false,null,false)).id;
select is((select course_id from public.assignments where id=(select id from course_test_ids where name='assignment')),(select id from course_test_ids where name='main'),'course instructor creates an assignment in the selected course');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.list_course_members((select id from course_test_ids where name='main'))$$,'42501','course_staff_required','students cannot list other course member identities');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.set_course_member((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000001',null)$$,'42501','transfer_owner_first','owner cannot remove self before transfer');
select lives_ok($$select public.rotate_course_join_code((select id from course_test_ids where name='main'),'synthetic-join-code-8a5xxxxxxxxxxxx')$$,'course instructor can set a student join code');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000004',true);
select is(public.join_course_by_code('synthetic-join-code-8a5xxxxxxxxxxxx'),(select id from course_test_ids where name='main'),'verified student can join by code');
select is((select count(*)::integer from generate_series(1,9) where public.join_course_by_code('invalid-course-code') is null),9,'repeated invalid join codes are rate limited per user');
select is(public.join_course_by_code('synthetic-join-code-8a5xxxxxxxxxxxx'),null::uuid,'join-code attempts are capped after repeated guesses');
select is((select role from public.course_memberships m join course_test_ids c on c.id=m.course_id where c.name='main' and m.user_id='8a500000-0000-4000-8000-000000000004'),'student','join code cannot grant instructor role');
select throws_ok($$select * from public.course_join_codes$$,'42501',null,'join code hashes are not directly visible through the Data API');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.revoke_course_join_code((select id from course_test_ids where name='main'))$$,'staff can revoke a join code');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000004',true);
select is(public.join_course_by_code('synthetic-join-code-8a5xxxxxxxxxxxx'),null::uuid,'revoked join code cannot grant another membership');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.set_course_feature((select id from course_test_ids where name='main'),'ai',false)$$,'staff can change shipped feature setting');
select is((select enabled from public.course_features f join course_test_ids i on i.id=f.course_id where i.name='main' and f.feature='ai'),false,'feature setting is persisted');
select is(course_private.can_use_feature((select id from course_test_ids where name='main'),'ai'),false,'disabled feature gate denies use');
select throws_ok($$select public.transfer_course_ownership((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000006')$$,'42501','course_member_required','owner cannot transfer a course to a verified non-member');
select is((select count(*)::integer from public.course_memberships where course_id=(select id from course_test_ids where name='main') and user_id='8a500000-0000-4000-8000-000000000006'),0,'failed ownership transfer does not enroll a new member');
select lives_ok($$select public.transfer_course_ownership((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000004')$$,'owner can transfer ownership to an enrolled student');
select is((select owner_id from public.courses c join course_test_ids i on i.id=c.id where i.name='main'),'8a500000-0000-4000-8000-000000000004'::uuid,'transfer updates course owner atomically');
select is((select role from public.course_memberships m join course_test_ids i on i.id=m.course_id where i.name='main' and user_id='8a500000-0000-4000-8000-000000000004'),'instructor','ownership transfer promotes an existing student member');
select is((select role from public.course_memberships m join course_test_ids i on i.id=m.course_id where i.name='main' and user_id='8a500000-0000-4000-8000-000000000001'),'instructor','former owner remains instructor');
select throws_ok($$select public.transfer_course_ownership((select id from course_test_ids where name='main'),'8a500000-0000-4000-8000-000000000004')$$,'42501','course_owner_required','former owner cannot transfer ownership again');

select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000004',true);
select lives_ok($$select public.archive_course((select id from course_test_ids where name='main'))$$,'new owner can archive course');
select is((select lifecycle from public.courses c join course_test_ids i on i.id=c.id where i.name='main'),'archived','archived course retains its lifecycle state');
select is(course_private.can_use_feature((select id from course_test_ids where name='main'),'assessments'),false,'archived course denies activity');
select throws_ok($$select public.set_course_feature((select id from course_test_ids where name='main'),'ai',true)$$,'42501','course_staff_required','archived course settings are read-only');
select throws_ok($$select public.update_course((select id from course_test_ids where name='main'),'No longer editable',null)$$,'42501','course_staff_required','archived course details are read-only');

select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
insert into course_test_ids select 'empty',public.create_course('Empty course','');
select throws_ok($$select public.delete_empty_course((select id from course_test_ids where name='empty'),false)$$,'42501','course_delete_confirmation_required','empty course deletion requires explicit confirmation');
select lives_ok($$select public.delete_empty_course((select id from course_test_ids where name='empty'),true)$$,'confirmed empty course can be permanently deleted');
select is((select count(*)::integer from public.courses c join course_test_ids i on i.id=c.id where i.name='empty'),0,'confirmed deletion removes empty course');
select throws_ok($$select public.delete_empty_course((select id from public.courses where is_legacy),true)$$,'42501','course_owner_required','Legacy course cannot be deleted');

select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000006',true);
select lives_ok($$select public.assign_legacy_course_owner('8a500000-0000-4000-8000-000000000001')$$,'platform admin can assign Legacy owner');
select is((select owner_id from public.courses where is_legacy),'8a500000-0000-4000-8000-000000000001'::uuid,'admin assignment replaces Unassigned placeholder');

select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000004',true);
select is((select count(*)::integer from public.forum_threads where id='8a700000-0000-4000-8000-000000000001'),0,'non-member cannot read Legacy forum history');
select is((select count(*)::integer from public.courses c where is_legacy),0,'non-member cannot discover Legacy course');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000001',true);
select ok(public.owns_assignment('8a600000-0000-4000-8000-000000000001'),'Legacy assignment grading remains limited to the original instructor');
select is((select course_id from public.assignments where id='8a600000-0000-4000-8000-000000000001'),(select id from public.courses where is_legacy),'legacy assignment retains its Legacy association and authorship');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000002',true);
select ok(not public.owns_assignment('8a600000-0000-4000-8000-000000000001'),'another Legacy instructor cannot grade an assignment they did not author');
select is((select count(*)::integer from public.assignments where id='8a600000-0000-4000-8000-000000000001'),0,'another Legacy instructor cannot read an assignment they did not author');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000006',true);
select ok(not public.owns_assignment('8a600000-0000-4000-8000-000000000001'),'platform admins retain only per-assignment Legacy access');
select is((select count(*)::integer from public.assignments where id='8a600000-0000-4000-8000-000000000001'),0,'platform admin cannot read another instructor Legacy assignment');
select set_config('request.jwt.claim.sub','8a500000-0000-4000-8000-000000000003',true);
select is((select count(*)::integer from public.forum_threads where id='8a700000-0000-4000-8000-000000000001'),1,'migrated Legacy member can read historical forum post');
select is((select count(*)::integer from public.forum_threads where course_id=(select id from course_test_ids where name='main')),0,'Legacy membership cannot read another course forum');
reset role;

select * from finish();
rollback;
