"use client";

import { JOB_SOURCES } from "@fitvector/shared";

interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const config = (JOB_SOURCES as Record<string, { name: string; color: string }>)[
    source
  ] || {
    name: source,
    color: "#6B7280",
  };

  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
      style={{ backgroundColor: config.color }}
    >
      {config.name}
    </span>
  );
}
