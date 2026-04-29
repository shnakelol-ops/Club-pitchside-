import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";

const ROOT_STYLE: CSSProperties = {
  margin: 0,
  width: "100%",
  minHeight: "100vh",
  background: "#0b1110",
  padding: "4px 6px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const CONTENT_STYLE: CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const PITCH_STYLE: CSSProperties = {
  width: "min(98vw, calc((100vh - 82px) * 1.6), 1360px)",
  aspectRatio: "16 / 10",
  height: "auto",
  maxHeight: "calc(100vh - 82px)",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 20px 44px rgba(0, 0, 0, 0.38)",
  background: "#13221d",
};

const CONTROL_BAR_STYLE: CSSProperties = {
  position: "static",
  display: "flex",
  gap: "6px",
  width: "fit-content",
  maxWidth: "96%",
  marginTop: "8px",
  padding: "6px 10px",
  borderRadius: "14px",
  background: "rgba(8, 16, 14, 0.64)",
  border: "1px solid rgba(92, 196, 132, 0.24)",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.22), 0 0 18px rgba(72, 184, 118, 0.12)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid rgba(95, 205, 138, 0.34)",
  borderRadius: "10px",
  background: "rgba(8, 23, 16, 0.58)",
  color: "#dcf6e5",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11.5px",
  fontWeight: 550,
  letterSpacing: "0.01em",
  height: "40px",
  padding: "0 13px",
  minWidth: "84px",
  cursor: "pointer",
  boxShadow: "inset 0 0 0 1px rgba(111, 220, 153, 0.08), 0 0 10px rgba(68, 178, 112, 0.1)",
};

const DISABLED_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  opacity: 0.42,
  cursor: "not-allowed",
};

const PHASE_COUNT_STYLE: CSSProperties = {
  height: "40px",
  display: "flex",
  alignItems: "center",
  border: "1px solid rgba(95, 205, 138, 0.28)",
  borderRadius: "10px",
  background: "rgba(6, 19, 13, 0.58)",
  color: "rgba(213, 244, 224, 0.95)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 560,
  padding: "0 10px",
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

  const togglePlay = () => {
    if (!isPlaying) {
      surfaceRef.current?.play();
      setIsPlaying(true);
      return;
    }
    setIsPlaying(false);
  };

  return (
    <div style={ROOT_STYLE}>
      <div style={CONTENT_STYLE}>
        <div ref={hostRef} style={PITCH_STYLE} />
        <div style={CONTROL_BAR_STYLE}>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_BUTTON_STYLE : BUTTON_STYLE}
            onClick={() => surfaceRef.current?.setStart()}
          >
            Set Start
          </button>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_BUTTON_STYLE : BUTTON_STYLE}
            onClick={() => surfaceRef.current?.addPhase()}
          >
            Add Phase
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={togglePlay}>
            Play
          </button>
          <button
            type="button"
            style={BUTTON_STYLE}
            onClick={() => {
              surfaceRef.current?.reset();
              setIsPlaying(false);
            }}
          >
            Reset
          </button>
          <div style={PHASE_COUNT_STYLE}>Phases: {phaseCount}</div>
        </div>
      </div>
    </div>
  );
}
