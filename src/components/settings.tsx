"use client";

import { type RuleSet, RULE_OPTIONS } from "@/lib/rules";

export function Settings({
  rules,
  onChange,
}: {
  rules: RuleSet;
  onChange: (rules: RuleSet) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Table Rules</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Configure the rules to match your casino. Strategy adjusts automatically.
        </p>
      </div>

      <div className="space-y-4">
        {RULE_OPTIONS.map((option) => {
          const currentValue = rules[option.id];
          const descKey = String(currentValue);
          const description = option.descriptions[descKey];

          return (
            <div
              key={option.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">
                  {option.label}
                </span>

                {option.type === "toggle" ? (
                  <button
                    onClick={() =>
                      onChange({ ...rules, [option.id]: !currentValue })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      currentValue ? "bg-emerald-600" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                        currentValue ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    {option.options?.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          onChange({ ...rules, [option.id]: opt.value })
                        }
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          currentValue === opt.value
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">
                {description}
              </p>
            </div>
          );
        })}
      </div>

      {/* House edge estimate */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Estimated House Edge</span>
          <span className="text-sm font-mono font-bold text-zinc-200">
            {estimateHouseEdge(rules)}%
          </span>
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          With perfect basic strategy. Actual results vary.
        </p>
      </div>
    </div>
  );
}

function estimateHouseEdge(rules: RuleSet): string {
  // Base edge for 6-deck H17 is ~0.64%
  let edge = 0.64;

  // S17 vs H17
  if (!rules.dealerHitsSoft17) edge -= 0.2;

  // DAS
  if (!rules.doubleAfterSplit) edge += 0.14;

  // Surrender
  if (!rules.surrenderAllowed) edge += 0.07;

  // Deck count adjustments (relative to 6 deck)
  if (rules.deckCount === 1) edge -= 0.47;
  else if (rules.deckCount === 2) edge -= 0.19;
  else if (rules.deckCount === 8) edge += 0.02;

  return Math.max(0, edge).toFixed(2);
}
