"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

export function JobStatusUpdate({ job }: { job: Job }) {
  const [status, setStatus] = useState(job.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(job.status);
  }, [job.id, job.status]);
  const router = useRouter();
  const toast = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/jobs/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ job_id: job.id, status }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Unexpected response from server." };
      }

      if (!res.ok) {
        setStatus(job.status);
        const msg = data.error ?? "Could not update job status.";
        if (res.status >= 500 || res.status === 401 || res.status === 403 || res.status === 404) toast.error(msg);
        else toast.warning(msg);
        return;
      }

      toast.success("Job status updated.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <select
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value as Job["status"])}
        className="rounded border border-slate-300 px-2 py-1 text-sm"
      >
        <option value="pending_deposit">Pending Deposit</option>
        <option value="scheduled">Scheduled</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      <Button type="submit" variant="secondary" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
