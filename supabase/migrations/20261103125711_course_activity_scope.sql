-- Keep each discussion, XP summary and leaderboard inside the selected course.

create function course_private.can_read_feature(p_course uuid,p_feature text)
returns boolean language sql stable security definer set search_path='' as $function$
  select course_private.email_is_verified() and exists(select 1 from public.user_roles r where r.user_id=auth.uid())
    and course_private.is_member(p_course,null,true) and exists(
    select 1 from public.courses c where c.id=p_course and (
      c.lifecycle='archived' or (c.lifecycle='active' and course_private.can_use_feature(p_course,p_feature))
    )
  );
$function$;
revoke all on function course_private.can_read_feature(uuid,text) from public,anon,authenticated;
grant execute on function course_private.can_read_feature(uuid,text) to authenticated;

drop policy forum_threads_member_read on public.forum_threads;
create policy forum_threads_member_read on public.forum_threads for select to authenticated
  using(course_private.can_read_feature(course_id,'discussions'));
drop policy forum_replies_member_read on public.forum_replies;
create policy forum_replies_member_read on public.forum_replies for select to authenticated
  using(exists(select 1 from public.forum_threads t where t.id=thread_id and course_private.can_read_feature(t.course_id,'discussions')));

drop policy own_xp_awards on public.xp_awards;
create policy own_xp_awards on public.xp_awards for select to authenticated using(
  student_id=auth.uid() and exists(
    select 1 from public.assignments a join public.course_memberships m on m.course_id=a.course_id
    where a.id=xp_awards.assignment_id and m.user_id=xp_awards.student_id and m.role='student'
      and course_private.can_read_feature(a.course_id,'xp')
  )
);
drop policy own_xp_ledger on public.xp_ledger;
create policy own_xp_ledger on public.xp_ledger for select to authenticated using(
  student_id=auth.uid() and exists(
    select 1 from public.assignments a join public.course_memberships m on m.course_id=a.course_id
    where a.id=xp_ledger.assignment_id and m.user_id=xp_ledger.student_id and m.role='student'
      and course_private.can_read_feature(a.course_id,'xp')
  )
);

drop function public.get_my_xp(integer);
create function public.get_my_xp(p_course_id uuid,p_page integer default 1) returns jsonb
language plpgsql security definer set search_path='' as $function$
declare result jsonb;
begin
 if not course_private.email_is_verified() or not exists(select 1 from public.user_roles r where r.user_id=auth.uid())
   or not course_private.is_member(p_course_id,array['student']) then
  raise exception 'course_member_required' using errcode='42501'; end if;
 if not course_private.can_read_feature(p_course_id,'xp') then
  raise exception 'course_feature_unavailable' using errcode='42501'; end if;
 if p_page is null or p_page not between 1 and 10000 then
  raise exception 'invalid_page' using errcode='22023'; end if;
 with page_rows as (
  select w.assignment_id,case when a.publication_status='published' then a.title else null end assignment_title,
    w.amount awarded_xp,a.max_xp,w.updated_at
  from public.xp_awards w join public.assignments a on a.id=w.assignment_id
  where w.student_id=auth.uid() and a.course_id=p_course_id
  order by w.updated_at desc,w.assignment_id limit 26 offset (p_page-1)*25
 ) select jsonb_build_object(
   'total_xp',(select coalesce(sum(w.amount),0)::text from public.xp_awards w join public.assignments a on a.id=w.assignment_id
     where w.student_id=auth.uid() and a.course_id=p_course_id),
   'page',p_page,'has_more',(select count(*)>25 from page_rows),'awards',
   (select coalesce(jsonb_agg(to_jsonb(r) order by r.updated_at desc,r.assignment_id),'[]'::jsonb)
    from(select * from page_rows order by updated_at desc,assignment_id limit 25) r)
 ) into result;
 return result;
end
$function$;
revoke all on function public.get_my_xp(uuid,integer) from public,anon;
grant execute on function public.get_my_xp(uuid,integer) to authenticated;

