"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function JobCompleteButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Unexpected response from server." };
      }

      if (!res.ok) {
        const msg = data.error ?? "Could not complete this job.";
        if (res.status >= 500 || res.status === 401 || res.status === 403 || res.status === 404) toast.error(msg);
        else toast.warning(msg);
        return;
      }

      toast.success("Job completed and invoice created.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" onClick={onClick} disabled={loading}>
      {loading ? "Working…" : "Complete + Invoice"}
    </Button>
  );
}
