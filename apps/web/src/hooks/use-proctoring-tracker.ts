"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProctoringSignal {
  type: "tab_switch" | "copy" | "cut" | "paste" | "focus_lost";
  at: string; // ISO timestamp
}

export interface ProctoringOptions {
  /** Unique ID scoping the sessionStorage key AND the assessment submission token. */
  sessionId: string;
  /** Whether event listeners should be active. Set false until the session starts. */
  enabled: boolean;
  /** Track visibility changes (tab/window switching). Default: true */
  trackTabSwitches?: boolean;
  /** Track copy / cut / paste events. Default: true */
  trackCopyPaste?: boolean;
  /**
   * Persist counts to sessionStorage so reloads don't reset them.
   * Use true for assessments (timed, can be reloaded), false for AI interviews.
   */
  persistToStorage?: boolean;
  /**
   * When true, batched proctoring counts are flushed to the server every
   * BEACON_INTERVAL_MS via navigator.sendBeacon. The server accumulates them
   * so the final submit score cannot be tampered with client-side.
   * Default: true.
   */
  serverSync?: boolean;
}

// ── Server beacon constants ───────────────────────────────────────────────────

/** Flush pending proctoring events to the server every 15 seconds. */
const BEACON_INTERVAL_MS = 15_000;

export interface ProctoringResult {
  tabSwitches: number;
  copyPasteAttempts: number;
  proctoringWarning: string | null;
  dismissWarning: () => void;
  /** Returns the simple counts shape used by the Assessment submit payload. */
  getProctoringData: () => { tabSwitches: number; copyPasteAttempts: number };
  /** Returns timestamped signal log used by the AI Interview complete payload. */
  getSignals: () => ProctoringSignal[];
}

// ── sessionStorage helpers ───────────────────────────────────────────────────

function storageKey(id: string) {
  return `proctoring_${id}`;
}

function readCounts(id: string): { tabSwitches: number; copyPasteAttempts: number } {
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { tabSwitches: 0, copyPasteAttempts: 0 };
}

function writeCounts(id: string, counts: { tabSwitches: number; copyPasteAttempts: number }) {
  try {
    sessionStorage.setItem(storageKey(id), JSON.stringify(counts));
  } catch { /* ignore */ }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProctoringTracker({
  sessionId,
  enabled,
  trackTabSwitches = true,
  trackCopyPaste = true,
  persistToStorage = false,
  serverSync = true,
}: ProctoringOptions): ProctoringResult {
  const [tabSwitches, setTabSwitches] = useState<number>(() => {
    if (persistToStorage && typeof window !== "undefined") {
      return readCounts(sessionId).tabSwitches;
    }
    return 0;
  });

  const [copyPasteAttempts, setCopyPasteAttempts] = useState<number>(() => {
    if (persistToStorage && typeof window !== "undefined") {
      return readCounts(sessionId).copyPasteAttempts;
    }
    return 0;
  });

  const [proctoringWarning, setProctoringWarning] = useState<string | null>(null);

  // Internal timestamped log (for AI interview payload — never stored in sessionStorage)
  const signalsRef = useRef<ProctoringSignal[]>([]);

  // Keep a ref to the latest counts for use inside event handlers without stale closure
  const countsRef = useRef({ tabSwitches, copyPasteAttempts });
  countsRef.current = { tabSwitches, copyPasteAttempts };

  // ── Server beacon (pending delta buffer) ──────────────────────────────────
  // Track unsent increments since the last beacon flush. The beacon sends only
  // the delta so we don't overwrite server counts if a flush was already processed.
  const pendingRef = useRef({ tabSwitches: 0, copyPasteAttempts: 0 });

  /** Flush pending event counts to the server via sendBeacon (fire-and-forget). */
  const flushBeacon = useCallback(() => {
    if (!serverSync || !enabled) return;
    const { tabSwitches: ts, copyPasteAttempts: cp } = pendingRef.current;
    if (ts === 0 && cp === 0) return; // nothing to send

    const url = `/api/assessment/${sessionId}/event`;
    const payload = JSON.stringify({ tabSwitches: ts, copyPasteAttempts: cp });

    // navigator.sendBeacon is ideal here: it works even when the page is being
    // closed (e.g. tab switch → close), and it never blocks the UI thread.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) {
        // Reset pending delta — server has received it
        pendingRef.current = { tabSwitches: 0, copyPasteAttempts: 0 };
      }
    }
  }, [serverSync, enabled, sessionId]);

  const dismissWarning = useCallback(() => setProctoringWarning(null), []);

  const getProctoringData = useCallback(
    () => ({ tabSwitches: countsRef.current.tabSwitches, copyPasteAttempts: countsRef.current.copyPasteAttempts }),
    []
  );

  const getSignals = useCallback(() => [...signalsRef.current], []);

  // ── Periodic beacon flush every 15 seconds ────────────────────────────────
  useEffect(() => {
    if (!enabled || !serverSync) return;
    const interval = setInterval(flushBeacon, BEACON_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      flushBeacon(); // flush any remaining on cleanup
    };
  }, [enabled, serverSync, flushBeacon]);

  // ── Event listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (!trackTabSwitches) return;
      if (document.visibilityState === "hidden") {
        const signal: ProctoringSignal = { type: "tab_switch", at: new Date().toISOString() };
        signalsRef.current.push(signal);

        setTabSwitches((prev) => {
          const next = prev + 1;
          if (persistToStorage) {
            writeCounts(sessionId, { tabSwitches: next, copyPasteAttempts: countsRef.current.copyPasteAttempts });
          }
          return next;
        });

        // Increment the pending beacon delta
        pendingRef.current.tabSwitches += 1;

        // Flush immediately on tab switch — sendBeacon is reliable on visibilitychange
        // and this is the most critical event to capture server-side right away.
        flushBeacon();

        setProctoringWarning("Tab switch detected — this has been recorded.");
      }
    };

    const handleCopyPaste = (e: Event) => {
      if (!trackCopyPaste) return;
      e.preventDefault();
      const type = e.type as ProctoringSignal["type"];
      const signal: ProctoringSignal = { type, at: new Date().toISOString() };
      signalsRef.current.push(signal);

      setCopyPasteAttempts((prev) => {
        const next = prev + 1;
        if (persistToStorage) {
          writeCounts(sessionId, { tabSwitches: countsRef.current.tabSwitches, copyPasteAttempts: next });
        }
        return next;
      });

      // Increment pending beacon delta (will be flushed on next 15s tick)
      pendingRef.current.copyPasteAttempts += 1;

      setProctoringWarning(
        e.type === "paste"
          ? "Pasting is not allowed during this session."
          : "Copying is not allowed during this session.",
      );
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, [enabled, sessionId, trackTabSwitches, trackCopyPaste, persistToStorage, flushBeacon]);

  return {
    tabSwitches,
    copyPasteAttempts,
    proctoringWarning,
    dismissWarning,
    getProctoringData,
    getSignals,
  };
}
