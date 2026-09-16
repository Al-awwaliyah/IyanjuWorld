-- IyanjuWorld 0022: harden admin/customer operations and remove messaging RLS recursion.
-- This migration is intentionally self-contained so it remains effective even
-- when 0021 was not previously applied.

-- ------------------------------------------------------------
-- Role helpers must never re-enter profiles RLS.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and admin_role = 'super_admin' and is_active = true
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role from public.profiles
  where id = auth.uid() and is_active = true
  limit 1;
$$;

-- ------------------------------------------------------------
-- Membership helpers bypass caller RLS and are used by policies.
-- ------------------------------------------------------------
create or replace function public.user_is_conversation_member(p_conversation_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = p_user_id
  );
$$;

create or replace function public.users_share_conversation(p_user_id uuid, p_other_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.conversation_members mine
    join public.conversation_members other on other.conversation_id = mine.conversation_id
    where mine.user_id = p_other_user_id and other.user_id = p_user_id
  );
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.user_is_conversation_member(p_conversation_id, auth.uid());
$$;

grant execute on function public.user_is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.users_share_conversation(uuid, uuid) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- ------------------------------------------------------------
-- Replace messaging policies. Drop every existing policy on these
-- tables so an older recursive policy cannot remain alongside the fix.
-- ------------------------------------------------------------
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname
           from pg_policies
           where schemaname = 'public'
             and tablename in ('conversations','conversation_members','messages')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "Messaging admins can view conversations"
on public.conversations for select to authenticated
using (public.is_admin() or public.user_is_conversation_member(id, auth.uid()));

create policy "Authenticated users can create conversations"
on public.conversations for insert to authenticated
with check (auth.uid() is not null);

create policy "Messaging participants can update conversations"
on public.conversations for update to authenticated
using (public.is_admin() or public.user_is_conversation_member(id, auth.uid()))
with check (public.is_admin() or public.user_is_conversation_member(id, auth.uid()));

create policy "Messaging admins and members can view members"
on public.conversation_members for select to authenticated
using (public.is_admin() or user_id = auth.uid() or public.user_is_conversation_member(conversation_id, auth.uid()));

create policy "Messaging admins or members can add members"
on public.conversation_members for insert to authenticated
with check (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()));

create policy "Messaging admins or members can remove members"
on public.conversation_members for delete to authenticated
using (public.is_admin() or user_id = auth.uid() or public.user_is_conversation_member(conversation_id, auth.uid()));

create policy "Messaging admins and members can view messages"
on public.messages for select to authenticated
using (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()));

create policy "Messaging members can send messages"
on public.messages for insert to authenticated
with check (sender_id = auth.uid() and (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid())));

create policy "Messaging members can update messages"
on public.messages for update to authenticated
using (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()))
with check (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()));

-- ------------------------------------------------------------
-- Profiles: consolidate SELECT policy without any direct RLS query
-- against conversation_members.
-- ------------------------------------------------------------
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname='public' and tablename='profiles' and cmd='SELECT'
  loop
    execute format('drop policy if exists %I on public.profiles', p.policyname);
  end loop;
end $$;

create policy "Users can view permitted profiles"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or public.users_share_conversation(id, auth.uid())
);

-- ------------------------------------------------------------
-- Admin customer activation/deactivation.
-- ------------------------------------------------------------
create or replace function public.admin_set_customer_active(p_user_id uuid, p_active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare result public.profiles;
begin
  if not public.is_admin() then
    raise exception using errcode='42501', message='ADMIN_REQUIRED';
  end if;

  update public.profiles
  set is_active = p_active,
      active = p_active,
      updated_at = timezone('utc', now())
  where id = p_user_id and role = 'customer'
  returning * into result;

  if result.id is null then
    raise exception using errcode='P0001', message='CUSTOMER_NOT_FOUND';
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'customer_active_status_changed', 'profile', p_user_id,
          jsonb_build_object('active', p_active));

  return result;
end;
$$;

grant execute on function public.admin_set_customer_active(uuid, boolean) to authenticated;
