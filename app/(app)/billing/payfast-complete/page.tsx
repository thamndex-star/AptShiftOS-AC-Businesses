import Link from "next/link";
import { PayFastCompleteClient } from "@/components/billing/payfast-complete-client";

export default function PayFastCompletePage() {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payment Complete</h1>
        <p className="mt-1 text-sm text-slate-500">We are confirming your PayFast payment and unlocking your workspace.</p>
      </header>

      <PayFastCompleteClient />

      <div>
        <Link href="/billing" className="text-sm font-medium text-slate-900 underline">
          Back to Billing
        </Link>
      </div>
    </section>
  );
}
