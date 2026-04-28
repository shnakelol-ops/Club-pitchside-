import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  createTacticalPadLiteSurface,
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
  gap: "10px",
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
  border: "1px solid rgba(225, 243, 235, 0.3)",
  borderRadius: "10px",
  background: "rgba(10, 22, 18, 0.72)",
  color: "#e7f6ee",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  padding: "8px 13px",
};

const PHASE_NAV_STYLE: CSSProperties = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
};

const PHASE_DOT_BASE_STYLE: CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  border: "1px solid rgba(225, 243, 235, 0.36)",
  background: "rgba(10, 22, 18, 0.78)",
  color: "#e7f6ee",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  lineHeight: 1,
};
const PHASE_DOT_IDLE_BORDER_COLOR = "rgba(225, 243, 235, 0.36)";

export default function TacticalPadLitePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const phaseIndices = useMemo(
    () => Array.from({ length: phaseCount + 1 }, (_, index) => index),
    [phaseCount],
  );

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
      onSelectedPhaseChange: (index) => {
        if (!disposed) {
          setSelectedPhaseIndex(index);
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

  return (
    <div style={ROOT_STYLE}>
      <div ref={hostRef} style={BOARD_STYLE} />
      <div style={CONTROLS_STYLE}>
        <button type="button" style={BUTTON_STYLE} onClick={() => surfaceRef.current?.setStart()}>
          Set Start
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={() => surfaceRef.current?.addPhase()}>
          Add Phase
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={() => surfaceRef.current?.play()}>
          Play
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={() => surfaceRef.current?.reset()}>
          Reset
        </button>
        <div style={PHASE_COUNT_STYLE}>Phases: {phaseCount}</div>
        <div style={PHASE_NAV_STYLE}>
          {phaseIndices.map((phaseIndex) => {
            const isSelected = selectedPhaseIndex === phaseIndex;
            return (
              <button
                key={phaseIndex}
                type="button"
                style={{
                  ...PHASE_DOT_BASE_STYLE,
                  background: isSelected ? "#2f80ed" : PHASE_DOT_BASE_STYLE.background,
                  borderColor: isSelected ? "rgba(111, 189, 255, 0.95)" : PHASE_DOT_IDLE_BORDER_COLOR,
                }}
                onClick={() => surfaceRef.current?.jumpToPhase(phaseIndex)}
              >
                {phaseIndex}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
