// Spaced repetition learning engine for blackjack strategy
// Persists to localStorage, tracks per-scenario performance

import { HARD, SOFT, PAIRS, type Action, getCorrectAction } from "./strategy";
import type { Rank } from "./blackjack";

// ── Types ────────────────────────────────────────────────────

export type MasteryLevel = "unseen" | "learning" | "familiar" | "mastered";

export interface ScenarioRecord {
  id: string; // e.g. "hard-16-vs-10" or "pair-8,8-vs-A"
  category: "hard" | "soft" | "pair";
  playerLabel: string; // "16", "A,7", "8,8"
  dealerUpcard: string; // "2"-"10", "A"
  correctAction: Action;
  totalAttempts: number;
  correctAttempts: number;
  consecutiveCorrect: number; // reset on miss
  lastAttemptMs: number;
  lastCorrect: boolean;
  explanation: string;
}

export interface LearningState {
  scenarios: Record<string, ScenarioRecord>;
  sessionStats: {
    total: number;
    correct: number;
    streak: number;
    bestStreak: number;
  };
}

// ── Mastery thresholds ───────────────────────────────────────

const MASTERY_THRESHOLDS = {
  familiar: 2, // 2 consecutive correct → familiar
  mastered: 4, // 4 consecutive correct → mastered
};

export function getMasteryLevel(record: ScenarioRecord): MasteryLevel {
  if (record.totalAttempts === 0) return "unseen";
  if (record.consecutiveCorrect >= MASTERY_THRESHOLDS.mastered) return "mastered";
  if (record.consecutiveCorrect >= MASTERY_THRESHOLDS.familiar) return "familiar";
  return "learning";
}

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  unseen: "bg-zinc-800 text-zinc-500",
  learning: "bg-red-900/50 text-red-400",
  familiar: "bg-yellow-900/50 text-yellow-400",
  mastered: "bg-green-900/50 text-green-400",
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  unseen: "Unseen",
  learning: "Learning",
  familiar: "Familiar",
  mastered: "Mastered",
};

// ── Scenario explanations ────────────────────────────────────

function hardExplanation(total: number, dealer: string, action: Action): string {
  // Key counterintuitive plays get detailed explanations
  const key = `${total}-${dealer}`;
  const explanations: Record<string, string> = {
    "12-2": "Dealer 2 only busts ~35% of the time. Your 12 only busts if you draw a 10 (31%). Hitting has better expected value.",
    "12-3": "Same idea as 12 vs 2 — dealer 3 doesn't bust often enough. Stand only when dealer shows 4, 5, or 6.",
    "16-9": "Dealer 9 makes 17+ about 77% of the time. Your 16 loses by standing. Hit and hope.",
    "16-10": "The worst hand in blackjack. Surrender saves half your bet. Without surrender, hit — standing is slightly worse.",
    "16-A": "Even worse than 16 vs 10 with H17 rules. Surrender if you can.",
    "15-10": "15 vs 10 is a surrender hand. You lose more than half the time no matter what.",
    "17-A": "Hard 17 vs Ace — surrender in H17 games. Dealer hits soft 17, so they'll improve past your 17 too often.",
    "9-2": "Don't double 9 vs 2 — the dealer isn't weak enough. Only double 9 against 3-6.",
  };

  if (explanations[key]) return explanations[key];

  if (action === "H") return `With ${total}, you need to improve. Dealer ${dealer} is strong enough that standing loses more.`;
  if (action === "S") return `${total} is strong enough to stand against dealer ${dealer}. Let the dealer risk busting.`;
  if (action === "D") return `Double ${total} against dealer ${dealer} — you're favored, so get more money out.`;
  return `Basic strategy says ${action} for ${total} vs ${dealer}.`;
}

