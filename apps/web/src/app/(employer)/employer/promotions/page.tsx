"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  Eye,
  MousePointer,
  Briefcase,
  Rocket,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePromotions } from "@/hooks/use-employer";
import {
  PROMOTION_TYPE_LABELS,
  PROMOTION_STATUS_COLORS,
  type PromotionType,
  type PromotionStatus,
} from "@/types/employer";

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ── Skeleton row while loading ────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-surface-100">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-surface-100" />
        </td>
      ))}
    </tr>
  );
}

export default function PromotionsPage() {
  const { data, isLoading } = usePromotions();
  const promotions = data?.data ?? [];

  const totalSpend = promotions.reduce((s, p) => s + p.amountPaid, 0);
  const totalImpressions = promotions.reduce((s, p) => s + p.impressions, 0);
  const totalApplications = promotions.reduce((s, p) => s + p.applications, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-800">Promoted Listings</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            Boost your job visibility to attract more qualified candidates
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/employer/jobs">
            <Rocket className="h-3.5 w-3.5" />
            Boost a Job
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Spend", value: formatCurrency(totalSpend), icon: IndianRupee, bg: "bg-brand-50", color: "text-brand-600" },
          { label: "Total Impressions", value: totalImpressions.toLocaleString(), icon: Eye, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Applications from Promotions", value: String(totalApplications), icon: Briefcase, bg: "bg-green-50", color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                {isLoading ? (
                  <div className="h-6 w-16 animate-pulse rounded bg-surface-100" />
                ) : (
                  <p className="text-lg font-semibold text-surface-800">{s.value}</p>
                )}
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promotions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">Impressions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">Clicks</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">CTR</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">Apps</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">Spend</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : (
                  promotions.map((promo) => {
                    const typeConfig = PROMOTION_TYPE_LABELS[promo.promotionType as PromotionType];
                    const statusConfig = PROMOTION_STATUS_COLORS[promo.status as PromotionStatus];
                    const ctr =
                      promo.impressions > 0
                        ? ((promo.clicks / promo.impressions) * 100).toFixed(1)
                        : "0";

                    return (
                      <tr key={promo.id} className="border-b border-surface-100 last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-surface-800">{promo.jobTitle}</p>
                          <p className="text-xs text-surface-400">
                            {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="brand" className="text-[10px]">
                            {typeConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-surface-600">
                          {promo.duration} days
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[10px]", statusConfig.bg, statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-surface-700">
                          {promo.impressions.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-surface-700">
                          {promo.clicks}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-surface-700">
                          {ctr}%
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-surface-800">
                          {promo.applications}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-surface-800">
                          {formatCurrency(promo.amountPaid)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!isLoading && promotions.length === 0 && (
        <div className="py-12 text-center">
          <Rocket className="mx-auto mb-2 h-8 w-8 text-surface-300" />
          <p className="text-sm text-surface-500">No promoted listings yet</p>
          <p className="mt-1 text-xs text-surface-400">
            Boost your job posts to reach more qualified candidates
          </p>
        </div>
      )}
    </div>
  );
}
