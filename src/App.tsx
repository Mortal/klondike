import { Board } from "./Board.tsx";
import GameState from "./GameState.ts";

type Globals = {
  gameState?: GameState;
};

const globals = window as any as Globals;
globals.gameState = new GameState();
globals.gameState.initializeGame();

function Menu() {
  return (
    <div id="menu">
      <button type="button">Hello</button>
    </div>
  );
}

function Status() {
  return <div id="status">status</div>;
}

export function App() {
  const gameState = globals.gameState!;
  return (
    <div id="app">
      {/* <Menu /> */}
      <Board gameState={gameState} />
      {/* <Status /> */}
    </div>
  );
}
