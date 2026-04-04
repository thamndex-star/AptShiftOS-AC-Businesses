alter table if exists workspaces
  add column if not exists subscription_status text not null default 'trial',
  add column if not exists subscription_plan text not null default 'basic',
  add column if not exists subscription_expires_at timestamptz;

update workspaces
set
  subscription_status = coalesce(subscription_status, 'trial'),
  subscription_plan = coalesce(subscription_plan, 'basic'),
  subscription_expires_at = coalesce(subscription_expires_at, now() + interval '7 days');

alter table if exists workspaces
  alter column subscription_expires_at set not null,
  alter column subscription_expires_at set default (now() + interval '7 days');
