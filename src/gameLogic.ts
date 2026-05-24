import { suitColor, type Card } from "./types.ts";
import GameState, { FOUNDATION, STOCK, TABLEAU, WASTE } from "./GameState.ts";

export type Move =
  | {
      type: "move-to-foundation";
      from: number;
      to: number;
    }
  | {
      type: "move-tableau";
      from: number;
      to: number;
      count: number;
    }
  | { type: "deal-card" }
  | { type: "flip-card"; tableau: number }
  | {
      type: "reshuffle-waste";
    };

// Check if a sequence of cards forms a valid tableau build
export function isTableauBuild(
  gameState: GameState,
  slot: number,
  cardCount: number,
): boolean {
  const cards = gameState.slots[slot].cards;
  if (cardCount === 0 || cardCount > cards.length) return false;
  if ((window as any).cheats) return true;
  for (let i = cards.length - cardCount + 1; i < cards.length; i++) {
    const prev = cards[i - 1];
    const curr = cards[i];
    if (
      !curr.isFaceUp ||
      prev.value !== curr.value + 1 ||
      suitColor(prev.suit) === suitColor(curr.suit)
    ) {
      return false;
    }
  }
  return cards[cards.length - cardCount].isFaceUp;
}

// Find the target slot for a double-clicked card
export function findTargetSlot(state: GameState, slot: number): number | null {
  const card = state.slots[slot].cards.at(-1);
  if (!card) return null;
  for (const slot of FOUNDATION) {
    const foundation = state.slots[slot].cards;
    if (
      (foundation.length === 0 && card.value === 1) || // Ace to empty foundation
      (foundation.length > 0 &&
        foundation[foundation.length - 1].suit === card.suit &&
        foundation[foundation.length - 1].value === card.value - 1)
    ) {
      return slot;
    }
  }
  return null;
}

// Generator function to compute valid moves
export function* computeValidMoves(state: GameState): Generator<Move> {
  // Check for moving a card to the foundation
  for (const slot of [...TABLEAU, WASTE]) {
    const targetSlot = findTargetSlot(state, slot);
    if (targetSlot) {
      yield {
        type: "move-to-foundation",
        from: slot,
        to: targetSlot,
      };
    }
  }

  // Check for flipping a face-down card in the tableau
  for (const slot of TABLEAU) {
    if (state.slots[slot].cards.length > 0) {
      const topCard = state.slots[slot].cards.at(-1)!;
      if (!topCard.isFaceUp) {
        yield {
          type: "flip-card",
          tableau: slot,
        };
      }
    }
  }

  // Check for moving a card to an empty tableau slot
  for (const slot of TABLEAU) {
    const buildLength = getTopBuildLength(state, slot);
    if (buildLength && state.slots[slot].cards.at(-buildLength)!.value === 13) {
      const emptySlot = TABLEAU.find(
        (slot) => state.slots[slot].cards.length === 0,
      );
      if (emptySlot != null) {
        yield {
          type: "move-tableau",
          from: slot,
          to: emptySlot,
          count: buildLength,
        };
      }
    }
  }

  // Check for shifting groups of cards
  for (const fromSlot of TABLEAU) {
    const buildLength = getTopBuildLength(state, fromSlot);
    if (buildLength > 0) {
      for (const toSlot of TABLEAU) {
        if (
          toSlot !== fromSlot &&
          isShiftable(state, fromSlot, buildLength, toSlot)
        ) {
          yield {
            type: "move-tableau",
            from: fromSlot,
            to: toSlot,
            count: buildLength,
          };
        }
      }
    }
  }

  // Check for dealing a new card from the stock
  if (state.slots[STOCK].cards.length > 0) {
    yield { type: "deal-card" };
  }

  // Check for reshuffling the waste to the stock
  if (
    state.slots[WASTE].cards.length > 0 &&
    state.slots[STOCK].cards.length === 0 &&
    state.redealsLeft !== 0
  ) {
    yield { type: "reshuffle-waste" };
  }
}

// Helper function to get the length of the top build of cards from a tableau slot
function getTopBuildLength(state: GameState, slot: number): number {
  const cards = state.slots[slot].cards;
  let count = 0;
  while (count < cards.length) {
    const a = cards[cards.length - count - 1];
    const b = cards[cards.length - count];
    if (!a.isFaceUp) break;
    if (b != null && !isTableauAboveBelow(a, b)) break;
    ++count;
  }
  return count;
}

/** Returns true if `b` (below) can be dropped on `a` (above) in the tableau. */
function isTableauAboveBelow(a: Card, b: Card) {
  const aRed = a.suit === "heart" || a.suit === "diamond";
  const bRed = b.suit === "heart" || b.suit === "diamond";
  return aRed !== bRed && a.value === b.value + 1;
}

// Helper function to check if a build can be shifted to a target slot
export function isShiftable(
  state: GameState,
  fromSlot: number,
  cardCount: number,
  toSlot: number,
) {
  const a = state.slots[toSlot].cards.at(-1);
  const b = state.slots[fromSlot].cards.at(-cardCount);
  if (cardCount === 0 || b == null) return null;
  if (TABLEAU.includes(toSlot)) {
    if ((window as any).cheats) return "tableau";
    if (a == null) {
      // Only kings can be dropped on an empty spot in the tableau.
      return b.value === 13 ? "tableau" : null;
    }
    return isTableauAboveBelow(a, b) ? "tableau" : null;
  } else if (FOUNDATION.includes(toSlot) && cardCount === 1) {
    if ((window as any).cheats) return "foundation";
    if (a == null) {
      // Only aces can be dropped on empty foundation slots.
      return b.value === 1 ? "foundation" : null;
    }
    return a.suit === b.suit && a.value + 1 === b.value ? "foundation" : null;
  }
  return null;
}
