import Link from "next/link";
import { Card } from "@/components/ui/card";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/helpers";
import type { Database } from "@/types/database";

type JobStatus = Database["public"]["Enums"]["job_status"];

export type PendingDepositRow = {
  jobId: string;
  customerName: string;
  serviceType: string;
  status: JobStatus;
  depositAmount: number;
};

const GENERIC_SERVICE = /\b(service request|general service|misc)\b/i;

function displayServiceType(raw: string) {
  const t = raw?.trim() ?? "";
  if (!t || GENERIC_SERVICE.test(t)) return "Service";
  return t;
}

function jobLineSubtitle(status: JobStatus): string {
  switch (status) {
    case "pending_deposit":
      return "Awaiting Deposit";
    case "scheduled":
      return "Scheduled";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return String(status).replaceAll("_", " ");
  }
}

function statusBadge(status: JobStatus): { label: string; className: string } {
  switch (status) {
    case "pending_deposit":
      return {
        label: "Awaiting Deposit",
        className: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
      };
    case "scheduled":
      return {
        label: "Scheduled",
        className: "bg-slate-50 text-slate-800 ring-1 ring-slate-200/90",
      };
    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-sky-50 text-sky-900 ring-1 ring-sky-200/80",
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80",
      };
    default:
      return { label: status, className: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
  }
}

export function PendingDepositsPanel({ rows, currency = "USD" }: { rows: PendingDepositRow[]; currency?: string }) {
  const code = normalizeWorkspaceCurrency(currency);
  const totalAtRisk = rows.reduce((sum, r) => sum + r.depositAmount, 0);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            <span className="mr-1.5" aria-hidden="true">
              ⚠️
            </span>
            Action Required: Deposits Pending
          </h2>
          <p className="text-sm leading-snug text-slate-500">
            These jobs require a deposit and still have an unpaid deposit invoice. Collect payment to reduce risk and
            move work forward.
          </p>
        </div>
        <Link
          href="/jobs"
          className="shrink-0 text-sm font-medium text-slate-900 underline-offset-4 hover:underline sm:pt-0.5"
        >
          Manage jobs
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">No deposit invoices waiting on payment.</p>
      ) : (
        <>
          <p className="border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-sm text-slate-700">
            <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(totalAtRisk, code)}</span>
            <span className="text-slate-600"> at risk until deposit is collected</span>
          </p>
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => {
              const service = displayServiceType(row.serviceType);
              const subtitle = jobLineSubtitle(row.status);
              const badge = statusBadge(row.status);
              return (
                <li key={row.jobId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-medium text-slate-900">{row.customerName}</p>
                    <p className="text-sm text-slate-600">
                      {service}
                      <span className="text-slate-300"> · </span>
                      {subtitle}
                    </p>
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Deposit due</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                      {formatCurrency(row.depositAmount, code)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
