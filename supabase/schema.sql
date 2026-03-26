create extension if not exists pgcrypto;

create type app_role as enum ('owner', 'admin', 'technician');
create type lead_status as enum ('NEW', 'WON', 'LOST');
create type job_status as enum ('pending_deposit', 'scheduled', 'in_progress', 'completed');
create type invoice_type as enum ('deposit', 'final', 'full');
create type invoice_status as enum ('pending', 'paid');
create type message_direction as enum ('incoming', 'outgoing');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  active_workspace_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'USD',
  invite_code text not null unique,
  owner_user_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table profiles add constraint profiles_active_workspace_fkey foreign key (active_workspace_id) references workspaces(id) on delete set null;

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  phone text not null,
  location text not null,
  service_type text not null,
  status lead_status not null default 'NEW',
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid null references leads(id) on delete set null,
  customer_name text not null,
  phone text not null,
  location text not null,
  service_type text not null,
  status job_status not null default 'scheduled',
  scheduled_date timestamptz null,
  technician_id uuid null references profiles(id) on delete set null,
  requires_deposit boolean not null default false,
  total_amount numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  pricing_notes text null,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  total_amount numeric(12,2) not null default 0,
  amount_due numeric(12,2) not null default 0,
  type invoice_type not null,
  status invoice_status not null default 'pending',
  created_at timestamptz not null default now()
);

create unique index if not exists invoices_one_deposit_per_job on invoices(job_id) where type = 'deposit';
create unique index if not exists invoices_one_final_per_job on invoices(job_id) where type = 'final';
create unique index if not exists invoices_one_full_per_job on invoices(job_id) where type = 'full';

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  content text not null,
  direction message_direction not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_members_user on workspace_members(user_id, workspace_id);
create index if not exists idx_jobs_workspace_status on jobs(workspace_id, status);
create index if not exists idx_invoices_workspace_status on invoices(workspace_id, status);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_user();

create or replace function is_workspace_member(ws_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from workspace_members wm
    where wm.workspace_id = ws_id and wm.user_id = auth.uid()
  );
$$;

create or replace function is_workspace_admin(ws_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from workspace_members wm
    where wm.workspace_id = ws_id and wm.user_id = auth.uid() and wm.role in ('owner', 'admin')
  );
$$;

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table leads enable row level security;
alter table jobs enable row level security;
alter table invoices enable row level security;
alter table messages enable row level security;

create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Workspaces: members see their workspaces; owners see rows they created (needed for INSERT ... RETURNING before membership exists).
drop policy if exists "workspaces_member_access" on workspaces;
create policy "workspaces_select_member" on workspaces for select using (is_workspace_member(id));
create policy "workspaces_select_owner" on workspaces for select using (auth.uid() = owner_user_id);
create policy "workspaces_insert_owner" on workspaces for insert with check (auth.uid() = owner_user_id);
create policy "workspaces_update_admin" on workspaces for update using (is_workspace_admin(id)) with check (is_workspace_admin(id));
create policy "workspaces_delete_owner" on workspaces for delete using (auth.uid() = owner_user_id);

-- Workspace members: admins manage roster; onboarding allows self-insert as owner or joiner-technician; self-delete for API rollbacks.
drop policy if exists "workspace_members_member_access" on workspace_members;
drop policy if exists "workspace_members_admin_write" on workspace_members;
-- Own rows first: avoids RLS/bootstrap issues where is_workspace_member() depends on reading workspace_members.
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

create policy "leads_member_read" on leads for select using (is_workspace_member(workspace_id));
create policy "leads_admin_write" on leads for all using (is_workspace_admin(workspace_id)) with check (is_workspace_admin(workspace_id));

create policy "jobs_member_read" on jobs for select using (is_workspace_member(workspace_id));
create policy "jobs_admin_write" on jobs for all using (is_workspace_admin(workspace_id)) with check (is_workspace_admin(workspace_id));
create policy "jobs_technician_update_assigned" on jobs for update
  using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = jobs.workspace_id and wm.user_id = auth.uid() and wm.role = 'technician'
    ) and technician_id = auth.uid()
  )
  with check (technician_id = auth.uid());

create policy "invoices_member_read" on invoices for select using (is_workspace_member(workspace_id));
create policy "invoices_admin_write" on invoices for all using (is_workspace_admin(workspace_id)) with check (is_workspace_admin(workspace_id));

create policy "messages_member_read" on messages for select using (is_workspace_member(workspace_id));
create policy "messages_admin_write" on messages for all using (is_workspace_admin(workspace_id)) with check (is_workspace_admin(workspace_id));
