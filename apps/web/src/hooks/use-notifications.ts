"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SeekerNotification } from "@/types/marketplace";

export function useNotifications(userId?: string) {
  const qc = useQueryClient();

  // Supabase Realtime subscription — replaces the 2-min polling interval.
  // Fires on any INSERT to the notifications table for this user_id.
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate cache — the query will re-fetch in the background
          qc.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

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
    // No refetchInterval — Realtime handles live updates
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
