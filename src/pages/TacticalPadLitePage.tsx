import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";
import "./tactical-pad-lite-shell.css";

const PORTRAIT_BUBBLE_SIZE_PX = 42;
const LANDSCAPE_BUBBLE_SIZE_PX = 38;
const BUBBLE_MARGIN_PX = 12;
const SAFE_GAP_PX = 8;
const MIN_SPACE_RIGHT_FOR_SIDE_PANEL_PX = 200;
const PLAYABLE_PITCH_ASPECT_RATIO = 160 / 100;

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

type PitchMetrics = {
  left: number;
  right: number;
  width: number;
  availableRight: number;
  availableBelow: number;
};

function isLandscapeViewport(): boolean {
  return window.innerWidth > window.innerHeight;
}

function getPlayablePitchRect(hostRect: DOMRect): DOMRect {
  const hostAspect = hostRect.width / Math.max(1, hostRect.height);
  if (hostAspect >= PLAYABLE_PITCH_ASPECT_RATIO) {
    const width = hostRect.height * PLAYABLE_PITCH_ASPECT_RATIO;
    const left = hostRect.left + (hostRect.width - width) * 0.5;
    return new DOMRect(left, hostRect.top, width, hostRect.height);
  }

  const height = hostRect.width / PLAYABLE_PITCH_ASPECT_RATIO;
  const top = hostRect.top + (hostRect.height - height) * 0.5;
  return new DOMRect(hostRect.left, top, hostRect.width, height);
}

function clampBubbleToViewport(position: BubblePosition, bubbleSizePx: number): BubblePosition {
  const maxX = Math.max(BUBBLE_MARGIN_PX, window.innerWidth - BUBBLE_MARGIN_PX - bubbleSizePx);
  const maxY = Math.max(BUBBLE_MARGIN_PX, window.innerHeight - BUBBLE_MARGIN_PX - bubbleSizePx);
  return {
    x: Math.min(Math.max(position.x, BUBBLE_MARGIN_PX), maxX),
    y: Math.min(Math.max(position.y, BUBBLE_MARGIN_PX), maxY),
  };
}

function intersectsRect(position: BubblePosition, bubbleSizePx: number, blockedRect: DOMRect): boolean {
  const bubbleLeft = position.x;
  const bubbleTop = position.y;
  const bubbleRight = bubbleLeft + bubbleSizePx;
  const bubbleBottom = bubbleTop + bubbleSizePx;
  return !(
    bubbleRight <= blockedRect.left ||
    bubbleLeft >= blockedRect.right ||
    bubbleBottom <= blockedRect.top ||
    bubbleTop >= blockedRect.bottom
  );
}

