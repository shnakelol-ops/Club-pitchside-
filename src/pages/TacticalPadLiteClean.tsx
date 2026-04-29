import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(220, 238, 242, 1) 0%, rgba(180, 210, 220, 1) 45%, rgba(120, 170, 195, 1) 100%)",
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
    "radial-gradient(circle at top left, rgba(0, 120, 100, 0.09), transparent 60%), radial-gradient(circle at top right, rgba(0, 120, 100, 0.09), transparent 60%), linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0) 30%), linear-gradient(to top, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0) 35%), linear-gradient(to bottom, rgba(0, 0, 0, 0) 58%, rgba(0, 80, 60, 0.13) 100%), linear-gradient(135deg, rgba(220, 238, 242, 1) 0%, rgba(172, 203, 214, 1) 45%, rgba(108, 158, 183, 1) 100%)",
};

const BACKGROUND_VIGNETTE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 42%, rgba(4, 12, 18, 0.28) 68%, rgba(0, 0, 0, 0.62) 100%)",
};

const STADIUM_FLOODLIGHT_CSS = `
.stadium-light {
  position: absolute;
  top: 6%;
  width: 88px;
  height: 70px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
  pointer-events: none;
  z-index: 1;
  opacity: 0.95;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.75))
    drop-shadow(0 0 28px rgba(180, 235, 255, 0.55));
}

.stadium-light span {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.9),
    0 0 22px rgba(185, 235, 255, 0.65);
}

.stadium-light-left {
  left: 2.5%;
  transform: rotate(14deg);
}

.stadium-light-right {
  right: 2.5%;
  transform: rotate(-14deg);
}

.stadium-light::before {
  content: "";
  position: absolute;
  top: 18px;
  width: 210px;
  height: 220px;
  pointer-events: none;
  background: radial-gradient(
    ellipse at top,
    rgba(210, 240, 255, 0.28) 0%,
    rgba(160, 220, 235, 0.16) 35%,
    rgba(100, 180, 190, 0.08) 58%,
    transparent 78%
  );
  filter: blur(22px);
  z-index: -1;
}

.stadium-light-left::before {
  left: -25px;
  transform: rotate(24deg);
}

.stadium-light-right::before {
  right: -25px;
  transform: rotate(-24deg);
}

.simulator-container::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background:
    radial-gradient(ellipse at 15% 0%, rgba(255, 255, 255, 0.18), transparent 35%),
    radial-gradient(ellipse at 85% 0%, rgba(255, 255, 255, 0.18), transparent 35%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.18), transparent 40%);
}

.floating-bubble {
  transition: transform 140ms ease, filter 140ms ease;
}

.floating-bubble:hover,
.floating-bubble:active {
  transform: scale(1.04);
  filter: brightness(1.1);
}

.floating-bubble-tool {
  background: rgba(5, 8, 10, 0.92);
  border: 2px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.55),
    inset 0 1px 2px rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.96);
}

.floating-bubble-tool:hover,
.floating-bubble-tool:active {
  transform: scale(0.96);
  filter: brightness(1.15);
}

.tool-bubble-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.tool-bubble-mark-svg {
  width: 24px;
  height: 24px;
  display: block;
}

.control-button {
  transition: transform 140ms ease, filter 140ms ease;
}

.control-button:hover,
.control-button:active {
  transform: scale(1.04);
  filter: brightness(1.1);
}

@media (max-width: 700px) and (orientation: portrait) {
  .stadium-light {
    top: 5%;
    width: 62px;
    height: 50px;
    gap: 5px;
  }

  .stadium-light span {
    width: 8px;
    height: 8px;
  }

  .stadium-light::before {
    width: 150px;
    height: 160px;
    top: 14px;
  }
}
`;

const STADIUM_BEAM_BASE_STYLE: CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  bottom: "-20%",
  width: "115%",
  height: "75%",
  pointerEvents: "none",
  filter: "blur(32px)",
  opacity: 1,
  background:
    "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.38) 35%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0.08) 75%, transparent 85%)",
  zIndex: 0,
};

const STADIUM_BEAM_LEFT_STYLE: CSSProperties = {
  ...STADIUM_BEAM_BASE_STYLE,
};

const STADIUM_BEAM_RIGHT_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(to bottom, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 30%), linear-gradient(to top, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0) 50%)",
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
  boxShadow: "0 50px 110px rgba(0, 0, 0, 0.55), 0 18px 45px rgba(0, 0, 0, 0.35)",
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
  color: "rgba(255, 255, 255, 0.95)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 600,
  letterSpacing: "0.3px",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  background: "rgba(20, 25, 30, 0.65)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(255, 255, 255, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
  cursor: "pointer",
  zIndex: 20,
};

