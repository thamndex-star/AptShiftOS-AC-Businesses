import type { PropsWithChildren } from "react";
import { EmailConfirmedToast } from "@/components/auth/email-confirmed-toast";
import { ToastProvider } from "@/components/ui/toast";

export default function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <EmailConfirmedToast />
      {children}
    </ToastProvider>
  );
}
