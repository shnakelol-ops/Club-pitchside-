import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
  type WhiteboardTokenColor,
} from "../engine/pixi/createTacticalPadLiteSurface";
import StatsModeSurface from "../StatsModeSurface";
import OrientationGate from "../components/OrientationGate";

type PadMode = "tactical" | "stats" | "whiteboard";

const CONTENT_WIDTH_EXPR =
  "min(calc(100dvw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)), calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)), calc((100dvh - 10px) * 1.6), calc((100vh - 10px) * 1.6), 1360px)";
const WHITEBOARD_LEFT_MODE_LEFT = `calc(50vw - (${CONTENT_WIDTH_EXPR} / 2) - 74px)`;
const WHITEBOARD_LEFT_MODE_MENU_LEFT = `calc(50vw - (${CONTENT_WIDTH_EXPR} / 2) - 132px)`;
const WHITEBOARD_PLAYER_COLOR_CHOICES: ReadonlyArray<{
  value: WhiteboardTokenColor;
  css: string;
}> = [
  { value: "blue", css: "#2563eb" },
  { value: "red", css: "#dc2626" },
  { value: "yellow", css: "#facc15" },
  { value: "black", css: "#1f2937" },
];
const WHITEBOARD_PEN_COLOR_CHOICES: ReadonlyArray<{ label: string; value: number; css: string }> = [
  { label: "Black", value: 0x111111, css: "#111111" },
  { label: "White", value: 0xffffff, css: "#ffffff" },
  { label: "Yellow", value: 0xfacc15, css: "#facc15" },
  { label: "Red", value: 0xdc2626, css: "#dc2626" },
  { label: "Blue", value: 0x2563eb, css: "#2563eb" },
];
const WHITEBOARD_DRAW_COLOR = WHITEBOARD_PEN_COLOR_CHOICES[0]?.value ?? 0x111111;
type WhiteboardToolControl = "move" | "pen" | "line" | "arrow" | "dashed";
type WhiteboardToolAction = WhiteboardToolControl | "eraser";
const WHITEBOARD_BUBBLE_SIZE = 36;
const WHITEBOARD_BUBBLE_MARGIN = 12;

type ViewportRect = { left: number; top: number; width: number; height: number };

