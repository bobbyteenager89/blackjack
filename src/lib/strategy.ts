// Basic Strategy for 4-8 deck, Dealer Hits Soft 17 (H17)
// Actions: H=Hit, S=Stand, D=Double(hit if can't), Ds=Double(stand if can't),
//          SP=Split, Rh=Surrender(hit if can't), Rs=Surrender(stand if can't), Rp=Surrender(split if can't)

export type Action = "H" | "S" | "D" | "Ds" | "SP" | "Rh" | "Rs" | "Rp";

// Labels for display
export const ACTION_LABELS: Record<Action, string> = {
  H: "Hit",
  S: "Stand",
  D: "Double",
  Ds: "Double/Stand",
  SP: "Split",
  Rh: "Surrender/Hit",
  Rs: "Surrender/Stand",
  Rp: "Surrender/Split",
};

export const ACTION_COLORS: Record<Action, string> = {
  H: "bg-red-600/80 text-white",
  S: "bg-green-600/80 text-white",
  D: "bg-yellow-500/80 text-black",
  Ds: "bg-yellow-600/80 text-black",
  SP: "bg-blue-500/80 text-white",
  Rh: "bg-purple-600/80 text-white",
  Rs: "bg-purple-700/80 text-white",
  Rp: "bg-purple-500/80 text-white",
};

export const ACTION_SHORT_COLORS: Record<Action, string> = {
  H: "bg-red-600/90",
  S: "bg-green-600/90",
  D: "bg-yellow-500/90",
  Ds: "bg-yellow-600/90",
  SP: "bg-blue-500/90",
  Rh: "bg-purple-600/90",
  Rs: "bg-purple-700/90",
  Rp: "bg-purple-500/90",
};

// ── Hard totals (rows: 5-21, cols: dealer 2-A) ──────────────

