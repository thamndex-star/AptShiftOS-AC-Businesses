import { NextResponse } from "next/server";
import { canManage, getActiveMembership, getActiveWorkspace, hasActiveSubscription } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/login", request.url));

  const member = await getActiveMembership();
  if (!member || !canManage(member.role)) return NextResponse.redirect(new URL("/invoices", request.url));
  const workspace = await getActiveWorkspace(member);
  if (!hasActiveSubscription(workspace)) return NextResponse.redirect(new URL("/dashboard?billing=required", request.url));

  const form = await request.formData();
  const invoiceId = String(form.get("invoice_id") ?? "");
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("workspace_id", member.workspace_id)
    .maybeSingle();
  if (!invoice || invoice.status === "paid") return NextResponse.redirect(new URL("/invoices", request.url));

  await supabase.from("invoices").update({ status: "paid" }).eq("id", invoice.id);
  if (invoice.type === "deposit") {
    await supabase.from("jobs").update({ status: "scheduled" }).eq("id", invoice.job_id).eq("workspace_id", member.workspace_id);
  }

  return NextResponse.redirect(new URL("/invoices", request.url));
}
