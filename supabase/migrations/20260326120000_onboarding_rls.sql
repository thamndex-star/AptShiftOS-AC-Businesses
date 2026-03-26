-- Apply once if your project used the older workspace / workspace_members RLS.
-- Supabase SQL Editor: paste and run.

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "workspaces_member_access" on workspaces;
drop policy if exists "workspaces_select_member" on workspaces;
drop policy if exists "workspaces_select_owner" on workspaces;
drop policy if exists "workspaces_insert_owner" on workspaces;
drop policy if exists "workspaces_update_admin" on workspaces;
drop policy if exists "workspaces_delete_owner" on workspaces;
create policy "workspaces_select_member" on workspaces for select using (is_workspace_member(id));
create policy "workspaces_select_owner" on workspaces for select using (auth.uid() = owner_user_id);
create policy "workspaces_insert_owner" on workspaces for insert with check (auth.uid() = owner_user_id);
create policy "workspaces_update_admin" on workspaces for update using (is_workspace_admin(id)) with check (is_workspace_admin(id));
create policy "workspaces_delete_owner" on workspaces for delete using (auth.uid() = owner_user_id);

drop policy if exists "workspace_members_member_access" on workspace_members;
drop policy if exists "workspace_members_admin_write" on workspace_members;
drop policy if exists "workspace_members_select_own" on workspace_members;
drop policy if exists "workspace_members_select_member" on workspace_members;
drop policy if exists "workspace_members_insert_owner_self" on workspace_members;
drop policy if exists "workspace_members_insert_technician_self" on workspace_members;
drop policy if exists "workspace_members_delete_self" on workspace_members;
create policy "workspace_members_select_own" on workspace_members for select using (user_id = auth.uid());
create policy "workspace_members_select_member" on workspace_members for select using (is_workspace_member(workspace_id));
create policy "workspace_members_admin_write" on workspace_members for all using (is_workspace_admin(workspace_id)) with check (is_workspace_admin(workspace_id));
create policy "workspace_members_insert_owner_self" on workspace_members for insert with check (
  user_id = auth.uid() and role = 'owner'
  and exists (select 1 from workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid())
);
create policy "workspace_members_insert_technician_self" on workspace_members for insert with check (
  user_id = auth.uid() and role = 'technician'
  and exists (select 1 from workspaces w where w.id = workspace_id)
);
create policy "workspace_members_delete_self" on workspace_members for delete using (user_id = auth.uid());