const LEFT_BUBBLE_STYLE: CSSProperties = {
  ...BUBBLE_BASE_STYLE,
  left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
  bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
};

const RIGHT_BUBBLE_STYLE: CSSProperties = {
  ...BUBBLE_BASE_STYLE,
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
};

const TOOL_BUBBLE_STYLE: CSSProperties = {
  ...RIGHT_BUBBLE_STYLE,
  background: "rgba(5, 8, 10, 0.92)",
  border: "2px solid rgba(255, 255, 255, 0.18)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55), inset 0 1px 2px rgba(255, 255, 255, 0.18)",
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
  border: "1px solid rgba(255, 255, 255, 0.25)",
  background: "rgba(20, 25, 30, 0.65)",
  color: "rgba(255, 255, 255, 0.95)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.3px",
  padding: "0 10px",
  cursor: "pointer",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(255, 255, 255, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
  flex: "0 0 auto",
};

const DISABLED_CONTROL_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  opacity: 0.4,
  cursor: "not-allowed",
};

const SET_START_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 20px rgba(255, 255, 255, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
};

const ADD_PHASE_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  border: "1px solid rgba(59, 130, 246, 0.6)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(59, 130, 246, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
};

const PLAY_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  border: "1px solid rgba(34, 197, 94, 0.6)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(34, 197, 94, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
};

const RESET_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  border: "1px solid rgba(239, 68, 68, 0.6)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(239, 68, 68, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
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
  const floodlightDots = Array.from({ length: 12 }, (_, index) => index);
  const closeControlsMenu = () => setControlsOpen(false);
  const closeToolsMenu = () => setToolsOpen(false);

  return (
    <div style={ROOT_STYLE} className="simulator-container">
      <style>{STADIUM_FLOODLIGHT_CSS}</style>
      <div style={BACKGROUND_LAYER_STYLE} aria-hidden="true">
        <div style={BACKGROUND_BASE_STYLE} />
        <div className="stadium-light stadium-light-left" aria-hidden="true">
          {floodlightDots.map((dot) => (
            <span key={`left-light-${dot}`} />
          ))}
        </div>
        <div className="stadium-light stadium-light-right" aria-hidden="true">
          {floodlightDots.map((dot) => (
            <span key={`right-light-${dot}`} />
          ))}
        </div>
        <div style={STADIUM_BEAM_LEFT_STYLE} />
        <div style={STADIUM_BEAM_RIGHT_STYLE} />
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
            className="control-button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : SET_START_BUTTON_STYLE}
            onClick={() => {
              surfaceRef.current?.setStart();
              closeControlsMenu();
            }}
          >
            Set Start
          </button>
          <button
            type="button"
            className="control-button"
            disabled={isPlaying}
            style={isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : ADD_PHASE_BUTTON_STYLE}
            onClick={() => {
              surfaceRef.current?.addPhase();
              closeControlsMenu();
            }}
          >
            Add Phase
          </button>
          <button type="button" className="control-button" style={PLAY_BUTTON_STYLE} onClick={togglePlay}>
            Play
          </button>
          <button
            type="button"
            className="control-button"
            style={RESET_BUTTON_STYLE}
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
        className="floating-bubble"
        style={LEFT_BUBBLE_STYLE}
        aria-label="Open controls"
        onClick={() => setControlsOpen((open) => !open)}
      >
        Ctrl
      </button>
      <button
        type="button"
        className="floating-bubble floating-bubble-tool"
        style={TOOL_BUBBLE_STYLE}
        aria-label="Open tools"
        onClick={() => setToolsOpen((open) => !open)}
      >
        <span className="tool-bubble-icon" aria-hidden="true">
          <svg className="tool-bubble-mark-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 8h9.2c4.5 0 7.4 2.8 7.4 6.6 0 3.8-2.9 6.5-7.4 6.5H12.4"
              fill="none"
              stroke="rgba(255,255,255,0.94)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 8v2.7M12.4 10.8v16.2"
              fill="none"
              stroke="rgba(255,255,255,0.94)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.8 28.4C4.8 21 8.8 14.5 15.8 14.5 22.8 14.5 27.2 18.8 27.2 24.5"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.8 28.7c-2.3-0.1-4.2-1.7-4.2-4.2 0-2.9 2.2-5 5.3-5h9.2"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.7 22.4l3.1 1.8-3.5 1.1"
              fill="none"
              stroke="#F4C542"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
