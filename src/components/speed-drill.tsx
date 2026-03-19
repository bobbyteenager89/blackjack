"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CardDisplay } from "./card-display";
import { type RuleSet } from "@/lib/rules";
import type { Card, Suit } from "@/lib/blackjack";
import { isPair, handValue } from "@/lib/blackjack";
import {
  type ScenarioRecord,
  loadLearningState,
  saveLearningState,
  recordAttempt,
} from "@/lib/learning";
import { ACTION_COLORS, type Action } from "@/lib/strategy";

const TOTAL_HANDS = 20;

// Keyboard shortcuts
const BUTTON_SHORTCUTS: Record<string, string> = {
  Hit: "H",
  Stand: "S",
  Double: "D",
  Split: "P",
  Surrender: "R",
};

type DrillPhase = "idle" | "running" | "done";

interface HandResult {
  scenario: ScenarioRecord;
  userAction: string;
  correctAction: Action;
  correct: boolean;
  msElapsed: number;
}

function makeFakeCard(rank: string): Card {
  const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
  return {
    rank: rank as Card["rank"],
    suit: suits[Math.floor(Math.random() * suits.length)],
  };
}

function scenarioToCards(scenario: ScenarioRecord): [Card, Card] {
  if (scenario.category === "pair") {
    const rank = scenario.playerLabel.split(",")[0];
    return [makeFakeCard(rank), makeFakeCard(rank)];
  }
  if (scenario.category === "soft") {
    const otherRank = scenario.playerLabel.split(",")[1];
    return [makeFakeCard("A"), makeFakeCard(otherRank)];
  }
  const total = parseInt(scenario.playerLabel);
  const splits: Record<number, [string, string]> = {
    8: ["3", "5"],
    9: ["4", "5"],
    10: ["4", "6"],
    11: ["5", "6"],
    12: ["10", "2"],
    13: ["10", "3"],
    14: ["10", "4"],
    15: ["10", "5"],
    16: ["10", "6"],
    17: ["10", "7"],
  };
  const [a, b] = splits[total] || ["10", String(total - 10)];
  return [makeFakeCard(a), makeFakeCard(b)];
}

function handTotalLabel(cards: [Card, Card]): string {
  if (isPair(cards)) {
    const rank = cards[0].rank;
    const plural = rank === "A" ? "Aces" : `${rank}s`;
    return `Pair of ${plural}`;
  }
  const hv = handValue(cards);
  if (hv.soft) return `Soft ${hv.total}`;
  return `Hard ${hv.total}`;
}

function effectiveActionLabel(action: Action, surrenderAllowed: boolean): string {
  if (action === "Rp") return surrenderAllowed ? "Surrender" : "Split";
  if (action === "Rh") return surrenderAllowed ? "Surrender" : "Hit";
  if (action === "Rs") return surrenderAllowed ? "Surrender" : "Stand";
  if (action === "Ds" || action === "D") return "Double";
  if (action === "SP") return "Split";
  if (action === "S") return "Stand";
  if (action === "H") return "Hit";
  return action;
}

function buttonToKey(label: string): string {
  const map: Record<string, string> = {
    Hit: "H", Stand: "S", Double: "D", Split: "SP", Surrender: "R",
  };
  return map[label] || label;
}

function correctButtonKey(action: Action, surrenderAllowed: boolean): string {
  return buttonToKey(effectiveActionLabel(action, surrenderAllowed));
}

function normalizeForCheck(action: string): string {
  if (["Rh", "Rs", "Rp"].includes(action)) return "R";
  if (action === "Ds") return "D";
  return action;
}