function softExplanation(otherCard: string, dealer: string, action: Action): string {
  const key = `A${otherCard}-${dealer}`;
  const explanations: Record<string, string> = {
    "A7-9": "Soft 18 feels strong, but vs 9 you're an underdog. Hitting can't bust you and improves your EV.",
    "A7-10": "Soft 18 vs 10 is a losing hand either way. Hitting gives you a chance to improve. You can't bust a soft hand.",
    "A7-A": "Against an Ace with H17, the dealer hits soft 17 making them more dangerous. Your soft 18 needs improvement.",
    "A7-2": "Double soft 18 vs 2! You have a good hand, doubling extracts extra value.",
    "A7-3": "Double soft 18 vs 3-6. Dealer is weak, your hand is flexible.",
    "A7-4": "Double soft 18 vs dealer 4. Weak dealer + flexible hand = get more money out.",
    "A7-5": "Double soft 18 vs dealer 5. Classic double spot.",
    "A7-6": "Double soft 18 vs 6. Dealer 6 is the worst upcard. Maximize profit.",
    "A6-2": "Soft 17 — always hit or double, never stand. Even the casino hits it (H17 rule).",
    "A6-3": "Double soft 17 vs 3. Dealer is weak, your hand is flexible.",
    "A6-4": "Double soft 17 vs 4. Feels wrong but the math is clear.",
    "A6-5": "Double soft 17 vs 5. Weak dealer = double.",
    "A6-6": "Double soft 17 vs 6. Best spot to double a soft 17.",
  };

  if (explanations[key]) return explanations[key];

  const softTotal = 11 + parseInt(otherCard);
  if (action === "H") return `Soft ${softTotal} needs improvement against dealer ${dealer}. You can't bust.`;
  if (action === "S") return `Soft ${softTotal} is strong enough to stand against dealer ${dealer}.`;
  if (action === "D" || action === "Ds") return `Double soft ${softTotal} against dealer ${dealer} — flexible hand vs weak dealer.`;
  return `Basic strategy says ${action} for A,${otherCard} vs ${dealer}.`;
}

function pairExplanation(card: string, dealer: string, action: Action): string {
  const key = `${card}${card}-${dealer}`;
  const explanations: Record<string, string> = {
    "88-10": "16 is the worst hand. Splitting gives two shots at 18. Yes it's scary, but 16 is SO bad that two 8s are better.",
    "88-A": "Same logic — 16 vs Ace is terrible. Split to escape. Surrender first if allowed.",
    "88-9": "16 vs 9 is bad. Split to get two chances at 18.",
    "99-9": "18 seems good, but dealer 9 will often make 19. Split gives two shots at 19.",
    "99-7": "Stand on 18 vs 7 — you're ahead. Don't split here.",
    "99-10": "Stand on 18 vs 10. Splitting into two 9s against 10 puts too much money at risk.",
    "99-A": "Stand on 18 vs A. Splitting is too risky here.",
    "44-5": "Split 4s against dealer 5. Each 4 can build into a good hand against a weak dealer.",
    "44-6": "Split 4s against dealer 6. Dealer 6 busts often, give yourself two chances.",
    "AA-A": "Always split Aces. Two chances at 21 beats a soft 12.",
  };

  if (explanations[key]) return explanations[key];

  const pairTotal = card === "A" ? 12 : parseInt(card) * 2;
  if (action === "SP" || action === "Rp") return `Split ${card}s against dealer ${dealer}. Two separate hands give better odds than ${pairTotal}.`;
  if (action === "H") return `Don't split ${card}s vs ${dealer} — just play it as ${pairTotal} and hit.`;
  if (action === "S") return `Don't split ${card}s vs ${dealer} — ${pairTotal} is strong enough to stand.`;
  if (action === "D") return `Don't split ${card}s vs ${dealer} — double your ${pairTotal} instead.`;
  return `Basic strategy says ${action} for ${card},${card} vs ${dealer}.`;
}

// ── Build all scenarios ──────────────────────────────────────

const DEALER_UPCARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

