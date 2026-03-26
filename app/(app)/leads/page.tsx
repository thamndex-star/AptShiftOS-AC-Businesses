import { requireWorkspace, canManage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function LeadsPage() {
  const membership = await requireWorkspace();
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", membership.workspace_id)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Leads</h1>
      {canManage(membership.role) && (
        <Card>
          <form action="/api/leads" method="post" className="grid gap-3 md:grid-cols-4">
            <Input name="name" placeholder="Customer name" required />
            <Input name="phone" placeholder="Phone" required />
            <Input name="location" placeholder="Location" required />
            <Input name="service_type" placeholder="Service type" required />
            <Button className="md:col-span-4 w-fit">Create lead</Button>
          </form>
        </Card>
      )}
      <Card>
        <div className="space-y-2">
          {leads?.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm">
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-slate-500">
                  {lead.phone} - {lead.service_type}
                </p>
              </div>
              <form action="/api/leads/status" method="post" className="flex items-center gap-2">
                <input type="hidden" name="lead_id" value={lead.id} />
                <select name="status" defaultValue={lead.status} className="rounded border border-slate-300 px-2 py-1">
                  <option value="NEW">NEW</option>
                  <option value="WON">WON</option>
                  <option value="LOST">LOST</option>
                </select>
                <Button variant="secondary">Save</Button>
              </form>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
