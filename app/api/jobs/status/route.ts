import { NextResponse } from "next/server";
import { canManage, getActiveMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const transitions: Record<string, string[]> = {
  pending_deposit: ["scheduled"],
  scheduled: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

function wantsJson(request: Request) {
  return request.headers.get("content-type")?.includes("application/json") ?? false;
}

async function parseBody(request: Request) {
  if (wantsJson(request)) {
    const body = await request.json();
    return { jobId: String(body.job_id ?? ""), nextStatus: String(body.status ?? "") };
  }
  const form = await request.formData();
  return { jobId: String(form.get("job_id") ?? ""), nextStatus: String(form.get("status") ?? "") };
}

export async function POST(request: Request) {
  const json = wantsJson(request);
  const err = (message: string, status: number) =>
    json ? NextResponse.json({ error: message }, { status }) : NextResponse.redirect(new URL("/jobs", request.url));

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return err("You must be signed in.", 401);

  const member = await getActiveMembership();
  if (!member) return err("You are not part of a workspace.", 403);

  const { jobId, nextStatus } = await parseBody(request);
  if (!jobId || !nextStatus) return err("Job and status are required.", 400);

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("workspace_id", member.workspace_id)
    .maybeSingle();
  if (!job) return err("Job not found.", 404);

  const allowed = transitions[job.status]?.includes(nextStatus);
  if (!allowed) {
    return err("This status change is not allowed from the current state.", 400);
  }

  if (member.role === "technician" && job.technician_id !== auth.user.id) {
    return err("You can only update jobs assigned to you.", 403);
  }
  if (!canManage(member.role) && member.role !== "technician") {
    return err("You don't have permission to change job status.", 403);
  }

  if (nextStatus === "in_progress" && job.requires_deposit) {
    const { data: deposit } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("workspace_id", member.workspace_id)
      .eq("job_id", job.id)
      .eq("type", "deposit")
      .maybeSingle();
    if (!deposit || deposit.status !== "paid") {
      return err("Deposit must be paid before starting this job.", 400);
    }
  }

  const { error: updateError } = await supabase.from("jobs").update({ status: nextStatus as never }).eq("id", job.id);
  if (updateError) {
    return err(updateError.message || "Could not save job status.", 500);
  }

  if (json) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL("/jobs", request.url));
}
