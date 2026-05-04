export default function LoginLoading() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true">
      {/* Logo placeholder */}
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      {/* Heading */}
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </div>
      {/* Role toggle */}
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      {/* OAuth buttons */}
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-px flex-1 bg-border" />
      </div>
      {/* Email + Password fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      {/* Submit button */}
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      {/* Sign up link */}
      <div className="mx-auto h-4 w-48 animate-pulse rounded bg-muted" />
    </div>
  );
}
