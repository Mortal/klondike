import { findTargetSlot } from "../gameLogic.ts";
import GameState, {
  CardSlot,
  FOUNDATION,
  STOCK,
  TABLEAU,
  WASTE,
} from "../GameState.ts";
import { beforeEach, describe, expect, test } from "vitest";
import { type Card } from "../types.ts";

function areCardsEqual(card1: Card, card2: Card): boolean {
  return (
    card1.value === card2.value &&
    card1.suit === card2.suit &&
    card1.isFaceUp === card2.isFaceUp
  );
}
describe("Game Logic Tests", () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.initializeGame();
  });

  test("initializeGame sets up the game state correctly", () => {
    expect(gameState.slots[TABLEAU[0]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[TABLEAU[1]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[TABLEAU[2]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[TABLEAU[3]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[TABLEAU[4]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[TABLEAU[5]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[TABLEAU[6]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[FOUNDATION[0]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[FOUNDATION[1]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[FOUNDATION[2]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[FOUNDATION[3]]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[STOCK]).toBeInstanceOf(CardSlot);
    expect(gameState.slots[WASTE]).toBeInstanceOf(CardSlot);

    const totalCards =
      gameState.slots[TABLEAU[0]].cards.length +
      gameState.slots[TABLEAU[1]].cards.length +
      gameState.slots[TABLEAU[2]].cards.length +
      gameState.slots[TABLEAU[3]].cards.length +
      gameState.slots[TABLEAU[4]].cards.length +
      gameState.slots[TABLEAU[5]].cards.length +
      gameState.slots[TABLEAU[6]].cards.length +
      gameState.slots[FOUNDATION[0]].cards.length +
      gameState.slots[FOUNDATION[1]].cards.length +
      gameState.slots[FOUNDATION[2]].cards.length +
      gameState.slots[FOUNDATION[3]].cards.length +
      gameState.slots[STOCK].cards.length +
      gameState.slots[WASTE].cards.length;
    expect(totalCards).toBe(52); // Total cards should equal 52
  });

  test("findTargetSlot returns correct foundation for Ace", () => {
    const aceOfSpades: Card = { value: 1, suit: "spade", isFaceUp: true };
    gameState.slots[TABLEAU[0]].cards.push(aceOfSpades);

    const target = findTargetSlot(gameState, TABLEAU[0]);
    expect(target).toBe(FOUNDATION[0]);
  });

  test("findTargetSlot returns null for invalid move", () => {
    const kingOfHearts: Card = { value: 13, suit: "heart", isFaceUp: true };
    gameState.slots[TABLEAU[0]].cards.push(kingOfHearts);

    const target = findTargetSlot(gameState, TABLEAU[0]);
    expect(target).toBeNull();
  });

  test("moveCardToSlot moves card successfully", () => {
    const aceOfSpades: Card = { value: 1, suit: "spade", isFaceUp: true };
    gameState.slots[TABLEAU[0]].cards.push(aceOfSpades);

    const targetIndex = FOUNDATION[0];
    const success = gameState.moveCardToSlot(TABLEAU[0], targetIndex);

    expect(success).toBe(true);
    expect(
      gameState.slots[targetIndex].cards.some((card) =>
        areCardsEqual(card, aceOfSpades),
      ),
    ).toBe(true);
    expect(
      gameState.slots[TABLEAU[0]].cards.some((card) =>
        areCardsEqual(card, aceOfSpades),
      ),
    ).toBe(false);
  });
});
