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
  await supabase.from("leads").insert({
    workspace_id: member.workspace_id,
    name: String(form.get("name") ?? ""),
    phone: String(form.get("phone") ?? ""),
    location: String(form.get("location") ?? ""),
    service_type: String(form.get("service_type") ?? ""),
    status: "NEW",
  });
  return NextResponse.redirect(new URL("/leads", request.url));
}