function buildAllScenarios(): Record<string, ScenarioRecord> {
  const scenarios: Record<string, ScenarioRecord> = {};

  // Hard totals (5-21, but only 8-21 are interesting — below 8 is always hit)
  for (let total = 8; total <= 17; total++) {
    for (const dealer of DEALER_UPCARDS) {
      const di = DEALER_UPCARDS.indexOf(dealer);
      const action = HARD[total]?.[di];
      if (!action || (total <= 11 && action === "H")) continue; // Skip trivial always-hit

      const id = `hard-${total}-vs-${dealer}`;
      scenarios[id] = {
        id,
        category: "hard",
        playerLabel: String(total),
        dealerUpcard: dealer,
        correctAction: action,
        totalAttempts: 0,
        correctAttempts: 0,
        consecutiveCorrect: 0,
        lastAttemptMs: 0,
        lastCorrect: true,
        explanation: hardExplanation(total, dealer, action),
      };
    }
  }

  // Soft totals
  for (const [softKey, actions] of Object.entries(SOFT)) {
    const otherCard = softKey.split(",")[1];
    for (let di = 0; di < DEALER_UPCARDS.length; di++) {
      const dealer = DEALER_UPCARDS[di];
      const action = actions[di];
      const id = `soft-${softKey}-vs-${dealer}`;
      scenarios[id] = {
        id,
        category: "soft",
        playerLabel: softKey,
        dealerUpcard: dealer,
        correctAction: action,
        totalAttempts: 0,
        correctAttempts: 0,
        consecutiveCorrect: 0,
        lastAttemptMs: 0,
        lastCorrect: true,
        explanation: softExplanation(otherCard, dealer, action),
      };
    }
  }

  // Pairs
  for (const [pairKey, actions] of Object.entries(PAIRS)) {
    const card = pairKey.split(",")[0];
    for (let di = 0; di < DEALER_UPCARDS.length; di++) {
      const dealer = DEALER_UPCARDS[di];
      const action = actions[di];
      const id = `pair-${pairKey}-vs-${dealer}`;
      scenarios[id] = {
        id,
        category: "pair",
        playerLabel: pairKey,
        dealerUpcard: dealer,
        correctAction: action,
        totalAttempts: 0,
        correctAttempts: 0,
        consecutiveCorrect: 0,
        lastAttemptMs: 0,
        lastCorrect: true,
        explanation: pairExplanation(card, dealer, action),
      };
    }
  }

  return scenarios;
}

// ── Persistence ──────────────────────────────────────────────

const STORAGE_KEY = "blackjack-trainer-v1";

export function loadLearningState(): LearningState {
  if (typeof window === "undefined") return createFreshState();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LearningState;
      // Merge with fresh scenarios in case we added new ones
      const fresh = buildAllScenarios();
      for (const id of Object.keys(fresh)) {
        if (!parsed.scenarios[id]) {
          parsed.scenarios[id] = fresh[id];
        }
      }
      return parsed;
    }
  } catch {
    // Corrupt data, start fresh
  }

  return createFreshState();
}

function createFreshState(): LearningState {
  return {
    scenarios: buildAllScenarios(),
    sessionStats: { total: 0, correct: 0, streak: 0, bestStreak: 0 },
  };
}

export function saveLearningState(state: LearningState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full, silently fail
  }
}

// ── Scenario selection (spaced repetition) ───────────────────

