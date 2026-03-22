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
} from "lucide-react";
import { APPLICATION_STATUSES } from "@fitvector/shared";
import type { TrackerApplication } from "@/hooks/use-tracker";

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
            {statusConfig && (
              <Badge style={{ backgroundColor: statusConfig.color, color: "white" }}>
                {statusConfig.label}
              </Badge>
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

          {/* Status history */}
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

          {/* Contact info */}
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

          {/* Follow-up date */}
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
