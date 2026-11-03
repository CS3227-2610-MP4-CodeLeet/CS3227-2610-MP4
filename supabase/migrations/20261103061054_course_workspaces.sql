-- Course workspaces: per-course roles, features, lifecycle and the archived legacy workspace.
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  lifecycle text not null default 'active' check (lifecycle in ('active','archived')),
  is_legacy boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (not is_legacy or (lifecycle='archived' and title='Legacy')),
  check (is_legacy or owner_id is not null)
);
create unique index courses_single_legacy_idx on public.courses(is_legacy) where is_legacy;
create index courses_owner_idx on public.courses(owner_id,created_at desc);

create table public.course_memberships (
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','instructor')),
  added_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default clock_timestamp(),
  primary key(course_id,user_id)
);
create index course_memberships_user_idx on public.course_memberships(user_id,course_id);
create index course_memberships_course_role_idx on public.course_memberships(course_id,role,user_id);

create table public.course_features (
  course_id uuid not null references public.courses(id) on delete cascade,
  feature text not null check(feature in ('assessments','ai','discussions','xp','leaderboard')),
  enabled boolean not null default true,
  updated_at timestamptz not null default clock_timestamp(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key(course_id,feature)
);

create table public.course_invitations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  email text not null check(email=lower(btrim(email)) and char_length(email) between 3 and 320),
  role text not null check(role in ('student','instructor')),
  token_hash bytea not null unique check(octet_length(token_hash)=32),
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check((accepted_by is null)=(accepted_at is null)),
  check(expires_at > created_at)
);
create unique index course_invites_one_pending_email_idx on public.course_invitations(course_id,email) where accepted_at is null and revoked_at is null;
create index course_invites_pending_idx on public.course_invitations(course_id,expires_at) where accepted_at is null and revoked_at is null;

create table public.course_join_codes (
  course_id uuid primary key references public.courses(id) on delete cascade,
  code_hash bytea not null unique check(octet_length(code_hash)=32),
  rotated_by uuid not null references auth.users(id) on delete restrict,
  rotated_at timestamptz not null default clock_timestamp(),
  revoked_at timestamptz
);
create table public.course_join_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default clock_timestamp()
);
create index course_join_attempts_user_time_idx on public.course_join_attempts(user_id,attempted_at desc);

