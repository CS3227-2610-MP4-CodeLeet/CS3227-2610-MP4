begin;
select no_plan();
create temporary table lb_baseline as select w.student_id,coalesce(p.display_name,'Student') username,sum(w.amount) xp
 from public.xp_awards w join public.user_roles r on r.user_id=w.student_id and r.role='student'
 left join public.profiles p on p.id=w.student_id group by w.student_id,p.display_name having sum(w.amount)>0;
create temporary table lb_expected as select
 (1+(select count(*) from lb_baseline where xp>100000)) top_rank,
 (3+(select count(*) from lb_baseline where xp>90000)) group_rank,
 (28+(select count(*) from lb_baseline where xp>50000)) corrected_rank,
 (1+(select count(*) from lb_baseline where xp>100000 or (xp=100000 and
  (lower(username) collate "C"<'same' or (lower(username) collate "C"='same' and student_id<'d1000000-0000-4000-8000-000000000001'::uuid))))) top_position,
 (28+(select count(*) from lb_baseline where xp>90000 or (xp=90000 and
  (lower(username) collate "C"<'leaderboard 28' or (lower(username) collate "C"='leaderboard 28' and student_id<'d1000000-0000-4000-8000-000000000028'::uuid))))) last_position;
grant select on lb_expected to authenticated;
create function pg_temp.lb_member(p_member uuid,p_page integer default 1) returns jsonb language plpgsql as $$
begin perform set_config('request.jwt.claim.sub',p_member::text,true); return public.get_leaderboard(p_page); end $$;

