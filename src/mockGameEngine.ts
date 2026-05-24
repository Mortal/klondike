import type { Card } from "./types.ts";
import GameState, {
  FOUNDATION,
  STOCK,
  TABLEAU,
  WASTE,
} from "./GameState.ts";
import {
  computeValidMoves,
  type Move,
} from "./gameLogic.ts";

// Function to stringify a card
function stringifyCard(card: Card): string {
  const suitSymbols: Record<string, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  const value =
    card.value === 1
      ? "A"
      : card.value === 11
        ? "J"
        : card.value === 12
          ? "Q"
          : card.value === 13
            ? "K"
            : card.value;
  const symbol = suitSymbols[card.suit];
  const red = card.suit === "heart" || card.suit === "diamond";
  return red ? `\x1b[31m${symbol}${value}\x1b[0m` : `${symbol}${value}`;
}

// Function to pretty-print nested lists of cards
function prettyPrintCards(state: GameState, slots: number[]) {
  slots.forEach((slot) => {
    const faceUpCards = state.slots[slot].cards
      .filter((card) => card.isFaceUp)
      .map(stringifyCard);
    const faceDownCount = state.slots[slot].cards.length - faceUpCards.length;
    console.log(
      `Slot ${slot}: [${faceUpCards.join(" ")}] (${faceDownCount} face-down)`,
    );
  });
}

// Function to execute a move
function executeMove(state: GameState, move: Move) {
  if (move.type === "move-to-foundation") {
    state.moveToFoundation(move.from, move.to);
  } else if (move.type === "move-tableau") {
    state.moveTableau(move.from, move.to, move.count);
  } else if (move.type === "deal-card") {
    state.dealCard();
  } else if (move.type === "flip-card") {
    state.flipCard(move.tableau);
  } else if (move.type === "reshuffle-waste") {
    state.reshuffleWaste();
  } else {
    // The `satisfies never` ensures that TypeScript will raise a compile-time error
    // if a new move type is added to the `Move` union type but not handled here.
    move satisfies never;
    throw new Error(`Unhandled move type: ${(move as any)?.type}`);
  }
}

function getMoveMessage(move: Move): string {
  switch (move.type) {
    case "move-to-foundation":
      return "Move card to foundation";
    case "move-tableau":
      return "Move card(s) in the tableau";
    case "deal-card":
      return "Deal a new card from the stock";
    case "flip-card":
      return "Flip a face-down card in the tableau";
    case "reshuffle-waste":
      return "Reshuffle waste to stock";
  }
}

// Updated mockGameEngine to pick a random move if the first move is "shift-group"
function mockGameEngine() {
  const gameState = new GameState();
  gameState.initializeGame();

  console.log("Game initialized!");

  for (let i = 0; i < 10000; i++) {
    const moves = Array.from(computeValidMoves(gameState));
    if (moves.length === 0) {
      console.log(`No valid moves available at iteration ${i + 1}`);
      break;
    }

    let move = moves[0];
    if (move.type === "move-tableau") {
      const randomIndex = Math.floor(Math.random() * moves.length);
      move = moves[randomIndex];
    }

    console.log(`Executing move: ${getMoveMessage(move)}`);
    executeMove(gameState, move);
  }

  console.log("Final game state:");
  console.log("Tableau:");
  prettyPrintCards(gameState, TABLEAU);
  console.log("Foundation:");
  prettyPrintCards(gameState, FOUNDATION);
  console.log("Stock:");
  prettyPrintCards(gameState, [STOCK]);
  console.log("Waste:");
  prettyPrintCards(gameState, [WASTE]);
}

mockGameEngine();
