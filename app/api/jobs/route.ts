import { NextResponse } from "next/server";
import { canManage, getActiveMembership } from "@/lib/auth";
import { parseNumber } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/login", request.url));

  const member = await getActiveMembership();
  if (!member || !canManage(member.role)) return NextResponse.redirect(new URL("/jobs", request.url));

  const form = await request.formData();
  const requiresDeposit = form.get("requires_deposit") === "true";
  const totalAmount = parseNumber(form.get("total_amount"));
  const depositAmount = parseNumber(form.get("deposit_amount"));
  const status = requiresDeposit ? "pending_deposit" : "scheduled";

  const { data: job } = await supabase
    .from("jobs")
    .insert({
      workspace_id: member.workspace_id,
      customer_name: String(form.get("customer_name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      location: String(form.get("location") ?? ""),
      service_type: String(form.get("service_type") ?? ""),
      technician_id: (form.get("technician_id") as string) || null,
      requires_deposit: requiresDeposit,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      status,
    })
    .select("*")
    .single();

  if (job && requiresDeposit) {
    await supabase.from("invoices").insert({
      workspace_id: member.workspace_id,
      job_id: job.id,
      total_amount: totalAmount,
      amount_due: depositAmount,
      type: "deposit",
      status: "pending",
    });
  }

  return NextResponse.redirect(new URL("/jobs", request.url));
}
