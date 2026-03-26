import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { getActiveWorkspace, requireWorkspace } from "@/lib/auth";

export default async function AppLayout({ children }: PropsWithChildren) {
  const membership = await requireWorkspace();
  const workspace = await getActiveWorkspace(membership);
  const businessName = workspace?.name?.trim() || "My Business";

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar businessName={businessName} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