// Pick random scenarios (no spaced repetition — just random for speed drill)
function pickRandomScenarios(count: number): ScenarioRecord[] {
  const state = loadLearningState();
  const all = Object.values(state.scenarios);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatTime(ms: number): string {
  const s = ms / 1000;
  return s.toFixed(1) + "s";
}

export function SpeedDrill({ rules }: { rules: RuleSet }) {
  const [phase, setPhase] = useState<DrillPhase>("idle");
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<HandResult[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [handStartMs, setHandStartMs] = useState(0);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentScenario = scenarios[currentIndex] ?? null;

  const playerCards = useMemo(
    () => (currentScenario ? scenarioToCards(currentScenario) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentScenario?.id, currentIndex]
  );

  const dealerCard = useMemo(
    () => (currentScenario ? makeFakeCard(currentScenario.dealerUpcard) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentScenario?.id, currentIndex]
  );

  const buttons = useMemo(() => {
    if (!currentScenario) return [];
    const opts = ["Hit", "Stand", "Double"];
    if (currentScenario.category === "pair") opts.push("Split");
    if (rules.surrenderAllowed) opts.push("Surrender");
    return opts;
  }, [currentScenario, rules.surrenderAllowed]);

  const correctKey = currentScenario
    ? correctButtonKey(currentScenario.correctAction, rules.surrenderAllowed)
    : "";

  const startDrill = useCallback(() => {
    const picked = pickRandomScenarios(TOTAL_HANDS);
    setScenarios(picked);
    setCurrentIndex(0);
    setResults([]);
    setElapsedMs(0);
    setPhase("running");
    startTimeRef.current = Date.now();
    setHandStartMs(Date.now());

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const handleAnswer = useCallback(
    (label: string) => {
      if (phase !== "running" || !currentScenario) return;

      const handMs = Date.now() - handStartMs;
      const userKey = buttonToKey(label);
      const isCorrect =
        normalizeForCheck(userKey) === normalizeForCheck(correctKey);

      const result: HandResult = {
        scenario: currentScenario,
        userAction: label,
        correctAction: currentScenario.correctAction,
        correct: isCorrect,
        msElapsed: handMs,
      };

      // Record in learning engine silently
      const state = loadLearningState();
      const updated = recordAttempt(state, currentScenario.id, isCorrect);
      saveLearningState(updated);

      const newResults = [...results, result];
      setResults(newResults);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= TOTAL_HANDS) {
        // Done
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedMs(Date.now() - startTimeRef.current);
        setPhase("done");
      } else {
        setCurrentIndex(nextIndex);
        setHandStartMs(Date.now());
      }
    },
    [phase, currentScenario, correctKey, results, currentIndex, handStartMs]
  );

  // Keyboard shortcuts during drill
  useEffect(() => {
    if (phase !== "running") return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      const labelMap: Record<string, string> = {
        H: "Hit",
        S: "Stand",
        D: "Double",
        P: "Split",
        R: "Surrender",
      };
      const label = labelMap[key];
      if (label && buttons.includes(label)) {
        e.preventDefault();
        handleAnswer(label);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, buttons, handleAnswer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Idle ──────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Speed Drill</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {TOTAL_HANDS} hands, no explanations. How fast can you go?
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4">
          <div className="text-center space-y-2">
            <p className="text-zinc-400 text-sm">
              Random hands. Pick the correct play as fast as you can.
            </p>
            <p className="text-zinc-600 text-xs">
              Keyboard: H=Hit, S=Stand, D=Double, P=Split, R=Surrender
            </p>
          </div>
          <button
            onClick={startDrill}
            className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-lg"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────
  if (phase === "done") {
    const correct = results.filter((r) => r.correct).length;
    const accuracy = Math.round((correct / TOTAL_HANDS) * 100);
    const avgMs = Math.round(results.reduce((s, r) => s + r.msElapsed, 0) / results.length);
    const wrong = results.filter((r) => !r.correct);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Speed Drill — Results</h2>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold font-mono text-zinc-200">
              {formatTime(elapsedMs)}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Total Time</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold font-mono ${accuracy >= 80 ? "text-green-400" : accuracy >= 60 ? "text-yellow-400" : "text-red-400"}`}>
              {accuracy}%
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Accuracy</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold font-mono text-zinc-200">
              {formatTime(avgMs)}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Avg / Hand</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold font-mono text-zinc-200">
              {correct}/{TOTAL_HANDS}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Correct</div>
          </div>
        </div>

        {/* Mistakes */}
        {wrong.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              Mistakes ({wrong.length})
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg divide-y divide-zinc-800/50">
              {wrong.map((r, i) => {
                const correctLabel = effectiveActionLabel(r.correctAction, rules.surrenderAllowed);
                const correctColor = ACTION_COLORS[r.correctAction] || "bg-zinc-600 text-white";
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-zinc-300 font-mono font-bold whitespace-nowrap">
                        {r.scenario.playerLabel}
                      </span>
                      <span className="text-zinc-600 text-xs">vs</span>
                      <span className="text-sm text-zinc-300 font-mono font-bold whitespace-nowrap">
                        {r.scenario.dealerUpcard}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-red-400 line-through whitespace-nowrap">
                        {r.userAction}
                      </span>
                      <span className="text-zinc-600 text-xs">→</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap ${correctColor}`}>
                        {correctLabel}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono whitespace-nowrap">
                        {formatTime(r.msElapsed)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {wrong.length === 0 && (
          <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-4 text-center">
            <p className="text-green-400 font-medium">Perfect score!</p>
            <p className="text-zinc-500 text-sm mt-1">All {TOTAL_HANDS} hands correct.</p>
          </div>
        )}

        <button
          onClick={startDrill}
          className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          Drill Again
        </button>
      </div>
    );
  }

  // ── Running ───────────────────────────────────────────────
  if (!currentScenario || !playerCards || !dealerCard) {
    return <div className="text-zinc-500 text-sm">Loading...</div>;
  }

  const handLabel = handTotalLabel(playerCards);
  const handNum = currentIndex + 1;

  return (
    <div className="space-y-4">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-zinc-400">
            {handNum} / {TOTAL_HANDS}
          </span>
          <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-150"
              style={{ width: `${(handNum / TOTAL_HANDS) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-lg font-mono font-bold text-zinc-200 tabular-nums">
          {formatTime(elapsedMs)}
        </span>
      </div>

      {/* Hand */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Dealer */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Dealer shows
            </p>
            <div className="flex gap-2">
              <CardDisplay card={dealerCard} size="lg" />
              <CardDisplay card={dealerCard} faceDown size="lg" />
            </div>
          </div>

          {/* Player */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Your hand
              </p>
              <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                {handLabel}
              </span>
            </div>
            <div className="flex gap-2">
              {playerCards.map((card, i) => (
                <CardDisplay key={i} card={card} size="lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {buttons.map((label) => (
            <button
              key={label}
              onClick={() => handleAnswer(label)}
              className="px-5 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium transition-colors whitespace-nowrap"
            >
              {label}
              <span className="ml-1.5 text-[10px] text-zinc-400 font-mono">
                [{BUTTON_SHORTCUTS[label] ?? label[0]}]
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mini result log */}
      {results.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {results.map((r, i) => (
            <span
              key={i}
              className={`w-5 h-5 rounded text-[9px] flex items-center justify-center font-mono font-bold ${
                r.correct ? "bg-green-900/60 text-green-400" : "bg-red-900/60 text-red-400"
              }`}
              title={`${r.scenario.playerLabel} vs ${r.scenario.dealerUpcard}: ${r.correct ? "✓" : `✗ (${effectiveActionLabel(r.correctAction, rules.surrenderAllowed)})`}`}
            >
              {r.correct ? "✓" : "✗"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
