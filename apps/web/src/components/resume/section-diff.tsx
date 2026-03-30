"use client";

/**
 * Word-level diff for a single resume section.
 * Highlights added words in green, removed words in red.
 */

interface DiffWord {
  text: string;
  type: "unchanged" | "added" | "removed";
}

function computeWordDiff(original: string, tailored: string): DiffWord[] {
  const origWords = original.split(/\s+/).filter(Boolean);
  const tailWords = tailored.split(/\s+/).filter(Boolean);

  // Simple LCS-based word diff
  const m = origWords.length;
  const n = tailWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1] === tailWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffWord[] = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === tailWords[j - 1]) {
      result.unshift({ text: origWords[i - 1], type: "unchanged" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ text: tailWords[j - 1], type: "added" });
      j--;
    } else {
      result.unshift({ text: origWords[i - 1], type: "removed" });
      i--;
    }
  }

  return result;
}

interface SectionDiffProps {
  sectionName: string;
  original: string;
  tailored: string;
  accepted: boolean;
  onToggle: () => void;
}

export function SectionDiff({ sectionName, original, tailored, accepted, onToggle }: SectionDiffProps) {
  const diff = computeWordDiff(original, tailored);
  const hasChanges = diff.some((w) => w.type !== "unchanged");

  if (!hasChanges) {
    return (
      <div className="rounded-lg border border-surface-200 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-surface-700">{sectionName}</h4>
          <span className="text-xs text-surface-400">No changes</span>
        </div>
        <p className="mt-2 text-sm text-surface-600">{original}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-surface-700">{sectionName}</h4>
        <button
          onClick={onToggle}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            accepted
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-surface-100 text-surface-500 hover:bg-surface-200"
          }`}
        >
          {accepted ? "Accepted" : "Accept change"}
        </button>
      </div>
      <div className="mt-2 text-sm leading-relaxed">
        {diff.map((word, idx) => {
          if (word.type === "added") {
            return (
              <span key={idx} className="rounded bg-emerald-100 text-emerald-800">
                {word.text}{" "}
              </span>
            );
          }
          if (word.type === "removed") {
            return (
              <span key={idx} className="rounded bg-red-100 text-red-800 line-through">
                {word.text}{" "}
              </span>
            );
          }
          return <span key={idx}>{word.text} </span>;
        })}
      </div>
    </div>
  );
}