select has_function('public','get_leaderboard',array['integer'],'leaderboard RPC exists');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('d1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated',
 'leaderboard-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,32) n;
update public.user_roles set role='instructor' where user_id='d1000000-0000-4000-8000-000000000031';
update public.user_roles set role='admin' where user_id='d1000000-0000-4000-8000-000000000032';
insert into public.courses(id,owner_id,created_by,title,description) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000031','d1000000-0000-4000-8000-000000000031','Scoped fixture','');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000031','instructor');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000003','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000004','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000005','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000006','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000007','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000008','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000009','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000010','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000011','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000012','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000013','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000014','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000015','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000016','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000017','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000018','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000019','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000020','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000021','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000022','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000023','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000024','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000025','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000026','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000027','student');
insert into public.course_memberships(course_id,user_id,role) values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000028','student');
insert into public.course_features(course_id,feature,enabled) select 'd3000000-0000-4000-8000-000000000001',feature,true from unnest(array['assessments','ai','discussions','xp','leaderboard']) feature;
delete from public.user_roles where user_id='d1000000-0000-4000-8000-000000000030';
update public.profiles set display_name='Leaderboard '||right(id::text,2) where id in (select ('d1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,32) n);
update public.profiles set display_name='Same' where id in ('d1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002');
insert into public.assignments (id,instructor_id,title,instructions,language,publication_status,max_xp,course_id) values ('d2000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000031','Ranking fixture','Synthetic','python','published',100000,'d3000000-0000-4000-8000-000000000001'::uuid);
insert into public.assignment_rubrics(assignment_id,criteria) values('d2000000-0000-4000-8000-000000000001','[{"id":"d5000000-0000-4000-8000-000000000001","title":"Correctness","description":"Synthetic","maxScore":10}]');
insert into public.submissions(id,assignment_id,student_id,source,revision,request_id)
select ('d4000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'d2000000-0000-4000-8000-000000000001',
 ('d1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'print(1)',1,gen_random_uuid() from generate_series(1,28) n;
set local role authenticated;
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000031',true);
do $$declare n integer; score numeric; begin for n in 1..28 loop
 score:=case when n<=2 then 10 else 9 end;
 perform public.save_grade(('d4000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  jsonb_build_object('d5000000-0000-4000-8000-000000000001',score),'Synthetic',score,true,0);
end loop; end $$;
reset role;
create temporary table lb_before as select count(*) awards,(select count(*) from public.xp_ledger) ledger from public.xp_awards;
set local role authenticated;
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000028',true);
select is(jsonb_array_length(public.get_leaderboard(1)->'rows'),25,'first page bounded to25');
select is(public.get_leaderboard(1)->>'has_more','true','lookahead detects next page');
select is(public.get_leaderboard(1)->'rows'->0->>'rank','1','best result rank1');
select is(pg_temp.lb_member('d1000000-0000-4000-8000-000000000001')->'own'->>'rank',(select top_rank::text from lb_expected),'first equal-XP fixture has expected global rank');
select is(pg_temp.lb_member('d1000000-0000-4000-8000-000000000002')->'own'->>'rank',(select top_rank::text from lb_expected),'equal XP shares rank irrespective of baseline');
select is(pg_temp.lb_member('d1000000-0000-4000-8000-000000000028')->'own'->>'rank',(select group_rank::text from lb_expected),'next fixture group skips tied positions');
select is(pg_temp.lb_member('d1000000-0000-4000-8000-000000000001',(select ((top_position-1)/25+1)::integer from lb_expected))->'rows'->(select ((top_position-1)%25)::integer from lb_expected)->>'username','Same','duplicate username supported');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000028',true);
select is(public.get_leaderboard(1),public.get_leaderboard(1),'repeat page uses deterministic order');
select is(public.get_leaderboard(1)->'own'->>'rank',(select group_rank::text from lb_expected),'own rank is global beyond page1');
select is(public.get_leaderboard(1)->'own'->>'total_xp','90000','own XP remains exact');
select ok(not exists(select 1 from jsonb_array_elements(public.get_leaderboard(1)->'rows') r where (r->>'is_current_user')::boolean),'own row not fabricated on page1');
select is(public.get_leaderboard((select ((group_rank-1)/25+1)::integer from lb_expected))->'rows'->24->>'rank',(select group_rank::text from lb_expected),'tie reaches end of a page');
select is(public.get_leaderboard((select ((group_rank-1)/25+2)::integer from lb_expected))->'rows'->0->>'rank',(select group_rank::text from lb_expected),'tie rank continues across page boundary');
select is((select count(*)::integer from public.profiles),1,'profile RLS still own-only');
select is((select count(*)::integer from public.xp_awards),1,'award rows still own-only');
select ok(not exists(select 1 from jsonb_array_elements(public.get_leaderboard(1)->'rows') r,
 lateral jsonb_object_keys(r) k where k not in ('position','rank','username','total_xp','is_current_user')),'projection exposes only approved fields, regardless of username text');
select throws_ok($$select public.get_leaderboard(0)$$,'22023','invalid_page','invalid page rejected');
select throws_ok($$select public.get_leaderboard(null)$$,'22023','invalid_page','null page rejected');
select throws_ok($$select public.get_leaderboard(10001)$$,'22023','invalid_page','upper page limit enforced');
select is(public.get_leaderboard(10000)->'rows','[]'::jsonb,'out-of-range page is safely empty');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000001',true);
select is(public.get_leaderboard((select ((top_position-1)/25+1)::integer from lb_expected))->'rows'->(select ((top_position-1)%25)::integer from lb_expected)->>'is_current_user','true','stable ID orders first duplicate username');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000002',true);
select is(public.get_leaderboard((select (top_position/25+1)::integer from lb_expected))->'rows'->(select (top_position%25)::integer from lb_expected)->>'is_current_user','true','second duplicate has its own stable position');
reset role;
update public.assignments set publication_status='draft' where id='d2000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000028',true);
select is(public.get_leaderboard(1)->'own'->>'total_xp','90000','hiding assignment retains earned total without metadata');
reset role;
update public.user_roles set role='instructor' where user_id='d1000000-0000-4000-8000-000000000028';
set local role authenticated;
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000028',true);
select is(public.get_leaderboard(1)->'own','null'::jsonb,'role change removes own student summary');
select ok(not exists(select 1 from jsonb_array_elements(public.get_leaderboard((select ((last_position-1)/25+1)::integer from lb_expected))->'rows') r where (r->>'is_current_user')::boolean),'positive XP from a former student is excluded');
reset role;
update public.user_roles set role='student' where user_id='d1000000-0000-4000-8000-000000000028';
set local role authenticated;
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000029',true);
select is(public.get_leaderboard(1)->'own','{"rank":null,"total_xp":"0"}'::jsonb,'zero-XP student has unranked own summary');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000031',true);
select is(public.get_leaderboard(1)->'own','null'::jsonb,'instructor can browse without being ranked');
select lives_ok($$select public.save_grade('d4000000-0000-4000-8000-000000000001','{"d5000000-0000-4000-8000-000000000001":5}','Corrected',5,true,1)$$,'owner can correct XP source');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000001',true);
select is(public.get_leaderboard(1)->'own'->>'rank',(select corrected_rank::text from lb_expected),'corrected lower XP immediately changes rank');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000032',true);
select is(public.get_leaderboard(1)->'own','null'::jsonb,'admin can browse without student summary');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000030',true);
select throws_ok($$select public.get_leaderboard(1)$$,'42501','member_required','unprovisioned account denied');
select throws_ok($$select leaderboard_private.read_page(1)$$,'42501','member_required','private direct invocation also checks membership');
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.get_leaderboard(1)$$,'42501','member_required','authenticated role without verified identity denied');
reset role;
select ok(not has_function_privilege('anon','public.get_leaderboard(integer)','EXECUTE'),'anonymous execute denied');
select ok(not has_schema_privilege('authenticated','leaderboard_private','CREATE'),'client cannot create/replace private objects');
select is((select count(*) from public.xp_awards),(select awards from lb_before),'reads never create awards');
select is((select count(*) from public.xp_ledger),(select ledger+1 from lb_before),'only grade correction adds a ledger delta');
insert into public.assignments (id,instructor_id,title,instructions,publication_status,max_xp,course_id) values ('d2000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000031','Second XP fixture','Synthetic','published',10000,'d3000000-0000-4000-8000-000000000001'::uuid);
insert into public.assignment_rubrics(assignment_id,criteria) values('d2000000-0000-4000-8000-000000000002','[{"id":"d5000000-0000-4000-8000-000000000001","title":"Correctness","description":"Synthetic","maxScore":10}]');
insert into public.submissions(id,assignment_id,student_id,source,revision,request_id) values
('d6000000-0000-4000-8000-000000000028','d2000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000028','print(1)',1,gen_random_uuid()),
('d4000000-0000-4000-8000-000000000029','d2000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000029','print(1)',1,gen_random_uuid());
set local role authenticated;
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000031',true);
select lives_ok($$select public.save_grade('d6000000-0000-4000-8000-000000000028','{"d5000000-0000-4000-8000-000000000001":5}','Second assignment',5,true,0)$$,'second assignment can award XP');
select lives_ok($$select public.save_grade('d4000000-0000-4000-8000-000000000029','{"d5000000-0000-4000-8000-000000000001":0}','Zero score',0,true,0)$$,'explicit zero award can be published');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000028',true);
select is(public.get_leaderboard(1)->'own'->>'total_xp','95000','leaderboard sums awards across assignments');
select is(public.get_leaderboard(1)->'own'->>'total_xp',public.get_my_xp(1)->>'total_xp','shared and private totals agree');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000029',true);
select is(public.get_leaderboard(1)->'own','{"rank":null,"total_xp":"0"}'::jsonb,'explicit zero award does not become a ranking');
reset role;
select * from finish();
rollback;
