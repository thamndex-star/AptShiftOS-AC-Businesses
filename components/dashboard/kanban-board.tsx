import { Card } from "@/components/ui/card";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/helpers";
import type { Database } from "@/types/database";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const columns: Array<Database["public"]["Enums"]["job_status"]> = ["pending_deposit", "scheduled", "in_progress", "completed"];

export function KanbanBoard({ jobs, currency = "USD" }: { jobs: Job[]; currency?: string }) {
  const code = normalizeWorkspaceCurrency(currency);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {columns.map((status) => (
        <Card key={status}>
          <h3 className="mb-3 text-sm font-semibold capitalize">{status.replaceAll("_", " ")}</h3>
          <div className="space-y-2">
            {jobs
              .filter((j) => j.status === status)
              .map((job) => (
                <div key={job.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-medium">{job.customer_name}</p>
                  <p className="text-slate-500">{job.service_type}</p>
                  <p className="mt-1 text-xs tabular-nums text-slate-600">{formatCurrency(Number(job.total_amount), code)}</p>
                </div>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