function keepBubbleAwayFromRects(
  position: BubblePosition,
  bubbleSizePx: number,
  blockedRects: DOMRect[],
): BubblePosition {
  const clamped = clampBubbleToViewport(position, bubbleSizePx);
  if (blockedRects.length === 0 || blockedRects.every((rect) => !intersectsRect(clamped, bubbleSizePx, rect))) {
    return clamped;
  }

  const maxX = Math.max(BUBBLE_MARGIN_PX, window.innerWidth - BUBBLE_MARGIN_PX - bubbleSizePx);
  const maxY = Math.max(BUBBLE_MARGIN_PX, window.innerHeight - BUBBLE_MARGIN_PX - bubbleSizePx);
  let resolved = clamped;
  for (const blockedRect of blockedRects) {
    if (!intersectsRect(resolved, bubbleSizePx, blockedRect)) continue;
    const candidates: BubblePosition[] = [
      {
        x: Math.min(Math.max(blockedRect.right + SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxX),
        y: resolved.y,
      },
      {
        x: Math.min(Math.max(blockedRect.left - bubbleSizePx - SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxX),
        y: resolved.y,
      },
      {
        x: resolved.x,
        y: Math.min(Math.max(blockedRect.top - bubbleSizePx - SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxY),
      },
      {
        x: resolved.x,
        y: Math.min(Math.max(blockedRect.bottom + SAFE_GAP_PX, BUBBLE_MARGIN_PX), maxY),
      },
    ];
    const safeCandidate = candidates.find((candidate) =>
      blockedRects.every((rect) => !intersectsRect(candidate, bubbleSizePx, rect)),
    );
    if (safeCandidate) {
      resolved = safeCandidate;
    }
  }
  return resolved;
}

export default function TacticalPadLitePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const playbackStripRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const pitchMetricsRef = useRef<PitchMetrics | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window === "undefined" ? false : isLandscapeViewport(),
  );
  const [usesLandscapeSidePanel, setUsesLandscapeSidePanel] = useState(false);
  const [bubblePosition, setBubblePosition] = useState<BubblePosition>(() => {
    if (typeof window === "undefined") {
      return { x: BUBBLE_MARGIN_PX, y: BUBBLE_MARGIN_PX };
    }
    return {
      x: window.innerWidth - PORTRAIT_BUBBLE_SIZE_PX - BUBBLE_MARGIN_PX,
      y: Math.round(window.innerHeight * 0.62),
    };
  });

  const phaseDots = useMemo(() => Array.from({ length: phaseCount }, (_, index) => index + 1), [phaseCount]);
  const buttonClass = "tactical-pad-lite__button";
  const bubbleSizePx = isLandscape ? LANDSCAPE_BUBBLE_SIZE_PX : PORTRAIT_BUBBLE_SIZE_PX;

  const getPitchMeasurement = useCallback((): { pitchRect: DOMRect; metrics: PitchMetrics } | null => {
    const hostRect = hostRef.current?.getBoundingClientRect();
    if (!hostRect) {
      pitchMetricsRef.current = null;
      return null;
    }
    const pitchRect = getPlayablePitchRect(hostRect);
    const metrics: PitchMetrics = {
      left: pitchRect.left,
      right: pitchRect.right,
      width: pitchRect.width,
      availableRight: Math.max(0, window.innerWidth - pitchRect.right - BUBBLE_MARGIN_PX),
      availableBelow: Math.max(0, window.innerHeight - pitchRect.bottom - BUBBLE_MARGIN_PX),
    };
    pitchMetricsRef.current = metrics;
    return { pitchRect, metrics };
  }, []);

  const evaluateLandscapeLayout = useCallback(() => {
    const landscape = isLandscapeViewport();
    setIsLandscape(landscape);
    if (!landscape) {
      setUsesLandscapeSidePanel(false);
      return;
    }
    const measurement = getPitchMeasurement();
    const availableRight = measurement?.metrics.availableRight ?? 0;
    setUsesLandscapeSidePanel(availableRight >= MIN_SPACE_RIGHT_FOR_SIDE_PANEL_PX);
  }, [getPitchMeasurement]);

  const getBlockedRects = useCallback((): DOMRect[] => {
    const blockedRects: DOMRect[] = [];
    const measurement = getPitchMeasurement();
    if (measurement) {
      blockedRects.push(measurement.pitchRect);
    }
    if (!isLandscape) {
      return blockedRects;
    }
    const playbackRect = playbackStripRef.current?.getBoundingClientRect();
    if (playbackRect) {
      blockedRects.push(playbackRect);
    }
    if (usesLandscapeSidePanel && isDrawerOpen) {
      const drawerRect = drawerRef.current?.getBoundingClientRect();
      if (drawerRect) {
        blockedRects.push(drawerRect);
      }
    }
    return blockedRects;
  }, [getPitchMeasurement, isDrawerOpen, isLandscape, usesLandscapeSidePanel]);

  const updateBubbleForViewport = useCallback(() => {
    setBubblePosition((previous) => keepBubbleAwayFromRects(previous, bubbleSizePx, getBlockedRects()));
  }, [bubbleSizePx, getBlockedRects]);

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
      evaluateLandscapeLayout();
      updateBubbleForViewport();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [evaluateLandscapeLayout, updateBubbleForViewport]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const resizeObserver = new ResizeObserver(() => {
      evaluateLandscapeLayout();
      updateBubbleForViewport();
    });
    resizeObserver.observe(host);
    return () => {
      resizeObserver.disconnect();
    };
  }, [evaluateLandscapeLayout, updateBubbleForViewport]);

  useEffect(() => {
    if (!isLandscape) return;
    setBubblePosition(() =>
      keepBubbleAwayFromRects(
        {
          x: window.innerWidth - LANDSCAPE_BUBBLE_SIZE_PX - BUBBLE_MARGIN_PX,
          y: Math.round(window.innerHeight * 0.34),
        },
        LANDSCAPE_BUBBLE_SIZE_PX,
        getBlockedRects(),
      ),
    );
  }, [getBlockedRects, isLandscape, usesLandscapeSidePanel]);

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

    const nextPosition = clampBubbleToViewport(
      {
        x: dragState.bubbleStartX + (event.clientX - dragState.pointerStartX),
        y: dragState.bubbleStartY + (event.clientY - dragState.pointerStartY),
      },
      bubbleSizePx,
    );
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
    setBubblePosition((previous) => keepBubbleAwayFromRects(previous, bubbleSizePx, getBlockedRects()));
  };

  const cancelBubbleInteraction = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setBubblePosition((previous) => keepBubbleAwayFromRects(previous, bubbleSizePx, getBlockedRects()));
  };

  const rootClassName = [
    "tactical-pad-lite",
    isLandscape ? "is-landscape" : "",
    isLandscape ? (isDrawerOpen ? "is-tools-open" : "is-tools-closed") : "",
    isLandscape && usesLandscapeSidePanel ? "is-landscape-side" : "",
    isLandscape && !usesLandscapeSidePanel ? "is-landscape-bottom-fallback" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div className="tactical-pad-lite__content">
        <div className="tactical-pad-lite__pitch-shell">
          <div ref={hostRef} className="tactical-pad-lite__pitch-host" />
        </div>
        <div className="tactical-pad-lite__safe-controls">
          <div ref={playbackStripRef} className="tactical-pad-lite__playback-strip">
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
          <div ref={drawerRef} className={`tactical-pad-lite__drawer ${isDrawerOpen ? "is-open" : ""}`}>
            <div className="tactical-pad-lite__drawer-inner">
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
        </div>
        <button
          type="button"
          className="tactical-pad-lite__bubble"
          aria-label={isDrawerOpen ? "Close tactical tools menu" : "Open tactical tools menu"}
          style={{ left: `${bubblePosition.x}px`, top: `${bubblePosition.y}px` }}
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={completeBubbleInteraction}
          onPointerCancel={cancelBubbleInteraction}
        >
          <span className="tactical-pad-lite__bubble-icon" aria-hidden="true">
            {isDrawerOpen ? "×" : "☰"}
          </span>
        </button>
      </div>
    </div>
  );
}