create schema course_private;
revoke all on schema course_private from public,anon,authenticated;
create table course_private.ownership_events (
  id bigint generated always as identity primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  previous_owner uuid references auth.users(id) on delete set null,
  new_owner uuid references auth.users(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check(event_type in ('transferred','legacy_assigned')),
  created_at timestamptz not null default clock_timestamp()
);


-- One archived Legacy course represents data that predates course boundaries.
insert into public.courses(owner_id,created_by,title,description,lifecycle,is_legacy)
values(null,null,'Legacy','Historical work created before course workspaces existed. Owner: Unassigned.','archived',true);
insert into public.course_memberships(course_id,user_id,role,added_by)
select c.id,r.user_id,r.role,null
from public.courses c cross join public.user_roles r
where c.is_legacy and r.role in ('student','instructor')
on conflict(course_id,user_id) do nothing;
insert into public.course_features(course_id,feature,enabled)
select c.id,f.feature,true from public.courses c
cross join (values('assessments'),('ai'),('discussions'),('xp'),('leaderboard')) f(feature)
where c.is_legacy on conflict do nothing;

alter table public.assignments add column course_id uuid;
update public.assignments set course_id=(select id from public.courses where is_legacy);
alter table public.assignments alter column course_id set not null;
alter table public.assignments add constraint assignments_course_id_fkey foreign key(course_id) references public.courses(id) on delete restrict;
create index assignments_course_idx on public.assignments(course_id,created_at desc,id);
grant select(course_id) on public.assignments to authenticated;

alter table public.forum_threads add column course_id uuid;
update public.forum_threads set course_id=(select id from public.courses where is_legacy);
alter table public.forum_threads alter column course_id set not null;
alter table public.forum_threads add constraint forum_threads_course_id_fkey foreign key(course_id) references public.courses(id) on delete restrict;
create index forum_threads_course_page_idx on public.forum_threads(course_id,created_at desc,id);
grant select(course_id) on public.forum_threads to authenticated;

alter table public.ai_usage add column course_id uuid;
update public.ai_usage u set course_id=a.course_id from public.submissions s join public.assignments a on a.id=s.assignment_id where u.submission_id=s.id;
update public.ai_usage set course_id=(select id from public.courses where is_legacy) where course_id is null;
alter table public.ai_usage alter column course_id set not null;
alter table public.ai_usage add constraint ai_usage_course_id_fkey foreign key(course_id) references public.courses(id) on delete restrict;
create index ai_usage_course_idx on public.ai_usage(course_id,created_at desc);

grant select on public.courses,public.course_memberships,public.course_features to authenticated;
revoke all on public.courses,public.course_memberships,public.course_features,public.course_invitations,public.course_join_codes,public.course_join_attempts from public,anon,authenticated;
grant select(id,owner_id,created_by,title,description,lifecycle,is_legacy,created_at,updated_at) on public.courses to authenticated;
grant select(course_id,user_id,role,joined_at) on public.course_memberships to authenticated;
grant select(course_id,feature,enabled,updated_at) on public.course_features to authenticated;

alter table public.courses enable row level security;
alter table public.course_memberships enable row level security;
alter table public.course_features enable row level security;
alter table public.course_invitations enable row level security;
alter table public.course_join_codes enable row level security;
alter table public.course_join_attempts enable row level security;
alter table course_private.ownership_events enable row level security;
revoke all on course_private.ownership_events from public,anon,authenticated;

create function course_private.is_member(p_course uuid,p_roles text[] default null,p_allow_archived boolean default true)
returns boolean language sql stable security definer set search_path='' as $function$
 select exists(select 1 from public.course_memberships m join public.courses c on c.id=m.course_id
   where m.course_id=p_course and m.user_id=auth.uid() and (p_roles is null or m.role=any(p_roles))
   and (p_allow_archived or c.lifecycle='active'));
$function$;
create function course_private.email_is_verified(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path='' as $function$
 select exists(select 1 from auth.users u where u.id=p_user and u.email_confirmed_at is not null);
$function$;
create function course_private.is_platform_admin(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path='' as $function$
 select exists(select 1 from public.user_roles r where r.user_id=p_user and r.role='admin');
$function$;
revoke all on all functions in schema course_private from public,anon,authenticated;
grant usage on schema course_private to authenticated;
create policy courses_member_read on public.courses for select to authenticated
 using(course_private.is_member(id));
create policy memberships_member_read on public.course_memberships for select to authenticated
 using(user_id=auth.uid() or course_private.is_member(course_id,array['instructor']));
create policy features_member_read on public.course_features for select to authenticated
 using(course_private.is_member(course_id));

create function public.create_course(p_title text,p_description text default '') returns uuid
language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_course uuid;
begin
 if v_user is null or not course_private.email_is_verified(v_user) then raise exception 'verified_account_required' using errcode='42501'; end if;
 if not (exists(select 1 from public.user_roles r where r.user_id=v_user and r.role in ('instructor','admin')) or exists(select 1 from public.course_memberships m join public.courses c on c.id=m.course_id where m.user_id=v_user and m.role='instructor' and c.lifecycle='active')) then raise exception 'instructor_required' using errcode='42501'; end if;
 p_title:=btrim(p_title); p_description:=coalesce(p_description,'');
 if p_title is null or char_length(p_title) not between 1 and 120 or char_length(p_description)>4000 then raise exception 'invalid_course' using errcode='22023'; end if;
 insert into public.courses(owner_id,created_by,title,description) values(v_user,v_user,p_title,p_description) returning id into v_course;
 insert into public.course_memberships(course_id,user_id,role,added_by) values(v_course,v_user,'instructor',v_user);
 insert into public.course_features(course_id,feature,enabled)
 select v_course,f,true from unnest(array['assessments','ai','discussions','xp','leaderboard']) f;
 return v_course;
end $function$;
revoke all on function public.create_course(text,text) from public,anon;
grant execute on function public.create_course(text,text) to authenticated;

create function public.create_course_invitation(p_course uuid,p_email text,p_role text,p_token text,p_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_id uuid; v_email text;
begin
 if v_user is null or not course_private.email_is_verified(v_user) then raise exception 'verified_account_required' using errcode='42501'; end if;
 if not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 v_email:=lower(btrim(p_email));
 if v_email is null or char_length(v_email) not between 3 and 320 or p_role is null or p_role not in ('student','instructor') or p_token is null or char_length(p_token)<32 or p_expires_at is null or p_expires_at<=clock_timestamp() or p_expires_at>clock_timestamp()+interval '30 days' then raise exception 'invalid_invitation' using errcode='22023'; end if;
 perform 1 from public.courses where id=p_course and lifecycle='active' for update;
 if not found then raise exception 'course_unavailable' using errcode='42501'; end if;
 if not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 update public.course_invitations set revoked_at=clock_timestamp() where course_id=p_course and email=v_email and accepted_at is null and revoked_at is null;
 insert into public.course_invitations(course_id,email,role,token_hash,invited_by,expires_at)
 values(p_course,v_email,p_role,extensions.digest(p_token,'sha256'),v_user,p_expires_at) returning id into v_id;
 return v_id;
end $function$;
revoke all on function public.create_course_invitation(uuid,text,text,text,timestamptz) from public,anon;
grant execute on function public.create_course_invitation(uuid,text,text,text,timestamptz) to authenticated;

create function public.accept_course_invitation(p_token text) returns uuid
language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_inv public.course_invitations; v_email text; v_course uuid; v_lifecycle text;
begin
 if v_user is null or not course_private.email_is_verified(v_user) then raise exception 'invitation_unavailable' using errcode='42501'; end if;
 select lower(u.email) into v_email from auth.users u where u.id=v_user;
 select i.course_id into v_course from public.course_invitations i where i.token_hash=extensions.digest(coalesce(p_token,''),'sha256');
 if v_course is null then raise exception 'invitation_unavailable' using errcode='42501'; end if;
 select c.lifecycle into v_lifecycle from public.courses c where c.id=v_course for update;
 if not found then raise exception 'invitation_unavailable' using errcode='42501'; end if;
 select * into v_inv from public.course_invitations i where i.token_hash=extensions.digest(coalesce(p_token,''),'sha256') for update;
 if not found or v_inv.email<>v_email or v_inv.revoked_at is not null then raise exception 'invitation_unavailable' using errcode='42501'; end if;
 if v_inv.accepted_at is not null then
   if v_inv.accepted_by=v_user then return v_inv.course_id; end if;
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 if v_inv.expires_at<=clock_timestamp() or v_lifecycle<>'active' then raise exception 'invitation_unavailable' using errcode='42501'; end if;
 insert into public.course_memberships(course_id,user_id,role,added_by) values(v_inv.course_id,v_user,v_inv.role,v_inv.invited_by)
 on conflict(course_id,user_id) do nothing;
 update public.course_invitations set accepted_by=v_user,accepted_at=clock_timestamp() where id=v_inv.id;
 return v_inv.course_id;
end $function$;

drop policy forum_threads_member_read on public.forum_threads;
drop policy forum_replies_member_read on public.forum_replies;
create policy forum_threads_member_read on public.forum_threads for select to authenticated
 using(course_private.is_member(course_id));
create policy forum_replies_member_read on public.forum_replies for select to authenticated
 using(exists(select 1 from public.forum_threads t where t.id=thread_id and course_private.is_member(t.course_id)));

create policy courses_admin_read on public.courses for select to authenticated using(course_private.is_platform_admin());
grant execute on function course_private.is_platform_admin(uuid) to authenticated;

create function public.revoke_course_invitation(p_invitation uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare v_course uuid;
begin
 select course_id into v_course from public.course_invitations where id=p_invitation;
 if v_course is null then raise exception 'invitation_unavailable' using errcode='42501'; end if;
 perform 1 from public.courses where id=v_course and lifecycle='active' for update;
 if not found or not course_private.is_member(v_course,array['instructor'],false) then raise exception 'invitation_unavailable' using errcode='42501'; end if;
 update public.course_invitations set revoked_at=clock_timestamp() where id=p_invitation and accepted_at is null and revoked_at is null;
end $function$;
create function forum_private.create_post(p_course_id uuid,p_thread_id uuid,p_title text,p_body text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare
 v_user uuid:=auth.uid(); v_role text; v_name text; v_thread public.forum_threads; v_reply public.forum_replies; v_count bigint; v_id uuid;
begin
 if v_user is null or not course_private.email_is_verified(v_user)
   or not course_private.can_use_feature(p_course_id,'discussions') then
   raise exception 'forum_member_required' using errcode='42501';
 end if;
 select role into v_role from public.course_memberships where course_id=p_course_id and user_id=v_user;
 p_body:=btrim(p_body); p_title:=btrim(p_title);
 if p_course_id is null or p_request_id is null or p_body is null or char_length(p_body) not between 1 and 8000
   or p_body !~ '[^[:space:]]'
   or (p_thread_id is null and (p_title is null or char_length(p_title) not between 1 and 160 or p_title !~ '[^[:space:]]'))
   or (p_thread_id is not null and p_title is not null) then
   raise exception 'invalid_forum_post' using errcode='22023';
 end if;
 perform 1 from public.courses where id=p_course_id and lifecycle='active' for share;
 if not found or not course_private.can_use_feature(p_course_id,'discussions') then
   raise exception 'forum_member_required' using errcode='42501';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,30));
 if (p_thread_id is null and exists(select 1 from public.forum_replies where author_id=v_user and request_id=p_request_id))
   or (p_thread_id is not null and exists(select 1 from public.forum_threads where author_id=v_user and request_id=p_request_id)) then
   raise exception 'forum_retry_conflict' using errcode='23505';
 end if;
 if p_thread_id is null then
   select * into v_thread from public.forum_threads where author_id=v_user and request_id=p_request_id;
   if found then
     if v_thread.course_id<>p_course_id or v_thread.title<>p_title or v_thread.body<>p_body then raise exception 'forum_retry_conflict' using errcode='23505'; end if;
     return jsonb_build_object('threadId',v_thread.id,'postId',v_thread.id);
   end if;
 else
   select * into v_reply from public.forum_replies where author_id=v_user and request_id=p_request_id;
   if found then
     if v_reply.thread_id<>p_thread_id or v_reply.body<>p_body or not exists(select 1 from public.forum_threads t where t.id=p_thread_id and t.course_id=p_course_id) then raise exception 'forum_retry_conflict' using errcode='23505'; end if;
     return jsonb_build_object('threadId',v_reply.thread_id,'postId',v_reply.id);
   end if;
   perform 1 from public.forum_threads where id=p_thread_id and course_id=p_course_id for key share;
   if not found then raise exception 'thread_unavailable' using errcode='P0002'; end if;
 end if;
 select (select count(*) from public.forum_threads where author_id=v_user and created_at>clock_timestamp()-interval '1 minute')
   +(select count(*) from public.forum_replies where author_id=v_user and created_at>clock_timestamp()-interval '1 minute') into v_count;
 if v_count>=10 then raise exception 'forum_rate_limited' using errcode='P0001'; end if;
 select display_name into v_name from public.profiles where id=v_user;
 v_name:=coalesce(nullif(btrim(v_name),''),'Member');
 if p_thread_id is null then
   insert into public.forum_threads(course_id,author_id,author_name,author_role,title,body,request_id)
    values(p_course_id,v_user,v_name,v_role,p_title,p_body,p_request_id) returning id into v_id;
   p_thread_id:=v_id;
 else
   insert into public.forum_replies(thread_id,author_id,author_name,author_role,body,request_id)
    values(p_thread_id,v_user,v_name,v_role,p_body,p_request_id) returning id into v_id;
 end if;
 return jsonb_build_object('threadId',p_thread_id,'postId',v_id);
end $function$;
revoke all on function forum_private.create_post(uuid,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function forum_private.create_post(uuid,uuid,text,text,uuid) to authenticated;
create function public.create_forum_post(p_course_id uuid,p_thread_id uuid,p_title text,p_body text,p_request_id uuid)
returns jsonb language sql security invoker set search_path='' as $function$
 select forum_private.create_post(p_course_id,p_thread_id,p_title,p_body,p_request_id);
$function$;
revoke all on function public.create_forum_post(uuid,uuid,text,text,uuid) from public,anon;
grant execute on function public.create_forum_post(uuid,uuid,text,text,uuid) to authenticated;
revoke all on function public.create_forum_post(uuid,text,text,uuid) from authenticated;

create function course_private.set_ai_usage_course() returns trigger
language plpgsql security definer set search_path='' as $function$
declare v_course uuid;
begin
 if new.submission_id is not null then
   select a.course_id into v_course from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=new.submission_id;
   if v_course is null then raise exception 'ai_submission_unavailable' using errcode='P0002'; end if;
   if new.course_id is not null and new.course_id<>v_course then raise exception 'ai_course_mismatch' using errcode='42501'; end if;
   new.course_id:=v_course;
 elsif new.course_id is null then
   select id into v_course from public.courses where is_legacy;
   new.course_id:=v_course;
 end if;
 return new;
end;
$function$;
revoke all on function course_private.set_ai_usage_course() from public,anon,authenticated;
create trigger ai_usage_course_context before insert or update of submission_id,course_id on public.ai_usage
 for each row execute function course_private.set_ai_usage_course();


-- Prevent legacy callers from silently creating new records in the archived workspace.
create function course_private.require_assignment_course() returns trigger
language plpgsql set search_path='' as $function$
begin
 if new.course_id is null then raise exception 'course_context_required' using errcode='22023'; end if;
 return new;
end;
$function$;
revoke all on function course_private.require_assignment_course() from public,anon,authenticated;
create trigger assignments_require_course_context before insert on public.assignments
 for each row execute function course_private.require_assignment_course();

-- Course gates and atomic operations. All writes lock the course before child rows.
create function course_private.can_use_feature(p_course uuid,p_feature text)
returns boolean language sql stable security definer set search_path='' as $function$
 select course_private.is_member(p_course,null,false) and exists(select 1 from public.course_features f where f.course_id=p_course and f.feature=p_feature and f.enabled);
$function$;
grant execute on function course_private.is_member(uuid,text[],boolean),course_private.email_is_verified(uuid),course_private.can_use_feature(uuid,text) to authenticated;
grant execute on function course_private.is_platform_admin(uuid) to authenticated;

create function public.rotate_course_join_code(p_course uuid,p_code text) returns void
language plpgsql security definer set search_path='' as $function$
begin
 perform 1 from public.courses where id=p_course and lifecycle='active' for update;
 if not found or auth.uid() is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 if p_code is null or char_length(p_code)<20 or char_length(p_code)>128 then raise exception 'invalid_join_code' using errcode='22023'; end if;
 insert into public.course_join_codes(course_id,code_hash,rotated_by,rotated_at,revoked_at)
 values(p_course,extensions.digest(p_code,'sha256'),auth.uid(),clock_timestamp(),null)
 on conflict(course_id) do update set code_hash=excluded.code_hash,rotated_by=excluded.rotated_by,rotated_at=excluded.rotated_at,revoked_at=null;
end $function$;
revoke all on function public.rotate_course_join_code(uuid,text) from public,anon;
grant execute on function public.rotate_course_join_code(uuid,text) to authenticated;

create function public.revoke_course_join_code(p_course uuid) returns void
language plpgsql security definer set search_path='' as $function$
begin
 perform 1 from public.courses where id=p_course and lifecycle='active' for update;
 if not found or auth.uid() is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 update public.course_join_codes set revoked_at=clock_timestamp() where course_id=p_course;
end $function$;
revoke all on function public.revoke_course_join_code(uuid) from public,anon;
grant execute on function public.revoke_course_join_code(uuid) to authenticated;

create function public.join_course_by_code(p_code text) returns uuid
language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_course uuid;
begin
 if v_user is null or not course_private.email_is_verified(v_user) then return null; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,81));
 delete from public.course_join_attempts where user_id=v_user and attempted_at<clock_timestamp()-interval '1 hour';
 if (select count(*) from public.course_join_attempts where user_id=v_user)>=10 then return null; end if;
 insert into public.course_join_attempts(user_id) values(v_user);
 select c.id into v_course from public.course_join_codes j join public.courses c on c.id=j.course_id
 where j.code_hash=extensions.digest(coalesce(p_code,''),'sha256') and j.revoked_at is null and c.lifecycle='active' for update of c;
 if v_course is null then return null; end if;
 insert into public.course_memberships(course_id,user_id,role) values(v_course,v_user,'student') on conflict(course_id,user_id) do nothing;
 return v_course;
end $function$;
revoke all on function public.join_course_by_code(text) from public,anon;
grant execute on function public.join_course_by_code(text) to authenticated;

create function public.set_course_member(p_course uuid,p_user uuid,p_role text default null) returns void
language plpgsql security definer set search_path='' as $function$
declare v_owner uuid; v_actor uuid:=auth.uid(); v_old text;
begin
 select owner_id into v_owner from public.courses where id=p_course and lifecycle='active' for update;
 if not found then raise exception 'course_unavailable' using errcode='42501'; end if;
 if v_actor is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 select role into v_old from public.course_memberships where course_id=p_course and user_id=p_user for update;
 if p_role is null then
   if p_user=v_owner and v_actor<>v_owner then raise exception 'course_owner_required' using errcode='42501'; end if;
   if p_user=v_owner then raise exception 'transfer_owner_first' using errcode='42501'; end if;
   if v_old='instructor' and v_actor<>v_owner then raise exception 'course_owner_required' using errcode='42501'; end if;
   delete from public.course_memberships where course_id=p_course and user_id=p_user;
   return;
 end if;
 if p_role is null or p_role not in ('student','instructor') or not course_private.email_is_verified(p_user) then raise exception 'verified_member_required' using errcode='42501'; end if;
 if p_user=v_owner and p_role<>'instructor' then raise exception 'course_owner_required' using errcode='42501'; end if;
 if v_old='instructor' and p_role<>'instructor' and v_actor<>v_owner then raise exception 'course_owner_required' using errcode='42501'; end if;
 insert into public.course_memberships(course_id,user_id,role,added_by) values(p_course,p_user,p_role,v_actor)
 on conflict(course_id,user_id) do update set role=excluded.role,added_by=excluded.added_by;
end $function$;
revoke all on function public.set_course_member(uuid,uuid,text) from public,anon;
grant execute on function public.set_course_member(uuid,uuid,text) to authenticated;

create function public.transfer_course_ownership(p_course uuid,p_new_owner uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare v_old uuid:=auth.uid();
begin
 if v_old is null then raise exception 'course_owner_required' using errcode='42501'; end if;
 perform 1 from public.courses where id=p_course and lifecycle='active' and not is_legacy and owner_id=v_old for update;
 if not found then raise exception 'course_owner_required' using errcode='42501'; end if;
 if p_new_owner=v_old or not course_private.email_is_verified(p_new_owner) then raise exception 'verified_instructor_required' using errcode='42501'; end if;
 insert into public.course_memberships(course_id,user_id,role,added_by) values(p_course,p_new_owner,'instructor',v_old)
 on conflict(course_id,user_id) do update set role='instructor';
 update public.courses set owner_id=p_new_owner,updated_at=clock_timestamp() where id=p_course;
 update public.course_memberships set role='instructor' where course_id=p_course and user_id=v_old;
 insert into course_private.ownership_events(course_id,previous_owner,new_owner,actor_id,event_type) values(p_course,v_old,p_new_owner,v_old,'transferred');
end $function$;
revoke all on function public.transfer_course_ownership(uuid,uuid) from public,anon;
grant execute on function public.transfer_course_ownership(uuid,uuid) to authenticated;

create function public.assign_legacy_course_owner(p_owner uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare v_admin uuid:=auth.uid(); v_course uuid;
begin
 if v_admin is null or not course_private.is_platform_admin(v_admin) then raise exception 'platform_admin_required' using errcode='42501'; end if;
 if not course_private.email_is_verified(p_owner) or not (exists(select 1 from public.user_roles r where r.user_id=p_owner and r.role='instructor') or exists(select 1 from public.course_memberships m where m.user_id=p_owner and m.role='instructor')) then raise exception 'verified_instructor_required' using errcode='42501'; end if;
 select id into v_course from public.courses where is_legacy for update;
 if v_course is null then raise exception 'legacy_unavailable' using errcode='P0002'; end if;
 if not course_private.is_platform_admin(v_admin) then raise exception 'platform_admin_required' using errcode='42501'; end if;
 insert into public.course_memberships(course_id,user_id,role,added_by) values(v_course,p_owner,'instructor',v_admin)
 on conflict(course_id,user_id) do update set role='instructor';
 update public.courses set owner_id=p_owner,updated_at=clock_timestamp() where id=v_course;
 insert into course_private.ownership_events(course_id,new_owner,actor_id,event_type) values(v_course,p_owner,v_admin,'legacy_assigned');
end $function$;
revoke all on function public.assign_legacy_course_owner(uuid) from public,anon;
grant execute on function public.assign_legacy_course_owner(uuid) to authenticated;

create function public.set_course_feature(p_course uuid,p_feature text,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $function$
begin
 perform 1 from public.courses where id=p_course and lifecycle='active' for update;
 if not found or auth.uid() is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 if p_feature not in ('assessments','ai','discussions','xp','leaderboard') or p_enabled is null then raise exception 'invalid_course_feature' using errcode='22023'; end if;
 update public.course_features set enabled=p_enabled,updated_at=clock_timestamp(),updated_by=auth.uid() where course_id=p_course and feature=p_feature;
 if not found then raise exception 'course_unavailable' using errcode='P0002'; end if;
end $function$;
revoke all on function public.set_course_feature(uuid,text,boolean) from public,anon;
grant execute on function public.set_course_feature(uuid,text,boolean) to authenticated;

create function public.archive_course(p_course uuid) returns void
language plpgsql security definer set search_path='' as $function$
begin
 if auth.uid() is null then raise exception 'course_owner_required' using errcode='42501'; end if;
 perform 1 from public.courses where id=p_course and owner_id=auth.uid() and not is_legacy and lifecycle='active' for update;
 if not found then raise exception 'course_owner_required' using errcode='42501'; end if;
 update public.course_invitations set revoked_at=clock_timestamp() where course_id=p_course and accepted_at is null and revoked_at is null;
 update public.course_join_codes set revoked_at=clock_timestamp() where course_id=p_course and revoked_at is null;
 update public.courses set lifecycle='archived',updated_at=clock_timestamp() where id=p_course;
end $function$;
revoke all on function public.archive_course(uuid) from public,anon;
grant execute on function public.archive_course(uuid) to authenticated;

create function public.delete_empty_course(p_course uuid,p_confirm boolean) returns void
language plpgsql security definer set search_path='' as $function$
begin
 if auth.uid() is null or p_confirm is distinct from true then raise exception 'course_delete_confirmation_required' using errcode='42501'; end if;
 perform 1 from public.courses where id=p_course and owner_id=auth.uid() and not is_legacy for update;
 if not found then raise exception 'course_owner_required' using errcode='42501'; end if;
 if exists(select 1 from public.course_memberships where course_id=p_course and user_id<>auth.uid())
   or exists(select 1 from public.assignments where course_id=p_course)
   or exists(select 1 from public.forum_threads where course_id=p_course)
   or exists(select 1 from public.ai_usage where course_id=p_course)
   or exists(select 1 from public.ai_reviews r join public.submissions s on s.id=r.submission_id join public.assignments a on a.id=s.assignment_id where a.course_id=p_course)
 then raise exception 'course_not_empty' using errcode='23514'; end if;
 delete from public.courses where id=p_course;
end $function$;
revoke all on function public.delete_empty_course(uuid,boolean) from public,anon;
grant execute on function public.delete_empty_course(uuid,boolean) to authenticated;

revoke all on function public.revoke_course_invitation(uuid) from public,anon;
grant execute on function public.revoke_course_invitation(uuid) to authenticated;

notify pgrst,'reload schema';
