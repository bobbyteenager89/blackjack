export interface GuidePage {
  id: number;
  title: string;
  subtitle: string;
  content: string; // markdown-ish, rendered as JSX
  interactive?: {
    type: "quiz" | "reveal" | "slider" | "compare";
    data: Record<string, unknown>;
  };
}

export const GUIDE_PAGES: GuidePage[] = [
  {
    id: 1,
    title: "The House Always Wins (But Not By Much)",
    subtitle: "Understanding the house edge",
    content: `Every casino game has a mathematical edge built in. In blackjack, with perfect basic strategy, that edge is only about 0.5% — meaning for every $100 you bet, you lose about 50 cents on average.

That's the smallest house edge of any table game. Compare that to roulette (5.3%), slots (2-15%), or craps side bets (11%+).

But here's the catch: "perfect basic strategy" means making the mathematically correct decision on every single hand. Most players play at a 2-4% disadvantage because they go with gut instinct instead of math.

The entire point of this trainer is to close that gap.`,
    interactive: {
      type: "compare",
      data: {
        title: "House Edge by Game",
        items: [
          { label: "Blackjack (basic strategy)", value: 0.5, color: "green" },
          { label: "Blackjack (average player)", value: 2.5, color: "red" },
          { label: "Craps (pass line)", value: 1.4, color: "yellow" },
          { label: "Baccarat (banker)", value: 1.06, color: "yellow" },
          { label: "Roulette (double zero)", value: 5.26, color: "red" },
          { label: "Slots (average)", value: 8.0, color: "red" },
        ],
      },
    },
  },
  {
    id: 2,
    title: "Hard vs Soft: The Ace Changes Everything",
    subtitle: "Why soft hands are your biggest advantage",
    content: `An Ace can count as 1 or 11. A "soft" hand contains an Ace counted as 11. A "hard" hand has no flexible Ace.

This matters enormously because soft hands can't bust on a single hit. If you have A-6 (soft 17) and draw a 9, you don't bust at 26 — the Ace becomes 1, giving you 16.

This is why you should almost never stand on soft 17. Even the dealer hits it (that's the H17 rule). You have a free shot at improving without risk.

The mental model: soft hands are "safe to be aggressive with." Double more, hit more. Hard hands are "fragile" — you can bust.`,
    interactive: {
      type: "quiz",
      data: {
        question: "You have A-5 (soft 16) and hit, drawing a 10. What's your hand now?",
        options: ["Bust (26)", "Hard 16", "Soft 16", "Hard 26"],
        correct: 1,
        explanation: "The Ace switches from 11 to 1. So A(1) + 5 + 10 = 16. It's now a hard 16 because the Ace is no longer flexible.",
      },
    },
  },
  {
    id: 3,
    title: "The Dealer's Constraint",
    subtitle: "Why the dealer's upcard tells you almost everything",
    content: `The dealer has no choices. They must hit until 17 or higher (and hit soft 17 in H17 games). This rigid algorithm means we can calculate exactly how often each upcard leads to each outcome.

Dealer upcards fall into two camps:

**Bust cards (2-6):** The dealer must hit a stiff hand (12-16), and they'll bust a significant portion of the time. Dealer 5 and 6 are the weakest — they bust about 42% of the time.

**Pat cards (7-A):** The dealer's first two cards will often make 17+ without needing to risk busting. An Ace is the strongest upcard — the dealer busts only about 17% of the time.

This is the foundation of all basic strategy: play conservatively against bust cards (let the dealer bust) and aggressively when the dealer is strong (you need to improve).`,
    interactive: {
      type: "compare",
      data: {
        title: "Dealer Bust Probability by Upcard",
        items: [
          { label: "2", value: 35.3, color: "yellow" },
          { label: "3", value: 37.6, color: "yellow" },
          { label: "4", value: 40.3, color: "green" },
          { label: "5", value: 42.9, color: "green" },
          { label: "6", value: 42.1, color: "green" },
          { label: "7", value: 26.2, color: "red" },
          { label: "8", value: 24.4, color: "red" },
          { label: "9", value: 23.3, color: "red" },
          { label: "10", value: 21.4, color: "red" },
          { label: "A", value: 17.0, color: "red" },
        ],
      },
    },
  },
  {
    id: 4,
    title: "The 10-Rich Deck",
    subtitle: "Why there are more 10s than anything else",
    content: `In a standard deck, 10-value cards (10, J, Q, K) make up 4 out of 13 ranks — that's 30.8% of all cards. No other value comes close.

This single fact drives most of basic strategy:

**Doubling down on 10 or 11:** You're likely to draw a 10-value card, making 20 or 21.

**Standing on 12-16 vs bust cards:** The dealer's hidden card is likely a 10, putting them at 12-16. Then they must hit, and likely draw another 10 to bust.

**Never splitting 10s:** You already have 20. Why break up a winning hand?

**Insurance is always bad:** The dealer needs a 10 under their Ace. There are 16 tens vs 36 non-tens in a deck. The 2:1 payout doesn't cover those odds.

When in doubt, assume the next card is a 10. It's not always right, but it's the single most useful mental shortcut.`,
    interactive: {
      type: "quiz",
      data: {
        question: "What percentage of a deck is 10-value cards (10, J, Q, K)?",
        options: ["23.1% (3 in 13)", "30.8% (4 in 13)", "25.0% (1 in 4)", "15.4% (2 in 13)"],
        correct: 1,
        explanation: "Four ranks (10, J, Q, K) out of 13 total ranks = 30.8%. This is why you always expect the next card to be a 10.",
      },
    },
  },
  {
    id: 5,
    title: "Expected Value: Think Like a Casino",
    subtitle: "Why the 'right' play sometimes feels wrong",
    content: `Expected value (EV) is the average amount you win or lose per dollar bet over many hands. Basic strategy picks the highest EV play every time — even when that play loses more often than it wins.

Take 16 vs dealer 10. You'll probably lose either way. But the math says:
- Standing: you lose about 54% of the time
- Hitting: you lose about 52% of the time
- Surrendering: you lose exactly 50% (half your bet)

Surrendering saves the most money over time, even though it feels like quitting. Hitting is better than standing, even though hitting 16 feels suicidal.

The key insight: you're not trying to win this specific hand. You're trying to lose the least money over thousands of hands. Bad luck on one hand means nothing. The math always wins in the long run.`,
    interactive: {
      type: "quiz",
      data: {
        question: "You have hard 16 vs dealer 10. Standing loses 54% of the time. Hitting loses 52%. Surrendering loses your half bet. What's the best play?",
        options: ["Stand — don't risk busting", "Hit — slightly better odds", "Surrender — lose the least money"],
        correct: 2,
        explanation: "Surrender saves the most money long-term. You lock in a 50% loss (half your bet) instead of a 52-54% loss of your full bet. If surrender isn't available, hit — it's slightly better than standing.",
      },
    },
  },
  {
    id: 6,
    title: "Doubling: Getting Paid When You're Ahead",
    subtitle: "The most profitable plays in blackjack",
    content: `Doubling down lets you double your bet in exchange for exactly one more card. You should only do this when the math is heavily in your favor.

The three conditions for a good double:
1. **Your total is strong** (9, 10, 11, or a soft hand with room to improve)
2. **The dealer is weak** (showing a bust card, usually 2-6)
3. **One more card will likely make a good hand** (thanks to the 10-rich deck)

11 is the best doubling hand — you're about to get a 10 for 21. You should double 11 against everything except an Ace (and even then in some rule sets).

Soft doubles are the most overlooked: doubling A-7 against dealer 3-6 is correct but feels wrong because "18 is good enough." It's not — against weak dealers, you should extract maximum value.

Never double for "gut feeling." Double when the chart says to. These are the hands where you make back all the money you lose on 16 vs 10.`,
    interactive: {
      type: "reveal",
      data: {
        title: "Best Doubling Situations",
        items: [
          { hidden: "11 vs anything", detail: "Always double. You're the favorite against every dealer card." },
          { hidden: "10 vs 2-9", detail: "Double. The 10-rich deck will likely give you 20. Only stop against 10 or A." },
          { hidden: "9 vs 3-6", detail: "Double against bust cards only. Dealer 2 isn't weak enough." },
          { hidden: "Soft 13-17 vs 5-6", detail: "Double these soft hands against the weakest dealer cards. You can't bust." },
          { hidden: "Soft 18 vs 3-6", detail: "The surprise double. 18 'feels good' but you should maximize profit vs weak dealers." },
        ],
      },
    },
  },
  {
    id: 7,
    title: "Splitting: Escape Bad Hands, Exploit Good Ones",
    subtitle: "When to split and why",
    content: `Splitting turns one hand into two, each with its own bet. There are two reasons to split:

**1. Escape a terrible hand.**
8-8 is 16 — the worst total in blackjack. By splitting, you turn one awful hand into two decent starting points of 8. Even against a dealer 10, two 8s are better than one 16.

**2. Exploit a weak dealer.**
6-6 is a stiff 12, but two 6s against a dealer 5 gives you two chances to build a good hand while the dealer busts 43% of the time.

The rules to memorize:
- **Always split Aces and 8s.** Aces: two shots at 21. 8s: escape from 16.
- **Never split 10s or 5s.** 10s: you have 20, don't break it. 5s: 10 is better played as a double.
- **Split 2s, 3s, 6s, 7s against dealer bust cards** (2-6 or 2-7).
- **Never split 4s** (just hit 8) except vs 5-6 with DAS rules.
- **9-9 is tricky:** split vs 2-6 and 8-9, stand vs 7 (you beat 17), stand vs 10-A (too risky).`,
    interactive: {
      type: "quiz",
      data: {
        question: "You have 9-9 (18) vs dealer 7. What should you do?",
        options: ["Split — get two chances at 19", "Stand — 18 beats dealer's likely 17", "Hit — try to improve"],
        correct: 1,
        explanation: "Stand! Dealer 7 will most likely make 17. Your 18 beats 17. But against dealer 8 or 9, you should split because 18 won't be enough.",
      },
    },
  },
  {
    id: 8,
    title: "Surrender: Strategic Retreat",
    subtitle: "Losing half your bet is sometimes the best you can do",
    content: `Late surrender lets you forfeit half your bet after the dealer checks for blackjack. Most players never surrender — it feels like giving up. But it's the mathematically optimal play in specific spots.

Surrender is correct when you'll lose more than 50% of the time playing the hand out. By surrendering, you lock in a 50% loss instead of a worse outcome.

The surrender hands (H17 rules):
- **16 vs 9, 10, A** — You'll lose about 52-54% playing it out
- **15 vs 10, A** — Similar math
- **17 vs A** — In H17 games, the dealer hits soft 17 and will beat your hard 17 too often

That's it. Just five specific situations. But they come up often enough to save real money over time.

The mental model: surrender is not "giving up." It's cutting your losses. A good poker player folds bad hands. A good blackjack player surrenders bad hands.`,
    interactive: {
      type: "reveal",
      data: {
        title: "All Surrender Situations (H17)",
        items: [
          { hidden: "Hard 16 vs 9", detail: "Surrender. You lose ~53% playing it out. Save half your bet." },
          { hidden: "Hard 16 vs 10", detail: "Surrender. The most common surrender situation. 16 vs 10 is miserable." },
          { hidden: "Hard 16 vs A", detail: "Surrender. Even worse than vs 10 with H17 rules." },
          { hidden: "Hard 15 vs 10", detail: "Surrender. 15 vs 10 is almost as bad as 16 vs 10." },
          { hidden: "Hard 15 vs A", detail: "Surrender. The dealer's Ace is strongest with H17." },
          { hidden: "Hard 17 vs A", detail: "Surrender (H17 only). The dealer will hit soft 17 and beat you." },
          { hidden: "8,8 vs 10 or A", detail: "Surrender if allowed, otherwise split. Escape 16 any way you can." },
        ],
      },
    },
  },
  {
    id: 9,
    title: "The Counterintuitive Plays",
    subtitle: "Hands that feel wrong but are mathematically right",
    content: `These are the plays that separate a basic strategy player from a gut-instinct player. They feel wrong, but the math is unambiguous:

**Hit soft 18 against 9, 10, or A.**
18 feels like a great hand. It's not — against strong dealer cards, you're the underdog. Since it's soft, you can hit without risk of busting.

**Hit 12 against dealer 2 or 3.**
"Always stand on 12 against a low card" is the most common bad advice. Dealer 2 and 3 don't bust enough. Only stand on 12 vs 4, 5, or 6.

**Double 11 against dealer A.**
Scary? Yes. But 11 is so strong that you should double it against everything, including an Ace.

**Split 8s against 10.**
You're putting more money out against a 10, which feels terrible. But 16 is SO bad that two separate 8s give you better expected value.

**Stand with 9-9 (18) against 7, but split against 9.**
Against 7, your 18 beats the dealer's likely 17. Against 9, the dealer will often make 19, so you need to split for two shots at 19.`,
    interactive: {
      type: "quiz",
      data: {
        question: "You have A-7 (soft 18) vs dealer 9. What's the correct play?",
        options: ["Stand — 18 is a good hand", "Hit — 18 isn't enough vs 9, and you can't bust", "Double — maximize value", "Surrender — 18 vs 9 is bad"],
        correct: 1,
        explanation: "Hit! Soft 18 vs 9 is an underdog. Since it's soft, hitting can't bust you — worst case, you end up right back at hard 18. But you might improve to 19, 20, or 21.",
      },
    },
  },
  {
    id: 10,
    title: "Putting It All Together",
    subtitle: "The decision framework for every hand",
    content: `You don't need to memorize 270 cells in a chart. You need to understand six rules that cover almost every situation:

**Rule 1: Surrender first** (if available).
Check: is this 15-16 vs 9-A, or 17 vs A? If yes, surrender.

**Rule 2: Split pairs.**
Always split A-A and 8-8. Never split 10-10 and 5-5. Split other pairs against dealer bust cards.

**Rule 3: Double when you have the edge.**
11: always double. 10: double vs 2-9. 9: double vs 3-6. Soft hands: double against bust cards.

**Rule 4: Hit or stand on soft hands.**
Soft 17 or less: always hit/double. Soft 18: stand vs 2-8, hit vs 9-A. Soft 19+: always stand.

**Rule 5: Hit or stand on hard hands.**
Hard 17+: always stand. Hard 13-16: stand vs bust cards (2-6), hit vs 7+. Hard 12: stand only vs 4-6.

**Rule 6: Hard 11 or less: always hit** (or double).

That's it. Six rules. Practice them until they're automatic, and you'll be playing at a 99.5% return rate — better than almost anyone at the table.`,
    interactive: {
      type: "reveal",
      data: {
        title: "The 6-Rule Decision Flow",
        items: [
          { hidden: "1. Can I surrender?", detail: "15-16 vs 9/10/A, or 17 vs A (H17). If yes → surrender." },
          { hidden: "2. Should I split?", detail: "Always: A-A, 8-8. Never: 10-10, 5-5. Others: vs dealer bust cards." },
          { hidden: "3. Should I double?", detail: "11 always. 10 vs 2-9. 9 vs 3-6. Soft hands vs bust cards." },
          { hidden: "4. Soft hand?", detail: "≤17: hit. 18: stand vs 2-8, hit vs 9+. 19+: stand." },
          { hidden: "5. Hard hand ≥12?", detail: "17+: stand. 13-16: stand vs 2-6, hit vs 7+. 12: stand vs 4-6 only." },
          { hidden: "6. Hard ≤11?", detail: "Always hit (or double per rule 3)." },
        ],
      },
    },
  },
];
