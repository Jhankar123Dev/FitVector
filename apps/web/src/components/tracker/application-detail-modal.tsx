"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  Building2,
  ExternalLink,
  Calendar,
  Trash2,
  Save,
  Zap,
  FileText,
  ChevronDown,
  ChevronUp,
  Rocket,
  CheckCircle2,
  Sparkles,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUSES } from "@fitvector/shared";
import type { TrackerApplication } from "@/hooks/use-tracker";
import { isFitVectorApp, FV_STATUS_CONFIG, BOOST_OPTIONS, BOOST_CREDIT_PACKS } from "@/types/marketplace";
import type { FVApplicationStatus, BoostTier } from "@/types/marketplace";
import { FitVectorStatusTimeline } from "./fitvector-status-timeline";
import { useFitVectorDetail } from "@/hooks/use-fitvector-apply";

interface ApplicationDetailModalProps {
  application: TrackerApplication;
  onClose: () => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

export function ApplicationDetailModal({
  application,
  onClose,
  onUpdate,
  onDelete,
}: ApplicationDetailModalProps) {
  const [notes, setNotes] = useState(application.notes || "");
  const [contactName, setContactName] = useState(application.contactName || "");
  const [contactEmail, setContactEmail] = useState(application.contactEmail || "");
  const [contactRole, setContactRole] = useState(application.contactRole || "");
  const [followupDate, setFollowupDate] = useState(application.nextFollowupDate || "");
  const [isDirty, setIsDirty] = useState(false);
  const [showFVDetails, setShowFVDetails] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);
  const [selectedBoostTier, setSelectedBoostTier] = useState<BoostTier>("standard");

  const isFV = isFitVectorApp(application.status);
  const fvConfig = isFV
    ? FV_STATUS_CONFIG[application.status as FVApplicationStatus]
    : null;

  // Fetch live FitVector application detail (replaces mock data)
  const { data: fvDetailRes, isLoading: fvLoading } = useFitVectorDetail(
    isFV ? (application.fitvectorAppId ?? null) : null
  );
  const fvApp = fvDetailRes?.data ?? null;

  const handleSave = () => {
    onUpdate(application.id, {
      notes: notes || undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactRole: contactRole || undefined,
      nextFollowupDate: followupDate || undefined,
    });
    setIsDirty(false);
  };

