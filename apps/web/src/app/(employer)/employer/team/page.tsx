"use client";

import { useState } from "react";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  useCompanyMembers,
  useInviteMember,
  useUpdateMember,
  type MemberWithUser,
} from "@/hooks/use-employer";
import { useUser } from "@/hooks/use-user";
import type { TeamMemberRole, TeamActivity } from "@/types/employer";
import { TEAM_ROLE_LABELS } from "@/types/employer";
import type { CompanyMemberRole } from "@fitvector/shared";

// ── Role colors ──────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
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

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full access to all features and settings",
  recruiter: "Manage candidates, schedule interviews, view analytics",
  hiring_manager: "Review candidates, provide feedback, make hiring decisions",
  viewer: "Read-only access to candidates and reports",
};

export default function TeamPage() {
  const { data: membersData, isLoading, error } = useCompanyMembers();
  const inviteMember = useInviteMember();
  const updateMember = useUpdateMember();
  const { user } = useUser();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const members = membersData?.data || [];
  const active = members.filter((m) => m.status === "active").length;
  const invited = members.filter((m) => m.status === "invited").length;
  const roles = new Set(members.map((m) => m.role)).size;

  async function changeRole(memberId: string, newRole: CompanyMemberRole) {
    try {
      await updateMember.mutateAsync({ memberId, role: newRole });
    } catch (err) {
      console.error("Failed to change role:", err);
    }
  }

  async function deactivateMember(memberId: string) {
    try {
      await updateMember.mutateAsync({ memberId, status: "deactivated" });
    } catch (err) {
      console.error("Failed to deactivate member:", err);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <div className="h-6 w-48 animate-pulse rounded bg-surface-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-12 animate-pulse rounded bg-surface-100" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="h-32 animate-pulse rounded bg-surface-100" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        Failed to load team data. Please try again.
      </div>
    );
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
                      isSelf={member.userId === user?.id}
                      onChangeRole={changeRole}
                      onDeactivate={deactivateMember}
                      isUpdating={updateMember.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Activity log tab — placeholder for now */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-surface-400">Activity log will be available with real-time events</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Invite modal ──────────────────────────────────────── */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={async (email, role) => {
            try {
              await inviteMember.mutateAsync({ email, role });
              setShowInviteModal(false);
            } catch (err) {
              // Error is shown in the modal
              console.error("Invite failed:", err);
            }
          }}
          isInviting={inviteMember.isPending}
          inviteError={inviteMember.error?.message || null}
        />
      )}
    </div>
  );
}

// ── Member table row ────────────────────────────────────────────────
function MemberRow({
  member,
  isSelf,
  onChangeRole,
  onDeactivate,
  isUpdating,
}: {
  member: MemberWithUser;
  isSelf: boolean;
  onChangeRole: (memberId: string, role: CompanyMemberRole) => void;
  onDeactivate: (memberId: string) => void;
  isUpdating: boolean;
}) {
  const displayName = member.userName || member.userEmail;
  const initials = member.userName
    ? member.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : member.userEmail[0].toUpperCase();

  return (
    <tr className="border-b border-surface-100 transition-colors hover:bg-surface-50">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {member.userAvatarUrl ? (
            <img src={member.userAvatarUrl} alt={displayName} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] sm:text-xs font-semibold text-surface-600">
              {initials}
            </div>
          )}
          <span className="text-xs sm:text-sm font-medium text-surface-800">
            {member.userName || "Pending invite"}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">{member.userEmail}</span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {isSelf ? (
          <Badge className={cn("border text-[10px] sm:text-[11px]", ROLE_COLORS[member.role] || "")}>
            {TEAM_ROLE_LABELS[member.role as TeamMemberRole] || member.role}
          </Badge>
        ) : (
          <select
            className="h-7 rounded-md border border-surface-200 bg-white px-2 text-[11px] sm:text-xs text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
            value={member.role}
            onChange={(e) => onChangeRole(member.id, e.target.value as CompanyMemberRole)}
            disabled={isUpdating}
          >
            {(Object.keys(ROLE_DESCRIPTIONS) as CompanyMemberRole[]).map((r) => (
              <option key={r} value={r}>{TEAM_ROLE_LABELS[r as TeamMemberRole] || r}</option>
            ))}
          </select>
        )}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <Badge className={cn("border text-[10px] sm:text-[11px] capitalize", STATUS_COLORS[member.status] || "")}>
          {member.status}
        </Badge>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">
          {formatRelativeTime(member.invitedAt)}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {!isSelf && member.status !== "deactivated" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
            onClick={() => onDeactivate(member.id)}
            disabled={isUpdating}
          >
            <Trash2 className="h-3 w-3" />
            Deactivate
          </Button>
        )}
      </td>
    </tr>
  );
}

// ── Invite member modal ─────────────────────────────────────────────
function InviteMemberModal({
  onClose,
  onInvite,
  isInviting,
  inviteError,
}: {
  onClose: () => void;
  onInvite: (email: string, role: CompanyMemberRole) => void;
  isInviting: boolean;
  inviteError: string | null;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyMemberRole>("viewer");

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

          {inviteError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {inviteError}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Role</Label>
            <div className="space-y-2">
              {(Object.keys(ROLE_DESCRIPTIONS) as CompanyMemberRole[]).map((r) => (
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
                      {TEAM_ROLE_LABELS[r as TeamMemberRole] || r}
                    </p>
                    <p className="text-[11px] text-surface-400">{ROLE_DESCRIPTIONS[r]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-1.5"
            disabled={!email.includes("@") || isInviting}
            onClick={() => onInvite(email, role)}
          >
            {isInviting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isInviting ? "Sending..." : "Send Invite"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
