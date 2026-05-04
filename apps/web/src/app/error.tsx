"use client";

import { ErrorFallback } from "@/components/ui/error-boundary";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <ErrorFallback error={error} reset={reset} className="w-full max-w-md" />
    </div>
  );
}
