"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UsersRound,
  UserPlus,
  UserCheck,
  Clock,
  ShieldCheck,
  X,
  Send,
  Trash2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { MOCK_TEAM_MEMBERS } from "@/lib/mock/employer-data";
import { MOCK_TEAM_ACTIVITY } from "@/lib/mock/scheduling-data";
import type { TeamMember, TeamMemberRole, TeamActivity } from "@/types/employer";
import { TEAM_ROLE_LABELS } from "@/types/employer";

// ── Role colors ──────────────────────────────────────────────────────
const ROLE_COLORS: Record<TeamMemberRole, string> = {
  admin: "bg-brand-50 text-brand-700 border-brand-200",
  recruiter: "bg-emerald-50 text-emerald-700 border-emerald-200",
  hiring_manager: "bg-amber-50 text-amber-700 border-amber-200",
  viewer: "bg-surface-100 text-surface-600 border-surface-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  invited: "bg-amber-50 text-amber-700 border-amber-200",
  deactivated: "bg-red-50 text-red-700 border-red-200",
};

const ROLE_DESCRIPTIONS: Record<TeamMemberRole, string> = {
  admin: "Full access to all features and settings",
  recruiter: "Manage candidates, schedule interviews, view analytics",
  hiring_manager: "Review candidates, provide feedback, make hiring decisions",
  viewer: "Read-only access to candidates and reports",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const active = members.filter((m) => m.status === "active").length;
  const invited = members.filter((m) => m.status === "invited").length;
  const roles = new Set(members.map((m) => m.role)).size;

  function changeRole(id: string, newRole: TeamMemberRole) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)),
    );
  }

  function removeMember(id: string) {
    if (id === "tm-001") return; // can't remove self (admin)
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">
            Team Management
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-surface-500">
            Manage your hiring team members and roles
          </p>
        </div>
        <Button className="gap-1.5 w-full sm:w-auto" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Total Members", value: members.length, icon: UsersRound, iconBg: "bg-brand-50", iconColor: "text-brand-500" },
          { label: "Active", value: active, icon: UserCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Invited", value: invited, icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          { label: "Roles", value: roles, icon: ShieldCheck, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
              <div className={cn("hidden sm:flex rounded-lg p-2.5", stat.iconBg)}>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-surface-800">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-surface-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Member</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Email</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Role</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Status</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Joined</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      onChangeRole={changeRole}
                      onRemove={removeMember}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Activity log tab */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="p-3 sm:p-5">
              <div className="space-y-4">
                {MOCK_TEAM_ACTIVITY.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Invite modal ──────────────────────────────────────── */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={(email, role) => {
            setMembers((prev) => [
              ...prev,
              {
                id: `tm-${Date.now()}`,
                email,
                name: null,
                role,
                status: "invited",
                avatarUrl: null,
                invitedAt: new Date().toISOString(),
              },
            ]);
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Member table row ────────────────────────────────────────────────
function MemberRow({
  member,
  onChangeRole,
  onRemove,
}: {
  member: TeamMember;
  onChangeRole: (id: string, role: TeamMemberRole) => void;
  onRemove: (id: string) => void;
}) {
  const initials = member.name
    ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : member.email[0].toUpperCase();

  const isSelf = member.id === "tm-001"; // Mock current user

  return (
    <tr className="border-b border-surface-100 transition-colors hover:bg-surface-50">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] sm:text-xs font-semibold text-surface-600">
            {initials}
          </div>
          <span className="text-xs sm:text-sm font-medium text-surface-800">
            {member.name || "Pending invite"}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">{member.email}</span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {isSelf ? (
          <Badge className={cn("border text-[10px] sm:text-[11px]", ROLE_COLORS[member.role])}>
            {TEAM_ROLE_LABELS[member.role]}
          </Badge>
        ) : (
          <select
            className="h-7 rounded-md border border-surface-200 bg-white px-2 text-[11px] sm:text-xs text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
            value={member.role}
            onChange={(e) => onChangeRole(member.id, e.target.value as TeamMemberRole)}
          >
            {(Object.keys(TEAM_ROLE_LABELS) as TeamMemberRole[]).map((r) => (
              <option key={r} value={r}>{TEAM_ROLE_LABELS[r]}</option>
            ))}
          </select>
        )}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <Badge className={cn("border text-[10px] sm:text-[11px] capitalize", STATUS_COLORS[member.status])}>
          {member.status}
        </Badge>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">
          {formatRelativeTime(member.invitedAt)}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {!isSelf && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
            onClick={() => onRemove(member.id)}
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </Button>
        )}
      </td>
    </tr>
  );
}

// ── Activity log row ────────────────────────────────────────────────
function ActivityRow({ activity }: { activity: TeamActivity }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-100">
        <Activity className="h-3.5 w-3.5 text-surface-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-surface-700">
          <span className="font-semibold text-surface-800">{activity.actorName}</span>
          {" "}
          <Badge className={cn("border text-[9px] mx-1", ROLE_COLORS[activity.actorRole])}>
            {TEAM_ROLE_LABELS[activity.actorRole]}
          </Badge>
          {" "}
          {activity.description}
        </p>
        <p className="mt-0.5 text-[11px] text-surface-400">
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ── Invite member modal ─────────────────────────────────────────────
function InviteMemberModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (email: string, role: TeamMemberRole) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMemberRole>("viewer");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-surface-800">Invite Team Member</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Email Address</Label>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Role</Label>
            <div className="space-y-2">
              {(Object.keys(ROLE_DESCRIPTIONS) as TeamMemberRole[]).map((r) => (
                <label
                  key={r}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    role === r
                      ? "border-brand-500 bg-brand-50/50"
                      : "border-surface-200 hover:border-surface-300",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="mt-0.5 accent-brand-500"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-surface-800">
                      {TEAM_ROLE_LABELS[r]}
                    </p>
                    <p className="text-[11px] text-surface-400">{ROLE_DESCRIPTIONS[r]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-1.5"
            disabled={!email.includes("@")}
            onClick={() => onInvite(email, role)}
          >
            <Send className="h-3.5 w-3.5" />
            Send Invite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
