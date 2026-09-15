-- IyanjuWorld 0020: secure administrative workflows and messaging RLS

-- ------------------------------------------------------------
-- Secure super-admin assignment workflow
-- ------------------------------------------------------------
create or replace function public.admin_assign_admin(
  p_user_id uuid,
  p_admin_role public.admin_role
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  target_role public.user_role;
begin
  if not public.is_super_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_SUPER_ADMIN_REQUIRED';
  end if;

  if p_user_id = auth.uid() then
    raise exception using errcode = 'P0001', message = 'ADMIN_SELF_ASSIGNMENT_NOT_ALLOWED';
  end if;

  select role into target_role from public.profiles where id = p_user_id;
  if target_role is null then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  if target_role <> 'customer' then
    raise exception using errcode = 'P0001', message = 'ONLY_CUSTOMER_CAN_BE_ASSIGNED_AS_ADMIN';
  end if;

  update public.profiles
  set role = 'admin', admin_role = p_admin_role, is_active = true, updated_at = timezone('utc', now())
  where id = p_user_id
  returning * into result;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin_assigned', 'profile', p_user_id,
          jsonb_build_object('admin_role', p_admin_role::text));

  return result;
end;
$$;

create or replace function public.admin_revoke_admin(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  target_role public.user_role;
  target_admin_role public.admin_role;
  super_count integer;
begin
  if not public.is_super_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_SUPER_ADMIN_REQUIRED';
  end if;

  if p_user_id = auth.uid() then
    raise exception using errcode = 'P0001', message = 'ADMIN_SELF_REVOCATION_NOT_ALLOWED';
  end if;

  select role, admin_role into target_role, target_admin_role from public.profiles where id = p_user_id;
  if target_role is null then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  if target_role <> 'admin' then
    return (select p from public.profiles p where p.id = p_user_id);
  end if;

  if target_admin_role = 'super_admin' then
    select count(*) into super_count from public.profiles where role = 'admin' and admin_role = 'super_admin' and is_active = true;
    if super_count <= 1 then
      raise exception using errcode = 'P0001', message = 'LAST_SUPER_ADMIN_CANNOT_BE_REMOVED';
    end if;
  end if;

  update public.profiles
  set role = 'customer', admin_role = null, updated_at = timezone('utc', now())
  where id = p_user_id
  returning * into result;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin_revoked', 'profile', p_user_id,
          jsonb_build_object('previous_admin_role', target_admin_role::text));

  return result;
end;
$$;

create or replace function public.admin_set_business_verification(p_business_id uuid, p_verified boolean)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare result public.businesses;
begin
  if not public.is_admin() then raise exception using errcode='42501', message='ADMIN_REQUIRED'; end if;
  update public.businesses
  set is_verified = p_verified,
      status = case when p_verified and status = 'pending' then 'active'::public.business_status when not p_verified and status = 'active' then 'pending'::public.business_status else status end,
      is_open = case when not p_verified then false else is_open end,
      updated_at = timezone('utc', now())
  where id = p_business_id
  returning * into result;
  if result.id is null then raise exception using errcode='P0001', message='BUSINESS_NOT_FOUND'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), case when p_verified then 'business_verified' else 'business_unverified' end, 'business', p_business_id, jsonb_build_object('verified', p_verified));
  return result;
end;
$$;

create or replace function public.admin_set_business_status(p_business_id uuid, p_status public.business_status)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare result public.businesses;
begin
  if not public.is_admin() then raise exception using errcode='42501', message='ADMIN_REQUIRED'; end if;
  update public.businesses set status=p_status, is_open=case when p_status='active' then is_open else false end, updated_at=timezone('utc',now()) where id=p_business_id returning * into result;
  if result.id is null then raise exception using errcode='P0001', message='BUSINESS_NOT_FOUND'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata) values(auth.uid(),'business_status_changed','business',p_business_id,jsonb_build_object('status',p_status::text));
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
  if not public.is_admin() then raise exception using errcode='42501', message='ADMIN_REQUIRED'; end if;
  update public.riders
  set verification_status=p_status,
      verified=(p_status='verified'),
      verified_at=case when p_status='verified' then coalesce(verified_at, timezone('utc',now())) else null end,
      verified_by=case when p_status='verified' then auth.uid() else null end,
      available=case when p_status='verified' then available else false end,
      is_online=case when p_status='verified' then is_online else false end,
      updated_at=timezone('utc',now())
  where id=p_rider_id
  returning * into result;
  if result.id is null then raise exception using errcode='P0001', message='RIDER_NOT_FOUND'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata) values(auth.uid(),'rider_verification_changed','rider',p_rider_id,jsonb_build_object('status',p_status::text));
  return result;
