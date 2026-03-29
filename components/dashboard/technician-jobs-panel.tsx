"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/types/database";

type Job = Pick<
  Database["public"]["Tables"]["jobs"]["Row"],
  "id" | "customer_name" | "service_type" | "location" | "status"
>;

const statusLabel: Record<Job["status"], string> = {
  pending_deposit: "Pending Deposit",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
};

const statusBadgeClass: Record<Job["status"], string> = {
  pending_deposit: "bg-amber-100 text-amber-800 border-amber-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function TechnicianJobsPanel({ jobs }: { jobs: Job[] }) {
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function updateStatus(jobId: string, status: Job["status"]) {
    setLoadingJobId(jobId);
    try {
      const res = await fetch("/api/jobs/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ job_id: jobId, status }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        if (body.error?.toLowerCase().includes("deposit must be paid")) {
          toast.warning("Deposit must be paid before starting this job");
        } else {
          toast.error(body.error ?? "Could not update job status.");
        }
        return;
      }

      toast.success(status === "in_progress" ? "Job started." : "Job marked as done.");
      router.refresh();
    } finally {
      setLoadingJobId(null);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Today&apos;s Jobs</h1>
      </header>

      {jobs.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">You have no jobs assigned today</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const canStart = job.status === "scheduled";
            const canComplete = job.status === "in_progress";
            const busy = loadingJobId === job.id;

            return (
              <Card key={job.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{job.customer_name}</p>
                    <p className="text-sm text-slate-600">{job.service_type}</p>
                    {job.location ? <p className="text-sm text-slate-500">{job.location}</p> : null}
                  </div>
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                      statusBadgeClass[job.status],
                    ].join(" ")}
                  >
                    {statusLabel[job.status]}
                  </span>
                </div>

                {canStart ? (
                  <Button onClick={() => updateStatus(job.id, "in_progress")} disabled={busy} className="w-full sm:w-auto">
                    {busy ? "Starting..." : "Start Job"}
                  </Button>
                ) : null}
                {canComplete ? (
                  <Button onClick={() => updateStatus(job.id, "completed")} disabled={busy} className="w-full sm:w-auto">
                    {busy ? "Saving..." : "Mark as Done"}
                  </Button>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
