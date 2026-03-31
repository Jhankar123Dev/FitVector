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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Users</h1>
        <p className="mt-1 text-sm text-surface-500">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-surface-100" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-surface-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-surface-100 hover:bg-surface-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-surface-800">{user.fullName || "—"}</p>
                    <p className="text-xs text-surface-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        user.role === "superadmin"
                          ? "bg-red-100 text-red-700"
                          : user.role === "employer"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-surface-600">{user.planTier}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-surface-100 text-surface-600"
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-surface-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditingUser(user);
                        setEditPlan(user.planTier);
                        setEditStatus(user.status);
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-surface-500">
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-surface-200 bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-sm font-semibold text-surface-800">Edit User</h3>
            <p className="mb-3 text-xs text-surface-500">{editingUser.email}</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">Plan Tier</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => updateUser.mutate({ userId: editingUser.id, planTier: editPlan, status: editStatus })}
                disabled={updateUser.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
