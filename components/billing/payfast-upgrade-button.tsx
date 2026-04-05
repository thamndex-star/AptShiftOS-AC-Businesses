"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

const PENDING_PAYMENT_STORAGE_KEY = "aptos:pending_payment";

type PendingPayment = {
  workspaceId: string;
  userEmail: string;
  paymentId: string;
  token: string;
  initiatedAt: number;
};

type InitiateResponse = {
  success: boolean;
  paymentUrl?: string;
  formData?: Record<string, string>;
  pendingPayment?: PendingPayment;
  error?: string;
};

function submitToPayFast(paymentUrl: string, formData: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;

  for (const [key, value] of Object.entries(formData)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export function PayFastUpgradeButton({ className, label }: { className: string; label: string }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function startCheckout() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/payfast?action=initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initiate" }),
      });

      const payload = (await response.json()) as InitiateResponse;
      if (!response.ok || !payload.success || !payload.paymentUrl || !payload.formData || !payload.pendingPayment) {
        throw new Error(payload.error || "Unable to initiate PayFast checkout.");
      }

      localStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(payload.pendingPayment));
      submitToPayFast(payload.paymentUrl, payload.formData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start payment flow.";
      toast.error(message);
      setSubmitting(false);
    }
  }

  return (
    <button type="button" onClick={startCheckout} disabled={submitting} className={className}>
      {submitting ? "Redirecting to PayFast..." : label}
    </button>
  );
}

export { PENDING_PAYMENT_STORAGE_KEY };
