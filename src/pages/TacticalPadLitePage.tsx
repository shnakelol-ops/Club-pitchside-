import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";
import "./tactical-pad-lite-shell.css";

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  margin: 0,
  background: "#0b1110",
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr) auto",
  justifyItems: "center",
  alignItems: "stretch",
  gap: "10px",
  padding: "12px",
  boxSizing: "border-box",
};

const BOARD_STYLE: CSSProperties = {
  width: "min(96vw, 1200px)",
  height: "100%",
  maxHeight: "min(80vh, 760px)",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 20px 44px rgba(0, 0, 0, 0.38)",
  background: "#13221d",
};

const CONTROLS_STYLE: CSSProperties = {
  width: "min(96vw, 1200px)",
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: "8px",
  overflowX: "auto",
  padding: "6px 8px",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  background: "rgba(10, 20, 35, 0.74)",
  boxShadow: "0 8px 18px rgba(4, 12, 24, 0.22)",
  boxSizing: "border-box",
  transition: "opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.36)",
  borderRadius: "8px",
  background: "rgba(15, 23, 42, 0.86)",
  color: "#dbe7f5",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "1.1",
  letterSpacing: "0.2px",
  textTransform: "uppercase",
  padding: "6px 10px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
};

const PHASE_COUNT_STYLE: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.34)",
  borderRadius: "8px",
  background: "rgba(15, 23, 42, 0.86)",
  color: "#dbe7f5",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "1.1",
  letterSpacing: "0.2px",
  textTransform: "uppercase",
  padding: "6px 10px",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
};

export default function TacticalPadLitePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [isPlaybackVisualActive, setIsPlaybackVisualActive] = useState(false);

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

  const handleSetStart = () => {
    setIsPlaybackVisualActive(false);
    surfaceRef.current?.setStart();
  };

  const handleAddPhase = () => {
    setIsPlaybackVisualActive(false);
    surfaceRef.current?.addPhase();
  };

  const handlePlay = () => {
    setIsPlaybackVisualActive(true);
    surfaceRef.current?.play();
  };

  const handlePause = () => {
    setIsPlaybackVisualActive(false);
  };

  const handleReset = () => {
    setIsPlaybackVisualActive(false);
    surfaceRef.current?.reset();
  };

  return (
    <div style={ROOT_STYLE}>
      <div ref={hostRef} style={BOARD_STYLE} />
      <div
        style={CONTROLS_STYLE}
        className={`tactical-lite-controls ${isPlaybackVisualActive ? "is-playing" : ""}`}
      >
        <button
          type="button"
          style={BUTTON_STYLE}
          className="tactical-lite-control tactical-lite-control--ghost"
          onClick={handleSetStart}
        >
          Set Start
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          className="tactical-lite-control tactical-lite-control--ghost"
          onClick={handleAddPhase}
        >
          Add Phase
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          className="tactical-lite-control tactical-lite-control--ghost"
          onClick={handlePlay}
        >
          Play
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          className="tactical-lite-control tactical-lite-control--pause"
          onClick={handlePause}
        >
          Pause
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          className="tactical-lite-control tactical-lite-control--ghost"
          onClick={handleReset}
        >
          Reset
        </button>
        <div style={PHASE_COUNT_STYLE} className="tactical-lite-control tactical-lite-control--ghost">
          Phases: {phaseCount}
        </div>
      </div>
    </div>
  );
}
