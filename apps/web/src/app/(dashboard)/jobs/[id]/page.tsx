"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { JobDetailPanel } from "@/components/jobs/job-detail";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobSearchResult } from "@/types/job";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<{ data: JobSearchResult }>({
    queryKey: ["job-detail", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${params.id}`);
      if (!res.ok) throw new Error("Failed to load job details");
      return res.json();
    },
    enabled: !!params.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading job details..." />;
  }

  if (isError || !data?.data) {
    return (
      <EmptyState
        icon={FileX}
        title="Job not found"
        description="This job listing may have been removed or is no longer available."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/jobs")}
          >
            Back to search
          </Button>
        }
      />
    );
  }

  return (
    <div className="h-full">
      <JobDetailPanel
        job={data.data}
        userSkills={[]}
        onBack={() => router.push("/dashboard/jobs")}
      />
    </div>
  );
}