//                    2     3     4     5     6     7     8     9     10    A
export const HARD: Record<number, Action[]> = {
  5:  ["H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H" ],
  6:  ["H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H" ],
  7:  ["H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H" ],
  8:  ["H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H" ],
  9:  ["H",  "D",  "D",  "D",  "D",  "H",  "H",  "H",  "H",  "H" ],
  10: ["D",  "D",  "D",  "D",  "D",  "D",  "D",  "D",  "H",  "H" ],
  11: ["D",  "D",  "D",  "D",  "D",  "D",  "D",  "D",  "D",  "D" ],
  12: ["H",  "H",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H" ],
  13: ["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H" ],
  14: ["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H" ],
  15: ["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "Rh", "Rh"],
  16: ["S",  "S",  "S",  "S",  "S",  "H",  "H",  "Rh", "Rh", "Rh"],
  17: ["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "Rs"],
  18: ["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S" ],
  19: ["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S" ],
  20: ["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S" ],
  21: ["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S" ],
};

// ── Soft totals (rows: A2-A9, cols: dealer 2-A) ─────────────

//                         2     3     4     5     6     7     8     9     10    A
export const SOFT: Record<string, Action[]> = {
  "A,2": ["H",  "H",  "H",  "D",  "D",  "H",  "H",  "H",  "H",  "H" ],
  "A,3": ["H",  "H",  "H",  "D",  "D",  "H",  "H",  "H",  "H",  "H" ],
  "A,4": ["H",  "H",  "D",  "D",  "D",  "H",  "H",  "H",  "H",  "H" ],
  "A,5": ["H",  "H",  "D",  "D",  "D",  "H",  "H",  "H",  "H",  "H" ],
  "A,6": ["H",  "D",  "D",  "D",  "D",  "H",  "H",  "H",  "H",  "H" ],
  "A,7": ["Ds", "Ds", "Ds", "Ds", "Ds", "S",  "S",  "H",  "H",  "H" ],
  "A,8": ["S",  "S",  "S",  "S",  "Ds", "S",  "S",  "S",  "S",  "S" ],
  "A,9": ["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S" ],
};

// ── Pairs (rows: A,A - 10,10, cols: dealer 2-A) ─────────────

//                          2     3     4     5     6     7     8     9     10    A
export const PAIRS: Record<string, Action[]> = {
  "A,A": ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP"],
  "2,2": ["SP", "SP", "SP", "SP", "SP", "SP", "H",  "H",  "H",  "H" ],
  "3,3": ["SP", "SP", "SP", "SP", "SP", "SP", "H",  "H",  "H",  "H" ],
  "4,4": ["H",  "H",  "H",  "SP", "SP", "H",  "H",  "H",  "H",  "H" ],
  "5,5": ["D",  "D",  "D",  "D",  "D",  "D",  "D",  "D",  "H",  "H" ],
  "6,6": ["SP", "SP", "SP", "SP", "SP", "H",  "H",  "H",  "H",  "H" ],
  "7,7": ["SP", "SP", "SP", "SP", "SP", "SP", "H",  "H",  "H",  "H" ],
  "8,8": ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "Rp", "Rp"],
  "9,9": ["SP", "SP", "SP", "SP", "SP", "S",  "SP", "SP", "S",  "S" ],
  "10,10":["S", "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S" ],
};

// ── Lookup ───────────────────────────────────────────────────

import { type Card, type Rank, handValue, isPair, cardValue } from "./blackjack";

const DEALER_INDICES: Record<string, number> = {
  "2": 0, "3": 1, "4": 2, "5": 3, "6": 4,
  "7": 5, "8": 6, "9": 7, "10": 8, "J": 8, "Q": 8, "K": 8, "A": 9,
};

export function dealerIndex(rank: Rank): number {
  return DEALER_INDICES[rank];
}

export function getCorrectAction(
  playerCards: Card[],
  dealerUpcard: Rank,
  canSplit = true,
  canDouble = true,
  canSurrender = true
): Action {
  const di = dealerIndex(dealerUpcard);
  const hv = handValue(playerCards);

  // Check pairs first
  if (canSplit && isPair(playerCards)) {
    const pairKey =
      playerCards[0].rank === "A"
        ? "A,A"
        : `${cardValue(playerCards[0].rank)},${cardValue(playerCards[0].rank)}`;
    const pairAction = PAIRS[pairKey];
    if (pairAction) {
      let action = pairAction[di];
      if (action === "Rp" && !canSurrender) action = "SP";
      if (action !== "H" && action !== "S") return action;
      // If pair chart says H or S, fall through to hard/soft
    }
  }

  // Check soft totals
  if (hv.soft && playerCards.length === 2) {
    const nonAceCard = playerCards.find((c) => c.rank !== "A");
    if (nonAceCard) {
      const softKey = `A,${cardValue(nonAceCard.rank)}`;
      const softAction = SOFT[softKey];
      if (softAction) {
        let action = softAction[di];
        if ((action === "D" || action === "Ds") && !canDouble) {
          action = action === "Ds" ? "S" : "H";
        }
        return action;
      }
    }
    // Two aces handled by pairs above
  }

  // Hard totals
  const total = Math.min(hv.total, 21);
  const hardRow = HARD[total] || HARD[5];
  let action = hardRow[di];

  // Adjust for restrictions
  if ((action === "D" || action === "Ds") && !canDouble) {
    action = action === "Ds" ? "S" : "H";
  }
  if ((action === "Rh" || action === "Rs") && !canSurrender) {
    action = action === "Rs" ? "S" : "H";
  }

  return action;
}

// ── Puzzle definitions ───────────────────────────────────────

export interface Puzzle {
  id: string;
  playerCards: [Rank, Rank];
  dealerUpcard: Rank;
  correctAction: Action;
  difficulty: "hard" | "tricky" | "brutal";
  explanation: string;
}

export const PUZZLES: Puzzle[] = [
  // ── Brutal: Everyone gets these wrong ──
  {
    id: "soft18-vs-9",
    playerCards: ["A", "7"],
    dealerUpcard: "9",
    correctAction: "H",
    difficulty: "brutal",
    explanation:
      "Soft 18 feels strong, but vs dealer 9 you're actually an underdog. Hitting can't bust you (it's soft) and improves your expected value. Most players never hit 18.",
  },
  {
    id: "soft18-vs-10",
    playerCards: ["A", "7"],
    dealerUpcard: "10",
    correctAction: "H",
    difficulty: "brutal",
    explanation:
      "Soft 18 vs 10 is a losing hand either way, but hitting gives you a chance to improve. You can't bust a soft hand. Standing on 18 vs a dealer showing 10 loses more often than hitting.",
  },
  {
    id: "soft18-vs-A",
    playerCards: ["A", "7"],
    dealerUpcard: "A",
    correctAction: "H",
    difficulty: "brutal",
    explanation:
      "Against an Ace (with H17 rules), the dealer will hit their soft 17, making them even more dangerous. Your soft 18 needs improvement. Hit — you can't bust.",
  },
  {
    id: "88-vs-10",
    playerCards: ["8", "8"],
    dealerUpcard: "10",
    correctAction: "Rp",
    difficulty: "brutal",
    explanation:
      "16 is the worst hand in blackjack. Splitting 8s gives you two shots at making 18. Yes, you're putting more money out against a 10, but 16 is so bad that two hands of 8 are still better. Surrender if allowed, split if not.",
  },
  {
    id: "88-vs-A",
    playerCards: ["8", "8"],
    dealerUpcard: "A",
    correctAction: "Rp",
    difficulty: "brutal",
    explanation:
      "Same logic as 8,8 vs 10 but even scarier. 16 vs Ace is terrible. Split to escape it. Surrender if available, otherwise split.",
  },
  {
    id: "16-vs-10",
    playerCards: ["10", "6"],
    dealerUpcard: "10",
    correctAction: "Rh",
    difficulty: "brutal",
    explanation:
      "The most feared hand in blackjack. You lose either way most of the time, but surrendering loses only half your bet. If no surrender, hit — standing on 16 vs 10 is slightly worse.",
  },
  {
    id: "16-vs-A",
    playerCards: ["10", "6"],
    dealerUpcard: "A",
    correctAction: "Rh",
    difficulty: "brutal",
    explanation:
      "16 vs Ace is even worse than vs 10 with H17 rules. Surrender saves you money. If no surrender, hit.",
  },
  {
    id: "16-vs-9",
    playerCards: ["9", "7"],
    dealerUpcard: "9",
    correctAction: "H",
    difficulty: "brutal",
    explanation:
      "Dealer showing 9 will make 17+ about 77% of the time. Your 16 can't beat that by standing. Hit and hope for a 5 or less.",
  },
  {
    id: "12-vs-2",
    playerCards: ["10", "2"],
    dealerUpcard: "2",
    correctAction: "H",
    difficulty: "hard",
    explanation:
      "People think any 12 should stand vs a low card. But dealer 2 busts only ~35% of the time. With 12, you bust only with a 10 (31% chance). Hitting has better EV.",
  },
  {
    id: "12-vs-3",
    playerCards: ["10", "2"],
    dealerUpcard: "3",
    correctAction: "H",
    difficulty: "hard",
    explanation:
      "Similar to 12 vs 2. Dealer 3 still doesn't bust enough. You should stand on 12 only against 4, 5, or 6.",
  },
  // ── Tricky: Counterintuitive doubles and splits ──
  {
    id: "11-vs-A",
    playerCards: ["8", "3"],
    dealerUpcard: "A",
    correctAction: "D",
    difficulty: "tricky",
    explanation:
      "11 is a great doubling hand, even against an Ace. Under H17 rules, the dealer's Ace is slightly weaker. You still have about a 55% chance of winning with a double.",
  },
  {
    id: "soft18-vs-2",
    playerCards: ["A", "7"],
    dealerUpcard: "2",
    correctAction: "Ds",
    difficulty: "tricky",
    explanation:
      "Double your soft 18 against dealer 2! You already have a good hand, and doubling extracts extra value. If you can't double, stand.",
  },
  {
    id: "soft18-vs-6",
    playerCards: ["A", "7"],
    dealerUpcard: "6",
    correctAction: "Ds",
    difficulty: "tricky",
    explanation:
      "Dealer 6 is the worst upcard. Your soft 18 is strong enough to double for extra profit. Can't bust, dealer likely busts.",
  },
  {
    id: "99-vs-9",
    playerCards: ["9", "9"],
    dealerUpcard: "9",
    correctAction: "SP",
    difficulty: "tricky",
    explanation:
      "You have 18, which seems good. But against a 9, the dealer will frequently make 19. Splitting gives you two shots at making 19. Note: stand on 18 vs 7 (you're ahead), but split vs 9.",
  },
  {
    id: "99-vs-A",
    playerCards: ["9", "9"],
    dealerUpcard: "A",
    correctAction: "S",
    difficulty: "tricky",
    explanation:
      "Unlike vs 9, here you stand. Against an Ace, splitting puts too much money at risk. 18 is not great but splitting into two hands of 9 against an Ace is worse.",
  },
  {
    id: "A7-vs-3",
    playerCards: ["A", "7"],
    dealerUpcard: "3",
    correctAction: "Ds",
    difficulty: "tricky",
    explanation:
      "Double soft 18 against dealer 3-6. The dealer is weak and you have a flexible hand that can't bust. Extract maximum value.",
  },
  {
    id: "soft17-vs-2",
    playerCards: ["A", "6"],
    dealerUpcard: "2",
    correctAction: "H",
    difficulty: "tricky",
    explanation:
      "Soft 17 should always be hit or doubled. Never stand on soft 17 — even the casino hits it (that's the H17 rule). Against 2, just hit. Against 3-6, double.",
  },
  {
    id: "A6-vs-4",
    playerCards: ["A", "6"],
    dealerUpcard: "4",
    correctAction: "D",
    difficulty: "tricky",
    explanation:
      "Double your soft 17 against dealer 4. The dealer is weak and you have a flexible hand. This is one of those 'it feels wrong but the math is clear' plays.",
  },
  {
    id: "15-vs-10",
    playerCards: ["10", "5"],
    dealerUpcard: "10",
    correctAction: "Rh",
    difficulty: "hard",
    explanation:
      "15 vs 10 is a surrender spot. You'll lose more than 50% of the time no matter what. Save half your bet. If no surrender, hit.",
  },
  {
    id: "hard17-vs-A",
    playerCards: ["10", "7"],
    dealerUpcard: "A",
    correctAction: "Rs",
    difficulty: "hard",
    explanation:
      "Hard 17 vs Ace is a surrender in H17 games. The dealer will hit their soft 17, and hard 17 can't improve. You lose more than half the time — surrender saves money.",
  },
  {
    id: "44-vs-5",
    playerCards: ["4", "4"],
    dealerUpcard: "5",
    correctAction: "SP",
    difficulty: "tricky",
    explanation:
      "Most people just hit 8 here. But against dealer 5, splitting gives you two hands starting from 4 — each with a chance to double. The dealer is very weak.",
  },
  {
    id: "10-vs-A",
    playerCards: ["4", "6"],
    dealerUpcard: "A",
    correctAction: "H",
    difficulty: "hard",
    explanation:
      "10 vs Ace — don't double! The Ace is too strong. Under H17 rules, the dealer's Ace is slightly weaker, but not enough to justify doubling. Just hit.",
  },
  {
    id: "9-vs-2",
    playerCards: ["4", "5"],
    dealerUpcard: "2",
    correctAction: "H",
    difficulty: "hard",
    explanation:
      "9 vs 2 — don't double! The dealer 2 isn't weak enough. Only double 9 against 3-6.",
  },
];

// Shuffle and return puzzles
export function getShuffledPuzzles(): Puzzle[] {
  const shuffled = [...PUZZLES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
