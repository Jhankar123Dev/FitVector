"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SeekerNotification } from "@/types/marketplace";

export function useNotifications() {
  return useQuery<SeekerNotification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/user/notifications");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 2 * 60 * 1000, // poll every 2 min for new notifications
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/notifications", { method: "PATCH" });
      return res.json();
    },
    onMutate: async () => {
      // Optimistic update — mark all as read immediately in cache
      await qc.cancelQueries({ queryKey: ["notifications"] });
      qc.setQueryData<SeekerNotification[]>(["notifications"], (old) =>
        (old || []).map((n) => ({ ...n, isRead: true })),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
