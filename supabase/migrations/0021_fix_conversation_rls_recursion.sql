-- IyanjuWorld 0021: fix recursive messaging RLS policies
--
-- The previous conversation_members policies called is_conversation_member()
-- from policies on conversation_members itself. PostgreSQL can therefore
-- re-enter the same policy evaluation and raise 42P17.
--
-- These SECURITY DEFINER helpers perform membership checks outside the
-- caller's RLS policy context and are then used by all messaging policies.

create or replace function public.user_is_conversation_member(p_conversation_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = p_user_id
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
    join public.conversation_members other
      on other.conversation_id = mine.conversation_id
    where mine.user_id = p_other_user_id
      and other.user_id = p_user_id
  );
$$;

grant execute on function public.user_is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.users_share_conversation(uuid, uuid) to authenticated;

-- Keep the old helper available for application code, but make it safe.
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

grant execute on function public.is_conversation_member(uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Conversations
 drop policy if exists "Conversation participants can view conversations" on public.conversations;
create policy "Conversation participants can view conversations"
on public.conversations for select to authenticated
using (public.is_admin() or public.user_is_conversation_member(id, auth.uid()));

drop policy if exists "Conversation participants can create conversations" on public.conversations;
create policy "Conversation participants can create conversations"
on public.conversations for insert to authenticated
with check (auth.uid() is not null);

drop policy if exists "Conversation participants can update conversations" on public.conversations;
create policy "Conversation participants can update conversations"
on public.conversations for update to authenticated
using (public.is_admin() or public.user_is_conversation_member(id, auth.uid()))
with check (public.is_admin() or public.user_is_conversation_member(id, auth.uid()));

-- Conversation members. Never query conversation_members directly from a
-- policy on conversation_members; always use the security-definer helper.
drop policy if exists "Conversation participants can view members" on public.conversation_members;
create policy "Conversation participants can view members"
on public.conversation_members for select to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or public.user_is_conversation_member(conversation_id, auth.uid())
);

drop policy if exists "Users can add conversation members" on public.conversation_members;
create policy "Users can add conversation members"
on public.conversation_members for insert to authenticated
with check (
  public.is_admin()
  or user_id = auth.uid()
  or public.user_is_conversation_member(conversation_id, auth.uid())
);

drop policy if exists "Conversation participants can remove members" on public.conversation_members;
create policy "Conversation participants can remove members"
on public.conversation_members for delete to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or public.user_is_conversation_member(conversation_id, auth.uid())
);

-- Messages
drop policy if exists "Conversation participants can view messages" on public.messages;
create policy "Conversation participants can view messages"
on public.messages for select to authenticated
using (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "Conversation participants can send messages" on public.messages;
create policy "Conversation participants can send messages"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()))
);

drop policy if exists "Conversation participants can mark messages read" on public.messages;
create policy "Conversation participants can mark messages read"
on public.messages for update to authenticated
using (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()))
with check (public.is_admin() or public.user_is_conversation_member(conversation_id, auth.uid()));

-- Participant profile visibility. The previous policy queried
-- conversation_members directly while evaluating profiles, which could also
-- cause recursive policy evaluation. Use the security-definer helper.
drop policy if exists "Users can view conversation participants" on public.profiles;
create policy "Users can view conversation participants"
on public.profiles for select to authenticated
using (
  public.is_admin()
  or id = auth.uid()
  or public.users_share_conversation(id, auth.uid())
);
