"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WORKSPACE_CURRENCY_OPTIONS } from "@/lib/currency";

export default function OnboardingPage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(url: string, body: Record<string, string>) {
    setError(null);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.status === 401) return setError("Your session expired or you are not logged in. Please log in and try again.");
    if (!res.ok) return setError(data.error ?? "Action failed");
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl gap-6 px-6 py-16 md:grid-cols-2">
      <section className="md:col-span-2">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome 👋</h1>
        <p className="mt-2 text-sm text-slate-600">Let&apos;s set up your business in under 1 minute</p>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Set up your business</h2>
        <p className="mt-1 text-sm text-slate-500">Start managing your jobs, deposits, and cash flow in one place.</p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">What&apos;s your business name?</label>
          <Input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g. Cool Air Services"
            aria-label="Business name"
          />
          <label className="block text-sm font-medium text-slate-700">Which currency do you use?</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            aria-label="Workspace currency"
          >
            {WORKSPACE_CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button onClick={() => submit("/api/onboarding/create-workspace", { name: workspaceName, currency })}>
            Set up my business
          </Button>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Join a team</h2>
        <p className="mt-1 text-sm text-slate-500">Enter an invite code to join an existing business.</p>
        <div className="mt-4 space-y-3">
          <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Invite code" />
          <Button variant="secondary" onClick={() => submit("/api/onboarding/join-workspace", { inviteCode })}>
            Join
          </Button>
        </div>
      </section>
      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
    </main>
  );
}