end;
$$;

create or replace function public.admin_set_rider_active(p_rider_id uuid, p_active boolean)
returns public.riders
language plpgsql
security definer
set search_path = public
as $$
declare result public.riders;
begin
  if not public.is_admin() then raise exception using errcode='42501', message='ADMIN_REQUIRED'; end if;
  update public.riders set is_active=p_active, active=p_active, is_online=case when p_active then is_online else false end, available=case when p_active then available else false end, updated_at=timezone('utc',now()) where id=p_rider_id returning * into result;
  if result.id is null then raise exception using errcode='P0001', message='RIDER_NOT_FOUND'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata) values(auth.uid(),'rider_active_status_changed','rider',p_rider_id,jsonb_build_object('active',p_active));
  return result;
end;
$$;

grant execute on function public.admin_assign_admin(uuid, public.admin_role) to authenticated;
grant execute on function public.admin_revoke_admin(uuid) to authenticated;
grant execute on function public.admin_set_business_verification(uuid, boolean) to authenticated;
grant execute on function public.admin_set_business_status(uuid, public.business_status) to authenticated;
grant execute on function public.admin_set_rider_verification(uuid, public.rider_verification_status) to authenticated;
grant execute on function public.admin_set_rider_active(uuid, boolean) to authenticated;

-- ------------------------------------------------------------
-- Messaging security and profile visibility for participants
-- ------------------------------------------------------------
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(select 1 from public.conversation_members cm where cm.conversation_id=p_conversation_id and cm.user_id=auth.uid());
$$;

grant execute on function public.is_conversation_member(uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Conversation participants can view conversations" on public.conversations;
create policy "Conversation participants can view conversations" on public.conversations for select to authenticated using (public.is_admin() or public.is_conversation_member(id));

drop policy if exists "Conversation participants can create conversations" on public.conversations;
create policy "Conversation participants can create conversations" on public.conversations for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "Conversation participants can update conversations" on public.conversations;
create policy "Conversation participants can update conversations" on public.conversations for update to authenticated using (public.is_admin() or public.is_conversation_member(id)) with check (public.is_admin() or public.is_conversation_member(id));

drop policy if exists "Conversation participants can view members" on public.conversation_members;
create policy "Conversation participants can view members" on public.conversation_members for select to authenticated using (public.is_admin() or user_id=auth.uid() or public.is_conversation_member(conversation_id));

drop policy if exists "Users can add conversation members" on public.conversation_members;
create policy "Users can add conversation members" on public.conversation_members for insert to authenticated with check (public.is_admin() or user_id=auth.uid() or public.is_conversation_member(conversation_id));

drop policy if exists "Conversation participants can remove members" on public.conversation_members;
create policy "Conversation participants can remove members" on public.conversation_members for delete to authenticated using (public.is_admin() or user_id=auth.uid() or public.is_conversation_member(conversation_id));

drop policy if exists "Conversation participants can view messages" on public.messages;
create policy "Conversation participants can view messages" on public.messages for select to authenticated using (public.is_admin() or public.is_conversation_member(conversation_id));

drop policy if exists "Conversation participants can send messages" on public.messages;
create policy "Conversation participants can send messages" on public.messages for insert to authenticated with check (sender_id=auth.uid() and (public.is_admin() or public.is_conversation_member(conversation_id)));

drop policy if exists "Conversation participants can mark messages read" on public.messages;
create policy "Conversation participants can mark messages read" on public.messages for update to authenticated using (public.is_admin() or public.is_conversation_member(conversation_id)) with check (public.is_admin() or public.is_conversation_member(conversation_id));

-- Participants may see each other in the context of a shared conversation.
drop policy if exists "Users can view conversation participants" on public.profiles;
create policy "Users can view conversation participants" on public.profiles for select to authenticated using (
  public.is_admin() or id=auth.uid() or exists (
    select 1 from public.conversation_members mine
    join public.conversation_members other on other.conversation_id=mine.conversation_id
    where mine.user_id=auth.uid() and other.user_id=profiles.id
  )
);

-- Audit records are private to administrators.
alter table public.audit_logs enable row level security;
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs for select to authenticated using (public.is_admin());

grant select on public.conversations, public.conversation_members, public.messages, public.audit_logs to authenticated;
grant insert on public.conversations, public.conversation_members, public.messages to authenticated;
grant update on public.conversations, public.messages to authenticated;

-- Realtime delivery for chat. The DO block avoids duplicate-publication errors.
do $$
begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; when undefined_object then null; end;
end $$;

-- Compatibility fields used by the three dashboard message UIs.
alter table public.profiles add column if not exists email text;
alter table public.conversations add column if not exists type text;
alter table public.conversations add column if not exists title text;
alter table public.conversations add column if not exists subject text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

create index if not exists profiles_email_idx on public.profiles(email);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  final_role public.user_role;
begin
  requested_role := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', 'customer')));
  if requested_role = 'business' then requested_role := 'business_owner'; end if;
  if requested_role in ('customer','business_owner','rider','admin') then final_role := requested_role::public.user_role; else final_role := 'customer'::public.user_role; end if;
  insert into public.profiles (id, full_name, phone, email, role)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), new.email, final_role)
  on conflict (id) do update set full_name=coalesce(public.profiles.full_name,excluded.full_name), phone=coalesce(public.profiles.phone,excluded.phone), email=coalesce(public.profiles.email,excluded.email);
  return new;
