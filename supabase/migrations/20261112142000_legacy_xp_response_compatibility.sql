-- Preserve the response contracts consumed by deployed strict-schema clients
-- while all later-page legacy calls still pass through the revision guard.
create or replace function public.get_my_xp(p_course_id uuid,p_page integer default 1)
returns jsonb language sql stable security invoker set search_path='' as $$
  select public.get_my_xp(p_course_id,p_page,null) - 'revision' - 'restarted';
$$;
create or replace function public.get_leaderboard(p_course_id uuid,p_page integer default 1)
returns jsonb language sql stable security invoker set search_path='' as $$
  select public.get_leaderboard(p_course_id,p_page,null) - 'revision' - 'restarted';
$$;
create or replace function leaderboard_private.read_page(p_course_id uuid,p_page integer)
returns jsonb language sql stable security invoker set search_path='' as $$
  select public.get_leaderboard(p_course_id,p_page,null) - 'revision' - 'restarted';
$$;
-- CREATE OR REPLACE retains the existing restricted execution grants.
notify pgrst, 'reload schema';
