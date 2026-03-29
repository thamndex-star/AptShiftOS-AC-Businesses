import { NextResponse } from "next/server";
import { canManage, getActiveMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/login", request.url));

  const member = await getActiveMembership();
  if (!member || !canManage(member.role)) return NextResponse.redirect(new URL("/leads", request.url));

  const form = await request.formData();
  const leadId = String(form.get("lead_id") ?? "");
  const status = String(form.get("status") ?? "NEW");
  await supabase
    .from("leads")
    .update({ status: status as "NEW" | "WON" | "LOST" })
    .eq("id", leadId)
    .eq("workspace_id", member.workspace_id);
  return NextResponse.redirect(new URL("/leads", request.url));
}
