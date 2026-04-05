import { NextResponse } from "next/server";
import { canManage, getActiveMembership } from "@/lib/auth";

export async function GET(request: Request) {
  const member = await getActiveMembership();
  if (!member || !canManage(member.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Legacy endpoint kept for backwards compatibility with existing links.
  return NextResponse.redirect(new URL("/billing", request.url));
}
