import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPlayerPositionSnapshot,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  margin: 0,
  background: "#0b1110",
  display: "grid",
  placeItems: "center",
};

const BOARD_STYLE: CSSProperties = {
  width: "min(96vw, 1200px)",
  height: "min(88vh, 760px)",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 20px 44px rgba(0, 0, 0, 0.38)",
  background: "#13221d",
};

const CONTROLS_STYLE: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "22px",
  transform: "translateX(-50%)",
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "10px",
  rowGap: "8px",
  width: "calc(100vw - 16px)",
  maxWidth: "min(96vw, 1200px)",
  zIndex: 5,
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid rgba(225, 243, 235, 0.48)",
  borderRadius: "10px",
  background: "rgba(10, 22, 18, 0.88)",
  color: "#e7f6ee",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  padding: "8px 13px",
  cursor: "pointer",
};

const PHASE_COUNT_STYLE: CSSProperties = {
  position: "fixed",
  top: "16px",
  left: "16px",
  zIndex: 5,
  color: "#e7f6ee",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  background: "rgba(10, 22, 18, 0.78)",
  border: "1px solid rgba(225, 243, 235, 0.35)",
  borderRadius: "9px",
  padding: "6px 10px",
};

export default function TacticalPadLitePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const phasesRef = useRef<TacticalPlayerPositionSnapshot[][]>([]);
  const [phaseCount, setPhaseCount] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let destroySurface: (() => void) | null = null;

    void createTacticalPadLiteSurface(host).then((surface) => {
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

  function deepCopyPhaseSnapshot(
    snapshot: TacticalPlayerPositionSnapshot[],
  ): TacticalPlayerPositionSnapshot[] {
    return snapshot.map((player) => ({
      id: player.id,
      current: { ...player.current },
    }));
  }

  function readCurrentSnapshot(): TacticalPlayerPositionSnapshot[] | null {
    const snapshot = surfaceRef.current?.getCurrentPlayerPositions();
    if (!snapshot) return null;
    return deepCopyPhaseSnapshot(snapshot);
  }

  function buildPhasePlaybackSequence(): TacticalPlayerPositionSnapshot[][] {
    const startSnapshot = surfaceRef.current?.getStartPlayerPositions();
    if (!startSnapshot) return [];
    const phaseZero = deepCopyPhaseSnapshot(startSnapshot);
    const addedPhases = phasesRef.current.map((phase) => deepCopyPhaseSnapshot(phase));
    return [phaseZero, ...addedPhases];
  }

  return (
    <div style={ROOT_STYLE}>
      <div ref={hostRef} style={BOARD_STYLE} />
      <div style={PHASE_COUNT_STYLE}>Phases: {phaseCount}</div>
      <div style={CONTROLS_STYLE}>
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => {
            const snapshot = readCurrentSnapshot();
            if (!snapshot) return;
            phasesRef.current = [...phasesRef.current, snapshot];
            setPhaseCount(phasesRef.current.length);
          }}
        >
          Add Phase
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => {
            surfaceRef.current?.setStart();
            phasesRef.current = [];
            setPhaseCount(0);
          }}
        >
          Set Start
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => {
            const phaseSequence = buildPhasePlaybackSequence();
            if (phaseSequence.length <= 1) {
              surfaceRef.current?.play();
              return;
            }
            surfaceRef.current?.playPhaseSequence(phaseSequence);
          }}
        >
          Play
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={() => surfaceRef.current?.reset()}>
          Reset
        </button>
      </div>
    </div>
  );
}
