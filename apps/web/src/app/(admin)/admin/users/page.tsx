"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  planTier: string;
  status: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

const ROLE_FILTERS = ["", "seeker", "employer", "superadmin"];
const PLAN_OPTIONS = ["free", "starter", "pro", "elite"];
const STATUS_OPTIONS = ["active", "suspended", "onboarding"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function roleBadgeClass(role: string) {
  if (role === "superadmin") return "bg-red-100 text-red-700";
  if (role === "employer") return "bg-purple-100 text-purple-700";
  return "bg-blue-100 text-blue-700";
}

function statusBadgeClass(status: string) {
  return status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground";
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ data: AdminUser[]; total: number; page: number; limit: number }>;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, planTier, status }: { userId: string; planTier?: string; status?: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planTier, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
      toast.success("User updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.limit || 50));

  const selectClass = "w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Users</h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={roleFilter === r ? "default" : "outline"}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className="text-xs capitalize"
            >
              {r || "All Roles"}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground/70">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.fullName || "—"}</p>
                    <p className="text-xs text-muted-foreground/70">{user.email}</p>
                  </td>
                  <td className="px-4 py-3"><Badge className={roleBadgeClass(user.role)}>{user.role}</Badge></td>
                  <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{user.planTier}</td>
                  <td className="px-4 py-3"><Badge className={statusBadgeClass(user.status)}>{user.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => { setEditingUser(user); setEditPlan(user.planTier); setEditStatus(user.status); }}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground/70">No users found</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{user.fullName || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground/70">{user.email}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 shrink-0 text-xs"
                  onClick={() => { setEditingUser(user); setEditPlan(user.planTier); setEditStatus(user.status); }}>
                  Edit
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge className={roleBadgeClass(user.role)}>{user.role}</Badge>
                <Badge className={statusBadgeClass(user.status)}>{user.status}</Badge>
                <span className="text-xs capitalize text-muted-foreground">{user.planTier}</span>
                <span className="ml-auto text-xs text-muted-foreground/70">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Edit User</h3>
            <p className="mb-4 truncate text-xs text-muted-foreground">{editingUser.email}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan Tier</label>
                <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)} className={selectClass}>
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={selectClass}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button size="sm"
                onClick={() => updateUser.mutate({ userId: editingUser.id, planTier: editPlan, status: editStatus })}
                disabled={updateUser.isPending}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
