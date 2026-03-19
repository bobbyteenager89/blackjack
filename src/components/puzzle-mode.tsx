"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { CardDisplay } from "./card-display";
import { Badge } from "@/components/ui/badge";
import { ACTION_COLORS, type Action } from "@/lib/strategy";
import { type RuleSet } from "@/lib/rules";
import type { Card, Suit } from "@/lib/blackjack";
import { isPair, handValue } from "@/lib/blackjack";
import {
  type LearningState,
  type ScenarioRecord,
  loadLearningState,
  pickNextScenario,
  recordAttempt,
  getMasteryLevel,
  getMasteryStats,
  MASTERY_COLORS,
  MASTERY_LABELS,
} from "@/lib/learning";

function makeFakeCard(rank: string): Card {
  const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
  return {
    rank: rank as Card["rank"],
    suit: suits[Math.floor(Math.random() * suits.length)],
  };
}

// Build player cards from scenario
function scenarioToCards(scenario: ScenarioRecord): [Card, Card] {
  if (scenario.category === "pair") {
    const rank = scenario.playerLabel.split(",")[0];
    return [makeFakeCard(rank), makeFakeCard(rank)];
  }
  if (scenario.category === "soft") {
    const otherRank = scenario.playerLabel.split(",")[1];
    return [makeFakeCard("A"), makeFakeCard(otherRank)];
  }
  // Hard total — pick two cards that sum to it
  const total = parseInt(scenario.playerLabel);
  // Use common splits avoiding aces (which would make it soft)
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

// Compute hand total label: "Pair of 8s", "Soft 18", "Hard 16"
function handTotalLabel(cards: [Card, Card]): string {
  if (isPair(cards)) {
    const rank = cards[0].rank;
    const label = rank === "A" ? "Ace" : rank;
    const plural = rank === "A" ? "Aces" : `${label}s`;
    return `Pair of ${plural}`;
  }
  const hv = handValue(cards);
  if (hv.soft) return `Soft ${hv.total}`;
  return `Hard ${hv.total}`;
}

// Map action to simple label
function effectiveAction(action: Action, surrenderAllowed: boolean): string {
  if (action === "Rp") return surrenderAllowed ? "Surrender" : "Split";
  if (action === "Rh") return surrenderAllowed ? "Surrender" : "Hit";
  if (action === "Rs") return surrenderAllowed ? "Surrender" : "Stand";
  if (action === "Ds") return "Double";
  if (action === "D") return "Double";
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
  return buttonToKey(effectiveAction(action, surrenderAllowed));
}

function masteryBadge(level: ReturnType<typeof getMasteryLevel>) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${MASTERY_COLORS[level]}`}>
      {MASTERY_LABELS[level]}
    </span>
  );
}

// Keyboard shortcut hints per button label
const BUTTON_SHORTCUTS: Record<string, string> = {
  Hit: "H",
  Stand: "S",
  Double: "D",
  Split: "P",
  Surrender: "R",
};

export function PuzzleMode({ rules }: { rules: RuleSet }) {
  const [learningState, setLearningState] = useState<LearningState | null>(null);
  const [currentScenario, setCurrentScenario] = useState<ScenarioRecord | null>(null);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const state = loadLearningState();
    setLearningState(state);
    setCurrentScenario(pickNextScenario(state));
  }, []);

  const scenario = currentScenario;

  const playerCards = useMemo(
    () => (scenario ? scenarioToCards(scenario) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenario?.id]
  );

  const dealerCard = useMemo(
    () => (scenario ? makeFakeCard(scenario.dealerUpcard) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenario?.id]
  );

  // Determine buttons based on scenario
  const buttons = useMemo(() => {
    if (!scenario) return [];
    const opts = ["Hit", "Stand", "Double"];
    if (scenario.category === "pair") opts.push("Split");
    if (rules.surrenderAllowed) opts.push("Surrender");
    return opts;
  }, [scenario, rules.surrenderAllowed]);

  const correctKey = scenario ? correctButtonKey(scenario.correctAction, rules.surrenderAllowed) : "";
  const correctLabel = scenario ? effectiveAction(scenario.correctAction, rules.surrenderAllowed) : "";
  const isCorrect = selectedButton !== null && buttonToKey(selectedButton) === correctKey;
  const isWrong = selectedButton !== null && !isCorrect;

  const handleAnswer = useCallback(
    (label: string) => {
      if (selectedButton !== null || !learningState || !scenario) return;
      setSelectedButton(label);
      const correct = buttonToKey(label) === correctKey;

      const newState = recordAttempt(learningState, scenario.id, correct);
      setLearningState(newState);

      // If wrong, we'll offer a retry of the same scenario
      if (!correct) {
        setShowRetry(true);
      }
    },
    [selectedButton, learningState, scenario, correctKey]
  );

  const nextScenario = useCallback(() => {
    if (!learningState) return;
    setSelectedButton(null);
    setShowRetry(false);
    setCurrentScenario(pickNextScenario(learningState));
  }, [learningState]);

  const retryScenario = useCallback(() => {
    // Same scenario, new card visuals
    setSelectedButton(null);
    setShowRetry(false);
    if (scenario) {
      // Force re-render by creating a shallow copy with updated id suffix
      setCurrentScenario({ ...scenario });
    }
  }, [scenario]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();

      if (selectedButton === null) {
        // Action shortcuts
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
      } else {
        // Next / retry shortcuts
        if (key === "ENTER" || e.key === " ") {
          e.preventDefault();
          if (showRetry && isWrong) {
            retryScenario();
          } else {
            nextScenario();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedButton, buttons, handleAnswer, showRetry, isWrong, retryScenario, nextScenario]);

  if (!learningState || !scenario || !playerCards || !dealerCard) {
    return <div className="text-zinc-500 text-sm">Loading...</div>;
  }

  const stats = getMasteryStats(learningState);
  const session = learningState.sessionStats;
  const pct = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;
  const mastery = getMasteryLevel(
    learningState.scenarios[scenario.id] || scenario
  );
  const scenarioRecord = learningState.scenarios[scenario.id] || scenario;
  const scenarioAccuracy = scenarioRecord.totalAttempts > 0
    ? Math.round((scenarioRecord.correctAttempts / scenarioRecord.totalAttempts) * 100)
    : null;

  const correctActionColor = ACTION_COLORS[scenario.correctAction] || "bg-zinc-600 text-white";
  const handLabel = handTotalLabel(playerCards);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Mastered {stats.mastered} of {stats.total} scenarios
          </span>
          <span>{Math.round((stats.mastered / stats.total) * 100)}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            className="bg-green-600 transition-all duration-500"
            style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
          />
          <div
            className="bg-yellow-600 transition-all duration-500"
            style={{ width: `${(stats.familiar / stats.total) * 100}%` }}
          />
          <div
            className="bg-red-600 transition-all duration-500"
            style={{ width: `${(stats.learning / stats.total) * 100}%` }}
          />
        </div>
        <div className="flex gap-4 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-600" /> {stats.mastered} mastered
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-600" /> {stats.familiar} familiar
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600" /> {stats.learning} learning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-700" /> {stats.unseen} unseen
          </span>
        </div>
      </div>

      {/* Session stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="text-zinc-500">
            Session:{" "}
            <span className="text-zinc-200 font-mono">
              {session.correct}/{session.total}
            </span>{" "}
            <span className="text-zinc-600">({pct}%)</span>
          </span>
          <span className="text-zinc-500">
            Streak: <span className="text-zinc-200 font-mono">{session.streak}</span>
          </span>
          {session.bestStreak > 0 && (
            <span className="text-zinc-500">
              Best: <span className="text-zinc-200 font-mono">{session.bestStreak}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {scenarioAccuracy !== null && (
            <span className="text-[10px] text-zinc-600 font-mono">
              {scenarioAccuracy}% on this hand
            </span>
          )}
          {masteryBadge(mastery)}
        </div>
      </div>

      {/* The hand */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
            {/* Hand total label */}
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

        {/* What do you do? */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-300">What&apos;s the correct play?</p>
          <div className="flex flex-wrap gap-2">
            {buttons.map((label) => {
              const isThis = selectedButton === label;
              const isCorrectBtn =
                selectedButton !== null && buttonToKey(label) === correctKey;

              let btnClass =
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ";

              if (selectedButton === null) {
                btnClass +=
                  "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer";
              } else if (isCorrectBtn) {
                btnClass += "bg-green-600 text-white ring-2 ring-green-400";
              } else if (isThis && isWrong) {
                btnClass += "bg-red-600 text-white ring-2 ring-red-400";
              } else {
                btnClass += "bg-zinc-800/50 text-zinc-600";
              }

              return (
                <button
                  key={label}
                  onClick={() => handleAnswer(label)}
                  disabled={selectedButton !== null}
                  className={btnClass}
                >
                  {label}
                  {selectedButton === null && BUTTON_SHORTCUTS[label] && (
                    <span className="ml-1.5 text-[10px] text-zinc-500 font-mono">
                      [{BUTTON_SHORTCUTS[label]}]
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Keyboard hint */}
          {selectedButton === null && (
            <p className="text-[10px] text-zinc-600">
              Keyboard: H=Hit, S=Stand, D=Double{buttons.includes("Split") ? ", P=Split" : ""}{buttons.includes("Surrender") ? ", R=Surrender" : ""}
            </p>
          )}
          {selectedButton !== null && (
            <p className="text-[10px] text-zinc-600">
              Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[9px]">Enter</kbd> or <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[9px]">Space</kbd> for {showRetry && isWrong ? "Try Again" : "Next"}
            </p>
          )}
        </div>

        {/* Explanation */}
        {selectedButton !== null && (
          <div
            className={`p-4 rounded-lg border ${
              isCorrect
                ? "bg-green-950/30 border-green-800/50"
                : "bg-red-950/30 border-red-800/50"
            }`}
          >
            <p className="text-sm font-medium mb-1">
              {isCorrect ? "Correct!" : "Not quite."}{" "}
              <span className="text-zinc-400">
                The right play is{" "}
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-bold ${correctActionColor}`}
                >
                  {correctLabel}
                </span>
              </span>
            </p>
            <p className="text-sm text-zinc-400 mt-2">{scenario.explanation}</p>
            {isWrong && scenarioRecord.totalAttempts > 1 && (
              <p className="text-xs text-zinc-600 mt-2">
                You&apos;ve missed this hand {scenarioRecord.totalAttempts - scenarioRecord.correctAttempts} time{scenarioRecord.totalAttempts - scenarioRecord.correctAttempts !== 1 ? "s" : ""}.
                {" "}It&apos;ll come back more often until you get it consistently.
              </p>
            )}
          </div>
        )}

        {selectedButton !== null && (
          <div className="flex gap-2">
            {showRetry && (
              <button
                onClick={retryScenario}
                className="flex-1 py-2.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 border border-red-800/30 text-sm font-medium transition-colors text-red-300 whitespace-nowrap"
              >
                Try Again
              </button>
            )}
            <button
              onClick={nextScenario}
              className="flex-1 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Next {"\u2192"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
