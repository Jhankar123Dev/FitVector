"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShieldCheck,
  Fingerprint,
  GraduationCap,
  Briefcase,
  Award,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useVerification, useSubmitVerification } from "@/hooks/use-verification";
import {
  VERIFICATION_STATUS_CONFIG,
  type VerificationItem,
  type VerificationCategory,
  type VerificationStatus,
} from "@/types/marketplace";

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  VerificationCategory,
  { icon: typeof Fingerprint; color: string; bg: string }
> = {
  identity: { icon: Fingerprint, color: "text-blue-600", bg: "bg-blue-50" },
  education: { icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
  employment: { icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
  skills: { icon: Award, color: "text-green-600", bg: "bg-green-50" },
};

const STATUS_ICONS: Record<VerificationStatus, typeof CheckCircle2> = {
  not_started: AlertCircle,
  pending: Clock,
  verified: CheckCircle2,
  expired: AlertCircle,
};

// ── Upload button label per category ─────────────────────────────────────────

const UPLOAD_LABEL: Record<VerificationCategory, string> = {
  identity: "Upload Aadhaar/PAN",
  education: "Upload Degree",
  employment: "Upload Offer Letter",
  skills: "Take Assessment",
};

export default function VerificationPage() {
  const { user } = useUser();
  const { data: verificationRes, isLoading } = useVerification();
  const { mutate: submitVerification } = useSubmitVerification();

  const [items, setItems] = useState<VerificationItem[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadId = useRef<string | null>(null);

  // Sync local state from server once loaded (and after each re-fetch)
  useEffect(() => {
    if (verificationRes?.data) {
      setItems(verificationRes.data);
    }
  }, [verificationRes?.data]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const verifiedCount = items.filter((i) => i.status === "verified").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const progressPercent = verifiedCount * 25 + pendingCount * 12.5;
  const allVerified = verifiedCount === 4;

  // ── Upload handlers ───────────────────────────────────────────────────────

  const handleStartUpload = (itemId: string) => {
    activeUploadId.current = itemId;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = activeUploadId.current;
    e.target.value = "";

    if (!file || !itemId) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setUploadingId(itemId);

    submitVerification(
      { category: item.category, file },
      {
        onSettled: () => {
          setUploadingId(null);
          activeUploadId.current = null;
        },
      },
    );
  };

  // ── Initials ──────────────────────────────────────────────────────────────

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div>
        <Link
          href="/dashboard/settings"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">
          FitVector Verified Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn a verified badge to gain priority visibility with employers and access exclusive job postings
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/80">Verification Progress</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {verifiedCount} of 4 verifications complete
              </p>
            </div>
            <span className="text-lg font-semibold text-brand-600">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} max={100} className="mt-3" />
        </CardContent>
      </Card>

      {/* Badge Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Badge Preview</CardTitle>
          <CardDescription>This is how employers will see your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {user?.name || "Your Name"}
                </h3>
                {allVerified ? (
                  <Badge className="gap-1 bg-brand-500 text-white hover:bg-brand-600">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground/70">
                    <ShieldCheck className="h-3 w-3" />
                    Not Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Frontend Developer · 5 years exp.</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/70">
            {allVerified
              ? "✓ Your verified badge is active! Employers will see this on your profile."
              : "Complete all 4 verifications to earn your FitVector Verified badge."}
          </p>
        </CardContent>
      </Card>

      {/* Verification Checklist */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Verification Checklist</h2>

        {isLoading
          ? // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-64 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : items.map((item) => {
              const catConfig = CATEGORY_CONFIG[item.category];
              const statusConfig = VERIFICATION_STATUS_CONFIG[item.status];
              const StatusIcon = STATUS_ICONS[item.status];
              const CatIcon = catConfig.icon;
              const isUploading = uploadingId === item.id;

              return (
                <Card key={item.id}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      {/* Category icon */}
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          catConfig.bg,
                        )}
                      >
                        <CatIcon className={cn("h-5 w-5", catConfig.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {item.label}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <Badge
                            className={cn("shrink-0 gap-1", statusConfig.bg, statusConfig.color)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {/* Document name */}
                        {item.documentName && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {item.documentName}
                          </div>
                        )}

                        {/* Verified date */}
                        {item.status === "verified" && item.verifiedAt && (
                          <p className="mt-1.5 text-xs text-green-600">
                            Verified on{" "}
                            {new Date(item.verifiedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {item.expiresAt && (
                              <span className="text-muted-foreground/70">
                                {" · "}Expires{" "}
                                {new Date(item.expiresAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </p>
                        )}

                        {/* Action */}
                        <div className="mt-3">
                          {item.status === "not_started" && item.category !== "skills" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartUpload(item.id)}
                              disabled={isUploading}
                              className="gap-1.5"
                            >
                              <Upload className={cn("h-3.5 w-3.5", isUploading && "animate-pulse")} />
                              {isUploading ? "Uploading..." : UPLOAD_LABEL[item.category]}
                            </Button>
                          )}

                          {item.status === "not_started" && item.category === "skills" && (
                            <Button size="sm" variant="outline" className="gap-1.5" asChild>
                              <Link href="/assessments/take/at-001">
                                <Award className="h-3.5 w-3.5" />
                                Take Assessment
                              </Link>
                            </Button>
                          )}

                          {item.status === "pending" && (
                            <p className="text-xs text-amber-600">
                              Your document is being reviewed. This usually takes 1–2 business days.
                            </p>
                          )}

                          {item.status === "verified" && (
                            <p className="text-xs text-green-600">✓ Verification complete</p>
                          )}

                          {item.status === "expired" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStartUpload(item.id)}
                              disabled={isUploading}
                              className="gap-1.5"
                            >
                              <Upload className={cn("h-3.5 w-3.5", isUploading && "animate-pulse")} />
                              {isUploading ? "Uploading..." : "Re-verify"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Upload overlay */}
      {uploadingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="flex flex-col items-center p-8">
              <Upload className="mb-3 h-8 w-8 animate-pulse text-brand-500" />
              <p className="text-sm font-medium text-foreground">Uploading document...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please wait while we process your file
              </p>
              <Progress value={65} className="mt-4 w-full" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
