-- Additive username login identities. Public profile reads remain own-only.
create schema username_private;
revoke all on schema username_private from public, anon, authenticated;
grant usage on schema username_private to service_role;

create function username_private.name_key(p_name text) returns text
language sql immutable set search_path = '' as $$
 select case when char_length(btrim(p_name)) between 1 and 80
  and btrim(p_name) !~ '[[:cntrl:]@]' then lower(btrim(p_name)) end;
$$;
revoke all on function username_private.name_key(text) from public, anon, authenticated, service_role;

alter table public.profiles add column username_key text, add column login_username text;
with keys as (
 select p.id,case when p.display_name='Student' and coalesce(u.raw_user_meta_data->>'display_name','')=''
  then null else username_private.name_key(p.display_name) end key
 from public.profiles p join auth.users u on u.id=p.id
), claims as (select id,key,count(*) over(partition by key) owners from keys)
update public.profiles p set username_key=c.key,
 login_username=case when c.key is not null and c.owners=1 then c.key end
from claims c where p.id=c.id;
create index profiles_username_reservation on public.profiles(username_key) where username_key is not null;
create unique index profiles_unique_login_username on public.profiles(login_username) where login_username is not null;

create function username_private.claim_profile_name() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_key text;
begin
 if tg_op='INSERT' and new.display_name='Student' and
  coalesce((select u.raw_user_meta_data->>'display_name' from auth.users u where u.id=new.id),'')='' then
  new.username_key:=null; new.login_username:=null; return new;
 end if;
 new.display_name:=btrim(new.display_name);
 v_key:=username_private.name_key(new.display_name);
 if v_key is null then raise exception 'invalid_username' using errcode='23514'; end if;
 perform pg_advisory_xact_lock(hashtextextended('username:'||v_key,84));
 if exists(select 1 from public.profiles p where p.username_key=v_key and p.id<>new.id) then
  raise exception 'username_unavailable' using errcode='23505';
 end if;
 new.username_key:=v_key; new.login_username:=v_key;
 return new;
end $$;
revoke all on function username_private.claim_profile_name() from public, anon, authenticated, service_role;
create trigger claim_username before insert or update of display_name,username_key,login_username
 on public.profiles for each row execute function username_private.claim_profile_name();

create table username_private.login_attempts (
 fingerprint text not null check(fingerprint='global' or fingerprint ~ '^[0-9a-f]{64}$'),
 window_start timestamptz not null,
 attempts integer not null check(attempts between 1 and 60),
 primary key(fingerprint,window_start)
);
alter table username_private.login_attempts enable row level security;
revoke all on username_private.login_attempts from public,anon,authenticated,service_role;

create function username_private.normalize_identifier(p_identifier text) returns text
language sql immutable set search_path = '' as $$
 select case when position('@' in p_identifier)>0 then 'email:'||lower(btrim(p_identifier))
 else 'username:'||username_private.name_key(p_identifier) end;
$$;
create function username_private.resolve_email(p_username text) returns text
language sql stable security definer set search_path = '' as $$
 select u.email::text from public.profiles p join auth.users u on u.id=p.id
 where p.login_username=username_private.name_key(p_username);
$$;
create function username_private.reserve_attempt(p_fingerprint text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_window timestamptz:=date_trunc('minute',now()); v_retry integer;
begin
 if p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then
  raise exception 'invalid_fingerprint' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('login-budget',84));
 delete from username_private.login_attempts where window_start<v_window-interval '2 minutes';
 v_retry:=greatest(1,ceil(extract(epoch from (v_window+interval '1 minute'-clock_timestamp())))::integer);
 if coalesce((select attempts from username_private.login_attempts where fingerprint='global' and window_start=v_window),0)>=60
  or coalesce((select attempts from username_private.login_attempts where fingerprint=p_fingerprint and window_start=v_window),0)>=10 then
  return jsonb_build_object('allowed',false,'retry_after',v_retry);
 end if;
 insert into username_private.login_attempts(fingerprint,window_start,attempts)
 values('global',v_window,1),(p_fingerprint,v_window,1)
 on conflict(fingerprint,window_start) do update set attempts=username_private.login_attempts.attempts+1;
 return jsonb_build_object('allowed',true,'retry_after',v_retry);
end $$;
revoke all on function username_private.normalize_identifier(text) from public,anon,authenticated;
revoke all on function username_private.resolve_email(text) from public,anon,authenticated;
revoke all on function username_private.reserve_attempt(text) from public,anon,authenticated;
-- Normalization calls a private pure helper; grant it only to the reviewed server role.
grant execute on function username_private.name_key(text),username_private.normalize_identifier(text),
 username_private.resolve_email(text),username_private.reserve_attempt(text) to service_role;

create function public.normalize_login_identifier(p_identifier text) returns text
language sql immutable security invoker set search_path = '' as $$
 select username_private.normalize_identifier(p_identifier);
$$;
create function public.resolve_login_email(p_username text) returns text
language sql stable security invoker set search_path = '' as $$
 select username_private.resolve_email(p_username);
$$;
create function public.reserve_login_attempt(p_fingerprint text) returns jsonb
language sql volatile security invoker set search_path = '' as $$
 select username_private.reserve_attempt(p_fingerprint);
$$;
revoke all on function public.normalize_login_identifier(text),public.resolve_login_email(text),
 public.reserve_login_attempt(text) from public,anon,authenticated;
grant execute on function public.normalize_login_identifier(text),public.resolve_login_email(text),
 public.reserve_login_attempt(text) to service_role;
-- Existing column-level client write grants still cover display_name only.
