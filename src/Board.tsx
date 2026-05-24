import { observer } from "mobx-react-lite";
import GameState, { FOUNDATION, STOCK, TABLEAU, WASTE } from "./GameState.ts";
import React from "react";
import { findTargetSlot, isShiftable, isTableauBuild } from "./gameLogic.ts";
import { rankFromNumber, suits, type Card } from "./types.ts";
import { runInAction } from "mobx";

type CardProps = {
  card: Card | { isFaceUp: false };
  style?: React.CSSProperties;
  ["data-slot"]?: number;
  className?: string;
};

const CardSvg = observer(function CardSvg({
  card,
  className,
  ...props
}: CardProps) {
  const href = card.isFaceUp
    ? `/svg-cards.svg#${card.suit}_${rankFromNumber(card.value)}`
    : "/svg-cards.svg#alternate-back";
  return (
    <div
      className={`card ${card.isFaceUp ? "face-up" : "face-down"} ${className || ""}`}
      {...props}
    >
      <svg
        viewBox="0 0 169.075 244.64"
        aria-label={
          card.isFaceUp
            ? `${card.suit}_${rankFromNumber(card.value)}`
            : "Face down"
        }
      >
        <use href={href} />
      </svg>
    </div>
  );
});

type SlotEventHandler = {
  onClick?: (
    slot: number,
    cardCount: number,
    event: React.MouseEvent<HTMLElement>,
  ) => void;
  onDoubleClick?: (
    slot: number,
    cardCount: number,
    event: React.MouseEvent<HTMLElement>,
  ) => void;
  onTouchStart?: (
    slot: number,
    cardCount: number,
    event: React.TouchEvent<HTMLElement>,
  ) => void;
  onPointerDown?: (
    slot: number,
    cardCount: number,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
};

const Stack = observer(function Stack({
  gameState,
  slot,
  cardCount,
  events,
}: {
  gameState: GameState;
  slot: number;
  cardCount: number;
  events?: SlotEventHandler;
}) {
  const card = gameState.slots[slot].cards.at(-cardCount)!;
  return (
    <div
      className="stack"
      onClick={(e) => events?.onClick?.(slot, cardCount, e)}
      onContextMenu={(e) => events?.onDoubleClick?.(slot, cardCount, e)}
      onDoubleClick={(e) => events?.onDoubleClick?.(slot, cardCount, e)}
      onTouchStart={(e) => events?.onTouchStart?.(slot, cardCount, e)}
      onPointerDown={(e) => {
        if (
          e.button !== 0 ||
          e.ctrlKey ||
          e.altKey ||
          e.metaKey ||
          e.shiftKey
        ) {
          return;
        }
        events?.onPointerDown?.(slot, cardCount, e);
      }}
    >
      {card == null ? null : (
        <CardSvg card={card} data-slot={cardCount <= 1 ? slot : undefined} />
      )}
      {cardCount <= 1 ? null : (
        <Stack
          gameState={gameState}
          slot={slot}
          cardCount={cardCount - 1}
          events={events}
        />
      )}
    </div>
  );
});

const Slot = observer(function Slot({
  gameState,
  slot,
  gridArea,
  cardCount,
  events,
}: {
  gameState: GameState;
  slot: number;
  gridArea?: string;
  cardCount?: number;
  events?: SlotEventHandler;
}) {
  const tableau = TABLEAU.includes(slot);
  const cards = gameState.slots[slot].cards;
  return (
    <div
      className="slot"
      title={
        slot === STOCK || slot === WASTE
          ? cards.length === 1
            ? `${cards.length} card`
            : `${cards.length} cards`
          : undefined
      }
      style={{ gridArea }}
      onClick={(e) => events?.onClick?.(slot, 0, e)}
      onContextMenu={(e) => events?.onDoubleClick?.(slot, 0, e)}
      onDoubleClick={(e) => events?.onDoubleClick?.(slot, 0, e)}
      onTouchStart={(e) => events?.onTouchStart?.(slot, 0, e)}
      onPointerDown={(e) => {
        if (
          e.button !== 0 ||
          e.ctrlKey ||
          e.altKey ||
          e.metaKey ||
          e.shiftKey
        ) {
          return;
        }
        events?.onPointerDown?.(slot, 0, e);
      }}
    >
      <CardSvg
        card={{ isFaceUp: false }}
        className="emptyslot"
        data-slot={cards.length === 0 ? slot : undefined}
      />
      {!tableau && cards.length >= 2 ? <CardSvg card={cards.at(-2)!} /> : null}
      <Stack
        gameState={gameState}
        slot={slot}
        cardCount={cardCount ?? (tableau ? cards.length : 1)}
        events={events}
      />
    </div>
  );
});

function getGridAreaForElement(targetedElement: Element | null) {
  if (targetedElement) {
    const element = targetedElement.closest("[data-slot]");
    if (element) {
      return { element, slot: +element.getAttribute("data-slot")! };
    }
  }
  return null;
}

function getMoveTarget(
  gameState: GameState,
  fromSlot: number,
  cardCount: number,
  targetedElement: Element | null,
) {
  const x = getGridAreaForElement(targetedElement);
  if (x == null || x.slot === fromSlot) return null;
  const type = isShiftable(gameState, fromSlot, cardCount, x.slot);
  if (type == null) return null;
  return { type: type as typeof type, ...x };
}

function winAnimation(gameState: GameState) {
  console.log("win");
  const els = FOUNDATION.map((n) =>
    document.querySelector(`[data-slot="${n}"] > svg`),
  );
  const board = document.getElementById("klondike-board");
  const box = board?.getClientRects()[0];
  const boxes = els.map((el) => el?.getClientRects()?.[0]);
  if (
    els.every((e) => e instanceof SVGSVGElement) &&
    boxes.every((e) => e != null) &&
    board != null &&
    box != null
  ) {
    let stop = false;
    const myRoot = document.createElement("canvas");
    myRoot.addEventListener("click", () => {
      stop = true;
    });
    myRoot.style.position = "absolute";
    myRoot.style.top = "0";
    myRoot.style.left = "0";
    myRoot.style.width = `${document.documentElement.clientWidth}px`;
    myRoot.style.height = `${document.documentElement.clientHeight}px`;
    const scale = 169.075 / boxes[0].width;
    myRoot.setAttribute(
      "width",
      `${scale * document.documentElement.clientWidth}`,
    );
    myRoot.setAttribute(
      "height",
      `${scale * document.documentElement.clientHeight}`,
    );
    const ctx = myRoot.getContext("2d")!;
    // myRoot.setAttribute(
    //   "viewBox",
    //   `0 0 ${document.documentElement.clientWidth * scale} ${document.documentElement.clientHeight * scale}`,
    // );
    board.appendChild(myRoot);
    console.log("board", myRoot);
    let notify: (() => void) | null = () => {};
    let waitPromise = new Promise<void>((r) => {
      notify = r;
    });
    const wait = () =>
      waitPromise.then(() => {
        waitPromise = new Promise<void>((r) => {
          notify = r;
        });
      });
    const anim = async () => {
      const svgSource = await (await fetch("/svg-cards.svg")).text();
      const { Canvg } = (await import("canvg")) as any;
      for (let i = 0; i < 52; ++i) {
        const suitIndex = i % 4;
        const suit =
          gameState.slots[FOUNDATION[suitIndex]].cards[0]?.suit ??
          suits[suitIndex];
        const value = 13 - ((i / 4) | 0);
        const g = `${suit}_${rankFromNumber(value)}`;
        // const el = els[suitIndex];
        let x = boxes[suitIndex].left;
        let y = boxes[suitIndex].top;
        const w = boxes[suitIndex].width;
        const h = boxes[suitIndex].height;
        const t = 3;
        const dx =
          (1 + Math.floor(Math.random() * 4)) * (Math.random() > 0.5 ? -1 : 1);
        let dy = 0;
        const v = Canvg.fromString(
          ctx,
          svgSource.replace("</svg>", `<use xlink:href="#${g}"/></svg>`),
          {
            ignoreDimensions: true,
            ignoreClear: true,
          },
        );
        for (
          let frame = 0;
          -w < x && x < document.documentElement.clientWidth;
          frame++
        ) {
          x += t * dx;
          if (y + h + dy > box.height) {
            dy = -0.8 * dy;
          }
          y += t * dy;
          dy += t * 0.1;
          v.render({
            offsetX: scale * x,
            offsetY: scale * y,
          });
          await wait();
          if (stop) break;
        }
        if (stop) break;
      }
      notify = null;
    };
    const nextRaf = () => {
      if (notify != null) {
        notify();
        window.requestAnimationFrame(nextRaf);
      }
    };
    nextRaf();
    const handleMouseMove = () => notify?.();
    document.addEventListener("mousemove", handleMouseMove);
    anim().finally(() => {
      console.log("Done");
      document.removeEventListener("mousemove", handleMouseMove);
      myRoot.parentNode?.removeChild(myRoot);
      runInAction(() => {
        gameState.initializeGame();
      });
    });
  }
}

export const Board = observer(function Board({
  gameState,
}: {
  gameState: GameState;
}) {
  React.useEffect(() => {
    const handleKeyPress = (ev: KeyboardEvent) => {
      console.log(ev.key, ev.ctrlKey, ev.altKey, ev.shiftKey, ev.metaKey);
      if (
        ev.code === "Digit2" &&
        ev.altKey !== ev.metaKey &&
        ev.shiftKey &&
        !ev.ctrlKey
      ) {
        ev.preventDefault();
        ev.stopPropagation();
        winAnimation(gameState);
      }
    };
    console.log("hello", handleKeyPress);
    window.addEventListener("keydown", handleKeyPress, true);
    return () => {
      console.log("goodbye", handleKeyPress);
      window.removeEventListener("keydown", handleKeyPress, true);
    };
  }, []);
  type Mover = {
    from: number;
    cardCount: number;
    pointerId: number;
    element: HTMLElement;
    pageX: number;
    pageY: number;
    toLeftX: number;
    toRightX: number;
    toTopY: number;
    toBottomY: number;
  };
  const [mover, setMover] = React.useState<Mover | null>(null);
  const [targetedElement, setTargetedElement] = React.useState<Element | null>(
    null,
  );
  React.useEffect(() => {
    if (!(targetedElement instanceof HTMLElement)) return;
    targetedElement.classList.add("dropactive");
    return () => {
      targetedElement.classList.remove("dropactive");
    };
  }, [targetedElement]);
  const checkWin = () => {
    if (FOUNDATION.every((slot) => gameState.slots[slot].cards.length === 13)) {
      winAnimation(gameState);
    }
  };
  React.useEffect(() => {
    if (mover == null) return;
    mover.element.setPointerCapture(mover.pointerId);
    mover.element.style.left = `0px`;
    mover.element.style.top = `0px`;
    mover.element.style.position = "relative";
    mover.element.style.zIndex = "1";
    mover.element.style.pointerEvents = "none";
    const mt = (e: PointerEvent) =>
      getMoveTarget(
        gameState,
        mover.from,
        mover.cardCount,
        document.elementFromPoint(
          e.clientX + mover.toLeftX,
          e.clientY + mover.toTopY,
        ),
      ) ??
      getMoveTarget(
        gameState,
        mover.from,
        mover.cardCount,
        document.elementFromPoint(
          e.clientX + mover.toLeftX,
          e.clientY + mover.toBottomY,
        ),
      ) ??
      getMoveTarget(
        gameState,
        mover.from,
        mover.cardCount,
        document.elementFromPoint(
          e.clientX + mover.toRightX,
          e.clientY + mover.toTopY,
        ),
      ) ??
      getMoveTarget(
        gameState,
        mover.from,
        mover.cardCount,
        document.elementFromPoint(
          e.clientX + mover.toRightX,
          e.clientY + mover.toBottomY,
        ),
      );
    const handlePointerMove = (e: PointerEvent): void => {
      if (e.pointerId !== mover.pointerId) return;
      mover.element.style.left = `${e.pageX - mover.pageX}px`;
      mover.element.style.top = `${e.pageY - mover.pageY}px`;
      setTargetedElement(mt(e)?.element ?? null);
    };
    document.addEventListener("pointermove", handlePointerMove);
    const handlePointerUp = (e: PointerEvent): void => {
      if (e.pointerId !== mover.pointerId) return;
      handlePointerCancel(e);
      const t = mt(e);
      if (t == null) return;
      if (t.type === "foundation") {
        gameState.moveToFoundation(mover.from, t.slot);
      } else if (t.type === "tableau") {
        gameState.moveTableau(mover.from, t.slot, mover.cardCount);
      } else {
        // Ensure type error if we add more cases
        t.type satisfies never;
      }
      checkWin();
    };
    document.addEventListener("pointerup", handlePointerUp);
    const handlePointerCancel = (e?: PointerEvent): void => {
      if (e != null && e.pointerId !== mover.pointerId) return;
      mover.element.releasePointerCapture(mover.pointerId);
      mover.element.style.position = "";
      mover.element.style.left = "";
      mover.element.style.top = "";
      mover.element.style.zIndex = "";
      mover.element.style.pointerEvents = "";
      setMover((m) => (m === mover ? null : m));
      setTargetedElement(null);
    };
    document.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      handlePointerCancel();
    };
  }, [mover]);
  const foundationEvents: SlotEventHandler | undefined = {
    onTouchStart: (_slot, _cardCount, event) => {
      event.preventDefault();
    },
    onPointerDown: (
      slot,
      cardCount: number,
      event: React.PointerEvent<HTMLElement>,
    ) => {
      if (
        cardCount === 1 &&
        slot !== WASTE &&
        !gameState.slots[slot].cards.at(-1)?.isFaceUp
      ) {
        gameState.flipCard(slot);
      } else if (cardCount > 0 && isTableauBuild(gameState, slot, cardCount)) {
        const box = (event.target as Element)
          .closest("svg")
          ?.getClientRects()[0];
        setMover({
          from: slot,
          cardCount: cardCount,
          pointerId: event.pointerId,
          element: event.currentTarget,
          pageX: event.pageX,
          pageY: event.pageY,
          toLeftX: box!.left - event.clientX,
          toRightX: box!.right - event.clientX,
          toTopY: box!.top - event.clientY,
          toBottomY: box!.bottom - event.clientY,
        });
      }
      event.stopPropagation();
      event.preventDefault();
    },
    onDoubleClick: (slot, cardCount, event) => {
      if (!cardCount) return;
      event.stopPropagation();
      event.preventDefault();
      const target = findTargetSlot(gameState, slot);
      if (target != null) {
        gameState.moveToFoundation(slot, target);
        checkWin();
      }
    },
  };
  return (
    <div
      id="klondike-board"
      onContextMenu={(e) => {
        let count = 0;
        for (;;) {
          let it = 0;
          for (const slot of [WASTE, ...TABLEAU]) {
            const target = findTargetSlot(gameState, slot);
            if (target != null) {
              gameState.moveToFoundation(slot, target);
              it += 1;
            }
          }
          if (it === 0) break;
          count += 1;
        }
        if (count > 0) {
          e.preventDefault();
          e.stopPropagation();
          checkWin();
        }
      }}
    >
      <Slot
        gridArea="stock"
        gameState={gameState}
        slot={STOCK}
        events={{
          onTouchStart: (_slot, _cardCount, event) => {
            event.preventDefault();
          },
          onPointerDown: (slot, _cardCount, event) => {
            event.stopPropagation();
            event.preventDefault();
            console.log("stock", gameState.slots[slot].cards.length);
            if (gameState.slots[slot].cards.length === 0)
              gameState.reshuffleWaste();
            else gameState.dealCard();
          },
        }}
      />
      <Slot
        gridArea="waste"
        gameState={gameState}
        slot={WASTE}
        events={foundationEvents}
      />
      {FOUNDATION.map((slot, index) => (
        <Slot
          key={index}
          gameState={gameState}
          gridArea={`foundation${index + 1}`}
          slot={slot}
          events={{
            onTouchStart: (_slot, _cardCount, event) => {
              event.preventDefault();
            },
            onPointerDown: (
              slot,
              cardCount: number,
              event: React.PointerEvent<HTMLElement>,
            ) => {
              if (cardCount === 1) {
                const box = (event.target as Element)
                  .closest("svg")
                  ?.getClientRects()[0];
                setMover({
                  from: slot,
                  cardCount: cardCount,
                  pointerId: event.pointerId,
                  element: event.currentTarget,
                  pageX: event.pageX,
                  pageY: event.pageY,
                  toLeftX: box!.left - event.clientX,
                  toRightX: box!.right - event.clientX,
                  toTopY: box!.top - event.clientY,
                  toBottomY: box!.bottom - event.clientY,
                });
              }
              event.stopPropagation();
              event.preventDefault();
            },
          }}
        />
      ))}
      {TABLEAU.map((slot, index) => (
        <Slot
          key={index}
          gameState={gameState}
          gridArea={`tableau${index + 1}`}
          slot={slot}
          events={foundationEvents}
        />
      ))}
    </div>
  );
});
