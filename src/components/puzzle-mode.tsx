"use client";

import { useState, useCallback, useMemo } from "react";
import { CardDisplay } from "./card-display";
import { Badge } from "@/components/ui/badge";
import {
  type Puzzle,
  getShuffledPuzzles,
  ACTION_LABELS,
  ACTION_COLORS,
  type Action,
} from "@/lib/strategy";
import { type RuleSet } from "@/lib/rules";
import type { Card, Suit } from "@/lib/blackjack";

function makeFakeCard(rank: string): Card {
  const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
  return {
    rank: rank as Card["rank"],
    suit: suits[Math.floor(Math.random() * suits.length)],
  };
}

const ANSWER_OPTIONS: { action: Action; label: string }[] = [
  { action: "H", label: "Hit" },
  { action: "S", label: "Stand" },
  { action: "D", label: "Double" },
  { action: "SP", label: "Split" },
  { action: "Rh", label: "Surrender" },
];

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
    if (!rules.surrenderAllowed) {
      p = p.filter((pz) => !["Rh", "Rs", "Rp"].includes(pz.correctAction));
    }
    return p;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
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

  const isCorrect = selectedAction !== null && normalizeAction(selectedAction) === normalizeAction(puzzle.correctAction);
  const isWrong = selectedAction !== null && !isCorrect;

  const handleAnswer = useCallback(
    (action: Action) => {
      if (selectedAction !== null) return;
      setSelectedAction(action);
      const correct = normalizeAction(action) === normalizeAction(puzzle.correctAction);
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
    [selectedAction, puzzle, streak, bestStreak]
  );

  const nextPuzzle = useCallback(() => {
    setSelectedAction(null);
    setCurrentIndex((i) => i + 1);
  }, []);

  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

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
            {ANSWER_OPTIONS.map(({ action, label }) => {
              const isThis = selectedAction === action;
              const isCorrectAnswer =
                selectedAction !== null &&
                normalizeAction(action) === normalizeAction(puzzle.correctAction);

              let btnClass =
                "px-4 py-2 rounded-lg text-sm font-medium transition-all ";

              if (selectedAction === null) {
                btnClass +=
                  "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer";
              } else if (isCorrectAnswer) {
                btnClass += "bg-green-600 text-white ring-2 ring-green-400";
              } else if (isThis && isWrong) {
                btnClass += "bg-red-600 text-white ring-2 ring-red-400";
              } else {
                btnClass += "bg-zinc-800/50 text-zinc-600";
              }

              return (
                <button
                  key={action}
                  onClick={() => handleAnswer(action)}
                  disabled={selectedAction !== null}
                  className={btnClass}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {selectedAction !== null && (
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
                  className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                    ACTION_COLORS[puzzle.correctAction]
                  }`}
                >
                  {ACTION_LABELS[puzzle.correctAction]}
                </span>
              </span>
            </p>
            <p className="text-sm text-zinc-400 mt-2">{puzzle.explanation}</p>
          </div>
        )}

        {selectedAction !== null && (
          <button
            onClick={nextPuzzle}
            className="w-full py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium transition-colors"
          >
            Next Puzzle &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

// Normalize actions for comparison (surrender variants map to surrender)
function normalizeAction(action: Action): string {
  if (action === "Rh" || action === "Rs" || action === "Rp") return "R";
  if (action === "Ds") return "D";
  return action;
}
