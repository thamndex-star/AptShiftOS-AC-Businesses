"use client";

import { useEffect } from "react";
import { PENDING_PAYMENT_STORAGE_KEY } from "@/components/billing/payfast-upgrade-button";

export function PayFastCancelClient() {
  useEffect(() => {
    localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
  }, []);

  return null;
}
