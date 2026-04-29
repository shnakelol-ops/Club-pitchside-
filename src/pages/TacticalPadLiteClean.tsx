import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "#0b1110",
  margin: 0,
  padding: "4px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const CONTENT_STYLE: CSSProperties = {
  width: "min(99vw, calc((100vh - 10px) * 1.6), 1360px)",
  aspectRatio: "16 / 10",
  maxHeight: "calc(100vh - 10px)",
  display: "flex",
  alignItems: "stretch",
};

const PITCH_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 20px 44px rgba(0, 0, 0, 0.38)",
  background: "#13221d",
};

const BUBBLE_BASE_STYLE: CSSProperties = {
  position: "fixed",
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#e7f4ee",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  border: "1px solid rgba(216, 226, 222, 0.22)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.24)",
  cursor: "pointer",
  zIndex: 20,
};

const LEFT_BUBBLE_STYLE: CSSProperties = {
  ...BUBBLE_BASE_STYLE,
  left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
  bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
  background: "rgba(255, 80, 80, 0.08)",
  border: "1px solid rgba(255, 114, 114, 0.25)",
};

const RIGHT_BUBBLE_STYLE: CSSProperties = {
  ...BUBBLE_BASE_STYLE,
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
  background: "rgba(80, 255, 140, 0.08)",
  border: "1px solid rgba(110, 230, 156, 0.25)",
};

const POPOUT_BASE_STYLE: CSSProperties = {
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "10px",
  borderRadius: "14px",
  background: "rgba(10, 20, 25, 0.62)",
  border: "1px solid rgba(215, 228, 224, 0.18)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
  zIndex: 19,
};

const CONTROLS_POPOUT_STYLE: CSSProperties = {
  ...POPOUT_BASE_STYLE,
  left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
  bottom: "max(64px, calc(env(safe-area-inset-bottom, 0px) + 62px))",
  background: "rgba(22, 17, 18, 0.66)",
  border: "1px solid rgba(255, 118, 118, 0.22)",
};

const TOOLS_POPOUT_STYLE: CSSProperties = {
  ...POPOUT_BASE_STYLE,
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  bottom: "max(64px, calc(env(safe-area-inset-bottom, 0px) + 62px))",
  background: "rgba(11, 20, 16, 0.66)",
  border: "1px solid rgba(108, 226, 150, 0.22)",
};

const CONTROL_BUTTON_STYLE: CSSProperties = {
  height: "38px",
  minWidth: "104px",
  borderRadius: "10px",
  border: "1px solid rgba(255, 124, 124, 0.28)",
  background: "rgba(28, 20, 21, 0.56)",
  color: "#f0e7e7",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11.5px",
  fontWeight: 560,
  letterSpacing: "0.01em",
  padding: "0 12px",
  cursor: "pointer",
  boxShadow: "inset 0 0 0 1px rgba(255, 142, 142, 0.08)",
};

const DISABLED_CONTROL_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  opacity: 0.4,
  cursor: "not-allowed",
};

const PHASE_COUNT_STYLE: CSSProperties = {
  height: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255, 133, 133, 0.22)",
  borderRadius: "10px",
  background: "rgba(30, 21, 22, 0.52)",
  color: "rgba(247, 228, 228, 0.92)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 550,
  padding: "0 9px",
};

const TOOLS_BUTTON_STYLE: CSSProperties = {
  height: "34px",
  minWidth: "86px",
  borderRadius: "10px",
  border: "1px solid rgba(110, 226, 150, 0.24)",
  background: "rgba(13, 24, 18, 0.56)",
  color: "#dff3e6",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 550,
  padding: "0 10px",
  cursor: "pointer",
};

const CLOSE_BUTTON_STYLE: CSSProperties = {
  height: "28px",
  borderRadius: "8px",
  border: "1px solid rgba(220, 228, 224, 0.2)",
  background: "rgba(16, 22, 24, 0.44)",
  color: "#d6e3df",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10px",
  fontWeight: 560,
  cursor: "pointer",
};

export default function TacticalPadLiteClean() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

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
      setControlsOpen(false);
      return;
    }
    setIsPlaying(false);
    setControlsOpen(false);
  };

  return (
    <div style={ROOT_STYLE}>
      <div style={CONTENT_STYLE}>
        <div ref={hostRef} style={PITCH_STYLE} />
      </div>
      {controlsOpen ? (
        <div style={CONTROLS_POPOUT_STYLE}>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : CONTROL_BUTTON_STYLE}
            onClick={() => surfaceRef.current?.setStart()}
          >
            Set Start
          </button>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : CONTROL_BUTTON_STYLE}
            onClick={() => surfaceRef.current?.addPhase()}
          >
            Add Phase
          </button>
          <button type="button" style={CONTROL_BUTTON_STYLE} onClick={togglePlay}>
            Play
          </button>
          <button
            type="button"
            style={CONTROL_BUTTON_STYLE}
            onClick={() => {
              surfaceRef.current?.reset();
              setIsPlaying(false);
            }}
          >
            Reset
          </button>
          <div style={PHASE_COUNT_STYLE}>Phases: {phaseCount}</div>
          <button type="button" style={CLOSE_BUTTON_STYLE} onClick={() => setControlsOpen(false)}>
            Close
          </button>
        </div>
      ) : null}
      {toolsOpen ? (
        <div style={TOOLS_POPOUT_STYLE}>
          <button type="button" style={TOOLS_BUTTON_STYLE}>
            Select
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE}>
            Arrow
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE}>
            Dashed
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE}>
            Zone
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE}>
            Clear
          </button>
          <button type="button" style={CLOSE_BUTTON_STYLE} onClick={() => setToolsOpen(false)}>
            Close
          </button>
        </div>
      ) : null}
      <button
        type="button"
        style={LEFT_BUBBLE_STYLE}
        aria-label="Open controls"
        onClick={() => setControlsOpen((open) => !open)}
      >
        Ctrl
      </button>
      <button
        type="button"
        style={RIGHT_BUBBLE_STYLE}
        aria-label="Open tools"
        onClick={() => setToolsOpen((open) => !open)}
      >
        Tool
      </button>
    </div>
  );
}
