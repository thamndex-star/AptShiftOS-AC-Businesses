"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PENDING_PAYMENT_STORAGE_KEY } from "@/components/billing/payfast-upgrade-button";
import { useToast } from "@/components/ui/toast";

const MAX_VERIFY_ATTEMPTS = 4;
const VERIFY_INTERVAL_MS = 2000;

type PendingPayment = {
  workspaceId: string;
  userEmail: string;
  paymentId: string;
  token: string;
  initiatedAt: number;
};

type VerifyResponse = {
  success: boolean;
  unlocked?: boolean;
  error?: string;
};

type FallbackResponse = {
  success: boolean;
  unlocked?: boolean;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPayment>;
    if (
      !parsed ||
      typeof parsed.workspaceId !== "string" ||
      typeof parsed.userEmail !== "string" ||
      typeof parsed.paymentId !== "string" ||
      typeof parsed.token !== "string" ||
      typeof parsed.initiatedAt !== "number"
    ) {
      return null;
    }
    return {
      workspaceId: parsed.workspaceId,
      userEmail: parsed.userEmail,
      paymentId: parsed.paymentId,
      token: parsed.token,
      initiatedAt: parsed.initiatedAt,
    };
  } catch {
    return null;
  }
}

export function PayFastCompleteClient() {
  const router = useRouter();
  const toast = useToast();
  const toastRef = useRef(toast);
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  toastRef.current = toast;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const pending = readPendingPayment();
      if (!pending) {
        setState("failed");
        setMessage("No pending payment was found. Please retry from Billing.");
        return;
      }

      for (let attempt = 0; attempt < MAX_VERIFY_ATTEMPTS; attempt += 1) {
        const verifyResponse = await fetch(`/api/payfast?action=verify&workspaceId=${encodeURIComponent(pending.workspaceId)}`);
        const verifyPayload = (await verifyResponse.json()) as VerifyResponse;

        if (cancelled) return;
        if (verifyResponse.ok && verifyPayload.success && verifyPayload.unlocked) {
          localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
          setState("success");
          setMessage("Payment confirmed. Redirecting to dashboard...");
          toastRef.current.success("Payment confirmed. Subscription unlocked.");
          router.replace("/dashboard?payfast=success");
          router.refresh();
          return;
        }

        if (attempt < MAX_VERIFY_ATTEMPTS - 1) {
          await sleep(VERIFY_INTERVAL_MS);
        }
      }

      setMessage("PayFast is still processing. Applying secure fallback unlock...");
      const fallbackResponse = await fetch("/api/payfast?action=fallback-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fallback-unlock",
          workspaceId: pending.workspaceId,
          email: pending.userEmail,
          token: pending.token,
        }),
      });
      const fallbackPayload = (await fallbackResponse.json()) as FallbackResponse;

      if (cancelled) return;
      if (fallbackResponse.ok && fallbackPayload.success && fallbackPayload.unlocked) {
        localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
        setState("success");
        setMessage("Payment confirmed. Redirecting to dashboard...");
        toastRef.current.success("Payment confirmed. Subscription unlocked.");
        router.replace("/dashboard?payfast=success");
        router.refresh();
        return;
      }

      setState("failed");
      setMessage(fallbackPayload.error || "Payment not confirmed yet. Please refresh shortly.");
      toastRef.current.warning("Payment processing is delayed. Please retry in a minute.");
    }

    run().catch((error) => {
      if (cancelled) return;
      setState("failed");
      setMessage(error instanceof Error ? error.message : "Unexpected payment verification error.");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">
        {state === "loading" ? "Processing payment..." : state === "success" ? "Payment complete" : "Verification pending"}
      </p>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}
