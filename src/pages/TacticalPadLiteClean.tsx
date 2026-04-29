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
  overflow: "hidden",
};

const BACKGROUND_LAYER_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
  overflow: "hidden",
};

const BACKGROUND_BASE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, rgba(0, 0, 0, 0.9) 70%), linear-gradient(to bottom, #020617, #020617)",
};

const BACKGROUND_VIGNETTE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at center, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, 0.42) 100%)",
};

const STADIUM_LIGHT_BASE_STYLE: CSSProperties = {
  position: "absolute",
  width: "42vw",
  height: "42vw",
  minWidth: "220px",
  minHeight: "220px",
  borderRadius: "999px",
  filter: "blur(96px)",
  opacity: 0.2,
  background: "radial-gradient(circle, rgba(168, 243, 192, 0.35) 0%, rgba(34, 197, 94, 0) 72%)",
};

const STADIUM_LIGHT_LEFT_STYLE: CSSProperties = {
  ...STADIUM_LIGHT_BASE_STYLE,
  top: "-14vw",
  left: "-10vw",
};

const STADIUM_LIGHT_RIGHT_STYLE: CSSProperties = {
  ...STADIUM_LIGHT_BASE_STYLE,
  top: "-14vw",
  right: "-10vw",
};

const CONTENT_STYLE: CSSProperties = {
  width: "min(calc(100dvw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)), calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)), calc((100dvh - 10px) * 1.6), calc((100vh - 10px) * 1.6), 1360px)",
  maxWidth: "calc(100vw - 24px)",
  aspectRatio: "16 / 10",
  maxHeight: "min(calc(100dvh - 10px), calc(100vh - 10px))",
  boxSizing: "border-box",
  position: "relative",
  zIndex: 1,
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
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#e7f4ee",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 600,
  border: "1px solid rgba(216, 226, 222, 0.22)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
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
  flexDirection: "row",
  gap: "6px",
  padding: "6px",
  borderRadius: "14px",
  background: "rgba(10, 20, 25, 0.62)",
  border: "1px solid rgba(215, 228, 224, 0.18)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.2)",
  zIndex: 19,
};

const CONTROLS_POPOUT_STYLE: CSSProperties = {
  ...POPOUT_BASE_STYLE,
  left: "50%",
  transform: "translateX(-50%)",
  bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
  width: "fit-content",
  maxWidth: "calc(100vw - 128px)",
  overflowX: "auto",
  overflowY: "hidden",
  whiteSpace: "nowrap",
  flexWrap: "nowrap",
  background: "rgba(20, 16, 17, 0.58)",
  border: "1px solid rgba(238, 146, 146, 0.16)",
};

const TOOLS_POPOUT_STYLE: CSSProperties = {
  ...POPOUT_BASE_STYLE,
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  width: "112px",
  maxHeight: "60vh",
  overflowY: "auto",
  overflowX: "hidden",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  bottom: "max(60px, calc(env(safe-area-inset-bottom, 0px) + 58px))",
  background: "rgba(14, 24, 19, 0.56)",
  border: "1px solid rgba(126, 192, 150, 0.16)",
};

const CONTROL_BUTTON_STYLE: CSSProperties = {
  height: "34px",
  minWidth: "78px",
  borderRadius: "10px",
  border: "1px solid rgba(233, 146, 146, 0.2)",
  background: "rgba(26, 20, 20, 0.52)",
  color: "#f0e7e7",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 560,
  letterSpacing: "0.01em",
  padding: "0 10px",
  cursor: "pointer",
  boxShadow: "inset 0 0 0 1px rgba(236, 154, 154, 0.05)",
  flex: "0 0 auto",
};

const DISABLED_CONTROL_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  opacity: 0.4,
  cursor: "not-allowed",
};

const TOOLS_BUTTON_STYLE: CSSProperties = {
  height: "32px",
  minWidth: "100%",
  borderRadius: "9px",
  border: "1px solid rgba(129, 192, 151, 0.16)",
  background: "rgba(14, 25, 19, 0.5)",
  color: "#dff3e6",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10px",
  fontWeight: 550,
  padding: "0 8px",
  cursor: "pointer",
};

