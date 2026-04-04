import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const body = await request.formData();

  const paymentStatus = String(body.get("payment_status") ?? "");
  const workspaceId = String(body.get("m_payment_id") ?? body.get("custom_str1") ?? "");

  if (paymentStatus !== "COMPLETE" || !looksLikeUuid(workspaceId)) {
    return new NextResponse("IGNORED", { status: 200 });
  }

  const nextRenewal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const admin = createAdminClient();

  const { error } = await admin
    .from("workspaces")
    .update({
      subscription_status: "active",
      subscription_plan: "basic",
      subscription_expires_at: nextRenewal,
    })
    .eq("id", workspaceId);

  if (error) {
    return new NextResponse("ERROR", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
