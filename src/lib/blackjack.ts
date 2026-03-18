// ── Card & Deck ──────────────────────────────────────────────

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
}

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function createShoe(numDecks = 6): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createDeck());
  }
  return shuffle(shoe);
}

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Hand evaluation ──────────────────────────────────────────

export function cardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return parseInt(rank);
}

export interface HandValue {
  total: number;
  soft: boolean;
}

export function handValue(cards: Card[]): HandValue {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card.rank);
    if (card.rank === "A") aces++;
  }
  let soft = aces > 0;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  if (aces === 0) soft = false;
  return { total, soft };
}

export function isBusted(cards: Card[]): boolean {
  return handValue(cards).total > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank;
}

// ── Card display ─────────────────────────────────────────────

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

export function cardLabel(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

// ── Dealer upcard index (for strategy chart) ─────────────────

export const DEALER_CARDS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "A",
] as const;
export type DealerCard = (typeof DEALER_CARDS)[number];

export function dealerCardIndex(rank: Rank): number {
  if (rank === "A") return 9;
  const val = cardValue(rank);
  return val - 2;
}
