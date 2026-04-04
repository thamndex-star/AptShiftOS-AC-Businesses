import type { PropsWithChildren } from "react";
import { EmailConfirmedToast } from "@/components/auth/email-confirmed-toast";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { getActiveWorkspace, requireWorkspace } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: PropsWithChildren) {
  const membership = await requireWorkspace();
  const workspace = await getActiveWorkspace(membership);
  const businessName = workspace?.name?.trim() || "My Business";

  return (
    <ToastProvider>
      <EmailConfirmedToast />
      <div className="flex min-h-screen">
        <Sidebar businessName={businessName} role={membership.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
