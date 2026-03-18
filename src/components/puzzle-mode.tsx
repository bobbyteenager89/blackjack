"use client";

import { useState, useCallback, useMemo } from "react";
import { CardDisplay } from "./card-display";
import { Badge } from "@/components/ui/badge";
import {
  type Puzzle,
  getShuffledPuzzles,
  ACTION_COLORS,
  type Action,
} from "@/lib/strategy";
import { type RuleSet } from "@/lib/rules";
import type { Card, Suit } from "@/lib/blackjack";
import { isPair } from "@/lib/blackjack";

function makeFakeCard(rank: string): Card {
  const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
  return {
    rank: rank as Card["rank"],
    suit: suits[Math.floor(Math.random() * suits.length)],
  };
}

// Simple display label — no compound actions
function simpleLabel(action: Action, surrenderAllowed: boolean): string {
  switch (action) {
    case "H": return "Hit";
    case "S": return "Stand";
    case "D": return "Double";
    case "Ds": return surrenderAllowed ? "Double" : "Double (stand if can't)";
    case "SP": return "Split";
    case "Rh": return "Surrender";
    case "Rs": return "Surrender";
    case "Rp": return "Surrender";
    default: return action;
  }
}

// What the player should actually do given the rules
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

// Map button label to normalized key for matching
function buttonToKey(label: string): string {
  const map: Record<string, string> = {
    Hit: "H",
    Stand: "S",
    Double: "D",
    Split: "SP",
    Surrender: "R",
  };
  return map[label] || label;
}

// Normalize correct action to what button key it maps to
function correctButtonKey(action: Action, surrenderAllowed: boolean): string {
  const eff = effectiveAction(action, surrenderAllowed);
  return buttonToKey(eff);
}

function difficultyColor(d: Puzzle["difficulty"]) {
  switch (d) {
    case "brutal":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "hard":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "tricky":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }
}

export function PuzzleMode({ rules }: { rules: RuleSet }) {
  const [puzzles] = useState<Puzzle[]>(() => {
    let p = getShuffledPuzzles();
    // Filter out surrender puzzles if surrender not allowed AND the fallback
    // would be a trivial play (like just hitting)
    if (!rules.surrenderAllowed) {
      p = p.filter((pz) => !["Rh", "Rs"].includes(pz.correctAction));
    }
    return p;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const puzzle = puzzles[currentIndex % puzzles.length];

  const playerCards = useMemo(
    () => [makeFakeCard(puzzle.playerCards[0]), makeFakeCard(puzzle.playerCards[1])],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex]
  );
  const dealerCard = useMemo(
    () => makeFakeCard(puzzle.dealerUpcard),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex]
  );

  // Determine which buttons to show based on the hand
  const handIsPair = isPair(playerCards);
  const buttons = useMemo(() => {
    const opts = ["Hit", "Stand", "Double"];
    if (handIsPair) opts.push("Split");
    if (rules.surrenderAllowed) opts.push("Surrender");
    return opts;
  }, [handIsPair, rules.surrenderAllowed]);

  const correctKey = correctButtonKey(puzzle.correctAction, rules.surrenderAllowed);
  const correctLabel = effectiveAction(puzzle.correctAction, rules.surrenderAllowed);
  const isCorrect = selectedButton !== null && buttonToKey(selectedButton) === correctKey;
  const isWrong = selectedButton !== null && !isCorrect;

  const handleAnswer = useCallback(
    (label: string) => {
      if (selectedButton !== null) return;
      setSelectedButton(label);
      const correct = buttonToKey(label) === correctKey;
      setStats((s) => ({
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
      }));
      if (correct) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
      } else {
        setStreak(0);
      }
    },
    [selectedButton, correctKey, streak, bestStreak]
  );

  const nextPuzzle = useCallback(() => {
    setSelectedButton(null);
    setCurrentIndex((i) => i + 1);
  }, []);

  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  // Color for the correct answer badge in explanation
  const correctActionColor = ACTION_COLORS[puzzle.correctAction] || "bg-zinc-600 text-white";

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="text-zinc-500">
            Score:{" "}
            <span className="text-zinc-200 font-mono">
              {stats.correct}/{stats.total}
            </span>{" "}
            <span className="text-zinc-600">({pct}%)</span>
          </span>
          <span className="text-zinc-500">
            Streak: <span className="text-zinc-200 font-mono">{streak}</span>
          </span>
          {bestStreak > 0 && (
            <span className="text-zinc-500">
              Best: <span className="text-zinc-200 font-mono">{bestStreak}</span>
            </span>
          )}
        </div>
        <Badge variant="outline" className={difficultyColor(puzzle.difficulty)}>
          {puzzle.difficulty}
        </Badge>
      </div>

      {/* The hand */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-8">
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
            <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Your hand
            </p>
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
                "px-4 py-2 rounded-lg text-sm font-medium transition-all ";

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
                </button>
              );
            })}
          </div>
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
            <p className="text-sm text-zinc-400 mt-2">{puzzle.explanation}</p>
          </div>
        )}

        {selectedButton !== null && (
          <button
            onClick={nextPuzzle}
            className="w-full py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium transition-colors"
          >
            Next Puzzle {"\u2192"}
          </button>
        )}
      </div>
    </div>
  );
}
