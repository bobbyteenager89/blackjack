"use client";

import { type Card, suitSymbol, isRed } from "@/lib/blackjack";

function BackPattern() {
  return (
    <svg viewBox="0 0 60 84" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="diamonds" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#1e3a5f" />
          <rect x="0" y="0" width="4" height="4" fill="#1e4d7a" opacity="0.6" />
          <rect x="4" y="4" width="4" height="4" fill="#1e4d7a" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="60" height="84" rx="4" fill="#0f2744" />
      <rect x="3" y="3" width="54" height="78" rx="2" fill="url(#diamonds)" />
      <rect x="3" y="3" width="54" height="78" rx="2" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
      <rect x="6" y="6" width="48" height="72" rx="1" fill="none" stroke="#60a5fa" strokeWidth="0.3" opacity="0.2" />
    </svg>
  );
}

function SuitIcon({ suit, className }: { suit: Card["suit"]; className?: string }) {
  const paths: Record<string, string> = {
    spades:
      "M12 2C12 2 4 10 4 14c0 2.5 2 4 4 4 1.5 0 2.5-.5 3.2-1.5C10.5 18.5 9 20 7 22h10c-2-2-3.5-3.5-4.2-5.5C13.5 17.5 14.5 18 16 18c2 0 4-1.5 4-4C20 10 12 2 12 2z",
    hearts:
      "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    diamonds: "M12 2L4 12l8 10 8-10L12 2z",
    clubs:
      "M12 2C9.5 2 8 4 8 6c0 2 1 3.5 3 4.5C9 11 7 11.5 7 14c0 2 2 4 5 4s5-2 5-4c0-2.5-2-3-4-3.5 2-1 3-2.5 3-4.5 0-2-1.5-4-4-4z",
  };

  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d={paths[suit]} />
    </svg>
  );
}

export function CardDisplay({
  card,
  faceDown = false,
  size = "md",
}: {
  card: Card;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-14 h-20",
    md: "w-[4.5rem] h-[6.5rem]",
    lg: "w-16 h-24 sm:w-20 sm:h-[7.5rem] md:w-24 md:h-36",
  };

  const rankSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const suitSize = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const centerSuitSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl overflow-hidden shadow-xl shadow-black/40 ring-1 ring-white/10`}
      >
        <BackPattern />
      </div>
    );
  }

  const red = isRed(card.suit);
  const color = red ? "text-red-500" : "text-zinc-800";

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-white via-zinc-50 to-zinc-100 flex flex-col justify-between select-none shadow-xl shadow-black/40 ring-1 ring-black/10 relative overflow-hidden`}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.8),transparent_60%)]" />

      {/* Top-left rank + suit */}
      <div className={`${color} flex flex-col items-center leading-none p-1.5 relative z-10`}>
        <span className={`${rankSize[size]} font-black tracking-tight`}>
          {card.rank}
        </span>
        <SuitIcon suit={card.suit} className={suitSize[size]} />
      </div>

      {/* Center suit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <SuitIcon
          suit={card.suit}
          className={`${centerSuitSize[size]} ${color} drop-shadow-sm`}
        />
      </div>

      {/* Bottom-right rank + suit (upside down) */}
      <div
        className={`${color} flex flex-col items-center leading-none p-1.5 rotate-180 relative z-10`}
      >
        <span className={`${rankSize[size]} font-black tracking-tight`}>
          {card.rank}
        </span>
        <SuitIcon suit={card.suit} className={suitSize[size]} />
      </div>
    </div>
  );
}

export function HandDisplay({
  cards,
  hideSecond = false,
  size = "md",
}: {
  cards: Card[];
  hideSecond?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex -space-x-3">
      {cards.map((card, i) => (
        <div
          key={`${card.rank}-${card.suit}-${i}`}
          className="transition-transform hover:-translate-y-1"
          style={{ zIndex: i }}
        >
          <CardDisplay
            card={card}
            faceDown={hideSecond && i === 1}
            size={size}
          />
        </div>
      ))}
    </div>
  );
}
