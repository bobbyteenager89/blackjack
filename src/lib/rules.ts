export interface RuleSet {
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  surrenderAllowed: boolean;
  deckCount: number;
}

export const DEFAULT_RULES: RuleSet = {
  dealerHitsSoft17: true,
  doubleAfterSplit: true,
  surrenderAllowed: true,
  deckCount: 6,
};

export interface RuleOption {
  id: keyof RuleSet;
  label: string;
  type: "toggle" | "select";
  options?: { value: number; label: string }[];
  descriptions: Record<string, string>;
}

export const RULE_OPTIONS: RuleOption[] = [
  {
    id: "dealerHitsSoft17",
    label: "Dealer Soft 17",
    type: "toggle",
    descriptions: {
      true:
        "Dealer hits on soft 17 (H17). This is worse for the player — the dealer gets an extra chance to improve a weak hand. It bumps the house edge by about 0.2%. Most Vegas strip casinos use this rule.",
      false:
        "Dealer stands on soft 17 (S17). This is better for the player — the dealer can't improve their soft 17. Look for this rule at higher-limit tables. It changes a few key strategy plays, especially doubling and surrender decisions.",
    },
  },
  {
    id: "doubleAfterSplit",
    label: "Double After Split",
    type: "toggle",
    descriptions: {
      true:
        "You can double down after splitting a pair (DAS). This makes splitting more profitable, especially with pairs like 2s, 3s, and 4s against dealer bust cards. It reduces the house edge by about 0.14%.",
      false:
        "No doubling after split (NDAS). You can only hit or stand after splitting. This makes you less aggressive with splits — some pairs that are splits with DAS become hits without it.",
    },
  },
  {
    id: "surrenderAllowed",
    label: "Late Surrender",
    type: "toggle",
    descriptions: {
      true:
        "Late surrender is available — you can forfeit half your bet after the dealer checks for blackjack. This is most valuable with hard 15 and 16 against dealer 9, 10, or Ace. Reduces the house edge by about 0.07%.",
      false:
        "No surrender allowed. You must play every hand to completion. Without surrender, those ugly 15s and 16s against strong dealer cards become straight hits instead.",
    },
  },
  {
    id: "deckCount",
    label: "Number of Decks",
    type: "select",
    options: [
      { value: 1, label: "1 Deck" },
      { value: 2, label: "2 Decks" },
      { value: 6, label: "6 Decks" },
      { value: 8, label: "8 Decks" },
    ],
    descriptions: {
      "1":
        "Single deck blackjack has the lowest house edge (~0.17% with perfect strategy). Card composition effects are stronger — you're more likely to get a blackjack, and doubling is more effective. Casinos compensate with worse payout rules (6:5 instead of 3:2).",
      "2":
        "Double deck is a good middle ground. Slightly higher house edge than single deck but still favorable. Strategy deviations from 6-deck are minor. Often found with better rules than shoe games.",
      "6":
        "Six-deck shoe is the most common game in casinos. The large shoe makes card counting harder and slightly increases the house edge. This is the standard that basic strategy charts are optimized for.",
      "8":
        "Eight-deck shoe maximizes the house edge from deck count alone (about 0.02% more than 6-deck). Used by casinos to further discourage card counters. Strategy is effectively identical to 6-deck.",
    },
  },
];
