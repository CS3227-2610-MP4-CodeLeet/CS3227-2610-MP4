-- Migration: add search and role filtering to admin_list_users RPC

create or replace function public.admin_list_users(
  p_after_user_id uuid default null,
  p_limit integer default 51,
  p_search text default null,
  p_role text default null
)
returns table (user_id uuid, email text, display_name text, role text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;
  if p_limit is null or p_limit not between 1 and 101 then
    raise exception using errcode = '22023', message = 'invalid_limit';
  end if;
  if p_role is not null and p_role not in ('student', 'instructor', 'admin') then
    raise exception using errcode = '22023', message = 'invalid_role';
  end if;

  return query
    select u.id, u.email::text, coalesce(p.display_name, 'Student'), r.role
    from auth.users u
    join public.user_roles r on r.user_id = u.id
    left join public.profiles p on p.id = u.id
    where (p_after_user_id is null or u.id > p_after_user_id)
      and (p_role is null or r.role = p_role)
      and (
        p_search is null
        or trim(p_search) = ''
        or u.email ilike ('%' || trim(p_search) || '%')
        or coalesce(p.display_name, '') ilike ('%' || trim(p_search) || '%')
      )
    order by u.id
    limit p_limit;
end;
$function$;

revoke all on function public.admin_list_users(uuid, integer, text, text) from public, anon;
grant execute on function public.admin_list_users(uuid, integer, text, text) to authenticated;

create or replace function public.admin_list_users(
  p_after_user_id uuid,
  p_limit integer
)
returns table (user_id uuid, email text, display_name text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.admin_list_users(p_after_user_id, p_limit, null, null);
$$;

revoke all on function public.admin_list_users(uuid, integer) from public, anon;
grant execute on function public.admin_list_users(uuid, integer) to authenticated;
