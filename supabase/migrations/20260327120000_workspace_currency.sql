-- Add workspace currency (run in Supabase SQL Editor on existing projects).

alter table public.workspaces add column if not exists currency text not null default 'USD';
