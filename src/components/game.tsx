"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { type RuleSet } from "@/lib/rules";
import { HandDisplay } from "./card-display";
import {
  type Card,
  createShoe,
  handValue,
  isBusted,
  isBlackjack,
  isPair,
  cardValue,
} from "@/lib/blackjack";
import { getCorrectAction, ACTION_LABELS, ACTION_COLORS } from "@/lib/strategy";
import {
  loadLearningState,
  saveLearningState,
  recordAttempt,
  type LearningState,
} from "@/lib/learning";

type GamePhase = "betting" | "playing" | "dealer" | "result";

interface GameState {
  shoe: Card[];
  playerCards: Card[];
  dealerCards: Card[];
  phase: GamePhase;
  result: string;
  payout: number;
  balance: number;
  bet: number;
  hasDoubled: boolean;
  hint: string | null;
  showHint: boolean;
  handsPlayed: number;
  correctPlays: number;
}

function drawCard(shoe: Card[]): [Card, Card[]] {
  if (shoe.length < 20) {
    const newShoe = createShoe();
    return [newShoe[0], newShoe.slice(1)];
  }
  return [shoe[0], shoe.slice(1)];
}

function initialState(): GameState {
  return {
    shoe: createShoe(),
    playerCards: [],
    dealerCards: [],
    phase: "betting",
    result: "",
    payout: 0,
    balance: 1000,
    bet: 10,
    hasDoubled: false,
    hint: null,
    showHint: false,
    handsPlayed: 0,
    correctPlays: 0,
  };
}

// Build a scenario ID from the current hand for learning engine
function buildScenarioId(playerCards: Card[], dealerCards: Card[]): string | null {
  if (playerCards.length < 2 || dealerCards.length < 2) return null;

  const dealerRank = dealerCards[0].rank;
  const dealerLabel =
    ["J", "Q", "K"].includes(dealerRank) ? "10" : dealerRank;

  // Check pairs
  if (isPair(playerCards)) {
    const rank = playerCards[0].rank;
    const pairKey =
      rank === "A"
        ? "A,A"
        : `${cardValue(rank)},${cardValue(rank)}`;
    return `pair-${pairKey}-vs-${dealerLabel}`;
  }

  // Check soft
  const hv = handValue(playerCards);
  if (hv.soft && playerCards.length === 2) {
    const nonAce = playerCards.find((c) => c.rank !== "A");
    if (nonAce) {
      const val = cardValue(nonAce.rank);
      return `soft-A,${val}-vs-${dealerLabel}`;
    }
  }

  // Hard total
  const total = Math.min(hv.total, 21);
  return `hard-${total}-vs-${dealerLabel}`;
}

// Human-readable hand total label
function handTotalLabel(cards: Card[]): string {
  if (cards.length < 2) return "";
  if (isPair(cards)) {
    const rank = cards[0].rank;
    const label = rank === "A" ? "Ace" : String(cardValue(rank));
    const plural = rank === "A" ? "Aces" : `${label}s`;
    return `Pair of ${plural}`;
  }
  const hv = handValue(cards);
  if (hv.soft) return `Soft ${hv.total}`;
  return `Hard ${hv.total}`;
}