  const statusConfig = APPLICATION_STATUSES[application.status as keyof typeof APPLICATION_STATUSES];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-base">{application.jobTitle}</CardTitle>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {application.companyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFV && fvConfig ? (
              <>
                <Badge className="gap-1 bg-accent-50 text-accent-700 hover:bg-accent-100">
                  <Zap className="h-3 w-3" />
                  FitVector
                </Badge>
                <Badge style={{ backgroundColor: fvConfig.color, color: "white" }}>
                  {fvConfig.label}
                </Badge>
              </>
            ) : (
              statusConfig && (
                <Badge style={{ backgroundColor: statusConfig.color, color: "white" }}>
                  {statusConfig.label}
                </Badge>
              )
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Links */}
          {application.jobUrl && (
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <a href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
                View job posting
              </a>
            </Button>
          )}

          {/* Status history / FitVector timeline */}
          {isFV && fvLoading ? (
            <div className="text-xs text-muted-foreground/70 py-2">Loading application details…</div>
          ) : isFV && fvApp ? (
            <div>
              <Label className="text-xs">Application Timeline</Label>
              <div className="mt-2">
                <FitVectorStatusTimeline
                  timeline={fvApp.statusTimeline}
                  currentStatus={application.status}
                />
              </div>

              {/* FV Application Details */}
              <button
                onClick={() => setShowFVDetails(!showFVDetails)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {showFVDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Application Details
              </button>
              {showFVDetails && (
                <div className="mt-2 space-y-2 rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-muted-foreground">Resume:</span>
                    <span className="font-medium text-foreground/80">{fvApp.resumeName}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Match Score:</span>{" "}
                    <span className="font-medium text-foreground/80">{fvApp.matchScore}%</span>
                  </div>
                  {fvApp.screeningAnswers.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Screening Questions:</span>{" "}
                      <span className="font-medium text-foreground/80">
                        {fvApp.screeningAnswers.length} answered
                      </span>
                    </div>
                  )}
                  {fvApp.coverNote && (
                    <div className="text-xs">
                      <p className="text-muted-foreground">Cover Note:</p>
                      <p className="mt-1 text-muted-foreground">{fvApp.coverNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <Label className="text-xs">Status History</Label>
              <div className="mt-1 space-y-1">
                {(application.statusHistory || []).map((entry, i) => {
                  const cfg = APPLICATION_STATUSES[entry.status as keyof typeof APPLICATION_STATUSES];
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cfg?.color || "#6B7280" }}
                      />
                      <span className="font-medium">{cfg?.label || entry.status}</span>
                      <span className="text-muted-foreground">
                        {new Date(entry.changed_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Boost Application (FitVector apps only) */}
          {isFV && (
            <div className="border-t border-border pt-3">
              {isBoosted ? (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Application Boosted</p>
                    <p className="text-xs text-amber-600">
                      {BOOST_OPTIONS.find((o) => o.tier === selectedBoostTier)?.label} — your application is highlighted in the employer&apos;s pipeline
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="h-4 w-4 text-brand-500" />
                    <h4 className="text-xs font-semibold text-foreground">Boost Your Application</h4>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Highlight your application in the employer&apos;s pipeline with a &quot;Boosted&quot; badge
                  </p>
                  <div className="space-y-1.5">
                    {BOOST_OPTIONS.map((option) => (
                      <button
                        key={option.tier}
                        onClick={() => setSelectedBoostTier(option.tier)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-colors",
                          selectedBoostTier === option.tier
                            ? "border-brand-300 bg-brand-50/50"
                            : "border-border hover:border-border/60",
                        )}
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground">{option.label}</p>
                          <p className="text-[10px] text-muted-foreground">{option.description}</p>
                        </div>
                        <span className="text-sm font-bold text-brand-600">₹{option.price}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground/70">
                    <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
                    Or buy a credit pack: {BOOST_CREDIT_PACKS[0].count} boosts for ₹{BOOST_CREDIT_PACKS[0].price} ({BOOST_CREDIT_PACKS[0].savings})
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    Boosted applications are highlighted but do not affect your match score.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsBoosted(true)}
                    className="mt-3 w-full gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    Boost for ₹{BOOST_OPTIONS.find((o) => o.tier === selectedBoostTier)?.price}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
              placeholder="Add notes about this application..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Interview link — FitVector apps only */}
          {isFV && application.interviewLink && (
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
              <p className="mb-2 text-xs font-medium text-violet-800">Interview Invited</p>
              <a
                href={application.interviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                <Video className="h-3.5 w-3.5" />
                Start Interview
              </a>
            </div>
          )}

          {/* Contact info — personal apps only */}
          {!isFV && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Contact Name</Label>
                  <Input
                    value={contactName}
                    onChange={(e) => { setContactName(e.target.value); setIsDirty(true); }}
                    placeholder="Recruiter name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Contact Email</Label>
                  <Input
                    value={contactEmail}
                    onChange={(e) => { setContactEmail(e.target.value); setIsDirty(true); }}
                    placeholder="recruiter@company.com"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Contact Role</Label>
                <Input
                  value={contactRole}
                  onChange={(e) => { setContactRole(e.target.value); setIsDirty(true); }}
                  placeholder="e.g. HR Manager"
                  className="mt-1"
                />
              </div>

              {/* Follow-up date — personal apps only */}
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Next Follow-up
                </Label>
                <Input
                  type="date"
                  value={followupDate}
                  onChange={(e) => { setFollowupDate(e.target.value); setIsDirty(true); }}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 border-t pt-3">
            <Button onClick={handleSave} disabled={!isDirty} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(application.id)}
              className="ml-auto gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
