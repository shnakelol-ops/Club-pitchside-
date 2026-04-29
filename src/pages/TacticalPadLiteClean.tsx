import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  margin: 0,
  background: "#0b1110",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  boxSizing: "border-box",
};

const CONTENT_STYLE: CSSProperties = {
  width: "min(96vw, 1200px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const PITCH_FRAME_STYLE: CSSProperties = {
  width: "100%",
  maxHeight: "78vh",
  aspectRatio: "160 / 100",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 20px 44px rgba(0, 0, 0, 0.38)",
  background: "#13221d",
};

const CONTROL_BAR_STYLE: CSSProperties = {
  maxWidth: "90%",
  width: "fit-content",
  margin: "0 auto",
  marginTop: "12px",
  padding: "10px 12px",
  borderRadius: "16px",
  border: "1px solid rgba(160, 176, 192, 0.24)",
  background: "rgba(10, 20, 30, 0.7)",
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.26)",
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: "8px",
  overflowX: "auto",
  boxSizing: "border-box",
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid rgba(152, 171, 189, 0.34)",
  borderRadius: "10px",
  background: "rgba(16, 28, 40, 0.88)",
  color: "#dbe7f5",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "1.1",
  letterSpacing: "0.15px",
  textTransform: "uppercase",
  padding: "7px 11px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
};

const PHASE_COUNT_STYLE: CSSProperties = {
  border: "1px solid rgba(152, 171, 189, 0.3)",
  borderRadius: "10px",
  background: "rgba(16, 28, 40, 0.82)",
  color: "#dbe7f5",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  padding: "7px 11px",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
};

const DISABLED_STYLE: CSSProperties = {
  opacity: 0.4,
  pointerEvents: "none",
};

export default function TacticalPadLiteClean() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
    if (isPlaying) return;
    surfaceRef.current?.setStart();
  };

  const handleAddPhase = () => {
    if (isPlaying) return;
    surfaceRef.current?.addPhase();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    surfaceRef.current?.play();
  };

  const handleReset = () => {
    setIsPlaying(false);
    surfaceRef.current?.reset();
  };

  return (
    <div style={ROOT_STYLE}>
      <div style={CONTENT_STYLE}>
        <div ref={hostRef} style={PITCH_FRAME_STYLE} />
        <div style={CONTROL_BAR_STYLE}>
          <button
            type="button"
            style={isPlaying ? { ...BUTTON_STYLE, ...DISABLED_STYLE } : BUTTON_STYLE}
            onClick={handleSetStart}
            disabled={isPlaying}
          >
            Set Start
          </button>
          <button
            type="button"
            style={isPlaying ? { ...BUTTON_STYLE, ...DISABLED_STYLE } : BUTTON_STYLE}
            onClick={handleAddPhase}
            disabled={isPlaying}
          >
            Add Phase
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={handlePlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={handleReset}>
            Reset
          </button>
          <div style={PHASE_COUNT_STYLE}>Phases: {phaseCount}</div>
        </div>
      </div>
    </div>
  );
}
