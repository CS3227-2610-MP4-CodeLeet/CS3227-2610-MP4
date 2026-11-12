-- STABLE readers share the calling statement's snapshot, including the private
-- projection and its revision. Tokens detect changes; they never authorize reads.
alter function public.get_my_xp(uuid,integer) set schema xp_private;
alter function xp_private.get_my_xp(uuid,integer) rename to raw_page;
alter function xp_private.raw_page(uuid,integer) stable;
revoke all on function xp_private.raw_page(uuid,integer) from public,anon,authenticated;
alter function leaderboard_private.read_page(uuid,integer) rename to raw_page;
revoke all on function leaderboard_private.raw_page(uuid,integer) from public,anon,authenticated;

create function public.get_my_xp(p_course_id uuid,p_page integer,p_revision text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare first_page jsonb; revision text; effective_page integer; restarted boolean;
begin
  -- The existing projection rechecks verified identity, membership, feature and page.
  first_page := xp_private.raw_page(p_course_id,p_page);
  if p_revision is not null and p_revision !~ '^[a-f0-9]{32}$' then
    raise exception 'invalid_revision' using errcode='22023';
  end if;
  select md5(jsonb_build_array('xp',p_course_id,auth.uid(),coalesce(
    jsonb_agg(jsonb_build_array(w.assignment_id,w.amount,w.updated_at,
      case when a.publication_status='published' then a.title else null end,a.max_xp)
      order by w.updated_at desc,w.assignment_id),'[]'::jsonb))::text)
  into revision from public.xp_awards w join public.assignments a on a.id=w.assignment_id
  where w.student_id=auth.uid() and a.course_id=p_course_id;
  restarted := p_page>1 and p_revision is distinct from revision;
  effective_page := case when restarted then 1 else p_page end;
  if restarted then first_page := xp_private.raw_page(p_course_id,1); end if;
  return first_page || jsonb_build_object('revision',revision,'restarted',restarted,'page',effective_page);
end $$;
revoke all on function public.get_my_xp(uuid,integer,text) from public,anon;
grant execute on function public.get_my_xp(uuid,integer,text) to authenticated;

create function public.get_my_xp(p_course_id uuid,p_page integer default 1)
returns jsonb language sql stable security invoker set search_path='' as $$
  select public.get_my_xp(p_course_id,p_page,null);
$$;
revoke all on function public.get_my_xp(uuid,integer) from public,anon;
grant execute on function public.get_my_xp(uuid,integer) to authenticated;

create function public.get_leaderboard(p_course_id uuid,p_page integer,p_revision text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; revision text; member_role text; restarted boolean;
begin
  result := leaderboard_private.raw_page(p_course_id,p_page);
  if p_revision is not null and p_revision !~ '^[a-f0-9]{32}$' then
    raise exception 'invalid_revision' using errcode='22023';
  end if;
  select role into member_role from public.course_memberships
    where course_id=p_course_id and user_id=auth.uid();
  with totals as (
    select w.student_id,coalesce(p.display_name,'Student') username,sum(w.amount) total_xp
    from public.xp_awards w join public.assignments a on a.id=w.assignment_id and a.course_id=p_course_id
    join public.course_memberships m on m.course_id=p_course_id and m.user_id=w.student_id and m.role='student'
    left join public.profiles p on p.id=w.student_id group by w.student_id,p.display_name
  ) select md5(jsonb_build_array('leaderboard',p_course_id,auth.uid(),member_role,
      coalesce(jsonb_agg(to_jsonb(t) order by t.student_id),'[]'::jsonb))::text)
    into revision from totals t;
  restarted := p_page>1 and p_revision is distinct from revision;
  if restarted then result := leaderboard_private.raw_page(p_course_id,1); end if;
  return result || jsonb_build_object('revision',revision,'restarted',restarted);
end $$;
revoke all on function public.get_leaderboard(uuid,integer,text) from public,anon;
grant execute on function public.get_leaderboard(uuid,integer,text) to authenticated;

-- Preserve old signatures, but missing revisions cannot bypass the restart rule.
create function leaderboard_private.read_page(p_course_id uuid,p_page integer)
returns jsonb language sql stable security invoker set search_path='' as $$
  select public.get_leaderboard(p_course_id,p_page,null);
$$;
revoke all on function leaderboard_private.read_page(uuid,integer) from public,anon;
grant execute on function leaderboard_private.read_page(uuid,integer) to authenticated;
create or replace function public.get_leaderboard(p_course_id uuid,p_page integer default 1)
returns jsonb language sql stable security invoker set search_path='' as $$
  select public.get_leaderboard(p_course_id,p_page,null);
$$;
notify pgrst, 'reload schema';
