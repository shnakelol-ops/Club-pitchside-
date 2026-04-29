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
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "16px",
  boxSizing: "border-box",
};

const STACK_STYLE: CSSProperties = {
  width: "min(96vw, 1200px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const PITCH_STYLE: CSSProperties = {
  width: "100%",
  height: "min(80vh, 760px)",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 20px 44px rgba(0, 0, 0, 0.38)",
  background: "#13221d",
};

const CONTROL_BAR_STYLE: CSSProperties = {
  position: "static",
  display: "flex",
  gap: "8px",
  maxWidth: "90%",
  margin: "0 auto",
  marginTop: "12px",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "rgba(10, 20, 30, 0.7)",
  border: "1px solid rgba(190, 208, 222, 0.2)",
  boxShadow: "0 10px 26px rgba(0, 0, 0, 0.28)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid rgba(215, 221, 228, 0.36)",
  borderRadius: "10px",
  background: "rgba(223, 230, 236, 0.1)",
  color: "#e7edf2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 14px",
  minWidth: "92px",
  cursor: "pointer",
};

const DISABLED_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  opacity: 0.4,
  cursor: "not-allowed",
};

export default function TacticalPadLiteClean() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
      <div style={STACK_STYLE}>
        <div ref={hostRef} style={PITCH_STYLE} />
        <div style={CONTROL_BAR_STYLE}>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_BUTTON_STYLE : BUTTON_STYLE}
            onClick={() => surfaceRef.current?.setStart()}
          >
            SET START
          </button>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_BUTTON_STYLE : BUTTON_STYLE}
            onClick={() => surfaceRef.current?.addPhase()}
          >
            ADD PHASE
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={togglePlay}>
            {isPlaying ? "PAUSE" : "PLAY"}
          </button>
          <button
            type="button"
            style={BUTTON_STYLE}
            onClick={() => {
              surfaceRef.current?.reset();
              setIsPlaying(false);
            }}
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}
