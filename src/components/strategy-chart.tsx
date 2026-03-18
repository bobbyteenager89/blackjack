"use client";

import { HARD, SOFT, PAIRS, ACTION_SHORT_COLORS, ACTION_LABELS, type Action } from "@/lib/strategy";
import { type RuleSet } from "@/lib/rules";
import { useState } from "react";

const DEALER_HEADERS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

function Cell({ action, highlight }: { action: Action; highlight?: boolean }) {
  return (
    <td
      className={`${ACTION_SHORT_COLORS[action]} px-1.5 py-1 text-center text-xs font-mono font-bold border border-zinc-800/50 ${
        highlight ? "ring-2 ring-white ring-inset" : ""
      }`}
      title={ACTION_LABELS[action]}
    >
      {action}
    </td>
  );
}

function ChartTable({
  title,
  rows,
  labels,
}: {
  title: string;
  rows: Record<string | number, Action[]>;
  labels: string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wider">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className="px-2 py-1 text-xs text-zinc-500 font-mono text-left border border-zinc-800/50 bg-zinc-900/50">

              </th>
              {DEALER_HEADERS.map((d) => (
                <th
                  key={d}
                  className="px-1.5 py-1 text-xs text-zinc-400 font-mono text-center border border-zinc-800/50 bg-zinc-900/50"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
              <tr key={label}>
                <td className="px-2 py-1 text-xs text-zinc-400 font-mono font-bold border border-zinc-800/50 bg-zinc-900/50 whitespace-nowrap">
                  {label}
                </td>
                {(rows[label] || []).map((action, i) => (
                  <Cell key={i} action={action} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StrategyChart({ rules }: { rules: RuleSet }) {
  const [activeSection, setActiveSection] = useState<"all" | "hard" | "soft" | "pairs">("all");

  const hardLabels = Object.keys(HARD)
    .map(Number)
    .sort((a, b) => b - a)
    .filter((n) => n >= 5)
    .map(String);

  const softLabels = Object.keys(SOFT);
  const pairLabels = Object.keys(PAIRS);

  // Build hard rows with string keys
  const hardRows: Record<string, Action[]> = {};
  for (const key of hardLabels) {
    hardRows[key] = HARD[parseInt(key)];
  }

  const sections = [
    { id: "all" as const, label: "All" },
    { id: "hard" as const, label: "Hard" },
    { id: "soft" as const, label: "Soft" },
    { id: "pairs" as const, label: "Pairs" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Basic Strategy Chart</h2>
          <p className="text-sm text-zinc-500">
            {rules.deckCount} Deck{rules.deckCount > 1 ? "s" : ""} &middot;{" "}
            Dealer {rules.dealerHitsSoft17 ? "Hits" : "Stands on"} Soft 17 ({rules.dealerHitsSoft17 ? "H17" : "S17"})
            {rules.surrenderAllowed ? " · Surrender" : ""}
          </p>
        </div>
        <div className="flex gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeSection === s.id
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(
          [
            ["H", "Hit"],
            ["S", "Stand"],
            ["D", "Double"],
            ["Ds", "Dbl/Stand"],
            ["SP", "Split"],
            ["Rh", "Surr/Hit"],
            ["Rs", "Surr/Stand"],
            ["Rp", "Surr/Split"],
          ] as [Action, string][]
        ).map(([action, label]) => (
          <span key={action} className="flex items-center gap-1.5">
            <span
              className={`${ACTION_SHORT_COLORS[action]} w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px]`}
            >
              {action}
            </span>
            <span className="text-zinc-500">{label}</span>
          </span>
        ))}
      </div>

      <div className="space-y-6">
        {(activeSection === "all" || activeSection === "hard") && (
          <ChartTable title="Hard Totals" rows={hardRows} labels={hardLabels} />
        )}
        {(activeSection === "all" || activeSection === "soft") && (
          <ChartTable title="Soft Totals" rows={SOFT} labels={softLabels} />
        )}
        {(activeSection === "all" || activeSection === "pairs") && (
          <ChartTable title="Pairs" rows={PAIRS} labels={pairLabels} />
        )}
      </div>
    </div>
  );
}