const PHASES_CHIP_STYLE: CSSProperties = {
  position: "fixed",
  left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
  top: "max(12px, calc(env(safe-area-inset-top, 0px) + 10px))",
  height: "32px",
  borderRadius: "10px",
  border: "1px solid rgba(226, 236, 232, 0.22)",
  background: "rgba(10, 19, 20, 0.56)",
  color: "#dce9e4",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 560,
  padding: "0 10px",
  cursor: "pointer",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  zIndex: 20,
};

const PHASES_TRAY_STYLE: CSSProperties = {
  position: "fixed",
  left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
  top: "max(48px, calc(env(safe-area-inset-top, 0px) + 46px))",
  width: "126px",
  maxHeight: "156px",
  overflowY: "auto",
  padding: "6px",
  borderRadius: "12px",
  border: "1px solid rgba(226, 236, 232, 0.16)",
  background: "rgba(10, 19, 20, 0.64)",
  color: "#dce9e4",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.2)",
  zIndex: 19,
};

const PHASE_ITEM_STYLE: CSSProperties = {
  height: "28px",
  borderRadius: "8px",
  border: "1px solid rgba(224, 235, 230, 0.18)",
  background: "rgba(15, 24, 24, 0.58)",
  color: "#dce9e4",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10px",
  fontWeight: 550,
  padding: "0 8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const PHASES_EMPTY_STYLE: CSSProperties = {
  ...PHASE_ITEM_STYLE,
  opacity: 0.75,
};

export default function TacticalPadLiteClean() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [phasesOpen, setPhasesOpen] = useState(false);

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

  const phaseItems = Array.from({ length: phaseCount }, (_, index) => index + 1);
  const closeControlsMenu = () => setControlsOpen(false);
  const closeToolsMenu = () => setToolsOpen(false);

  return (
    <div style={ROOT_STYLE}>
      <div style={BACKGROUND_LAYER_STYLE} aria-hidden="true">
        <div style={BACKGROUND_BASE_STYLE} />
        <div style={STADIUM_LIGHT_LEFT_STYLE} />
        <div style={STADIUM_LIGHT_RIGHT_STYLE} />
        <div style={BACKGROUND_VIGNETTE_STYLE} />
      </div>
      <div style={CONTENT_STYLE}>
        <div ref={hostRef} style={PITCH_STYLE} />
      </div>
      <button
        type="button"
        style={PHASES_CHIP_STYLE}
        aria-label="Toggle phases tray"
        onClick={() => setPhasesOpen((open) => !open)}
      >
        Phases: {phaseCount}
      </button>
      {phasesOpen ? (
        <div style={PHASES_TRAY_STYLE}>
          {phaseItems.length > 0 ? (
            phaseItems.map((phase) => (
              <div key={phase} style={PHASE_ITEM_STYLE}>
                Phase {phase}
              </div>
            ))
          ) : (
            <div style={PHASES_EMPTY_STYLE}>No phases</div>
          )}
        </div>
      ) : null}
      {controlsOpen ? (
        <div style={CONTROLS_POPOUT_STYLE}>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : CONTROL_BUTTON_STYLE}
            onClick={() => {
              surfaceRef.current?.setStart();
              closeControlsMenu();
            }}
          >
            Set Start
          </button>
          <button
            type="button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : CONTROL_BUTTON_STYLE}
            onClick={() => {
              surfaceRef.current?.addPhase();
              closeControlsMenu();
            }}
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
              closeControlsMenu();
            }}
          >
            Reset
          </button>
        </div>
      ) : null}
      {toolsOpen ? (
        <div style={TOOLS_POPOUT_STYLE}>
          <button type="button" style={TOOLS_BUTTON_STYLE} onClick={closeToolsMenu}>
            Select
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE} onClick={closeToolsMenu}>
            Arrow
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE} onClick={closeToolsMenu}>
            Dashed
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE} onClick={closeToolsMenu}>
            Zone
          </button>
          <button type="button" style={TOOLS_BUTTON_STYLE} onClick={closeToolsMenu}>
            Clear
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
