create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  author_role text not null check (author_role in ('student','instructor')),
  title text not null check (char_length(title) between 1 and 160 and title ~ '[^[:space:]]'),
  body text not null check (char_length(body) between 1 and 8000 and body ~ '[^[:space:]]'),
  request_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(author_id, request_id)
);
create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  author_role text not null check (author_role in ('student','instructor')),
  body text not null check (char_length(body) between 1 and 8000 and body ~ '[^[:space:]]'),
  request_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(author_id, request_id)
);
create index forum_threads_page_idx on public.forum_threads(created_at desc,id desc);
create index forum_replies_page_idx on public.forum_replies(thread_id,created_at desc,id desc);
create index forum_threads_author_time_idx on public.forum_threads(author_id,created_at desc);
create index forum_replies_author_time_idx on public.forum_replies(author_id,created_at desc);
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
create policy forum_threads_member_read on public.forum_threads for select to authenticated
  using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('student','instructor')));
create policy forum_replies_member_read on public.forum_replies for select to authenticated
  using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('student','instructor')));
revoke all on public.forum_threads,public.forum_replies from public,anon,authenticated;
grant select(id,title,body,author_name,author_role,created_at) on public.forum_threads to authenticated;
grant select(id,thread_id,body,author_name,author_role,created_at) on public.forum_replies to authenticated;

create schema forum_private;
revoke all on schema forum_private from public,anon,authenticated;
grant usage on schema forum_private to authenticated;

-- The privileged implementation is outside the Data API's exposed schemas.
-- It is required because clients have no table write privileges; it enforces
-- identity, validation, idempotency and rate limits before every insert.
create function forum_private.create_post(p_thread_id uuid,p_title text,p_body text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_name text;
  v_thread public.forum_threads;
  v_reply public.forum_replies;
  v_count bigint;
  v_id uuid;
begin
  if v_user is null then raise exception using errcode='42501',message='forum_member_required'; end if;
  select role into v_role from public.user_roles where user_id=v_user for share;
  if v_role is null or v_role not in ('student','instructor') then
    raise exception using errcode='42501',message='forum_member_required';
  end if;
  p_body := btrim(p_body);
  p_title := btrim(p_title);
  if p_request_id is null or p_body is null or char_length(p_body) not between 1 and 8000
    or p_body !~ '[^[:space:]]'
    or (p_thread_id is null and (p_title is null or char_length(p_title) not between 1 and 160 or p_title !~ '[^[:space:]]'))
    or (p_thread_id is not null and p_title is not null) then
    raise exception using errcode='22023',message='invalid_forum_post';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 30));
  if (p_thread_id is null and exists(select 1 from public.forum_replies where author_id=v_user and request_id=p_request_id))
    or (p_thread_id is not null and exists(select 1 from public.forum_threads where author_id=v_user and request_id=p_request_id)) then
    raise exception using errcode='23505',message='forum_retry_conflict';
  end if;
  if p_thread_id is null then
    select * into v_thread from public.forum_threads where author_id=v_user and request_id=p_request_id;
    if found then
      if v_thread.title <> p_title or v_thread.body <> p_body then
        raise exception using errcode='23505',message='forum_retry_conflict';
      end if;
      return jsonb_build_object('threadId',v_thread.id,'postId',v_thread.id);
    end if;
  else
    select * into v_reply from public.forum_replies where author_id=v_user and request_id=p_request_id;
    if found then
      if v_reply.thread_id <> p_thread_id or v_reply.body <> p_body then
        raise exception using errcode='23505',message='forum_retry_conflict';
      end if;
      return jsonb_build_object('threadId',v_reply.thread_id,'postId',v_reply.id);
    end if;
    perform 1 from public.forum_threads where id=p_thread_id for key share;
    if not found then raise exception using errcode='P0002',message='thread_unavailable'; end if;
  end if;
  select (select count(*) from public.forum_threads where author_id=v_user and created_at > clock_timestamp()-interval '1 minute')
    + (select count(*) from public.forum_replies where author_id=v_user and created_at > clock_timestamp()-interval '1 minute') into v_count;
  if v_count >= 10 then raise exception using errcode='P0001',message='forum_rate_limited'; end if;
  select display_name into v_name from public.profiles where id=v_user;
  v_name := coalesce(nullif(btrim(v_name),''),'Member');
  if p_thread_id is null then
    insert into public.forum_threads(author_id,author_name,author_role,title,body,request_id)
      values(v_user,v_name,v_role,p_title,p_body,p_request_id) returning id into v_id;
    p_thread_id := v_id;
  else
    insert into public.forum_replies(thread_id,author_id,author_name,author_role,body,request_id)
      values(p_thread_id,v_user,v_name,v_role,p_body,p_request_id) returning id into v_id;
  end if;
  return jsonb_build_object('threadId',p_thread_id,'postId',v_id);
end;
$function$;
revoke all on function forum_private.create_post(uuid,text,text,uuid) from public,anon;
grant execute on function forum_private.create_post(uuid,text,text,uuid) to authenticated;
create function public.create_forum_post(p_thread_id uuid,p_title text,p_body text,p_request_id uuid)
returns jsonb language sql security invoker set search_path = '' as $function$
  select forum_private.create_post(p_thread_id,p_title,p_body,p_request_id);
$function$;
revoke all on function public.create_forum_post(uuid,text,text,uuid) from public,anon;
grant execute on function public.create_forum_post(uuid,text,text,uuid) to authenticated;
