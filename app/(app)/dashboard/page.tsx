import { SummaryCard } from "@/components/dashboard/summary-card";
import { PendingDepositsPanel, type PendingDepositRow } from "@/components/dashboard/pending-deposits-panel";
import { InviteTeamPanel } from "@/components/dashboard/invite-team-panel";
import { TechnicianJobsPanel } from "@/components/dashboard/technician-jobs-panel";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { canManage, getActiveWorkspace, requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

export default async function DashboardPage() {
  const membership = await requireWorkspace();
  const workspaceMeta = await getActiveWorkspace(membership);
  const currency = normalizeWorkspaceCurrency(workspaceMeta?.currency);
  const inviteCode = workspaceMeta?.invite_code ?? "";
  const supabase = await createClient();
  const workspaceId = membership.workspace_id;
  const isTechnician = !canManage(membership.role);

  if (isTechnician) {
    const { data: assignedJobs } = await supabase
      .from("jobs")
      .select("id, customer_name, service_type, location, status")
      .eq("workspace_id", workspaceId)
      .eq("technician_id", membership.user_id)
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    return <TechnicianJobsPanel jobs={assignedJobs ?? []} />;
  }

  const [
    paidDepositRows,
    pendingDepositsCount,
    inProgressCount,
    unpaidInvoiceRows,
    pendingDepositInvoices,
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("total_amount")
      .eq("workspace_id", workspaceId)
      .eq("type", "deposit")
      .eq("status", "paid"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("type", "deposit")
      .eq("status", "pending"),
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "in_progress"),
    supabase
      .from("invoices")
      .select("amount_due")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending"),
    supabase
      .from("invoices")
      .select("job_id, amount_due, total_amount")
      .eq("workspace_id", workspaceId)
      .eq("type", "deposit")
      .eq("status", "pending"),
  ]);

  const revenueSecured =
    paidDepositRows.data?.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0) ?? 0;

  const unpaidInvoicesTotal =
    unpaidInvoiceRows.data?.reduce((sum, row) => sum + Number(row.amount_due ?? 0), 0) ?? 0;

  const depositJobIds = [...new Set(pendingDepositInvoices.data?.map((inv) => inv.job_id) ?? [])];

  let jobsWaitingForDeposit: JobRow[] = [];
  if (depositJobIds.length > 0) {
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("requires_deposit", true)
      .in("id", depositJobIds)
      .order("created_at", { ascending: false });
    jobsWaitingForDeposit = jobs ?? [];
  }

  const depositInvoiceByJobId = new Map(
    (pendingDepositInvoices.data ?? []).map((inv) => [inv.job_id, inv] as const),
  );

  const pendingDepositRows: PendingDepositRow[] = jobsWaitingForDeposit.map((job) => {
    const inv = depositInvoiceByJobId.get(job.id);
    const depositAmount = inv ? Number(inv.amount_due ?? inv.total_amount ?? 0) : 0;
    return {
      jobId: job.id,
      customerName: job.customer_name,
      serviceType: job.service_type,
      status: job.status,
      depositAmount,
    };
  });

  return (
    <section className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Cash flow and jobs at a glance.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Revenue secured"
          value={revenueSecured}
          format="currency"
          currency={currency}
          hint="Paid deposit invoices"
        />
        <SummaryCard
          label="Pending deposits"
          value={pendingDepositsCount.count ?? 0}
          format="number"
          hint="Deposit invoices not paid yet"
        />
        <SummaryCard label="Jobs in progress" value={inProgressCount.count ?? 0} format="number" />
        <SummaryCard
          label="Unpaid invoices"
          value={unpaidInvoicesTotal}
          format="currency"
          currency={currency}
          hint="Total still owed (all open invoices)"
        />
      </div>

      <InviteTeamPanel inviteCode={inviteCode} />

      <PendingDepositsPanel rows={pendingDepositRows} currency={currency} />
    </section>
  );
}