export function pickNextScenario(state: LearningState): ScenarioRecord {
  const all = Object.values(state.scenarios);
  const now = Date.now();

  // Score each scenario — higher = more urgent to review
  const scored = all.map((s) => {
    let score = 0;

    const mastery = getMasteryLevel(s);

    // Unseen scenarios get high priority
    if (mastery === "unseen") {
      score += 50 + Math.random() * 20;
    }

    // Recently missed scenarios get highest priority
    if (mastery === "learning") {
      const recency = s.lastAttemptMs ? (now - s.lastAttemptMs) / 1000 / 60 : 999; // minutes ago
      // If missed recently, show again soon
      if (!s.lastCorrect) {
        score += 100 - Math.min(recency, 50); // Higher score if recent miss
      } else {
        score += 40;
      }
    }

    // Familiar but not yet mastered — review periodically
    if (mastery === "familiar") {
      const recency = s.lastAttemptMs ? (now - s.lastAttemptMs) / 1000 / 60 : 999;
      score += 20 + Math.min(recency / 5, 20); // Slowly increase priority over time
    }

    // Mastered — occasional review, low priority
    if (mastery === "mastered") {
      const recency = s.lastAttemptMs ? (now - s.lastAttemptMs) / 1000 / 60 : 999;
      score += Math.min(recency / 30, 10); // Very slow increase
    }

    // Low accuracy boost
    if (s.totalAttempts > 0) {
      const accuracy = s.correctAttempts / s.totalAttempts;
      if (accuracy < 0.5) score += 30;
      else if (accuracy < 0.75) score += 15;
    }

    // Small random factor to prevent exact repetition
    score += Math.random() * 5;

    return { scenario: s, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored[0].scenario;
}

// ── Record an attempt ────────────────────────────────────────

export function recordAttempt(
  state: LearningState,
  scenarioId: string,
  correct: boolean
): LearningState {
  const scenario = state.scenarios[scenarioId];
  if (!scenario) return state;

  const updated: ScenarioRecord = {
    ...scenario,
    totalAttempts: scenario.totalAttempts + 1,
    correctAttempts: scenario.correctAttempts + (correct ? 1 : 0),
    consecutiveCorrect: correct ? scenario.consecutiveCorrect + 1 : 0,
    lastAttemptMs: Date.now(),
    lastCorrect: correct,
  };

  const sessionStats = {
    total: state.sessionStats.total + 1,
    correct: state.sessionStats.correct + (correct ? 1 : 0),
    streak: correct ? state.sessionStats.streak + 1 : 0,
    bestStreak: correct
      ? Math.max(state.sessionStats.bestStreak, state.sessionStats.streak + 1)
      : state.sessionStats.bestStreak,
  };

  const newState = {
    ...state,
    scenarios: { ...state.scenarios, [scenarioId]: updated },
    sessionStats,
  };

  saveLearningState(newState);
  return newState;
}

// ── Stats ────────────────────────────────────────────────────

export interface MasteryStats {
  unseen: number;
  learning: number;
  familiar: number;
  mastered: number;
  total: number;
  overallAccuracy: number;
  weakestScenarios: ScenarioRecord[];
}

export function getMasteryStats(state: LearningState): MasteryStats {
  const all = Object.values(state.scenarios);
  const counts = { unseen: 0, learning: 0, familiar: 0, mastered: 0 };
  let totalAttempts = 0;
  let totalCorrect = 0;

  for (const s of all) {
    counts[getMasteryLevel(s)]++;
    totalAttempts += s.totalAttempts;
    totalCorrect += s.correctAttempts;
  }

  // Get weakest scenarios (most missed, at least 1 attempt)
  const weakest = all
    .filter((s) => s.totalAttempts > 0 && s.correctAttempts / s.totalAttempts < 0.75)
    .sort((a, b) => {
      const accA = a.correctAttempts / a.totalAttempts;
      const accB = b.correctAttempts / b.totalAttempts;
      return accA - accB;
    })
    .slice(0, 10);

  return {
    ...counts,
    total: all.length,
    overallAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
    weakestScenarios: weakest,
  };
}

// ── Category stats for the progress grid ─────────────────────

export interface CategoryProgress {
  category: "hard" | "soft" | "pair";
  rows: {
    label: string;
    cells: { dealer: string; mastery: MasteryLevel; accuracy: number; attempts: number }[];
  }[];
}

export function getCategoryProgress(state: LearningState): CategoryProgress[] {
  const dealers = DEALER_UPCARDS;
  const categories: CategoryProgress[] = [];

  // Hard totals
  const hardRows: CategoryProgress["rows"] = [];
  for (let total = 17; total >= 8; total--) {
    const cells = dealers.map((d) => {
      const id = `hard-${total}-vs-${d}`;
      const s = state.scenarios[id];
      if (!s) return { dealer: d, mastery: "unseen" as MasteryLevel, accuracy: 0, attempts: 0 };
      return {
        dealer: d,
        mastery: getMasteryLevel(s),
        accuracy: s.totalAttempts > 0 ? s.correctAttempts / s.totalAttempts : 0,
        attempts: s.totalAttempts,
      };
    });
    hardRows.push({ label: String(total), cells });
  }
  categories.push({ category: "hard", rows: hardRows });

  // Soft totals
  const softRows: CategoryProgress["rows"] = [];
  for (const key of Object.keys(SOFT)) {
    const cells = dealers.map((d) => {
      const id = `soft-${key}-vs-${d}`;
      const s = state.scenarios[id];
      if (!s) return { dealer: d, mastery: "unseen" as MasteryLevel, accuracy: 0, attempts: 0 };
      return {
        dealer: d,
        mastery: getMasteryLevel(s),
        accuracy: s.totalAttempts > 0 ? s.correctAttempts / s.totalAttempts : 0,
        attempts: s.totalAttempts,
      };
    });
    softRows.push({ label: key, cells });
  }
  categories.push({ category: "soft", rows: softRows });

  // Pairs
  const pairRows: CategoryProgress["rows"] = [];
  for (const key of Object.keys(PAIRS)) {
    const cells = dealers.map((d) => {
      const id = `pair-${key}-vs-${d}`;
      const s = state.scenarios[id];
      if (!s) return { dealer: d, mastery: "unseen" as MasteryLevel, accuracy: 0, attempts: 0 };
      return {
        dealer: d,
        mastery: getMasteryLevel(s),
        accuracy: s.totalAttempts > 0 ? s.correctAttempts / s.totalAttempts : 0,
        attempts: s.totalAttempts,
      };
    });
    pairRows.push({ label: key, cells });
  }
  categories.push({ category: "pair", rows: pairRows });

  return categories;
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
