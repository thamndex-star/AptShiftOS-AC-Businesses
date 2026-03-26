import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { JobCompleteButton } from "@/components/jobs/job-complete-button";
import { JobStatusUpdate } from "@/components/jobs/job-status-update";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { canManage, getActiveWorkspace, requireWorkspace } from "@/lib/auth";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage() {
  const membership = await requireWorkspace();
  const workspaceMeta = await getActiveWorkspace(membership);
  const currency = normalizeWorkspaceCurrency(workspaceMeta?.currency);
  const supabase = await createClient();
  const ws = membership.workspace_id;

  let jobsQuery = supabase.from("jobs").select("*").eq("workspace_id", ws).order("created_at", { ascending: false });
  if (membership.role === "technician") jobsQuery = jobsQuery.eq("technician_id", membership.user_id);
  const [{ data: jobs }, { data: technicians }] = await Promise.all([
    jobsQuery,
    supabase.from("workspace_members").select("user_id, role").eq("workspace_id", ws),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Jobs</h1>
      {canManage(membership.role) && (
        <Card>
          <form action="/api/jobs" method="post" className="grid gap-3 md:grid-cols-3">
            <Input name="customer_name" placeholder="Customer name" required />
            <Input name="phone" placeholder="Phone" required />
            <Input name="location" placeholder="Location" required />
            <Input name="service_type" placeholder="Service type" required />
            <Input name="total_amount" placeholder="Total amount" type="number" required />
            <Input name="deposit_amount" placeholder="Deposit amount" type="number" defaultValue="0" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requires_deposit" value="true" /> Requires deposit
            </label>
            <select name="technician_id" className="rounded border border-slate-300 px-2 py-1">
              <option value="">Unassigned</option>
              {technicians?.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.user_id.slice(0, 8)} ({t.role})
                </option>
              ))}
            </select>
            <Button className="w-fit">Create job</Button>
          </form>
        </Card>
      )}
      <KanbanBoard jobs={jobs ?? []} currency={currency} />
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Update job status</h2>
        <div className="space-y-2">
          {jobs?.map((job) => (
            <div key={job.id} className="flex flex-wrap items-center gap-2 rounded border border-slate-200 p-3">
              <p className="mr-2 min-w-44 text-sm font-medium">{job.customer_name}</p>
              <JobStatusUpdate job={job} />
              {canManage(membership.role) && job.status !== "completed" && <JobCompleteButton jobId={job.id} />}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