function getViewportRect(): ViewportRect {
  const viewport = window.visualViewport;
  if (!viewport) {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return {
    left: viewport.offsetLeft,
    top: viewport.offsetTop,
    width: viewport.width,
    height: viewport.height,
  };
}

function clampWhiteboardBubblePosition(
  position: { left: number; top: number },
  viewport: ViewportRect,
): { left: number; top: number } {
  const minLeft = viewport.left + WHITEBOARD_BUBBLE_MARGIN;
  const maxLeft = viewport.left + viewport.width - WHITEBOARD_BUBBLE_MARGIN - WHITEBOARD_BUBBLE_SIZE;
  const minTop = viewport.top + WHITEBOARD_BUBBLE_MARGIN;
  const maxTop = viewport.top + viewport.height - WHITEBOARD_BUBBLE_MARGIN - WHITEBOARD_BUBBLE_SIZE;
  return {
    left: Math.min(Math.max(position.left, minLeft), Math.max(minLeft, maxLeft)),
    top: Math.min(Math.max(position.top, minTop), Math.max(minTop, maxTop)),
  };
}

function getDefaultWhiteboardBubblePosition(viewport: ViewportRect): { left: number; top: number } {
  return clampWhiteboardBubblePosition(
    {
      left: viewport.left + 14,
      top: viewport.top + 14,
    },
    viewport,
  );
}

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

const ROOT_WHITEBOARD_STYLE: CSSProperties = {
  ...ROOT_STYLE,
  background:
    "linear-gradient(165deg, rgba(245, 248, 251, 1) 0%, rgba(236, 241, 246, 1) 52%, rgba(228, 235, 242, 1) 100%)",
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
  width: CONTENT_WIDTH_EXPR,
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

const PITCH_WHITEBOARD_STYLE: CSSProperties = {
  ...PITCH_STYLE,
  background: "#f8f9fb",
  boxShadow: "0 40px 90px rgba(34, 42, 51, 0.22), 0 14px 30px rgba(45, 56, 68, 0.17)",
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

const TOOL_BUBBLE_MONOGRAM_WRAP_STYLE: CSSProperties = {
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2px",
};

const TOOL_BUBBLE_MONOGRAM_STYLE: CSSProperties = {
  fontFamily: "\"Arial Narrow\", \"Roboto Condensed\", Inter, system-ui, sans-serif",
  fontWeight: 800,
  fontSize: "14px",
  letterSpacing: "0.18px",
  color: "rgba(248, 251, 250, 0.98)",
  lineHeight: 1,
};

const TOOL_BUBBLE_MONOGRAM_ACCENT_STYLE: CSSProperties = {
  width: "12px",
  height: "2px",
  borderRadius: "999px",
  background: "#F2C94C",
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

const WHITEBOARD_TOOLS_BUTTON_STYLE: CSSProperties = {
  ...TOOLS_BUTTON_STYLE,
  border: "1px solid rgba(123, 146, 172, 0.28)",
  background: "rgba(224, 233, 242, 0.72)",
  color: "#1f3348",
  fontWeight: 600,
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

const WHITEBOARD_HEAD_BUTTON_BASE_STYLE: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  background: "rgba(15, 23, 42, 0.72)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  color: "#e2e8f0",
  fontSize: "14px",
  lineHeight: 1,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 0 1px rgba(148, 163, 184, 0.14), 0 0 6px rgba(148, 163, 184, 0.16)",
};

const WHITEBOARD_COUNT_SELECTOR_STYLE: CSSProperties = {
  position: "fixed",
  left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
  top: "max(54px, calc(env(safe-area-inset-top, 0px) + 52px))",
  zIndex: 22,
  width: "166px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "7px",
  borderRadius: "10px",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "rgba(10, 20, 35, 0.8)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  boxShadow: "0 10px 22px rgba(4, 12, 24, 0.3)",
};

const WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE: CSSProperties = {
  color: "#dbe7f5",
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.2px",
  textTransform: "uppercase",
  margin: 0,
  fontFamily: "Inter, system-ui, sans-serif",
};

const WHITEBOARD_TEAM_SELECTOR_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "5px",
};

const WHITEBOARD_TEAM_OPTION_STYLE: CSSProperties = {
  height: "28px",
  borderRadius: "8px",
  border: "1px solid rgba(148, 163, 184, 0.36)",
  background: "rgba(15, 23, 42, 0.82)",
  color: "#dbe7f5",
  fontSize: "10px",
  fontWeight: 650,
  letterSpacing: "0.2px",
  cursor: "pointer",
  fontFamily: "Inter, system-ui, sans-serif",
};

const WHITEBOARD_TEAM_OPTION_ACTIVE_STYLE: CSSProperties = {
  ...WHITEBOARD_TEAM_OPTION_STYLE,
  border: "1px solid rgba(125, 211, 252, 0.6)",
  background: "rgba(30, 64, 175, 0.52)",
  color: "#f8fcff",
};

const WHITEBOARD_COUNT_SELECTOR_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "4px",
};

const WHITEBOARD_COUNT_OPTION_STYLE: CSSProperties = {
  height: "26px",
  borderRadius: "8px",
  border: "1px solid rgba(148, 163, 184, 0.36)",
  background: "rgba(15, 23, 42, 0.86)",
  color: "#dbe7f5",
  fontSize: "10px",
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: "0.2px",
  cursor: "pointer",
  fontFamily: "Inter, system-ui, sans-serif",
};

const WHITEBOARD_COUNT_OPTION_ACTIVE_STYLE: CSSProperties = {
  ...WHITEBOARD_COUNT_OPTION_STYLE,
  border: "1px solid rgba(125, 211, 252, 0.56)",
  background: "rgba(30, 64, 175, 0.5)",
  color: "#f8fcff",
};

const WHITEBOARD_COUNT_OPTIONS = Array.from({ length: 15 }, (_, index) => index + 1);

const WHITEBOARD_TOKEN_COLOR_OPTION_STYLE: CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  border: "1px solid rgba(130, 150, 170, 0.4)",
  background: "rgba(15, 23, 42, 0.52)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

const WHITEBOARD_TOKEN_COLOR_SWATCH_STYLE: CSSProperties = {
  width: "22px",
  height: "22px",
  borderRadius: "999px",
  border: "1px solid rgba(255, 255, 255, 0.48)",
};

const MODE_TAB_STYLE: CSSProperties = {
  position: "fixed",
  top: "max(12px, calc(env(safe-area-inset-top, 0px) + 10px))",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  height: "32px",
  borderRadius: "10px",
  border: "1px solid rgba(230, 238, 241, 0.3)",
  background: "rgba(8, 14, 18, 0.66)",
  color: "rgba(236, 245, 249, 0.96)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.24px",
  padding: "0 11px",
  cursor: "pointer",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 8px 18px rgba(0, 0, 0, 0.24)",
  zIndex: 21,
};

const WHITEBOARD_MODE_TAB_STYLE: CSSProperties = {
  ...MODE_TAB_STYLE,
  top: "auto",
  right: "auto",
  left: WHITEBOARD_LEFT_MODE_LEFT,
  bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
};

const MODE_MENU_STYLE: CSSProperties = {
  position: "fixed",
  top: "max(48px, calc(env(safe-area-inset-top, 0px) + 46px))",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  width: "122px",
  padding: "5px",
  borderRadius: "11px",
  border: "1px solid rgba(207, 220, 231, 0.32)",
  background: "rgba(10, 18, 24, 0.84)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 10px 22px rgba(0, 0, 0, 0.28)",
  zIndex: 21,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const WHITEBOARD_MODE_MENU_STYLE: CSSProperties = {
  ...MODE_MENU_STYLE,
  top: "auto",
  right: "auto",
  left: WHITEBOARD_LEFT_MODE_MENU_LEFT,
  bottom: "max(50px, calc(env(safe-area-inset-bottom, 0px) + 48px))",
};

const MODE_MENU_ITEM_STYLE: CSSProperties = {
  height: "30px",
  width: "100%",
  textAlign: "left",
  border: "1px solid rgba(228, 236, 241, 0.16)",
  borderRadius: "8px",
  background: "rgba(16, 24, 30, 0.54)",
  color: "rgba(236, 245, 249, 0.9)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 600,
  letterSpacing: "0.18px",
  padding: "0 10px",
  cursor: "pointer",
};

const MODE_MENU_ITEM_ACTIVE_STYLE: CSSProperties = {
  ...MODE_MENU_ITEM_STYLE,
  background: "rgba(55, 103, 131, 0.58)",
  border: "1px solid rgba(171, 212, 232, 0.58)",
  color: "rgba(255, 255, 255, 0.97)",
};

export default function TacticalPadLiteClean() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const whiteboardBubbleButtonRef = useRef<HTMLButtonElement | null>(null);
  const whiteboardBubbleMenuRef = useRef<HTMLDivElement | null>(null);
  const whiteboardBubbleDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    moved: boolean;
  } | null>(null);
  const suppressWhiteboardBubbleClickRef = useRef(false);
  const [surfaceRefreshKey, setSurfaceRefreshKey] = useState(0);
  const [mode, setMode] = useState<PadMode>("tactical");
  const [whiteboardBlueCount, setWhiteboardBlueCount] = useState(1);
  const [whiteboardRedCount, setWhiteboardRedCount] = useState(1);
  const [whiteboardCountPickerTeam, setWhiteboardCountPickerTeam] = useState<"BLUE" | "RED">("BLUE");
  const [whiteboardBubbleOpen, setWhiteboardBubbleOpen] = useState(false);
  const [whiteboardBubblePosition, setWhiteboardBubblePosition] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [whiteboardBubbleMenuSize, setWhiteboardBubbleMenuSize] = useState<{ width: number; height: number }>({
    width: 176,
    height: 300,
  });
  const [whiteboardBlueColor, setWhiteboardBlueColor] = useState<WhiteboardTokenColor>("blue");
  const [whiteboardRedColor, setWhiteboardRedColor] = useState<WhiteboardTokenColor>("red");
  const [whiteboardPenColor, setWhiteboardPenColor] = useState<number>(WHITEBOARD_DRAW_COLOR);
  const whiteboardCountsRef = useRef({ blue: 1, red: 1 });
  const whiteboardTeamColorsRef = useRef<{ blue: WhiteboardTokenColor; red: WhiteboardTokenColor }>({
    blue: "blue",
    red: "red",
  });
  const [whiteboardTool, setWhiteboardTool] = useState<WhiteboardToolControl>("move");
  const [phaseCount, setPhaseCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [phasesOpen, setPhasesOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const isTacticalMode = mode === "tactical";
  const isStatsMode = mode === "stats";
  const isWhiteboardMode = mode === "whiteboard";

  useEffect(() => {
    const media = window.matchMedia("(orientation: landscape)");
    let rafA = 0;
    let rafB = 0;
    let wasLandscape = media.matches || window.innerWidth > window.innerHeight;

    const runDoubleRafReflow = (triggerRemount: boolean) => {
      rafA = window.requestAnimationFrame(() => {
        rafB = window.requestAnimationFrame(() => {
          surfaceRef.current?.reflow();
          if (triggerRemount) {
            setSurfaceRefreshKey((value) => value + 1);
          }
        });
      });
    };

    const handleViewportChange = () => {
      const isLandscape = media.matches || window.innerWidth > window.innerHeight;
      if (isLandscape && !wasLandscape) {
        runDoubleRafReflow(true);
      } else if (isLandscape) {
        runDoubleRafReflow(false);
      }
      wasLandscape = isLandscape;
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleViewportChange);
    } else {
      media.addListener(handleViewportChange);
    }
    window.addEventListener("orientationchange", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handleViewportChange);
      } else {
        media.removeListener(handleViewportChange);
      }
      window.removeEventListener("orientationchange", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    whiteboardCountsRef.current = {
      blue: whiteboardBlueCount,
      red: whiteboardRedCount,
    };
  }, [whiteboardBlueCount, whiteboardRedCount]);

  useEffect(() => {
    whiteboardTeamColorsRef.current = {
      blue: whiteboardBlueColor,
      red: whiteboardRedColor,
    };
  }, [whiteboardBlueColor, whiteboardRedColor]);

  useEffect(() => {
    if (isStatsMode) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let destroySurface: (() => void) | null = null;

    void createTacticalPadLiteSurface(host, {
      surfaceVariant: isWhiteboardMode ? "whiteboard" : "tactical",
      whiteboardTeamCounts: isWhiteboardMode ? whiteboardCountsRef.current : undefined,
      whiteboardTeamColors: isWhiteboardMode ? whiteboardTeamColorsRef.current : undefined,
      whiteboardDrawColor: isWhiteboardMode ? whiteboardPenColor : undefined,
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
      if (isWhiteboardMode) {
        surface.setWhiteboardDrawTool(whiteboardTool === "eraser" ? "move" : whiteboardTool);
        surface.setWhiteboardDrawColor(whiteboardPenColor);
      }
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          surface.reflow();
        });
      });
    });

    return () => {
      disposed = true;
      surfaceRef.current = null;
      destroySurface?.();
    };
  }, [isStatsMode, isWhiteboardMode, surfaceRefreshKey]);

  useEffect(() => {
    if (!isWhiteboardMode) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    surface.setWhiteboardTeamConfig({
      counts: whiteboardCountsRef.current,
      colors: whiteboardTeamColorsRef.current,
    });
  }, [isWhiteboardMode, whiteboardBlueCount, whiteboardRedCount, whiteboardBlueColor, whiteboardRedColor]);

  useEffect(() => {
    if (!isWhiteboardMode) return;
    const syncBubblePosition = () => {
      const viewport = getViewportRect();
      setWhiteboardBubblePosition((prev) => {
        const next =
          prev == null ? getDefaultWhiteboardBubblePosition(viewport) : clampWhiteboardBubblePosition(prev, viewport);
        if (prev && Math.abs(prev.left - next.left) < 0.5 && Math.abs(prev.top - next.top) < 0.5) {
          return prev;
        }
        return next;
      });
    };

    syncBubblePosition();
    window.addEventListener("resize", syncBubblePosition);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", syncBubblePosition);
    viewport?.addEventListener("scroll", syncBubblePosition);

    return () => {
      window.removeEventListener("resize", syncBubblePosition);
      viewport?.removeEventListener("resize", syncBubblePosition);
      viewport?.removeEventListener("scroll", syncBubblePosition);
    };
  }, [isWhiteboardMode]);

  useEffect(() => {
    if (!isWhiteboardMode || !whiteboardBubbleOpen) return;

    const measureMenu = () => {
      const rect = whiteboardBubbleMenuRef.current?.getBoundingClientRect();
      if (!rect) return;
      setWhiteboardBubbleMenuSize((prev) => {
        if (Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5) {
          return prev;
        }
        return { width: rect.width, height: rect.height };
      });
    };

    measureMenu();
    const rafId = window.requestAnimationFrame(measureMenu);
    window.addEventListener("resize", measureMenu);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", measureMenu);
    viewport?.addEventListener("scroll", measureMenu);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measureMenu);
      viewport?.removeEventListener("resize", measureMenu);
      viewport?.removeEventListener("scroll", measureMenu);
    };
  }, [isWhiteboardMode, whiteboardBubbleOpen]);

  useEffect(() => {
    if (!isWhiteboardMode || !whiteboardBubbleOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (whiteboardBubbleButtonRef.current?.contains(target)) return;
      if (whiteboardBubbleMenuRef.current?.contains(target)) return;
      setWhiteboardBubbleOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [isWhiteboardMode, whiteboardBubbleOpen]);

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
  const setPadMode = (nextMode: PadMode) => {
    setModeMenuOpen(false);
    if (nextMode === mode) return;
    setWhiteboardBubbleOpen(false);
    setControlsOpen(false);
    setToolsOpen(false);
    setPhasesOpen(false);
    if (nextMode === "stats") {
      setIsPlaying(false);
      setPhaseCount(0);
    }
    if (nextMode === "whiteboard") {
      setIsPlaying(false);
      setPhaseCount(0);
    }
    setMode(nextMode);
  };

  const setWhiteboardCount = (team: "BLUE" | "RED", count: number) => {
    const clamped = Math.max(1, Math.min(15, Math.floor(count)));
    if (team === "BLUE") {
      setWhiteboardBlueCount(clamped);
      return;
    }
    setWhiteboardRedCount(clamped);
  };

  const applyWhiteboardTool = (tool: WhiteboardToolAction) => {
    const surface = surfaceRef.current;
    if (!surface) return;
    if (tool === "eraser") {
      surface.eraseWhiteboardPenStroke();
      return;
    }
    setWhiteboardTool(tool);
    surface.setWhiteboardDrawTool(tool);
    surface.setWhiteboardDrawColor(whiteboardPenColor);
  };

  const applyWhiteboardPenColor = (color: number) => {
    setWhiteboardPenColor(color);
    surfaceRef.current?.setWhiteboardDrawColor(color);
  };

  const handleWhiteboardBubblePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const viewport = getViewportRect();
    const currentPosition =
      whiteboardBubblePosition == null
        ? getDefaultWhiteboardBubblePosition(viewport)
        : whiteboardBubblePosition;
    suppressWhiteboardBubbleClickRef.current = false;
    whiteboardBubbleDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: currentPosition.left,
      startTop: currentPosition.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleWhiteboardBubblePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = whiteboardBubbleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) >= 4) {
      drag.moved = true;
    }
    const viewport = getViewportRect();
    setWhiteboardBubblePosition(
      clampWhiteboardBubblePosition(
        {
          left: drag.startLeft + deltaX,
          top: drag.startTop + deltaY,
        },
        viewport,
      ),
    );
  };

  const finishWhiteboardBubbleDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = whiteboardBubbleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      suppressWhiteboardBubbleClickRef.current = true;
    }
    whiteboardBubbleDragRef.current = null;
  };

  const handleWhiteboardBubbleClick = () => {
    if (suppressWhiteboardBubbleClickRef.current) {
      suppressWhiteboardBubbleClickRef.current = false;
      return;
    }
    setWhiteboardBubbleOpen((open) => !open);
  };

  const whiteboardBubbleStyle =
    whiteboardBubblePosition == null
      ? undefined
      : {
          left: `${whiteboardBubblePosition.left}px`,
          top: `${whiteboardBubblePosition.top}px`,
          right: "auto",
          bottom: "auto",
          touchAction: "none",
          cursor: whiteboardBubbleDragRef.current ? "grabbing" : "grab",
        };
  const whiteboardBubbleMenuStyle = (() => {
    if (whiteboardBubblePosition == null) return undefined;
    const viewport = getViewportRect();
    const minLeft = viewport.left + WHITEBOARD_BUBBLE_MARGIN;
    const maxLeft = viewport.left + viewport.width - WHITEBOARD_BUBBLE_MARGIN - whiteboardBubbleMenuSize.width;
    let left = whiteboardBubblePosition.left + WHITEBOARD_BUBBLE_SIZE + 8;
    if (left > maxLeft) {
      left = whiteboardBubblePosition.left - whiteboardBubbleMenuSize.width - 8;
    }
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));
    const minTop = viewport.top + WHITEBOARD_BUBBLE_MARGIN;
    const maxTop = viewport.top + viewport.height - WHITEBOARD_BUBBLE_MARGIN - whiteboardBubbleMenuSize.height;
    let top = whiteboardBubblePosition.top + WHITEBOARD_BUBBLE_SIZE - whiteboardBubbleMenuSize.height;
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));
    return {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      marginLeft: 0,
      marginBottom: 0,
      maxHeight: `${Math.max(120, viewport.height - WHITEBOARD_BUBBLE_MARGIN * 2)}px`,
      overflowY: "auto",
      overflowX: "hidden",
      width: "176px",
      zIndex: 22,
    } as const;
  })();

  const modeMenu = modeMenuOpen ? (
    <div style={isWhiteboardMode ? WHITEBOARD_MODE_MENU_STYLE : MODE_MENU_STYLE}>
      <button
        type="button"
        style={isTacticalMode ? MODE_MENU_ITEM_ACTIVE_STYLE : MODE_MENU_ITEM_STYLE}
        onClick={() => setPadMode("tactical")}
      >
        Tactical
      </button>
      <button
        type="button"
        style={isWhiteboardMode ? MODE_MENU_ITEM_ACTIVE_STYLE : MODE_MENU_ITEM_STYLE}
        onClick={() => setPadMode("whiteboard")}
      >
        Whiteboard
      </button>
      <button
        type="button"
        style={isStatsMode ? MODE_MENU_ITEM_ACTIVE_STYLE : MODE_MENU_ITEM_STYLE}
        onClick={() => setPadMode("stats")}
      >
        Stats
      </button>
    </div>
  ) : null;

  const modeButton = (
    <button
      type="button"
      style={isWhiteboardMode ? WHITEBOARD_MODE_TAB_STYLE : MODE_TAB_STYLE}
      aria-label="Open mode menu"
      aria-expanded={modeMenuOpen}
      onClick={() => setModeMenuOpen((open) => !open)}
    >
      Mode
    </button>
  );

  if (isStatsMode) {
    return (
      <>
        <StatsModeSurface onRequestPadModeChange={setPadMode} />
      </>
    );
  }

  return (
    <OrientationGate modeLabel={isWhiteboardMode ? "Whiteboard Mode" : "Tactical Sim Lite"}>
      <div
        style={isWhiteboardMode ? ROOT_WHITEBOARD_STYLE : ROOT_STYLE}
        className={isWhiteboardMode ? undefined : "simulator-container"}
      >
        {!isWhiteboardMode ? <style>{STADIUM_FLOODLIGHT_CSS}</style> : null}
        {!isWhiteboardMode ? (
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
        ) : null}
        <div style={CONTENT_STYLE}>
          <div ref={hostRef} style={isWhiteboardMode ? PITCH_WHITEBOARD_STYLE : PITCH_STYLE} />
        </div>
        {isWhiteboardMode ? (
          <>
            <button
              ref={whiteboardBubbleButtonRef}
              type="button"
              style={{
                ...WHITEBOARD_HEAD_BUTTON_BASE_STYLE,
                position: "fixed",
                left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
                top: "max(12px, calc(env(safe-area-inset-top, 0px) + 10px))",
                zIndex: 23,
                ...(whiteboardBubbleStyle ?? {}),
              }}
              aria-label="Toggle whiteboard bubble controls"
              aria-expanded={whiteboardBubbleOpen}
              onPointerDown={handleWhiteboardBubblePointerDown}
              onPointerMove={handleWhiteboardBubblePointerMove}
              onPointerUp={finishWhiteboardBubbleDrag}
              onPointerCancel={finishWhiteboardBubbleDrag}
              onClick={handleWhiteboardBubbleClick}
            >
              👤
            </button>
            {whiteboardBubbleOpen ? (
              <div
                ref={whiteboardBubbleMenuRef}
                style={{
                  ...WHITEBOARD_COUNT_SELECTOR_STYLE,
                  ...(whiteboardBubbleMenuStyle ?? {}),
                }}
              >
                <p style={WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE}>Tools</p>
                <button
                  type="button"
                  style={{
                    ...WHITEBOARD_TOOLS_BUTTON_STYLE,
                    ...(whiteboardTool === "pen"
                      ? { border: "1px solid rgba(43, 95, 150, 0.58)", background: "rgba(196, 214, 232, 0.9)" }
                      : null),
                  }}
                  onClick={() => applyWhiteboardTool("pen")}
                >
                  Pen
                </button>
                <button
                  type="button"
                  style={{
                    ...WHITEBOARD_TOOLS_BUTTON_STYLE,
                    ...(whiteboardTool === "line"
                      ? { border: "1px solid rgba(43, 95, 150, 0.58)", background: "rgba(196, 214, 232, 0.9)" }
                      : null),
                  }}
                  onClick={() => applyWhiteboardTool("line")}
                >
                  Line
                </button>
                <button
                  type="button"
                  style={{
                    ...WHITEBOARD_TOOLS_BUTTON_STYLE,
                    ...(whiteboardTool === "arrow"
                      ? { border: "1px solid rgba(43, 95, 150, 0.58)", background: "rgba(196, 214, 232, 0.9)" }
                      : null),
                  }}
                  onClick={() => applyWhiteboardTool("arrow")}
                >
                  Arrow
                </button>
                <button
                  type="button"
                  style={{
                    ...WHITEBOARD_TOOLS_BUTTON_STYLE,
                    ...(whiteboardTool === "dashed"
                      ? { border: "1px solid rgba(43, 95, 150, 0.58)", background: "rgba(196, 214, 232, 0.9)" }
                      : null),
                  }}
                  onClick={() => applyWhiteboardTool("dashed")}
                >
                  Dashed line
                </button>
                <button
                  type="button"
                  style={WHITEBOARD_TOOLS_BUTTON_STYLE}
                  onClick={() => applyWhiteboardTool("eraser")}
                >
                  Eraser
                </button>
                <button
                  type="button"
                  style={WHITEBOARD_TOOLS_BUTTON_STYLE}
                  onClick={() => surfaceRef.current?.undoWhiteboardStroke()}
                >
                  Undo
                </button>
                <button
                  type="button"
                  style={WHITEBOARD_TOOLS_BUTTON_STYLE}
                  onClick={() => surfaceRef.current?.clearWhiteboardStrokes()}
                >
                  Clear All
                </button>
                <p style={WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE}>Drawing colour</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "4px" }}>
                  {WHITEBOARD_PEN_COLOR_CHOICES.map((choice) => {
                    const isActive = whiteboardPenColor === choice.value;
                    return (
                      <button
                        key={`whiteboard-pen-color-${choice.label.toLowerCase()}`}
                        type="button"
                        aria-label={`Set pen colour ${choice.label}`}
                        style={{
                          ...WHITEBOARD_TOKEN_COLOR_OPTION_STYLE,
                          width: "100%",
                          ...(isActive
                            ? {
                                boxShadow: "0 0 0 2px rgba(125, 211, 252, 0.9)",
                                border: "1px solid rgba(125, 211, 252, 0.75)",
                              }
                            : null),
                        }}
                        onClick={() => applyWhiteboardPenColor(choice.value)}
                      >
                        <span style={{ ...WHITEBOARD_TOKEN_COLOR_SWATCH_STYLE, background: choice.css }} />
                      </button>
                    );
                  })}
                </div>
                <p style={WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE}>Player colours</p>
                <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "6px", alignItems: "center" }}>
                  <span style={{ color: "#dbe7f5", fontSize: "10px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Team A
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
                    {WHITEBOARD_PLAYER_COLOR_CHOICES.map((choice) => {
                      const isActive = whiteboardBlueColor === choice.value;
                      return (
                        <button
                          key={`whiteboard-blue-color-${choice.value}`}
                          type="button"
                          aria-label="Set Team A player colour"
                          style={{
                            ...WHITEBOARD_TOKEN_COLOR_OPTION_STYLE,
                            ...(isActive
                              ? { boxShadow: "0 0 0 2px rgba(125, 211, 252, 0.9)", border: "1px solid rgba(125, 211, 252, 0.75)" }
                              : null),
                          }}
                          onClick={() => setWhiteboardBlueColor(choice.value)}
                        >
                          <span style={{ ...WHITEBOARD_TOKEN_COLOR_SWATCH_STYLE, background: choice.css }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "6px", alignItems: "center" }}>
                  <span style={{ color: "#dbe7f5", fontSize: "10px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Team B
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
                    {WHITEBOARD_PLAYER_COLOR_CHOICES.map((choice) => {
                      const isActive = whiteboardRedColor === choice.value;
                      return (
                        <button
                          key={`whiteboard-red-color-${choice.value}`}
                          type="button"
                          aria-label="Set Team B player colour"
                          style={{
                            ...WHITEBOARD_TOKEN_COLOR_OPTION_STYLE,
                            ...(isActive
                              ? { boxShadow: "0 0 0 2px rgba(125, 211, 252, 0.9)", border: "1px solid rgba(125, 211, 252, 0.75)" }
                              : null),
                          }}
                          onClick={() => setWhiteboardRedColor(choice.value)}
                        >
                          <span style={{ ...WHITEBOARD_TOKEN_COLOR_SWATCH_STYLE, background: choice.css }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p style={WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE}>Players</p>
                <div style={WHITEBOARD_TEAM_SELECTOR_ROW_STYLE}>
                  <button
                    type="button"
                    style={
                      whiteboardCountPickerTeam === "BLUE"
                        ? WHITEBOARD_TEAM_OPTION_ACTIVE_STYLE
                        : WHITEBOARD_TEAM_OPTION_STYLE
                    }
                    onClick={() => setWhiteboardCountPickerTeam("BLUE")}
                  >
                    Team A
                  </button>
                  <button
                    type="button"
                    style={
                      whiteboardCountPickerTeam === "RED"
                        ? WHITEBOARD_TEAM_OPTION_ACTIVE_STYLE
                        : WHITEBOARD_TEAM_OPTION_STYLE
                    }
                    onClick={() => setWhiteboardCountPickerTeam("RED")}
                  >
                    Team B
                  </button>
                </div>
                <div style={WHITEBOARD_COUNT_SELECTOR_GRID_STYLE}>
                  {WHITEBOARD_COUNT_OPTIONS.map((count) => {
                    const isActive =
                      whiteboardCountPickerTeam === "BLUE"
                        ? whiteboardBlueCount === count
                        : whiteboardRedCount === count;
                    return (
                      <button
                        key={`${whiteboardCountPickerTeam}-count-${count}`}
                        type="button"
                        style={isActive ? WHITEBOARD_COUNT_OPTION_ACTIVE_STYLE : WHITEBOARD_COUNT_OPTION_STYLE}
                        onClick={() => setWhiteboardCount(whiteboardCountPickerTeam, count)}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              style={{
                ...WHITEBOARD_TOOLS_BUTTON_STYLE,
                position: "fixed",
                right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
                bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
                minWidth: "74px",
                height: "34px",
                zIndex: 22,
                ...(whiteboardTool === "move"
                  ? { border: "1px solid rgba(43, 95, 150, 0.58)", background: "rgba(196, 214, 232, 0.9)" }
                  : null),
              }}
              onClick={() => applyWhiteboardTool("move")}
            >
              MOVE
            </button>
          </>
        ) : null}
        {!isWhiteboardMode ? (
          <button
            type="button"
            style={PHASES_CHIP_STYLE}
            aria-label="Toggle phases tray"
            onClick={() => setPhasesOpen((open) => !open)}
          >
            Phases: {phaseCount}
          </button>
        ) : null}
        {!isWhiteboardMode && phasesOpen ? (
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
        {!isWhiteboardMode && controlsOpen ? (
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
        {!isWhiteboardMode && toolsOpen ? (
          <div style={TOOLS_POPOUT_STYLE}>
            <>
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
            </>
          </div>
        ) : null}
        {!isWhiteboardMode ? (
          <button
            type="button"
            className="floating-bubble"
            style={LEFT_BUBBLE_STYLE}
            aria-label="Open controls"
            onClick={() => setControlsOpen((open) => !open)}
          >
            Ctrl
          </button>
        ) : null}
        {!isWhiteboardMode ? (
          <button
            type="button"
            className="floating-bubble floating-bubble-tool"
            style={TOOL_BUBBLE_STYLE}
            aria-label="Open tools"
            onClick={() => setToolsOpen((open) => !open)}
          >
            <span className="tool-bubble-icon" aria-hidden="true">
              <span style={TOOL_BUBBLE_MONOGRAM_WRAP_STYLE}>
                <span style={TOOL_BUBBLE_MONOGRAM_STYLE}>P</span>
                <span style={TOOL_BUBBLE_MONOGRAM_ACCENT_STYLE} />
              </span>
            </span>
          </button>
        ) : null}
        {modeButton}
        {modeMenu}
      </div>
    </OrientationGate>
  );
}
