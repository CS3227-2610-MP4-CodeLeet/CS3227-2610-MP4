begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('a1690000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated',
 'pagination-'||n||'@example.test',now(),'{}','{}',now(),now() from generate_series(1,28) n;
update public.user_roles set role='instructor' where user_id='a1690000-0000-4000-8000-000000000028';
insert into public.courses(id,owner_id,created_by,title,description) values
 ('a1691000-0000-4000-8000-000000000001','a1690000-0000-4000-8000-000000000028','a1690000-0000-4000-8000-000000000028','Pagination','');
insert into public.course_memberships(course_id,user_id,role)
select 'a1691000-0000-4000-8000-000000000001',id,case when id='a1690000-0000-4000-8000-000000000028' then 'instructor' else 'student' end
from auth.users where email like 'pagination-%@example.test';
insert into public.course_features(course_id,feature,enabled)
select 'a1691000-0000-4000-8000-000000000001',feature,true from unnest(array['assessments','xp','leaderboard']) feature;
insert into public.assignments(id,instructor_id,title,instructions,language,publication_status,max_xp,course_id)
select ('a1692000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'a1690000-0000-4000-8000-000000000028','Page '||n,'Synthetic','python','published',100,'a1691000-0000-4000-8000-000000000001' from generate_series(1,27) n;
insert into public.xp_awards(student_id,assignment_id,amount,updated_at)
select 'a1690000-0000-4000-8000-000000000001',id,10,'2026-11-01'::timestamptz + row_number() over(order by id)*interval '1 second' from public.assignments where course_id='a1691000-0000-4000-8000-000000000001';
insert into public.xp_awards(student_id,assignment_id,amount)
select user_id,'a1692000-0000-4000-8000-000000000001',20 from public.course_memberships where course_id='a1691000-0000-4000-8000-000000000001' and role='student' on conflict do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1690000-0000-4000-8000-000000000001',true);
select set_config('test.xp_revision',public.get_my_xp('a1691000-0000-4000-8000-000000000001',1)->>'revision',true);
select set_config('test.lb_revision',public.get_leaderboard('a1691000-0000-4000-8000-000000000001',1)->>'revision',true);
select ok(current_setting('test.xp_revision') ~ '^[a-f0-9]{32}$','XP page provides revision');
select ok(current_setting('test.lb_revision') ~ '^[a-f0-9]{32}$','leaderboard page provides revision');
select is(public.get_my_xp('a1691000-0000-4000-8000-000000000001',2,current_setting('test.xp_revision'))->>'page','2','unchanged XP supports next page');
select is(public.get_leaderboard('a1691000-0000-4000-8000-000000000001',2,current_setting('test.lb_revision'))->>'page','2','unchanged leaderboard supports next page');
reset role;
update public.xp_awards set amount=99,updated_at=clock_timestamp() where student_id='a1690000-0000-4000-8000-000000000001' and assignment_id='a1692000-0000-4000-8000-000000000001';
set local role authenticated;
select is(public.get_my_xp('a1691000-0000-4000-8000-000000000001',2,current_setting('test.xp_revision'))->>'page','1','changed XP restarts rather than skipping rows');
select is(public.get_my_xp('a1691000-0000-4000-8000-000000000001',2,current_setting('test.xp_revision'))->>'restarted','true','XP restart is explicit');
select is(public.get_leaderboard('a1691000-0000-4000-8000-000000000001',2,current_setting('test.lb_revision'))->>'page','1','changed ranking restarts');
select is(public.get_leaderboard('a1691000-0000-4000-8000-000000000001',2,null)->>'restarted','true','missing revision cannot bypass guard');
select is(public.get_my_xp('a1691000-0000-4000-8000-000000000001',2)->>'page','1','legacy XP wrapper cannot bypass guard');
select is(public.get_leaderboard('a1691000-0000-4000-8000-000000000001',2)->>'restarted','true','legacy public leaderboard wrapper cannot bypass guard');
select is(leaderboard_private.read_page('a1691000-0000-4000-8000-000000000001',2)->>'restarted','true','legacy private leaderboard wrapper cannot bypass guard');
reset role;
select ok(not has_function_privilege('authenticated','xp_private.raw_page(uuid,integer)','EXECUTE'),'raw XP projection is not callable by authenticated clients');
select ok(not has_function_privilege('authenticated','leaderboard_private.raw_page(uuid,integer)','EXECUTE'),'raw leaderboard projection is not callable by authenticated clients');
select ok(not has_function_privilege('anon','public.get_my_xp(uuid,integer,text)','EXECUTE'),'anonymous revision-aware XP denied');
select ok(not has_function_privilege('anon','public.get_leaderboard(uuid,integer,text)','EXECUTE'),'anonymous revision-aware leaderboard denied');
set local role authenticated;
select is(public.get_my_xp('a1691000-0000-4000-8000-000000000001',2,current_setting('test.xp_revision'))-'restarted',public.get_my_xp('a1691000-0000-4000-8000-000000000001',1)-'restarted','restart returns exactly the fresh XP first page and total');
select is(public.get_leaderboard('a1691000-0000-4000-8000-000000000001',2,current_setting('test.lb_revision'))-'restarted',public.get_leaderboard('a1691000-0000-4000-8000-000000000001',1)-'restarted','restart returns exactly the fresh ranking and own total');
select set_config('test.lb_revision',public.get_leaderboard('a1691000-0000-4000-8000-000000000001',1)->>'revision',true);
reset role;
update public.profiles set display_name='Renamed pagination student' where id='a1690000-0000-4000-8000-000000000002';
set local role authenticated;
select is(public.get_leaderboard('a1691000-0000-4000-8000-000000000001',2,current_setting('test.lb_revision'))->>'restarted','true','name ordering changes invalidate ranking');
select set_config('test.lb_revision',public.get_leaderboard('a1691000-0000-4000-8000-000000000001',1)->>'revision',true);
reset role;
delete from public.course_memberships where course_id='a1691000-0000-4000-8000-000000000001' and user_id='a1690000-0000-4000-8000-000000000002';
set local role authenticated;
select is(public.get_leaderboard('a1691000-0000-4000-8000-000000000001',2,current_setting('test.lb_revision'))->>'restarted','true','roster removal invalidates ranking');
select throws_ok($$select public.get_my_xp('a1691000-0000-4000-8000-000000000001',2,'bad')$$,'22023','invalid_revision','invalid token rejected');
select set_config('request.jwt.claim.sub','a1690000-0000-4000-8000-000000000028',true);
select throws_ok($$select public.get_my_xp('a1691000-0000-4000-8000-000000000001',1,null)$$,'42501','course_member_required','instructor cannot read student private XP');
reset role;
select * from finish();
rollback;