drop function public.get_leaderboard(integer);
drop function leaderboard_private.read_page(integer);
create function leaderboard_private.read_page(p_course_id uuid,p_page integer) returns jsonb
language plpgsql stable security definer set search_path='' as $function$
declare member_id uuid:=auth.uid(); member_role text; result jsonb;
begin
 select m.role into member_role from public.course_memberships m where m.course_id=p_course_id and m.user_id=member_id;
 if member_id is null or not course_private.email_is_verified()
   or not exists(select 1 from public.user_roles r where r.user_id=member_id) then
  raise exception 'member_required' using errcode='42501'; end if;
 if not course_private.is_member(p_course_id,array['student','instructor']) then
  raise exception 'course_member_required' using errcode='42501'; end if;
 if not course_private.can_read_feature(p_course_id,'leaderboard') then
  raise exception 'course_feature_unavailable' using errcode='42501'; end if;
 if p_page is null or p_page not between 1 and 10000 then
  raise exception 'invalid_page' using errcode='22023'; end if;
 with totals as materialized (
  select w.student_id,coalesce(p.display_name,'Student') username,sum(w.amount) total_xp
  from public.xp_awards w join public.assignments a on a.id=w.assignment_id and a.course_id=p_course_id
  join public.course_memberships m on m.course_id=p_course_id and m.user_id=w.student_id and m.role='student'
  left join public.profiles p on p.id=w.student_id group by w.student_id,p.display_name
 ), ranked as materialized (
  select t.*,rank() over(order by total_xp desc) shared_rank,
   row_number() over(order by total_xp desc,lower(username) collate "C",student_id) position
  from totals t where total_xp>0
 ), page_rows as materialized (
  select * from ranked order by position limit 26 offset (p_page-1)*25
 ) select jsonb_build_object('page',p_page,'has_more',(select count(*)>25 from page_rows),
  'own',case when member_role='student' then jsonb_build_object(
   'rank',(select shared_rank::text from ranked where student_id=member_id),
   'total_xp',coalesce((select total_xp::text from totals where student_id=member_id),'0')) else null end,
  'rows',(select coalesce(jsonb_agg(jsonb_build_object(
   'position',q.position::integer,'rank',q.shared_rank::text,'username',q.username,
   'total_xp',q.total_xp::text,'is_current_user',q.student_id=member_id) order by q.position),'[]'::jsonb)
   from(select * from page_rows order by position limit 25) q)) into result;
 return result;
end
$function$;
revoke all on function leaderboard_private.read_page(uuid,integer) from public,anon,authenticated;
grant execute on function leaderboard_private.read_page(uuid,integer) to authenticated;
create function public.get_leaderboard(p_course_id uuid,p_page integer default 1) returns jsonb
language sql stable security invoker set search_path='' as $function$
 select leaderboard_private.read_page(p_course_id,p_page);
$function$;
revoke all on function public.get_leaderboard(uuid,integer) from public,anon;
grant execute on function public.get_leaderboard(uuid,integer) to authenticated;

create or replace function forum_private.create_post(p_course_id uuid,p_thread_id uuid,p_title text,p_body text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare
  v_user uuid:=auth.uid(); v_role text; v_name text; v_thread public.forum_threads;
  v_reply public.forum_replies; v_count bigint; v_id uuid;
begin
  select m.role into v_role from public.course_memberships m
    join public.courses c on c.id=m.course_id
    where m.course_id=p_course_id and m.user_id=v_user and c.lifecycle='active';
  if v_user is null or not course_private.email_is_verified(v_user)
    or not exists(select 1 from public.user_roles r where r.user_id=v_user)
    or v_role not in ('student','instructor')
    or not course_private.can_use_feature(p_course_id,'discussions') then
    raise exception 'forum_member_required' using errcode='42501';
  end if;
  p_body:=btrim(p_body); p_title:=btrim(p_title);
  if p_request_id is null or p_body is null or char_length(p_body) not between 1 and 8000
    or p_body !~ '[^[:space:]]'
    or (p_thread_id is null and (p_title is null or char_length(p_title) not between 1 and 160 or p_title !~ '[^[:space:]]'))
    or (p_thread_id is not null and p_title is not null) then
    raise exception 'invalid_forum_post' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_course_id::text,30));
  if (p_thread_id is null and exists(select 1 from public.forum_replies where author_id=v_user and request_id=p_request_id))
    or (p_thread_id is not null and exists(select 1 from public.forum_threads where author_id=v_user and request_id=p_request_id)) then
    raise exception 'forum_retry_conflict' using errcode='23505';
  end if;
  if p_thread_id is null then
    select * into v_thread from public.forum_threads where author_id=v_user and request_id=p_request_id;
    if found then
      if v_thread.course_id<>p_course_id or v_thread.title<>p_title or v_thread.body<>p_body then
        raise exception 'forum_retry_conflict' using errcode='23505';
      end if;
      return jsonb_build_object('threadId',v_thread.id,'postId',v_thread.id);
    end if;
  else
    select * into v_reply from public.forum_replies where author_id=v_user and request_id=p_request_id;
    if found then
      if v_reply.thread_id<>p_thread_id or v_reply.body<>p_body or not exists(
        select 1 from public.forum_threads t where t.id=p_thread_id and t.course_id=p_course_id) then
        raise exception 'forum_retry_conflict' using errcode='23505';
      end if;
      return jsonb_build_object('threadId',v_reply.thread_id,'postId',v_reply.id);
    end if;
    perform 1 from public.forum_threads where id=p_thread_id and course_id=p_course_id for key share;
    if not found then raise exception 'thread_unavailable' using errcode='P0002'; end if;
  end if;
  select (select count(*) from public.forum_threads where author_id=v_user and course_id=p_course_id and created_at>clock_timestamp()-interval '1 minute')
    +(select count(*) from public.forum_replies r join public.forum_threads t on t.id=r.thread_id
       where r.author_id=v_user and t.course_id=p_course_id and r.created_at>clock_timestamp()-interval '1 minute') into v_count;
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
end
$function$;
revoke all on function forum_private.create_post(uuid,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function forum_private.create_post(uuid,uuid,text,text,uuid) to authenticated;
notify pgrst,'reload schema';
