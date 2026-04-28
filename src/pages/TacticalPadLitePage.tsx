import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";
import "./tactical-pad-lite-shell.css";

const BUBBLE_SIZE_PX = 54;
const BUBBLE_MARGIN_PX = 12;
const SAFE_GAP_PX = 8;

type BubblePosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  pointerStartX: number;
  pointerStartY: number;
  bubbleStartX: number;
  bubbleStartY: number;
  moved: boolean;
};

function isLandscapeViewport(): boolean {
  return window.innerWidth > window.innerHeight;
}

function defaultBubblePosition(): BubblePosition {
  return {
    x: window.innerWidth - BUBBLE_SIZE_PX - BUBBLE_MARGIN_PX,
    y: Math.round(window.innerHeight * (isLandscapeViewport() ? 0.48 : 0.62)),
  };
}

function clampBubbleToViewport(position: BubblePosition): BubblePosition {
  const maxX = Math.max(BUBBLE_MARGIN_PX, window.innerWidth - BUBBLE_MARGIN_PX - BUBBLE_SIZE_PX);
  const maxY = Math.max(BUBBLE_MARGIN_PX, window.innerHeight - BUBBLE_MARGIN_PX - BUBBLE_SIZE_PX);
  return {
    x: Math.min(Math.max(position.x, BUBBLE_MARGIN_PX), maxX),
    y: Math.min(Math.max(position.y, BUBBLE_MARGIN_PX), maxY),
  };
}

function intersectsPitch(position: BubblePosition, pitchRect: DOMRect): boolean {
  const bubbleLeft = position.x;
  const bubbleTop = position.y;
  const bubbleRight = bubbleLeft + BUBBLE_SIZE_PX;
  const bubbleBottom = bubbleTop + BUBBLE_SIZE_PX;
  return !(
    bubbleRight <= pitchRect.left ||
    bubbleLeft >= pitchRect.right ||
    bubbleBottom <= pitchRect.top ||
    bubbleTop >= pitchRect.bottom
  );
}

