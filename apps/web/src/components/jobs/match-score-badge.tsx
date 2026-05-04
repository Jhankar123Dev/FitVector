"use client";

import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number | null;
  bucket: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const BUCKET_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  strong_fit: { color: "text-green-700", bg: "bg-green-100", label: "Strong fit" },
  good_fit: { color: "text-blue-700", bg: "bg-blue-100", label: "Good fit" },
  potential_fit: { color: "text-yellow-700", bg: "bg-yellow-100", label: "Potential fit" },
  weak_fit: { color: "text-muted-foreground", bg: "bg-muted", label: "Explore" },
};

export function MatchScoreBadge({
  score,
  bucket,
  showLabel = false,
  size = "sm",
}: MatchScoreBadgeProps) {
  if (score === null || score === undefined) return null;

  const config = BUCKET_CONFIG[bucket || "weak_fit"] || BUCKET_CONFIG.weak_fit;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bg,
        config.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
    >
      <span className="font-bold">{score}</span>
      {showLabel && <span>— {config.label}</span>}
    </div>
  );
}
