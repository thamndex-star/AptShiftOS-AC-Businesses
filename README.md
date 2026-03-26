# Service Business SaaS MVP

Multi-tenant SaaS starter for service businesses (AC, HVAC, etc.) built with:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)

## 1) Prerequisites

- Node.js 20+
- pnpm
- Supabase project

## 2) Environment Setup

Copy env values:

```bash
cp .env.example .env.local
```

Fill these values in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## 3) Supabase Setup

1. Open Supabase SQL editor.
2. Run the SQL from `supabase/schema.sql`.
3. Confirm tables are created:
   - `profiles`, `workspaces`, `workspace_members`
   - `leads`, `jobs`, `invoices`, `messages`
4. Ensure RLS is enabled (included in schema file).

## 4) Install and Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## 5) MVP Flow

1. Sign up or login.
2. If no active workspace, user is redirected to `/onboarding`.
3. Create workspace or join with invite code.
4. Access app pages:
   - `/dashboard`
   - `/leads`
   - `/jobs`
   - `/invoices`

## Notes

- Deposit workflow is enforced in the application layer.
- Technician restrictions are enforced in both UI and API logic.
- Tenant isolation is enforced with Supabase RLS policies.
