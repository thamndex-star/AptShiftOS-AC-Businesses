import { NextResponse } from "next/server";
import { canManage, getActiveMembership } from "@/lib/auth";
import { buildPayFastPaymentUrl } from "@/lib/payfast";

const MONTHLY_AMOUNT = 49;

export async function GET(request: Request) {
  const member = await getActiveMembership();
  if (!member || !canManage(member.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const returnUrl = new URL("/dashboard", request.url).toString();
  const notifyUrl = new URL("/api/payfast/subscription-webhook", request.url).toString();

  const paymentUrl = buildPayFastPaymentUrl({
    amount: MONTHLY_AMOUNT,
    itemName: "AptShift OS Subscription",
    workspaceId: member.workspace_id,
    returnUrl,
    notifyUrl,
  });

  return NextResponse.redirect(paymentUrl);
}
