"use client";

import { ErrorFallback } from "@/components/ui/error-boundary";

export default function EmployerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <ErrorFallback error={error} reset={reset} className="w-full max-w-md" />
    </div>
  );
}
