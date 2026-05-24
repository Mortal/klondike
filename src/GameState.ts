import { makeAutoObservable, observable } from "mobx";
import type { Card } from "./types.ts";

export class CardSlot {
  cards: Card[] = [];

  constructor() {
    makeAutoObservable(this, { cards: observable.shallow });
  }
}

export const TABLEAU = [6, 7, 8, 9, 10, 11, 12];
export const FOUNDATION = [2, 3, 4, 5];
export const STOCK = 0;
export const WASTE = 1;

// Define the MobX state management class for Klondike
class GameState {
  slots: CardSlot[] = [];
  redealsLeft = 0;
  flipCounter = 0;

  constructor() {
    makeAutoObservable(this, { slots: observable.shallow });
  }

  dealCard() {
    console.log("Deal card");
    const card = this.slots[STOCK].cards.pop();
    if (card) {
      card.isFaceUp = true;
      this.slots[WASTE].cards.push(card);
    }
  }

  moveToFoundation(tableau: number, foundation: number) {
    const card = this.slots[tableau].cards.pop();
    if (card == null) return;
    if (!card.isFaceUp) card.isFaceUp = true;
    this.slots[foundation].cards.push(card);
  }

  moveTableau(from: number, to: number, count: number) {
    this.slots[to].cards.push(...this.slots[from].cards.splice(-count));
  }

  initializeGame() {
    for (const slot of [STOCK, WASTE, ...TABLEAU, ...FOUNDATION]) {
      this.slots[slot] = new CardSlot();
    }
    this.redealsLeft = 3;
    this.flipCounter = 0;

    // Generate deck
    const deck: Card[] = [];
    const suits: Card["suit"][] = ["heart", "diamond", "club", "spade"];
    for (const suit of suits) {
      for (let value = 1; value <= 13; value++) {
        deck.push({ value, suit, isFaceUp: false });
      }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal deck to tableau
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = deck.pop();
        if (card) {
          card.isFaceUp = j === i; // Only the top card is face up
          this.slots[TABLEAU[i]].cards.push(card);
        }
      }
    }
    // After dealing cards to the tableau, move the remaining cards to the stock
    this.slots[STOCK].cards = deck;
  }

  updateStatusMessage(): string {
    return `Stock: ${this.slots[STOCK].cards.length}, Redeals left: ${this.redealsLeft}`;
  }

  // Move a card to the target slot
  moveCardToSlot(startSlot: number, targetSlot: number): boolean {
    const removedCard = this.slots[startSlot].cards.pop();
    if (!removedCard) return false;
    this.slots[targetSlot].cards.push(removedCard);
    return true;
  }

  flipCard(tableau: number) {
    const card = this.slots[tableau].cards.at(-1);
    if (card != null && !card.isFaceUp) {
      this.slots[tableau].cards.pop();
      this.slots[tableau].cards.push({ ...card, isFaceUp: true });
    }
  }

  reshuffleWaste() {
    this.slots[STOCK].cards.push(
      ...this.slots[WASTE].cards
        .splice(0)
        .reverse()
        .map((card) => ({ ...card, isFaceUp: false })),
    );
    this.redealsLeft--;
  }
}

export default GameState;
