"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Plus, X } from "lucide-react";
import type { OnboardingData, TeamMemberRole } from "@/types/employer";
import { TEAM_ROLE_LABELS } from "@/types/employer";

interface Props {
  data: OnboardingData;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: TeamMemberRole;
  setInviteRole: (r: TeamMemberRole) => void;
  addInvite: () => void;
  removeInvite: (email: string) => void;
}

export function Step3TeamSetup({
  data,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  addInvite,
  removeInvite,
}: Props) {
  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-50 p-2">
            <UserPlus className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Team Setup</h2>
            <p className="text-sm text-muted-foreground">
              Invite team members to collaborate on hiring
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Invite Team Members</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="colleague@company.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInvite();
                  }
                }}
                className="pl-9"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamMemberRole)}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Button onClick={addInvite} disabled={!inviteEmail.trim()}>
              <Plus className="mr-1.5 h-4 w-4" />
              Invite
            </Button>
          </div>
        </div>

        {data.invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground/80">
              Pending Invites ({data.invites.length})
            </p>
            <div className="divide-y divide-border rounded-lg border border-border">
              {data.invites.map((invite) => (
                <div key={invite.email} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {invite.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{invite.email}</p>
                      <p className="text-xs text-muted-foreground/70">{TEAM_ROLE_LABELS[invite.role]}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeInvite(invite.email)}
                    className="rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.invites.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
            <UserPlus className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No invites yet. You can always add team members later.
            </p>
          </div>
        )}

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Role Permissions
          </p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Admin</span> — Full access, billing,
              team management
            </p>
            <p>
              <span className="font-medium text-foreground">Recruiter</span> — Post jobs, screen
              candidates, schedule interviews
            </p>
            <p>
              <span className="font-medium text-foreground">Hiring Manager</span> — View
              candidates, provide feedback, approve hires
            </p>
            <p>
              <span className="font-medium text-foreground">Viewer</span> — Read-only access to
              pipeline and reports
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
