"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProctoringSignal {
  type: "tab_switch" | "copy" | "cut" | "paste" | "focus_lost";
  at: string; // ISO timestamp
}

export interface ProctoringOptions {
  /** Unique ID scoping the sessionStorage key (submission ID or interview token). */
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
}

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

  const dismissWarning = useCallback(() => setProctoringWarning(null), []);

  const getProctoringData = useCallback(
    () => ({ tabSwitches: countsRef.current.tabSwitches, copyPasteAttempts: countsRef.current.copyPasteAttempts }),
    []
  );

  const getSignals = useCallback(() => [...signalsRef.current], []);

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
  }, [enabled, sessionId, trackTabSwitches, trackCopyPaste, persistToStorage]);

  return {
    tabSwitches,
    copyPasteAttempts,
    proctoringWarning,
    dismissWarning,
    getProctoringData,
    getSignals,
  };
}