export function BlackjackGame({ rules }: { rules: RuleSet }) {
  const [state, setState] = useState<GameState>(initialState);
  // We keep learning state in a ref so callbacks always see the latest
  const learningRef = useRef<LearningState | null>(null);

  useEffect(() => {
    learningRef.current = loadLearningState();
  }, []);

  const deal = useCallback(() => {
    setState((s) => {
      let shoe = [...s.shoe];
      const playerCards: Card[] = [];
      const dealerCards: Card[] = [];

      let card: Card;
      [card, shoe] = drawCard(shoe);
      playerCards.push(card);
      [card, shoe] = drawCard(shoe);
      dealerCards.push(card);
      [card, shoe] = drawCard(shoe);
      playerCards.push(card);
      [card, shoe] = drawCard(shoe);
      dealerCards.push(card);

      // Check for blackjack
      if (isBlackjack(playerCards)) {
        if (isBlackjack(dealerCards)) {
          return {
            ...s,
            shoe,
            playerCards,
            dealerCards,
            phase: "result",
            result: "Push — both blackjack",
            payout: 0,
            showHint: false,
            hint: null,
          };
        }
        return {
          ...s,
          shoe,
          playerCards,
          dealerCards,
          phase: "result",
          result: "Blackjack! 3:2 payout",
          payout: Math.floor(s.bet * 1.5),
          balance: s.balance + Math.floor(s.bet * 1.5),
          showHint: false,
          hint: null,
        };
      }

      const correct = getCorrectAction(playerCards, dealerCards[0].rank, true, true, rules.surrenderAllowed);

      return {
        ...s,
        shoe,
        playerCards,
        dealerCards,
        phase: "playing",
        result: "",
        payout: 0,
        hasDoubled: false,
        showHint: false,
        hint: ACTION_LABELS[correct],
      };
    });
  }, [rules.surrenderAllowed]);

  const playDealer = useCallback((dealerCards: Card[], shoe: Card[]): [Card[], Card[]] => {
    const cards = [...dealerCards];
    let s = [...shoe];
    let hv = handValue(cards);

    while (hv.total < 17 || (rules.dealerHitsSoft17 && hv.total === 17 && hv.soft)) {
      let card: Card;
      [card, s] = drawCard(s);
      cards.push(card);
      hv = handValue(cards);
    }
    return [cards, s];
  }, [rules.dealerHitsSoft17]);

  const resolveHand = useCallback(
    (
      playerCards: Card[],
      dealerCards: Card[],
      shoe: Card[],
      bet: number,
      balance: number,
      doubled: boolean
    ): Partial<GameState> => {
      const [finalDealer, finalShoe] = playDealer(dealerCards, shoe);
      const playerTotal = handValue(playerCards).total;
      const dealerTotal = handValue(finalDealer).total;
      const actualBet = doubled ? bet * 2 : bet;

      let result: string;
      let payout: number;

      if (isBusted(playerCards)) {
        result = `Bust! You lose $${actualBet}`;
        payout = -actualBet;
      } else if (isBusted(finalDealer)) {
        result = `Dealer busts! You win $${actualBet}`;
        payout = actualBet;
      } else if (playerTotal > dealerTotal) {
        result = `${playerTotal} beats ${dealerTotal}. You win $${actualBet}`;
        payout = actualBet;
      } else if (playerTotal < dealerTotal) {
        result = `${dealerTotal} beats ${playerTotal}. You lose $${actualBet}`;
        payout = -actualBet;
      } else {
        result = `Push at ${playerTotal}`;
        payout = 0;
      }

      return {
        dealerCards: finalDealer,
        shoe: finalShoe,
        phase: "result",
        result,
        payout,
        balance: balance + payout,
      };
    },
    [playDealer]
  );

  // Record action in learning engine
  const recordLearningAttempt = useCallback(
    (playerCards: Card[], dealerCards: Card[], actionTaken: string) => {
      const scenarioId = buildScenarioId(playerCards, dealerCards);
      if (!scenarioId || !learningRef.current) return;

      const correct = getCorrectAction(
        playerCards,
        dealerCards[0].rank,
        isPair(playerCards),
        playerCards.length === 2,
        rules.surrenderAllowed && playerCards.length === 2
      );
      const normalizedCorrect = normalizeForCheck(correct);
      const normalizedAction = normalizeForCheck(actionTaken);
      const isCorrect = normalizedAction === normalizedCorrect;

      learningRef.current = recordAttempt(learningRef.current, scenarioId, isCorrect);
      saveLearningState(learningRef.current);
    },
    [rules.surrenderAllowed]
  );

  const checkPlay = useCallback(
    (action: string) => {
      const correct = getCorrectAction(
        state.playerCards,
        state.dealerCards[0].rank,
        isPair(state.playerCards),
        state.playerCards.length === 2,
        rules.surrenderAllowed && state.playerCards.length === 2
      );
      const normalizedCorrect = normalizeForCheck(correct);
      const normalizedAction = normalizeForCheck(action);
      const isCorrect = normalizedAction === normalizedCorrect;

      setState((s) => ({
        ...s,
        handsPlayed: s.handsPlayed + 1,
        correctPlays: s.correctPlays + (isCorrect ? 1 : 0),
      }));

      // Feed into learning engine
      recordLearningAttempt(state.playerCards, state.dealerCards, action);
    },
    [state.playerCards, state.dealerCards, rules.surrenderAllowed, recordLearningAttempt]
  );

  const hit = useCallback(() => {
    checkPlay("H");
    setState((s) => {
      let shoe = [...s.shoe];
      let card: Card;
      [card, shoe] = drawCard(shoe);
      const newCards = [...s.playerCards, card];

      if (isBusted(newCards)) {
        const actualBet = s.hasDoubled ? s.bet * 2 : s.bet;
        return {
          ...s,
          shoe,
          playerCards: newCards,
          phase: "result" as const,
          result: `Bust! You lose $${actualBet}`,
          payout: -actualBet,
          balance: s.balance - actualBet,
          hint: null,
          showHint: false,
        };
      }

      const correct = getCorrectAction(newCards, s.dealerCards[0].rank, false, false, false);

      return {
        ...s,
        shoe,
        playerCards: newCards,
        hint: ACTION_LABELS[correct],
        showHint: false,
      };
    });
  }, [checkPlay]);

  const stand = useCallback(() => {
    checkPlay("S");
    setState((s) => {
      const resolved = resolveHand(
        s.playerCards,
        s.dealerCards,
        s.shoe,
        s.bet,
        s.balance,
        s.hasDoubled
      );
      return { ...s, ...resolved, hint: null, showHint: false };
    });
  }, [checkPlay, resolveHand]);

  const double = useCallback(() => {
    checkPlay("D");
    setState((s) => {
      let shoe = [...s.shoe];
      let card: Card;
      [card, shoe] = drawCard(shoe);
      const newCards = [...s.playerCards, card];

      if (isBusted(newCards)) {
        return {
          ...s,
          shoe,
          playerCards: newCards,
          hasDoubled: true,
          phase: "result" as const,
          result: `Bust! You lose $${s.bet * 2}`,
          payout: -s.bet * 2,
          balance: s.balance - s.bet * 2,
          hint: null,
          showHint: false,
        };
      }

      const resolved = resolveHand(newCards, s.dealerCards, shoe, s.bet, s.balance, true);
      return {
        ...s,
        ...resolved,
        playerCards: newCards,
        hasDoubled: true,
        hint: null,
        showHint: false,
      };
    });
  }, [checkPlay, resolveHand]);

  const surrender = useCallback(() => {
    checkPlay("Rh");
    setState((s) => ({
      ...s,
      phase: "result",
      result: `Surrendered. You lose $${Math.floor(s.bet / 2)}`,
      payout: -Math.floor(s.bet / 2),
      balance: s.balance - Math.floor(s.bet / 2),
      hint: null,
      showHint: false,
    }));
  }, [checkPlay]);

  const toggleHint = useCallback(() => {
    setState((s) => ({ ...s, showHint: !s.showHint }));
  }, []);

  // Keyboard shortcuts during play
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (state.phase !== "playing" && state.phase !== "result" && state.phase !== "betting") return;

      const key = e.key.toUpperCase();

      if (state.phase === "betting" && (key === "ENTER" || e.key === " ")) {
        e.preventDefault();
        deal();
        return;
      }

      if (state.phase === "result" && (key === "ENTER" || e.key === " " || key === "D")) {
        e.preventDefault();
        deal();
        return;
      }

      if (state.phase === "playing") {
        if (key === "H") { e.preventDefault(); hit(); }
        else if (key === "S") { e.preventDefault(); stand(); }
        else if (key === "D" && state.playerCards.length === 2) { e.preventDefault(); double(); }
        else if (key === "R" && rules.surrenderAllowed && state.playerCards.length === 2) { e.preventDefault(); surrender(); }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase, state.playerCards.length, deal, hit, stand, double, surrender, rules.surrenderAllowed]);

  const playerHV = handValue(state.playerCards);
  const dealerHV = handValue(state.dealerCards);
  const accuracy =
    state.handsPlayed > 0
      ? Math.round((state.correctPlays / state.handsPlayed) * 100)
      : 0;

  const playerHandLabel = handTotalLabel(state.playerCards);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="text-zinc-500">
            Balance:{" "}
            <span className="text-zinc-200 font-mono">${state.balance}</span>
          </span>
          <span className="text-zinc-500">
            Bet: <span className="text-zinc-200 font-mono">${state.bet}</span>
          </span>
        </div>
        {state.handsPlayed > 0 && (
          <span className="text-zinc-500">
            Strategy accuracy:{" "}
            <span
              className={`font-mono ${accuracy >= 80 ? "text-green-400" : accuracy >= 60 ? "text-yellow-400" : "text-red-400"}`}
            >
              {accuracy}%
            </span>{" "}
            <span className="text-zinc-600">
              ({state.correctPlays}/{state.handsPlayed})
            </span>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-6 space-y-6 min-h-[320px]">
        {state.phase === "betting" ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-zinc-400 text-sm">Place your bet and deal</p>
            <div className="flex gap-2">
              {[5, 10, 25, 50, 100].map((b) => (
                <button
                  key={b}
                  onClick={() => setState((s) => ({ ...s, bet: b }))}
                  className={`w-12 h-12 rounded-full text-sm font-bold transition-all ${
                    state.bet === b
                      ? "bg-yellow-500 text-black scale-110"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  ${b}
                </button>
              ))}
            </div>
            <button
              onClick={deal}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors mt-2"
            >
              Deal <span className="text-emerald-300 text-xs font-normal ml-1">[Enter]</span>
            </button>
          </div>
        ) : (
          <>
            {/* Hands: responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Dealer hand */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                    Dealer
                  </p>
                  {state.phase === "result" && (
                    <span className="text-xs font-mono text-zinc-400">
                      ({dealerHV.total}
                      {dealerHV.soft ? " soft" : ""})
                    </span>
                  )}
                </div>
                <HandDisplay
                  cards={state.dealerCards}
                  hideSecond={state.phase === "playing"}
                />
              </div>

              {/* Player hand */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                    Your Hand
                  </p>
                  {state.playerCards.length >= 2 && (
                    <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded">
                      {playerHandLabel}
                    </span>
                  )}
                </div>
                <HandDisplay cards={state.playerCards} />
              </div>
            </div>

            {/* Actions */}
            {state.phase === "playing" && (
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={hit}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Hit <span className="text-red-300 text-xs font-normal">[H]</span>
                </button>
                <button
                  onClick={stand}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Stand <span className="text-green-300 text-xs font-normal">[S]</span>
                </button>
                {state.playerCards.length === 2 && (
                  <button
                    onClick={double}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Double <span className="text-yellow-700 text-xs font-normal">[D]</span>
                  </button>
                )}
                {rules.surrenderAllowed && state.playerCards.length === 2 && (
                  <button
                    onClick={surrender}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Surrender <span className="text-purple-300 text-xs font-normal">[R]</span>
                  </button>
                )}

                <div className="ml-auto">
                  <button
                    onClick={toggleHint}
                    className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
                      state.showHint
                        ? "bg-zinc-600 text-zinc-200"
                        : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {state.showHint ? `Hint: ${state.hint}` : "Show Hint"}
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {state.phase === "result" && (
              <div className="space-y-3 pt-2">
                <p
                  className={`text-sm font-medium ${
                    state.payout > 0
                      ? "text-green-400"
                      : state.payout < 0
                        ? "text-red-400"
                        : "text-zinc-400"
                  }`}
                >
                  {state.result}
                </p>
                <button
                  onClick={deal}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Deal Again <span className="text-emerald-300 text-xs font-normal ml-1">[Enter]</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function normalizeForCheck(action: string): string {
  if (["Rh", "Rs", "Rp"].includes(action)) return "R";
  if (action === "Ds") return "D";
  return action;
}
