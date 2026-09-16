-- IyanjuWorld 0023: separate audit outcome from domain status values.
-- Older admin RPCs stored values such as "verified" or "pending" in
-- metadata.status. The Audit UI must not interpret those domain states as
-- a failed operation. New events store the operation outcome explicitly.

create or replace function public.admin_set_business_verification(p_business_id uuid, p_verified boolean)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare result public.businesses;
begin
  if not public.is_admin() then
    raise exception using errcode='42501', message='ADMIN_REQUIRED';
  end if;

  update public.businesses
  set is_verified = p_verified,
      status = case
        when p_verified and status = 'pending' then 'active'::public.business_status
        when not p_verified and status = 'active' then 'pending'::public.business_status
        else status
      end,
      is_open = case when not p_verified then false else is_open end,
      updated_at = timezone('utc', now())
  where id = p_business_id
  returning * into result;

  if result.id is null then
    raise exception using errcode='P0001', message='BUSINESS_NOT_FOUND';
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    case when p_verified then 'business_verified' else 'business_unverified' end,
    'business',
    p_business_id,
    jsonb_build_object('outcome', 'success', 'verified', p_verified)
  );

  return result;
end;
$$;

create or replace function public.admin_set_rider_verification(p_rider_id uuid, p_status public.rider_verification_status)
returns public.riders
language plpgsql
security definer
set search_path = public
as $$
declare result public.riders;
begin
  if not public.is_admin() then
    raise exception using errcode='42501', message='ADMIN_REQUIRED';
  end if;

  update public.riders
  set verification_status = p_status,
      verified = (p_status = 'verified'),
      verified_at = case when p_status = 'verified' then coalesce(verified_at, timezone('utc', now())) else null end,
      verified_by = case when p_status = 'verified' then auth.uid() else null end,
      available = case when p_status = 'verified' then available else false end,
      is_online = case when p_status = 'verified' then is_online else false end,
      updated_at = timezone('utc', now())
  where id = p_rider_id
  returning * into result;

  if result.id is null then
    raise exception using errcode='P0001', message='RIDER_NOT_FOUND';
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'rider_verification_changed',
    'rider',
    p_rider_id,
    jsonb_build_object('outcome', 'success', 'verification_status', p_status::text)
  );

  return result;
end;
$$;

grant execute on function public.admin_set_business_verification(uuid, boolean) to authenticated;
grant execute on function public.admin_set_rider_verification(uuid, public.rider_verification_status) to authenticated;
