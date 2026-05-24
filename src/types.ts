// Define TypeScript types for the Klondike game state

export const suits = ["spade", "heart", "diamond", "club"] as const;
export type Suit = (typeof suits)[number];
export type Rank =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "jack"
  | "queen"
  | "king";

export function rankToNumber(rank: Rank) {
  return rank === "jack"
    ? 11
    : rank === "queen"
      ? 12
      : rank === "king"
        ? 13
        : +rank;
}

export function rankFromNumber(n: number): Rank {
  return n === 11
    ? "jack"
    : n === 12
      ? "queen"
      : n === 13
        ? "king"
        : (`${n}` as Rank);
}

export const BLACK = false as const;
export const RED = true as const;

export function suitColor(s: Suit) {
  return s === "diamond" || s === "heart";
}

export function isSuit(s: string): s is Suit {
  return suits.includes(s as any);
}

export type Card = {
  value: number; // 1 for Ace, 11 for Jack, etc.
  suit: Suit;
  isFaceUp: boolean;
};