function keepBubbleAwayFromPitch(position: BubblePosition, pitchRect: DOMRect | null): BubblePosition {
  const clamped = clampBubbleToViewport(position);
  if (!pitchRect || !intersectsPitch(clamped, pitchRect)) {
    return clamped;
  }

  const maxX = Math.max(BUBBLE_MARGIN_PX, window.innerWidth - BUBBLE_MARGIN_PX - BUBBLE_SIZE_PX);
  const maxY = Math.max(BUBBLE_MARGIN_PX, window.innerHeight - BUBBLE_MARGIN_PX - BUBBLE_SIZE_PX);
  const candidates: BubblePosition[] = [
    {
      x: Math.min(Math.max(pitchRect.right + SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxX),
      y: clamped.y,
    },
    {
      x: Math.min(Math.max(pitchRect.left - BUBBLE_SIZE_PX - SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxX),
      y: clamped.y,
    },
    {
      x: clamped.x,
      y: Math.min(Math.max(pitchRect.bottom + SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxY),
    },
    {
      x: clamped.x,
      y: Math.min(Math.max(pitchRect.top - BUBBLE_SIZE_PX - SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxY),
    },
  ];

  const safeCandidate = candidates.find((candidate) => !intersectsPitch(candidate, pitchRect));
  return safeCandidate ?? clamped;
}

export default function TacticalPadLitePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window === "undefined" ? false : isLandscapeViewport(),
  );
  const [bubblePosition, setBubblePosition] = useState<BubblePosition>(() => {
    if (typeof window === "undefined") {
      return { x: BUBBLE_MARGIN_PX, y: BUBBLE_MARGIN_PX };
    }
    return defaultBubblePosition();
  });

  const phaseDots = useMemo(() => Array.from({ length: phaseCount }, (_, index) => index + 1), [phaseCount]);
  const buttonClass = "tactical-pad-lite__button";
  const pitchRectGetter = useCallback(() => hostRef.current?.getBoundingClientRect() ?? null, []);

  const updateBubbleForViewport = useCallback(() => {
    setBubblePosition((previous) => keepBubbleAwayFromPitch(previous, pitchRectGetter()));
  }, [pitchRectGetter]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let destroySurface: (() => void) | null = null;

    void createTacticalPadLiteSurface(host, {
      onPhaseCountChange: (count) => {
        if (!disposed) {
          setPhaseCount(count);
        }
      },
    }).then((surface) => {
      if (disposed) {
        surface.destroy();
        return;
      }
      surfaceRef.current = surface;
      destroySurface = surface.destroy;
    });

    return () => {
      disposed = true;
      surfaceRef.current = null;
      destroySurface?.();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(isLandscapeViewport());
      updateBubbleForViewport();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateBubbleForViewport]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBubblePosition((previous) => {
      if (!isLandscape) {
        return keepBubbleAwayFromPitch(previous, pitchRectGetter());
      }
      return keepBubbleAwayFromPitch(defaultBubblePosition(), pitchRectGetter());
    });
  }, [isLandscape, pitchRectGetter]);

  const handleBubblePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      bubbleStartX: bubblePosition.x,
      bubbleStartY: bubblePosition.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBubblePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const nextPosition = clampBubbleToViewport({
      x: dragState.bubbleStartX + (event.clientX - dragState.pointerStartX),
      y: dragState.bubbleStartY + (event.clientY - dragState.pointerStartY),
    });
    const movedDistance = Math.abs(event.clientX - dragState.pointerStartX) + Math.abs(event.clientY - dragState.pointerStartY);
    dragStateRef.current = {
      ...dragState,
      moved: dragState.moved || movedDistance > 5,
    };
    setBubblePosition(nextPosition);
  };

  const completeBubbleInteraction = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!dragState.moved) {
      setIsDrawerOpen((isOpen) => !isOpen);
      return;
    }
    setBubblePosition((previous) => keepBubbleAwayFromPitch(previous, pitchRectGetter()));
  };

  const cancelBubbleInteraction = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setBubblePosition((previous) => keepBubbleAwayFromPitch(previous, pitchRectGetter()));
  };

  return (
    <div
      className={`tactical-pad-lite ${isLandscape ? "is-landscape" : "is-portrait"} ${isDrawerOpen ? "is-tools-open" : "is-tools-closed"}`}
    >
      <div className="tactical-pad-lite__content">
        <div className="tactical-pad-lite__pitch-area">
          <div className="tactical-pad-lite__pitch-shell">
            <div ref={hostRef} className="tactical-pad-lite__pitch-host" />
          </div>
          <div className="tactical-pad-lite__playback-strip">
            <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.play()}>
              Play
            </button>
            <button type="button" className={`${buttonClass} tactical-pad-lite__button--muted`} disabled>
              Pause
            </button>
            <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.reset()}>
              Reset
            </button>
          </div>
        </div>
        <div className={`tactical-pad-lite__drawer ${isDrawerOpen ? "is-open" : ""}`}>
          <div className="tactical-pad-lite__drawer-inner">
            <div className="tactical-pad-lite__drawer-header">
              <strong className="tactical-pad-lite__drawer-title">Edit Tools</strong>
              <button
                type="button"
                className={`${buttonClass} tactical-pad-lite__drawer-close`}
                onClick={() => setIsDrawerOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="tactical-pad-lite__drawer-row">
              <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.setStart()}>
                Set Start
              </button>
              <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.addPhase()}>
                Add Phase
              </button>
              <div className="tactical-pad-lite__phase-count">Phases: {phaseCount}</div>
            </div>
            <div className="tactical-pad-lite__phase-dots-scroll">
              <div className="tactical-pad-lite__phase-dots">
                {phaseDots.length > 0 ? (
                  phaseDots.map((phase) => (
                    <span key={phase} className="tactical-pad-lite__phase-dot" aria-label={`Phase ${phase}`}>
                      {phase}
                    </span>
                  ))
                ) : (
                  <span className="tactical-pad-lite__phase-dot tactical-pad-lite__phase-dot--placeholder">No phases</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="tactical-pad-lite__bubble"
          style={{ left: `${bubblePosition.x}px`, top: `${bubblePosition.y}px` }}
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={completeBubbleInteraction}
          onPointerCancel={cancelBubbleInteraction}
        >
          <span className="tactical-pad-lite__bubble-label">{isDrawerOpen ? "Close" : "Tools"}</span>
        </button>
      </div>
    </div>
  );
}
