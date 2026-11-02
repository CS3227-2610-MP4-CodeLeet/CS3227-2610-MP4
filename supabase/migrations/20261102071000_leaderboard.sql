-- Deliberate narrow shared projection; peer profiles/awards retain own-only RLS.
create schema leaderboard_private;
revoke all on schema leaderboard_private from public,anon,authenticated;
grant usage on schema leaderboard_private to authenticated;
create function leaderboard_private.read_page(p_page integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare member_id uuid:=auth.uid(); member_role text; result jsonb;
begin
 select r.role into member_role from public.user_roles r where r.user_id=member_id;
 if member_id is null or member_role is null or member_role not in ('student','instructor','admin') then
  raise exception 'member_required' using errcode='42501';
 end if;
 if p_page is null or p_page not between 1 and 10000 then raise exception 'invalid_page' using errcode='22023'; end if;
 with totals as materialized (
  select w.student_id,coalesce(p.display_name,'Student') username,sum(w.amount) total_xp
  from public.xp_awards w join public.user_roles r on r.user_id=w.student_id and r.role='student'
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
end $$;
revoke all on function leaderboard_private.read_page(integer) from public,anon,authenticated;
grant execute on function leaderboard_private.read_page(integer) to authenticated;
create function public.get_leaderboard(p_page integer default 1) returns jsonb
language sql stable security invoker set search_path='' as $$
 select leaderboard_private.read_page(p_page);
$$;
revoke all on function public.get_leaderboard(integer) from public,anon,authenticated;
grant execute on function public.get_leaderboard(integer) to authenticated;
notify pgrst,'reload schema';
