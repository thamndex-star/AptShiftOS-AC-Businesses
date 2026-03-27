"use client";

import { useToast } from "@/components/ui/toast";

type InviteTeamPanelProps = {
  inviteCode: string;
};

export function InviteTeamPanel({ inviteCode }: InviteTeamPanelProps) {
  const toast = useToast();

  async function onCopy() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied");
    } catch {
      toast.error("Could not copy invite code");
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Invite your team</h2>
      <p className="mt-1 text-sm text-slate-500">Share this code with technicians so they can join your business.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold tracking-[0.18em] text-slate-900">
          {inviteCode || "N/A"}
        </code>
        <button
          type="button"
          onClick={onCopy}
          disabled={!inviteCode}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy code
        </button>
      </div>
    </section>
  );
}