end;
$$;

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.conversations set updated_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages for each row execute function public.touch_conversation_on_message();

-- ------------------------------------------------------------
-- Marketplace disputes (no seeded/demo records)
-- ------------------------------------------------------------
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  rider_id uuid references public.riders(id) on delete set null,
  reason text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  description text not null,
  customer_response text,
  business_response text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disputes_status_check check (status in ('open','under_review','awaiting_response','resolved','rejected','cancelled')),
  constraint disputes_priority_check check (priority in ('low','normal','high','urgent'))
);
create index if not exists disputes_status_idx on public.disputes(status);
create index if not exists disputes_created_at_idx on public.disputes(created_at desc);
alter table public.disputes enable row level security;
drop policy if exists "Admins can view disputes" on public.disputes;
create policy "Admins can view disputes" on public.disputes for select to authenticated using (public.is_admin());
drop policy if exists "Admins can update disputes" on public.disputes;
create policy "Admins can update disputes" on public.disputes for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, update on public.disputes to authenticated;

create or replace function public.admin_approve_refund(p_refund_id uuid)
returns public.refunds
language plpgsql
security definer
set search_path=public
as $$
declare result public.refunds;
begin
  if not public.is_admin() then raise exception using errcode='42501', message='ADMIN_REQUIRED'; end if;
  update public.refunds set status='approved', approved_by=auth.uid(), approved_at=coalesce(approved_at,timezone('utc',now())), updated_at=timezone('utc',now()) where id=p_refund_id and status='requested' returning * into result;
  if result.id is null then raise exception using errcode='P0001', message='REFUND_NOT_APPROVABLE'; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'refund_approved','refund',p_refund_id,'{}'::jsonb);
  return result;
end;
$$;

create or replace function public.admin_cancel_refund(p_refund_id uuid)
returns public.refunds
language plpgsql
security definer
set search_path=public
as $$
declare result public.refunds;
begin
  if not public.is_admin() then raise exception using errcode='42501', message='ADMIN_REQUIRED'; end if;
  update public.refunds set status='cancelled', cancelled_at=coalesce(cancelled_at,timezone('utc',now())), updated_at=timezone('utc',now()) where id=p_refund_id and status in ('requested','approved') returning * into result;
  if result.id is null then raise exception using errcode='P0001', message='REFUND_NOT_CANCELLABLE'; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'refund_cancelled','refund',p_refund_id,'{}'::jsonb);
  return result;
end;
$$;

create or replace function public.admin_process_wallet_refund(p_refund_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then raise exception using errcode='42501', message='ADMIN_REQUIRED'; end if;
  return public.process_wallet_refund(p_refund_id);
end;
$$;

grant execute on function public.admin_approve_refund(uuid), public.admin_cancel_refund(uuid), public.admin_process_wallet_refund(uuid) to authenticated;
