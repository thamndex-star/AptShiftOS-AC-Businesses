-- Technicians should not be able to view financial invoice data.
-- Restrict invoice reads to workspace owners/admins only.

drop policy if exists "invoices_member_read" on invoices;
drop policy if exists "invoices_admin_read" on invoices;

create policy "invoices_admin_read"
on invoices
for select
using (is_workspace_admin(workspace_id));
