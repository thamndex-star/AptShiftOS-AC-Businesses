import { redirect } from "next/navigation";
import { PayFastUpgradeButton } from "@/components/billing/payfast-upgrade-button";
import { Card } from "@/components/ui/card";
import { canManage, getActiveWorkspace, requireWorkspace } from "@/lib/auth";

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export default async function BillingPage() {
  const membership = await requireWorkspace();
  if (!canManage(membership.role)) redirect("/dashboard");

  const workspace = await getActiveWorkspace(membership);
  const subscriptionStatus = workspace?.subscription_status ?? "trial";
  const expiresAt = workspace?.subscription_expires_at ? new Date(workspace.subscription_expires_at) : null;
  const isActive = subscriptionStatus === "active" && (!expiresAt || expiresAt.getTime() > Date.now());
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)) : 0;
  const statusLabel = isActive
    ? "Active subscription"
    : daysLeft > 0
      ? `Trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
      : "Trial expired";

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your AptShift OS subscription.</p>
      </header>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Current plan</p>
            <p className="text-xl font-semibold text-slate-900 capitalize">{workspace?.subscription_plan ?? "basic"}</p>
          </div>
          <p className="text-lg font-semibold text-slate-900">$49/month</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{statusLabel}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Renews / expires</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(workspace?.subscription_expires_at)}</p>
          </div>
        </div>
        {!isActive ? (
          <div className="flex flex-wrap gap-3">
            <PayFastUpgradeButton
              label="Upgrade now ($49/month)"
              className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <p className="self-center text-xs text-slate-500">You will be redirected to PayFast checkout.</p>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Billing history</h2>
        <p className="mt-2 text-sm text-slate-500">
          Payment webhooks will keep your workspace subscription active. A full invoice history view can be added next.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Description</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-4 py-3 text-slate-500">-</td>
                <td className="px-4 py-3 text-slate-700">AptShift OS Subscription</td>
                <td className="px-4 py-3 text-slate-700">$49.00</td>
                <td className="px-4 py-3 text-slate-500">No records yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
