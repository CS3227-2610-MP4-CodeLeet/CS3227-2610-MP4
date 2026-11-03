begin;
select no_plan();
select has_function('public','normalize_login_identifier',array['text'],'private server normalization wrapper exists');
select has_function('public','resolve_login_email',array['text'],'private server username lookup wrapper exists');
select has_function('public','reserve_login_attempt',array['text'],'atomic login quota wrapper exists');
select is(has_function_privilege('anon','public.resolve_login_email(text)','execute'),false,'anonymous lookup denied');
select is(has_function_privilege('authenticated','public.resolve_login_email(text)','execute'),false,'signed-in lookup denied');
select is(has_function_privilege('service_role','public.resolve_login_email(text)','execute'),true,'server lookup allowed');
select is(has_function_privilege('anon','public.reserve_login_attempt(text)','execute'),false,'anonymous quota mutation denied');
select is(has_function_privilege('authenticated','public.normalize_login_identifier(text)','execute'),false,'normalizer not a public endpoint');
select is(has_table_privilege('service_role','username_private.login_attempts','select'),false,'server gets no direct counter table grant');
select is(has_column_privilege('authenticated','public.profiles','username_key','UPDATE'),false,'reservation column protected');
select is(has_column_privilege('authenticated','public.profiles','login_username','UPDATE'),false,'claim column protected');
select is(public.normalize_login_identifier('  AcCePtAnCe84  '),'username:acceptance84','database owns case/space normalization');
select is(public.normalize_login_identifier(' EMAIL@Example.TEST '),'email:email@example.test','email counter normalization');
select is(username_private.name_key('a@b'),null,'email-shaped username rejected');
select is(username_private.name_key(E'a\nb'),null,'control characters rejected');
select is(username_private.name_key(repeat('x',81)),null,'long names rejected');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('e8400000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated',
 'acceptance84-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,4) n;
select is((select count(*)::integer from public.profiles where id::text like 'e8400000-%' and login_username is null),4,'provisioned defaults have no allocated login name');
update public.profiles set display_name='Acceptance84_Alpha' where id='e8400000-0000-4000-8000-000000000001';
select is(public.resolve_login_email('ACCEPTANCE84_ALPHA'),'acceptance84-1@example.test','case-insensitive private lookup');
select throws_ok($$update public.profiles set display_name='acceptance84_ALPHA' where id='e8400000-0000-4000-8000-000000000002'$$,'23505',null,'duplicate profile claim denied');
select throws_ok($$insert into auth.users(id,aud,role,email,raw_user_meta_data) values('e8400000-0000-4000-8000-000000000005','authenticated','authenticated','acceptance84-5@example.test','{"display_name":"acceptance84_alpha","role":"instructor"}')$$,'23505',null,'signup duplicate cannot bypass trigger');
update public.profiles set display_name='Acceptance84_Beta' where id='e8400000-0000-4000-8000-000000000001';
select is(public.resolve_login_email('Acceptance84_Alpha'),null,'old name stops resolving');
select is(public.resolve_login_email('Acceptance84_Beta'),'acceptance84-1@example.test','new name resolves');
update auth.users set email='acceptance84-new@example.test' where id='e8400000-0000-4000-8000-000000000001';
select is(public.resolve_login_email('Acceptance84_Beta'),'acceptance84-new@example.test','lookup uses current Auth email');

-- Superuser-only transaction fixture models pre-migration legacy conflicts.
alter table public.profiles disable trigger claim_username;
update public.profiles set display_name='Acceptance84_Legacy',username_key='acceptance84_legacy',login_username=null
 where id in ('e8400000-0000-4000-8000-000000000002','e8400000-0000-4000-8000-000000000003');
alter table public.profiles enable trigger claim_username;
select is(public.resolve_login_email('Acceptance84_Legacy'),null,'legacy duplicate has no arbitrary winner');
select throws_ok($$update public.profiles set display_name='Acceptance84_Legacy' where id='e8400000-0000-4000-8000-000000000004'$$,'23505',null,'new account cannot take reserved legacy name');
update public.profiles set display_name='Acceptance84_Gamma' where id='e8400000-0000-4000-8000-000000000002';
select is(public.resolve_login_email('Acceptance84_Legacy'),null,'sole remaining legacy owner not auto-claimed');
update public.profiles set display_name='Acceptance84_Legacy' where id='e8400000-0000-4000-8000-000000000003';
select is(public.resolve_login_email('Acceptance84_Legacy'),'acceptance84-3@example.test','last owner can explicitly claim');
update public.profiles set display_name='Acceptance84_Delta' where id='e8400000-0000-4000-8000-000000000003';
select lives_ok($$update public.profiles set display_name='Acceptance84_Legacy' where id='e8400000-0000-4000-8000-000000000004'$$,'abandoned reservation becomes claimable');
set local role authenticated;
select set_config('request.jwt.claim.sub','e8400000-0000-4000-8000-000000000004',true);
select is((select count(*)::integer from public.profiles),1,'profile RLS stays own-only');
select throws_ok($$select public.resolve_login_email('Acceptance84_Beta')$$,'42501',null,'direct authenticated lookup rejected');
select throws_ok($$update public.profiles set login_username='forged' where id=auth.uid()$$,'42501',null,'direct canonical-column write denied');
select throws_ok($$update public.profiles set display_name='Acceptance84_Beta' where id=auth.uid()$$,'23505',null,'ordinary Data API-equivalent update enforces uniqueness');
reset role;

delete from username_private.login_attempts;
select throws_ok($$select public.reserve_login_attempt('plaintext@example.test')$$,'22023',null,'counter rejects non-fingerprints');
select ok((public.reserve_login_attempt(repeat('a',64))->>'allowed')::boolean,'first attempt allowed');
do $$begin for i in 2..10 loop perform public.reserve_login_attempt(repeat('a',64)); end loop; end $$;
select is(public.reserve_login_attempt(repeat('a',64))->>'allowed','false','eleventh identifier attempt denied');
select ok((public.reserve_login_attempt(repeat('a',64))->>'retry_after')::int between 1 and 60,'bounded retry-after');
do $$begin for i in 1..50 loop perform public.reserve_login_attempt(md5(i::text)||md5((i+100)::text)); end loop; end $$;
select is(public.reserve_login_attempt(repeat('b',64))->>'allowed','false','global sixty accepted attempts cap enforced');
select is((select attempts from username_private.login_attempts where fingerprint='global'),60,'denied attempts do not call Auth or inflate accepted reservations');
select ok(not exists(select 1 from username_private.login_attempts where fingerprint<>'global' and fingerprint !~ '^[a-f0-9]{64}$'),'no raw identifier counters');
select * from finish();
rollback;
