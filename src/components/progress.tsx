"use client";

import { useState, useEffect } from "react";
import {
  type LearningState,
  loadLearningState,
  getCategoryProgress,
  getMasteryStats,
  getMasteryLevel,
  MASTERY_COLORS,
  resetProgress,
} from "@/lib/learning";
import { ACTION_LABELS } from "@/lib/strategy";

const DEALER_HEADERS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

function MasteryCell({
  mastery,
  accuracy,
  attempts,
}: {
  mastery: string;
  accuracy: number;
  attempts: number;
}) {
  const colors: Record<string, string> = {
    unseen: "bg-zinc-800/50",
    learning: "bg-red-600/60",
    familiar: "bg-yellow-500/50",
    mastered: "bg-green-600/60",
  };

  return (
    <td
      className={`${colors[mastery] || colors.unseen} w-5 h-5 sm:w-8 sm:h-7 text-center border border-zinc-800/30`}
      title={
        attempts > 0
          ? `${Math.round(accuracy * 100)}% (${attempts} attempts)`
          : "Not yet attempted"
      }
    >
      {attempts > 0 && (
        <span className="text-[9px] font-mono text-white/70">
          {Math.round(accuracy * 100)}
        </span>
      )}
    </td>
  );
}

export function Progress() {
  const [state, setState] = useState<LearningState | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    setState(loadLearningState());
  }, []);

  if (!state) return <div className="text-zinc-500 text-sm">Loading...</div>;

  const stats = getMasteryStats(state);
  const categories = getCategoryProgress(state);
  const overallPct = Math.round(stats.overallAccuracy * 100);

  const handleReset = () => {
    resetProgress();
    setState(loadLearningState());
    setShowConfirmReset(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Your Progress</h2>
          <p className="text-sm text-zinc-500">
            {stats.mastered} of {stats.total} scenarios mastered
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono">
            {overallPct}%
          </div>
          <div className="text-xs text-zinc-500">overall accuracy</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { level: "mastered", color: "text-green-400", bg: "bg-green-900/20 border-green-800/30" },
            { level: "familiar", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800/30" },
            { level: "learning", color: "text-red-400", bg: "bg-red-900/20 border-red-800/30" },
            { level: "unseen", color: "text-zinc-500", bg: "bg-zinc-900/50 border-zinc-800/50" },
          ] as const
        ).map(({ level, color, bg }) => (
          <div key={level} className={`${bg} border rounded-lg p-3 text-center`}>
            <div className={`text-xl font-bold font-mono ${color}`}>
              {stats[level]}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
              {level}
            </div>
          </div>
        ))}
      </div>

      {/* Weakest hands */}
      {stats.weakestScenarios.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            Your Weakest Hands
          </h3>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg divide-y divide-zinc-800/50">
            {stats.weakestScenarios.slice(0, 5).map((s) => {
              const acc = Math.round((s.correctAttempts / s.totalAttempts) * 100);
              const mastery = getMasteryLevel(s);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${MASTERY_COLORS[mastery]}`}>
                      {mastery}
                    </span>
                    <span className="text-sm text-zinc-300">
                      <span className="font-mono font-bold">{s.playerLabel}</span>
                      <span className="text-zinc-600 mx-1">vs</span>
                      <span className="font-mono font-bold">{s.dealerUpcard}</span>
                    </span>
                    <span className="text-xs text-zinc-600">
                      {"\u2192"} {ACTION_LABELS[s.correctAction]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${acc < 50 ? "text-red-400" : "text-yellow-400"}`}>
                      {acc}%
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      ({s.correctAttempts}/{s.totalAttempts})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mastery grids */}
      {categories.map((cat) => (
        <div key={cat.category} className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            {cat.category === "hard"
              ? "Hard Totals"
              : cat.category === "soft"
                ? "Soft Totals"
                : "Pairs"}
          </h3>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-[10px] text-zinc-600 font-mono text-left border border-zinc-800/30 bg-zinc-900/30" />
                  {DEALER_HEADERS.map((d) => (
                    <th
                      key={d}
                      className="px-1 py-1 text-[10px] text-zinc-500 font-mono text-center border border-zinc-800/30 bg-zinc-900/30"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cat.rows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-2 py-1 text-[10px] text-zinc-500 font-mono font-bold border border-zinc-800/30 bg-zinc-900/30 whitespace-nowrap">
                      {row.label}
                    </td>
                    {row.cells.map((cell) => (
                      <MasteryCell
                        key={cell.dealer}
                        mastery={cell.mastery}
                        accuracy={cell.accuracy}
                        attempts={cell.attempts}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-600/60" /> Mastered (4+ in a row)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500/50" /> Familiar (2-3 in a row)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-600/60" /> Learning (missed recently)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-zinc-800/50" /> Unseen
        </span>
      </div>

      {/* Reset */}
      <div className="pt-4 border-t border-zinc-800">
        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Reset all progress
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-red-400">Are you sure? This can&apos;t be undone.</span>
            <button
              onClick={handleReset}
              className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
            >
              Yes, reset
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
