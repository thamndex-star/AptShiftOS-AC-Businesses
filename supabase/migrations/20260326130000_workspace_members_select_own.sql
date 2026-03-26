-- Fixes dashboard ↔ onboarding redirect loops: app layout must read the user's workspace_members row.
-- Run in Supabase SQL Editor if you still see infinite loading after login.

drop policy if exists "workspace_members_select_own" on workspace_members;
create policy "workspace_members_select_own" on workspace_members for select using (user_id = auth.uid());
