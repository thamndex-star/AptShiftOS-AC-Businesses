import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/helpers";
import { canManage, getActiveWorkspace, requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {
  const membership = await requireWorkspace();
  if (!canManage(membership.role)) redirect("/jobs");
  const workspaceMeta = await getActiveWorkspace(membership);
  const currency = normalizeWorkspaceCurrency(workspaceMeta?.currency);
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("workspace_id", membership.workspace_id)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <Card>
        <div className="space-y-2">
          {invoices?.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm">
              <div>
                <p className="font-medium">{invoice.type.toUpperCase()} invoice</p>
                <p className="text-slate-500">
                  Due: {formatCurrency(Number(invoice.amount_due), currency)} - {invoice.status}
                </p>
              </div>
              {invoice.status === "pending" && (
                <form action="/api/invoices/pay" method="post">
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <Button>Mark paid</Button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
