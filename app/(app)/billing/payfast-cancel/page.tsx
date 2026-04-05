import Link from "next/link";
import { PayFastCancelClient } from "@/components/billing/payfast-cancel-client";

export default function PayFastCancelPage() {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <PayFastCancelClient />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payment Cancelled</h1>
        <p className="mt-1 text-sm text-slate-500">No charge was applied. You can retry your upgrade whenever you are ready.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link href="/billing" className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Return to Billing
        </Link>
        <Link href="/dashboard" className="inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}
