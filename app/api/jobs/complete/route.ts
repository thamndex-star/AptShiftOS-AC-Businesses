import { NextResponse } from "next/server";
import { canManage, getActiveMembership, getActiveWorkspace, hasActiveSubscription } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function wantsJson(request: Request) {
  return request.headers.get("content-type")?.includes("application/json") ?? false;
}

async function parseJobId(request: Request) {
  if (wantsJson(request)) {
    const body = await request.json();
    return String(body.job_id ?? "");
  }
  const form = await request.formData();
  return String(form.get("job_id") ?? "");
}

export async function POST(request: Request) {
  const json = wantsJson(request);
  const err = (message: string, status: number) =>
    json ? NextResponse.json({ error: message }, { status }) : NextResponse.redirect(new URL("/jobs", request.url));

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return err("You must be signed in.", 401);

  const member = await getActiveMembership();
  if (!member || !canManage(member.role)) {
    return err("Only owners or admins can complete jobs and create invoices.", 403);
  }
  const workspace = await getActiveWorkspace(member);
  if (!hasActiveSubscription(workspace)) return err("Subscription required. Please upgrade to continue.", 402);

  const jobId = await parseJobId(request);
  if (!jobId) return err("Job is required.", 400);

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("workspace_id", member.workspace_id)
    .maybeSingle();
  if (!job) return err("Job not found.", 404);

  const { data: existingFinal } = await supabase
    .from("invoices")
    .select("id")
    .eq("workspace_id", member.workspace_id)
    .eq("job_id", job.id)
    .in("type", ["final", "full"]);
  if ((existingFinal?.length ?? 0) > 0) {
    return err("This job already has a final or full invoice.", 400);
  }

  const { data: deposit } = await supabase
    .from("invoices")
    .select("*")
    .eq("workspace_id", member.workspace_id)
    .eq("job_id", job.id)
    .eq("type", "deposit")
    .maybeSingle();

  if (job.requires_deposit) {
    if (!deposit) {
      return err("This job requires a deposit. Create a deposit invoice and mark it paid before completing.", 400);
    }
    if (deposit.status !== "paid") {
      return err("Deposit must be paid before completing this job.", 400);
    }
  }

  const previousStatus = job.status;
  const amountDue = deposit ? Number(job.total_amount) - Number(job.deposit_amount) : Number(job.total_amount);

  const { error: jobErr } = await supabase.from("jobs").update({ status: "completed" }).eq("id", job.id);
  if (jobErr) return err(jobErr.message || "Could not update the job.", 500);

  const { error: invErr } = await supabase.from("invoices").insert({
    workspace_id: member.workspace_id,
    job_id: job.id,
    total_amount: job.total_amount,
    amount_due: Math.max(0, amountDue),
    type: deposit ? "final" : "full",
    status: "pending",
  });

  if (invErr) {
    await supabase.from("jobs").update({ status: previousStatus }).eq("id", job.id);
    return err(invErr.message || "Could not create the invoice.", 500);
  }

  if (json) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL("/jobs", request.url));
}
