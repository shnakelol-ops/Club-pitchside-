import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

import {
  createTacticalPadLiteSurface,
  type ItemMode,
  type TacticalPadLiteSurface,
  type TacticalItem,
  type WhiteboardTokenColor,
} from "../engine/pixi/createTacticalPadLiteSurface";
import StatsModeSurface from "../StatsModeSurface";
import OrientationGate from "../components/OrientationGate";

type PadMode = "tactical" | "stats" | "whiteboard";
type TacticalPadLiteCleanProps = {
  initialMode?: PadMode;
};

const CONTENT_WIDTH_EXPR =
  "min(calc(100dvw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)), calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)), calc((100dvh - 10px) * 1.6), calc((100vh - 10px) * 1.6), 1360px)";
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
const TACTICAL_ITEM_CHOICES: ReadonlyArray<{ label: string; type: TacticalItem["type"] }> = [
  { label: "Cone", type: "cone" },
  { label: "Pole", type: "pole" },
  { label: "Ladder", type: "ladder" },
  { label: "Tackle Bag", type: "tackleBag" },
  { label: "Football", type: "football" },
  { label: "Sliotar", type: "sliotar" },
];
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
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "max(12px, calc(env(safe-area-inset-left, 0px) + 8px))",
  paddingRight: "max(12px, calc(env(safe-area-inset-right, 0px) + 8px))",
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

const WHITEBOARD_CONTENT_STYLE: CSSProperties = {
  width: "100%",
  maxWidth: "min(900px, calc((100dvh - 16px) * 1.6), calc((100vh - 16px) * 1.6))",
  aspectRatio: "16 / 10",
  maxHeight: "min(calc(100dvh - 16px), calc(100vh - 16px))",
  boxSizing: "border-box",
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "stretch",
  margin: "0 auto",
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

const ACTIONS_BUBBLE_STYLE: CSSProperties = {
  ...BUBBLE_BASE_STYLE,
  left: "max(12px, calc(env(safe-area-inset-left, 0px) + 10px))",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(32, 40, 50, 0.74)",
  border: "1px solid rgba(233, 242, 255, 0.34)",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.22)",
  zIndex: 21,
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

const ACTIONS_POPOUT_STYLE: CSSProperties = {
  ...POPOUT_BASE_STYLE,
  left: "max(58px, calc(env(safe-area-inset-left, 0px) + 56px))",
  top: "50%",
  transform: "translateY(-50%)",
  flexDirection: "column",
  width: "128px",
  padding: "7px",
  gap: "5px",
  overflow: "hidden",
  background: "rgba(22, 30, 38, 0.78)",
  border: "1px solid rgba(218, 232, 246, 0.24)",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.36)",
  zIndex: 21,
};

const ACTIONS_MENU_BUTTON_STYLE: CSSProperties = {
  borderRadius: "9px",
  border: "1px solid rgba(224, 236, 248, 0.2)",
  color: "rgba(255, 255, 255, 0.95)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 600,
  width: "100%",
  height: "30px",
  minWidth: 0,
  fontSize: "10px",
  letterSpacing: "0.2px",
  padding: "0 9px",
  cursor: "pointer",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  textAlign: "left",
  background: "rgba(15, 24, 31, 0.82)",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
};

const QUICK_SHARE_POPOUT_STYLE: CSSProperties = {
  ...POPOUT_BASE_STYLE,
  left: "max(194px, calc(env(safe-area-inset-left, 0px) + 192px))",
  top: "50%",
  transform: "translateY(-50%)",
  flexDirection: "column",
  width: "188px",
  padding: "9px",
  gap: "7px",
  overflow: "hidden",
  background: "rgba(20, 28, 36, 0.82)",
  border: "1px solid rgba(212, 228, 244, 0.24)",
  boxShadow: "0 12px 26px rgba(0, 0, 0, 0.34)",
  zIndex: 22,
};

const QUICK_SHARE_TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: "#eef7ff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11.5px",
  fontWeight: 700,
  letterSpacing: "0.14px",
};

const QUICK_SHARE_OPTION_BUTTON_STYLE: CSSProperties = {
  ...ACTIONS_MENU_BUTTON_STYLE,
  height: "40px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: "2px",
  padding: "6px 9px",
  lineHeight: 1.1,
};

const QUICK_SHARE_OPTION_TITLE_STYLE: CSSProperties = {
  color: "#eef6ff",
  fontSize: "10px",
  fontWeight: 650,
  letterSpacing: "0.16px",
};

const QUICK_SHARE_OPTION_SUBTITLE_STYLE: CSSProperties = {
  color: "rgba(206, 222, 238, 0.9)",
  fontSize: "9px",
  fontWeight: 520,
  letterSpacing: "0.12px",
};

const QUICK_SHARE_ONBOARDING_OVERLAY_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "max(16px, calc(env(safe-area-inset-top, 0px) + 10px)) max(16px, calc(env(safe-area-inset-right, 0px) + 8px)) max(16px, calc(env(safe-area-inset-bottom, 0px) + 10px)) max(16px, calc(env(safe-area-inset-left, 0px) + 8px))",
  background: "rgba(5, 11, 17, 0.36)",
  transition: "opacity 180ms ease-out",
  zIndex: 22,
};

const QUICK_SHARE_ONBOARDING_CARD_STYLE: CSSProperties = {
  width: "min(420px, calc(100vw - 32px))",
  display: "flex",
  flexDirection: "column",
  gap: "9px",
  padding: "12px",
  borderRadius: "14px",
  border: "1px solid rgba(194, 216, 235, 0.28)",
  background: "rgba(11, 21, 29, 0.84)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 16px 34px rgba(2, 8, 15, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.11)",
  transition: "transform 180ms ease-out, opacity 180ms ease-out",
  zIndex: 23,
};

const QUICK_SHARE_ONBOARDING_TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: "#eff8ff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.16px",
};

const QUICK_SHARE_ONBOARDING_BODY_STYLE: CSSProperties = {
  margin: 0,
  color: "rgba(220, 236, 247, 0.92)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10px",
  fontWeight: 520,
  lineHeight: 1.4,
};

const QUICK_SHARE_ONBOARDING_ROW_STYLE: CSSProperties = {
  borderRadius: "10px",
  border: "1px solid rgba(187, 211, 233, 0.24)",
  background: "rgba(16, 28, 37, 0.78)",
  padding: "9px 10px",
  display: "grid",
  gap: "3px",
};

const QUICK_SHARE_ONBOARDING_ROW_TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: "#edf7ff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.14px",
};

const QUICK_SHARE_ONBOARDING_ROW_TEXT_STYLE: CSSProperties = {
  margin: 0,
  color: "rgba(208, 227, 242, 0.9)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "9.5px",
  fontWeight: 520,
  lineHeight: 1.35,
};

const QUICK_SHARE_ONBOARDING_NOTE_STYLE: CSSProperties = {
  margin: 0,
  color: "rgba(199, 220, 238, 0.88)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "9.5px",
  fontWeight: 560,
  letterSpacing: "0.1px",
};

const QUICK_SHARE_ONBOARDING_BUTTON_STYLE: CSSProperties = {
  ...ACTIONS_MENU_BUTTON_STYLE,
  height: "34px",
  textAlign: "center",
  fontSize: "10.5px",
  fontWeight: 650,
  justifyContent: "center",
};

const QUICK_SHARE_ONBOARDING_STORAGE_KEY = "flowlabs_quick_share_onboarding_seen";

const COACH_HUB_PANEL_STYLE: CSSProperties = {
  ...POPOUT_BASE_STYLE,
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "clamp(128px, 15vw, 168px)",
  maxHeight: "min(60vh, 360px)",
  overflowY: "auto",
  overflowX: "hidden",
  right: "max(6px, calc(env(safe-area-inset-right, 0px) + 4px))",
  bottom: "max(60px, calc(env(safe-area-inset-bottom, 0px) + 58px))",
  padding: "6px",
  background: "rgba(10, 19, 24, 0.74)",
  border: "1px solid rgba(165, 194, 220, 0.26)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 14px 28px rgba(2, 8, 15, 0.36)",
  zIndex: 20,
};

const COACH_HUB_SECTION_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
};

const COACH_HUB_SECTION_TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: "#d7e8f5",
  fontSize: "8px",
  fontWeight: 700,
  letterSpacing: "0.16px",
  textTransform: "uppercase",
  fontFamily: "Inter, system-ui, sans-serif",
};

const COACH_HUB_TOOL_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "4px",
};

const COACH_HUB_TOOL_BUTTON_STYLE: CSSProperties = {
  height: "30px",
  minWidth: "100%",
  borderRadius: "8px",
  fontSize: "10px",
  fontWeight: 600,
  fontFamily: "Inter, system-ui, sans-serif",
  letterSpacing: "0.16px",
  lineHeight: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  padding: "0 3px",
  cursor: "pointer",
  border: "1px solid rgba(121, 171, 208, 0.28)",
  background: "rgba(17, 30, 40, 0.64)",
  color: "#dbecfa",
};

const COACH_HUB_TOOL_BUTTON_ACTIVE_STYLE: CSSProperties = {
  ...COACH_HUB_TOOL_BUTTON_STYLE,
  border: "1px solid rgba(125, 211, 252, 0.68)",
  background: "rgba(38, 72, 102, 0.68)",
  color: "#f7fcff",
};

const COACH_HUB_COLOR_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "3px",
};

const COACH_HUB_COLOR_BUTTON_STYLE: CSSProperties = {
  width: "100%",
  height: "24px",
  borderRadius: "999px",
  border: "1px solid rgba(147, 173, 196, 0.36)",
  background: "rgba(15, 25, 36, 0.65)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

const COACH_HUB_COLOR_SWATCH_STYLE: CSSProperties = {
  width: "16px",
  height: "16px",
  borderRadius: "999px",
  border: "1px solid rgba(255, 255, 255, 0.44)",
};

const COACH_HUB_ACTION_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "3px",
};

const COACH_HUB_ACTION_BUTTON_STYLE: CSSProperties = {
  ...COACH_HUB_TOOL_BUTTON_STYLE,
  minWidth: 0,
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

const PAUSE_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  border: "1px solid rgba(245, 158, 11, 0.62)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(245, 158, 11, 0.32), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
};

const RESET_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  border: "1px solid rgba(239, 68, 68, 0.6)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(239, 68, 68, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
};

const UNDO_PHASE_BUTTON_STYLE: CSSProperties = {
  ...CONTROL_BUTTON_STYLE,
  border: "1px solid rgba(168, 85, 247, 0.6)",
  boxShadow:
    "0 6px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(168, 85, 247, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
};

const SHARE_TIP_TOAST_STYLE: CSSProperties = {
  position: "fixed",
  left: "max(62px, calc(env(safe-area-inset-left, 0px) + 60px))",
  top: "calc(50% + 98px)",
  width: "min(286px, calc(100vw - 72px))",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "9px 10px",
  borderRadius: "12px",
  border: "1px solid rgba(191, 214, 235, 0.26)",
  background: "rgba(12, 22, 29, 0.84)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 12px 26px rgba(2, 8, 15, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  zIndex: 23,
  pointerEvents: "none",
};

const SHARE_TIP_TEXT_STYLE: CSSProperties = {
  margin: 0,
  color: "#e5f2ff",
  fontSize: "10.5px",
  fontWeight: 600,
  letterSpacing: "0.14px",
  lineHeight: 1.35,
  whiteSpace: "pre-line",
  fontFamily: "Inter, system-ui, sans-serif",
};

const HOME_MENU_ICON_BUTTON_STYLE: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  border: "1px solid rgba(120, 168, 143, 0.34)",
  background: "rgba(13, 35, 23, 0.72)",
  color: "#f1f7f0",
  fontSize: "16px",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

const WHITEBOARD_TOOLS_BUTTON_STYLE: CSSProperties = {
  ...COACH_HUB_TOOL_BUTTON_STYLE,
  minWidth: 0,
  fontWeight: 600,
};

const WHITEBOARD_TOOLS_BUTTON_ACTIVE_STYLE: CSSProperties = {
  ...WHITEBOARD_TOOLS_BUTTON_STYLE,
  border: "1px solid rgba(125, 211, 252, 0.66)",
  background: "rgba(38, 72, 102, 0.72)",
  color: "#f8fcff",
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
  right: "max(8px, calc(env(safe-area-inset-right, 0px) + 6px))",
  top: "max(16px, env(safe-area-inset-top, 0px))",
  bottom: "auto",
  zIndex: 22,
  width: "clamp(148px, 23vw, 176px)",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  padding: "7px",
  borderRadius: "12px",
  border: "1px solid rgba(163, 190, 212, 0.26)",
  background: "rgba(10, 19, 24, 0.74)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 12px 24px rgba(2, 8, 15, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  maxHeight: "min(62vh, 380px)",
  overflowY: "auto",
  overflowX: "hidden",
};

const WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE: CSSProperties = {
  color: "#d7e8f5",
  fontSize: "8px",
  fontWeight: 700,
  letterSpacing: "0.2px",
  textTransform: "uppercase",
  margin: 0,
  fontFamily: "Inter, system-ui, sans-serif",
};

const WHITEBOARD_SUBSECTION_TITLE_STYLE: CSSProperties = {
  ...WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE,
  opacity: 0.78,
};

const WHITEBOARD_PANEL_SECTION_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const WHITEBOARD_TOOL_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "4px",
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

const WHITEBOARD_HOME_BUTTON_STYLE: CSSProperties = {
  ...HOME_MENU_ICON_BUTTON_STYLE,
  position: "fixed",
  top: "max(12px, calc(env(safe-area-inset-top, 0px) + 10px))",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  zIndex: 23,
};

const WHITEBOARD_HOME_CONFIRM_STYLE: CSSProperties = {
  position: "fixed",
  top: "max(54px, calc(env(safe-area-inset-top, 0px) + 50px))",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  width: "min(244px, calc(100vw - 24px))",
  display: "flex",
  flexDirection: "column",
  gap: "7px",
  padding: "9px",
  borderRadius: "12px",
  border: "1px solid rgba(163, 190, 212, 0.24)",
  background: "rgba(10, 19, 24, 0.76)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 12px 24px rgba(2, 8, 15, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
  zIndex: 24,
};

const WHITEBOARD_HOME_CONFIRM_TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: "#e4eff8",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12px",
  fontFamily: "Inter, system-ui, sans-serif",
};

const WHITEBOARD_HOME_CONFIRM_MESSAGE_STYLE: CSSProperties = {
  margin: 0,
  color: "rgba(215, 232, 245, 0.88)",
  fontSize: "10px",
  lineHeight: 1.35,
  fontFamily: "Inter, system-ui, sans-serif",
};

const WHITEBOARD_HOME_CONFIRM_ACTIONS_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
};

const WHITEBOARD_HOME_CONFIRM_BUTTON_STYLE: CSSProperties = {
  ...COACH_HUB_TOOL_BUTTON_STYLE,
  minWidth: 0,
  height: "31px",
};

const WHITEBOARD_HOME_CONFIRM_GO_BUTTON_STYLE: CSSProperties = {
  ...WHITEBOARD_HOME_CONFIRM_BUTTON_STYLE,
  border: "1px solid rgba(248, 113, 113, 0.5)",
  background: "rgba(127, 29, 29, 0.62)",
  color: "#ffe5e5",
};

export default function TacticalPadLiteClean({ initialMode = "tactical" }: TacticalPadLiteCleanProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const tacticalItemCounterRef = useRef(0);
  const actionsBubbleButtonRef = useRef<HTMLButtonElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const quickSharePopoverRef = useRef<HTMLDivElement | null>(null);
  const quickShareOnboardingCardRef = useRef<HTMLDivElement | null>(null);
  const shareTipTimerRef = useRef<number | null>(null);
  const whiteboardBubbleButtonRef = useRef<HTMLButtonElement | null>(null);
  const whiteboardBubbleMenuRef = useRef<HTMLDivElement | null>(null);
  const whiteboardHomeButtonRef = useRef<HTMLButtonElement | null>(null);
  const whiteboardHomeConfirmRef = useRef<HTMLDivElement | null>(null);
  const whiteboardHomeConfirmHistoryRef = useRef(false);
  const whiteboardBubbleDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    moved: boolean;
  } | null>(null);
  const suppressWhiteboardBubbleClickRef = useRef(false);
  const mode: PadMode = initialMode;
  const [whiteboardBlueCount, setWhiteboardBlueCount] = useState(1);
  const [whiteboardRedCount, setWhiteboardRedCount] = useState(1);
  const [whiteboardCountPickerTeam, setWhiteboardCountPickerTeam] = useState<"BLUE" | "RED">("BLUE");
  const [whiteboardBubbleOpen, setWhiteboardBubbleOpen] = useState(false);
  const [whiteboardHomeConfirmOpen, setWhiteboardHomeConfirmOpen] = useState(false);
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
  const [tacticalPenColor, setTacticalPenColor] = useState<number>(WHITEBOARD_DRAW_COLOR);
  const whiteboardCountsRef = useRef({ blue: 1, red: 1 });
  const whiteboardTeamColorsRef = useRef<{ blue: WhiteboardTokenColor; red: WhiteboardTokenColor }>({
    blue: "blue",
    red: "red",
  });
  const [whiteboardTool, setWhiteboardTool] = useState<WhiteboardToolControl>("move");
  const [tacticalTool, setTacticalTool] = useState<WhiteboardToolControl>("move");
  const [items, setItems] = useState<TacticalItem[]>([]);
  const [itemMode, setItemMode] = useState<ItemMode>("locked");
  const [phaseCount, setPhaseCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [quickShareOpen, setQuickShareOpen] = useState(false);
  const [quickShareOnboardingOpen, setQuickShareOnboardingOpen] = useState(false);
  const [quickShareOnboardingSeen, setQuickShareOnboardingSeen] = useState(false);
  const [quickShareOnboardingEntered, setQuickShareOnboardingEntered] = useState(false);
  const [shareTipMessage, setShareTipMessage] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [phasesOpen, setPhasesOpen] = useState(false);

  const isStatsMode = mode === "stats";
  const isWhiteboardMode = mode === "whiteboard";
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(QUICK_SHARE_ONBOARDING_STORAGE_KEY) === "true";
    setQuickShareOnboardingSeen(seen);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(isStatsMode || isWhiteboardMode)) return;
    const typedNavigator = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    if (!typedNavigator.wakeLock?.request) return;

    let disposed = false;
    const requestWakeLock = async () => {
      try {
        const sentinel = await typedNavigator.wakeLock?.request("screen");
        if (disposed) {
          await sentinel?.release?.();
          return;
        }
        wakeLockRef.current = sentinel ?? null;
      } catch {
        wakeLockRef.current = null;
      }
    };
    const releaseWakeLock = async () => {
      try {
        await wakeLockRef.current?.release?.();
      } catch {
        // Ignore wake lock release errors.
      } finally {
        wakeLockRef.current = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      } else {
        void releaseWakeLock();
      }
    };

    if (document.visibilityState === "visible") {
      void requestWakeLock();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void releaseWakeLock();
    };
  }, [isStatsMode, isWhiteboardMode]);

  useEffect(() => {
    const media = window.matchMedia("(orientation: landscape)");
    let rafA = 0;
    let rafB = 0;

    const runDoubleRafReflow = () => {
      rafA = window.requestAnimationFrame(() => {
        rafB = window.requestAnimationFrame(() => {
          surfaceRef.current?.reflow();
        });
      });
    };

    const handleViewportChange = () => {
      runDoubleRafReflow();
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
      whiteboardDrawColor: isWhiteboardMode ? whiteboardPenColor : tacticalPenColor,
      onPhaseCountChange: (count) => {
        if (!disposed) {
          setPhaseCount(count);
        }
      },
      onPlaybackStateChange: (state) => {
        if (disposed) return;
        setIsPlaying(state.isPlaying);
        setIsPaused(state.isPaused);
      },
      onItemMove: (itemId, x, y) => {
        if (disposed) return;
        const nextX = Math.max(0, Math.min(100, x));
        const nextY = Math.max(0, Math.min(100, y));
        setItems((previous) =>
          previous.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  x: nextX,
                  y: nextY,
                }
              : item,
          ),
        );
      },
    }).then((surface) => {
      if (disposed) {
        surface.destroy();
        return;
      }
      surfaceRef.current = surface;
      destroySurface = surface.destroy;
      const initialDrawTool = isWhiteboardMode ? whiteboardTool : tacticalTool;
      const initialDrawColor = isWhiteboardMode ? whiteboardPenColor : tacticalPenColor;
      surface.setWhiteboardDrawTool(initialDrawTool);
      surface.setWhiteboardDrawColor(initialDrawColor);
      if (!isWhiteboardMode) {
        surface.setItems(items);
        const initialSurfaceItemMode: ItemMode =
          itemMode === "edit" && tacticalTool === "move" && !(isPlaying || isPaused)
            ? "edit"
            : "locked";
        surface.setItemMode(initialSurfaceItemMode);
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
  }, [isStatsMode, isWhiteboardMode]);

  useEffect(() => {
    if (isStatsMode) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const activeDrawTool = isWhiteboardMode ? whiteboardTool : tacticalTool;
    const activeDrawColor = isWhiteboardMode ? whiteboardPenColor : tacticalPenColor;
    surface.setWhiteboardDrawTool(activeDrawTool);
    surface.setWhiteboardDrawColor(activeDrawColor);
  }, [isStatsMode, isWhiteboardMode, whiteboardTool, whiteboardPenColor, tacticalTool, tacticalPenColor]);

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
    if (isStatsMode || isWhiteboardMode) return;
    surfaceRef.current?.setItems(items);
  }, [isStatsMode, isWhiteboardMode, items]);

  const isPlaybackLocked = isPlaying || isPaused;
  const effectiveItemMode: ItemMode =
    itemMode === "edit" && tacticalTool === "move" && !isPlaybackLocked ? "edit" : "locked";

  useEffect(() => {
    if (isStatsMode || isWhiteboardMode) return;
    surfaceRef.current?.setItemMode(effectiveItemMode);
  }, [isStatsMode, isWhiteboardMode, effectiveItemMode]);

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
    if (isWhiteboardMode || !quickShareOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (actionsBubbleButtonRef.current?.contains(target)) return;
      if (actionsMenuRef.current?.contains(target)) return;
      if (quickSharePopoverRef.current?.contains(target)) return;
      setQuickShareOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setQuickShareOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isWhiteboardMode, quickShareOpen]);

  useEffect(() => {
    if (isWhiteboardMode || !quickShareOnboardingOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (quickShareOnboardingCardRef.current?.contains(target)) return;
      dismissQuickShareOnboarding(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismissQuickShareOnboarding(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isWhiteboardMode, quickShareOnboardingOpen]);

  useEffect(() => {
    if (!quickShareOnboardingOpen) {
      setQuickShareOnboardingEntered(false);
      return;
    }
    const rafId = window.requestAnimationFrame(() => {
      setQuickShareOnboardingEntered(true);
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [quickShareOnboardingOpen]);

  useEffect(() => {
    if (isWhiteboardMode || !actionsOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (actionsBubbleButtonRef.current?.contains(target)) return;
      if (actionsMenuRef.current?.contains(target)) return;
      if (quickSharePopoverRef.current?.contains(target)) return;
      setActionsOpen(false);
      setQuickShareOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setActionsOpen(false);
      setQuickShareOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isWhiteboardMode, actionsOpen]);

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

  const handlePlayPress = () => {
    if (isPaused) {
      surfaceRef.current?.resumePlayback();
    } else {
      surfaceRef.current?.play();
    }
    setToolsOpen(false);
    setControlsOpen(false);
  };

  const handlePausePress = () => {
    surfaceRef.current?.pausePlayback();
    setControlsOpen(false);
  };

  const phaseItems = Array.from({ length: phaseCount }, (_, index) => index + 1);
  const floodlightDots = Array.from({ length: 12 }, (_, index) => index);
  const activeTacticalPenColor = tacticalPenColor;
  const closeActionsMenu = () => {
    setActionsOpen(false);
    setQuickShareOpen(false);
  };
  const closeControlsMenu = () => setControlsOpen(false);
  const goHome = () => {
    closeActionsMenu();
    window.location.assign("/board");
  };
  const closeQuickShareMenu = () => setQuickShareOpen(false);
  const showShareTip = (message: string) => {
    if (shareTipTimerRef.current !== null) {
      window.clearTimeout(shareTipTimerRef.current);
    }
    setShareTipMessage(message);
    shareTipTimerRef.current = window.setTimeout(() => {
      setShareTipMessage(null);
      shareTipTimerRef.current = null;
    }, 4000);
  };
  const handleQuickShareRecordClip = () => {
    closeQuickShareMenu();
    showShareTip(
      "Use your phone’s screen recorder 🎥\nAndroid: swipe down twice → Screen Record\niPhone: Control Centre → Screen Recording",
    );
  };
  const handleQuickShareSnapshot = () => {
    closeQuickShareMenu();
    showShareTip("Take a screenshot to share this setup 📸\nFastest way to send it to WhatsApp");
  };
  const dismissQuickShareOnboarding = (openQuickShareAfter = false) => {
    setQuickShareOnboardingOpen(false);
    setQuickShareOnboardingSeen(true);
    try {
      window.localStorage.setItem(QUICK_SHARE_ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // Keep onboarding state in-memory if storage is unavailable.
    }
    if (openQuickShareAfter) {
      setQuickShareOpen(true);
    }
  };
  const openQuickShareEntry = () => {
    closeActionsMenu();
    if (quickShareOnboardingSeen) {
      setQuickShareOpen(true);
      return;
    }
    setQuickShareOnboardingOpen(true);
  };
  useEffect(() => {
    return () => {
      if (shareTipTimerRef.current !== null) {
        window.clearTimeout(shareTipTimerRef.current);
      }
    };
  }, []);
  const openWhiteboardHomeConfirm = () => {
    if (whiteboardHomeConfirmOpen) return;
    setWhiteboardHomeConfirmOpen(true);
    if (!whiteboardHomeConfirmHistoryRef.current) {
      window.history.pushState(
        { ...(window.history.state as Record<string, unknown> | null), whiteboardHomeConfirmOpen: true },
        "",
        window.location.href,
      );
      whiteboardHomeConfirmHistoryRef.current = true;
    }
  };
  const closeWhiteboardHomeConfirm = () => {
    if (whiteboardHomeConfirmHistoryRef.current) {
      whiteboardHomeConfirmHistoryRef.current = false;
      window.history.back();
      return;
    }
    setWhiteboardHomeConfirmOpen(false);
  };
  const confirmWhiteboardGoHome = () => {
    whiteboardHomeConfirmHistoryRef.current = false;
    setWhiteboardHomeConfirmOpen(false);
    goHome();
  };

  useEffect(() => {
    if (!isWhiteboardMode || !whiteboardHomeConfirmOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (whiteboardHomeButtonRef.current?.contains(target)) return;
      if (whiteboardHomeConfirmRef.current?.contains(target)) return;
      closeWhiteboardHomeConfirm();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeWhiteboardHomeConfirm();
    };
    const handlePopState = () => {
      if (!whiteboardHomeConfirmOpen) return;
      whiteboardHomeConfirmHistoryRef.current = false;
      setWhiteboardHomeConfirmOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isWhiteboardMode, whiteboardHomeConfirmOpen]);

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

  const applyTacticalPenColor = (color: number) => {
    setTacticalPenColor(color);
    surfaceRef.current?.setWhiteboardDrawColor(color);
  };

  const applyTacticalTool = (tool: WhiteboardToolAction) => {
    const surface = surfaceRef.current;
    if (!surface) return;
    if (tool === "eraser") {
      surface.eraseWhiteboardPenStroke();
      return;
    }
    setTacticalTool(tool);
    surface.setWhiteboardDrawTool(tool);
    surface.setWhiteboardDrawColor(tacticalPenColor);
  };

  const clearTacticalDrawings = () => {
    surfaceRef.current?.clearWhiteboardStrokes();
  };

  const addTacticalPlayer = () => {
    surfaceRef.current?.addTacticalPlayer();
  };

  const removeTacticalPlayer = () => {
    surfaceRef.current?.removeTacticalPlayer();
  };

  const addItem = (type: TacticalItem["type"]) => {
    tacticalItemCounterRef.current += 1;
    const nextId = `item-${tacticalItemCounterRef.current}`;
    setItems((previous) => {
      const index = previous.length;
      const column = index % 3;
      const row = Math.floor(index / 3);
      const nextX = Math.min(78, 30 + column * 12);
      const nextY = Math.min(78, 26 + row * 10);
      return [...previous, { id: nextId, type, x: nextX, y: nextY }];
    });
  };

  const clearItems = () => {
    setItems([]);
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
    const viewport = getViewportRect();
    const availableHeight = viewport.height - WHITEBOARD_BUBBLE_MARGIN * 2;
    const preferredHeight = whiteboardBubbleMenuSize.height + 40;
    return {
      maxHeight: `${Math.max(140, Math.min(availableHeight, preferredHeight))}px`,
      zIndex: 22,
    } as const;
  })();

  if (isStatsMode) {
    return (
      <>
        <StatsModeSurface />
      </>
    );
  }

  return (
    <OrientationGate modeLabel={isWhiteboardMode ? "Whiteboard Mode" : "FlowLab Tactics"}>
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
        <div style={isWhiteboardMode ? WHITEBOARD_CONTENT_STYLE : CONTENT_STYLE}>
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
                <div style={WHITEBOARD_PANEL_SECTION_STYLE}>
                  <p style={WHITEBOARD_COUNT_SELECTOR_TITLE_STYLE}>TOOLS</p>
                  <div style={WHITEBOARD_TOOL_GRID_STYLE}>
                    <button
                      type="button"
                      style={whiteboardTool === "move" ? WHITEBOARD_TOOLS_BUTTON_ACTIVE_STYLE : WHITEBOARD_TOOLS_BUTTON_STYLE}
                      onClick={() => applyWhiteboardTool("move")}
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      style={whiteboardTool === "pen" ? WHITEBOARD_TOOLS_BUTTON_ACTIVE_STYLE : WHITEBOARD_TOOLS_BUTTON_STYLE}
                      onClick={() => applyWhiteboardTool("pen")}
                    >
                      Pen
                    </button>
                    <button
                      type="button"
                      style={whiteboardTool === "line" ? WHITEBOARD_TOOLS_BUTTON_ACTIVE_STYLE : WHITEBOARD_TOOLS_BUTTON_STYLE}
                      onClick={() => applyWhiteboardTool("line")}
                    >
                      Line
                    </button>
                    <button
                      type="button"
                      style={whiteboardTool === "arrow" ? WHITEBOARD_TOOLS_BUTTON_ACTIVE_STYLE : WHITEBOARD_TOOLS_BUTTON_STYLE}
                      onClick={() => applyWhiteboardTool("arrow")}
                    >
                      Arrow
                    </button>
                    <button
                      type="button"
                      style={whiteboardTool === "dashed" ? WHITEBOARD_TOOLS_BUTTON_ACTIVE_STYLE : WHITEBOARD_TOOLS_BUTTON_STYLE}
                      onClick={() => applyWhiteboardTool("dashed")}
                    >
                      Dash
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
                      Clear
                    </button>
                  </div>
                </div>
                <div style={WHITEBOARD_PANEL_SECTION_STYLE}>
                  <p style={WHITEBOARD_SUBSECTION_TITLE_STYLE}>COLOUR</p>
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
                </div>
                <div style={WHITEBOARD_PANEL_SECTION_STYLE}>
                  <p style={WHITEBOARD_SUBSECTION_TITLE_STYLE}>PLAYERS</p>
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
              </div>
            ) : null}
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
              disabled={isPlaybackLocked}
              style={isPlaybackLocked ? DISABLED_CONTROL_BUTTON_STYLE : SET_START_BUTTON_STYLE}
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
              disabled={isPlaybackLocked}
              style={isPlaybackLocked ? DISABLED_CONTROL_BUTTON_STYLE : ADD_PHASE_BUTTON_STYLE}
              onClick={() => {
                surfaceRef.current?.addPhase();
                closeControlsMenu();
              }}
            >
              Add Phase
            </button>
            <button
              type="button"
              className="control-button"
              disabled={isPlaying}
              style={isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : PLAY_BUTTON_STYLE}
              onClick={handlePlayPress}
            >
              Play
            </button>
            <button
              type="button"
              className="control-button"
              disabled={!isPlaying}
              style={!isPlaying ? DISABLED_CONTROL_BUTTON_STYLE : PAUSE_BUTTON_STYLE}
              onClick={handlePausePress}
            >
              Pause
            </button>
            <button
              type="button"
              className="control-button"
              disabled={phaseCount <= 0}
              style={phaseCount <= 0 ? DISABLED_CONTROL_BUTTON_STYLE : UNDO_PHASE_BUTTON_STYLE}
              onClick={() => {
                surfaceRef.current?.undoPhase();
                closeControlsMenu();
              }}
            >
              Undo Phase
            </button>
            <button
              type="button"
              className="control-button"
              style={RESET_BUTTON_STYLE}
              onClick={() => {
                surfaceRef.current?.reset();
                setIsPlaying(false);
                setIsPaused(false);
                closeControlsMenu();
              }}
            >
              Reset
            </button>
          </div>
        ) : null}
        {!isWhiteboardMode && toolsOpen ? (
          <div style={COACH_HUB_PANEL_STYLE}>
            <div style={COACH_HUB_SECTION_STYLE}>
              <p style={COACH_HUB_SECTION_TITLE_STYLE}>Tools</p>
              <div className="coach-hub-tool-grid" style={COACH_HUB_TOOL_GRID_STYLE}>
                <button
                  type="button"
                  style={tacticalTool === "move" ? COACH_HUB_TOOL_BUTTON_ACTIVE_STYLE : COACH_HUB_TOOL_BUTTON_STYLE}
                  onClick={() => applyTacticalTool("move")}
                >
                  Move
                </button>
                <button
                  type="button"
                  style={tacticalTool === "pen" ? COACH_HUB_TOOL_BUTTON_ACTIVE_STYLE : COACH_HUB_TOOL_BUTTON_STYLE}
                  onClick={() => applyTacticalTool("pen")}
                >
                  Pen
                </button>
                <button
                  type="button"
                  style={tacticalTool === "line" ? COACH_HUB_TOOL_BUTTON_ACTIVE_STYLE : COACH_HUB_TOOL_BUTTON_STYLE}
                  onClick={() => applyTacticalTool("line")}
                >
                  Line
                </button>
                <button
                  type="button"
                  style={tacticalTool === "arrow" ? COACH_HUB_TOOL_BUTTON_ACTIVE_STYLE : COACH_HUB_TOOL_BUTTON_STYLE}
                  onClick={() => applyTacticalTool("arrow")}
                >
                  Arrow
                </button>
                <button
                  type="button"
                  style={tacticalTool === "dashed" ? COACH_HUB_TOOL_BUTTON_ACTIVE_STYLE : COACH_HUB_TOOL_BUTTON_STYLE}
                  onClick={() => applyTacticalTool("dashed")}
                >
                  Dash
                </button>
              </div>
            </div>
            <div style={COACH_HUB_SECTION_STYLE}>
              <p style={COACH_HUB_SECTION_TITLE_STYLE}>Colour</p>
              <div style={COACH_HUB_COLOR_GRID_STYLE}>
                {WHITEBOARD_PEN_COLOR_CHOICES.map((choice) => {
                  const isActive = activeTacticalPenColor === choice.value;
                  return (
                    <button
                      key={`tactical-color-${choice.label.toLowerCase()}`}
                      type="button"
                      aria-label={`Set tactical drawing colour ${choice.label}`}
                      style={{
                        ...COACH_HUB_COLOR_BUTTON_STYLE,
                        ...(isActive
                          ? {
                              boxShadow: "0 0 0 2px rgba(125, 211, 252, 0.88)",
                              border: "1px solid rgba(125, 211, 252, 0.8)",
                            }
                          : null),
                      }}
                      onClick={() => applyTacticalPenColor(choice.value)}
                    >
                      <span style={{ ...COACH_HUB_COLOR_SWATCH_STYLE, background: choice.css }} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={COACH_HUB_SECTION_STYLE}>
              <p style={COACH_HUB_SECTION_TITLE_STYLE}>Players</p>
              <div style={COACH_HUB_ACTION_GRID_STYLE}>
                <button type="button" style={COACH_HUB_ACTION_BUTTON_STYLE} disabled={isPlaybackLocked} onClick={addTacticalPlayer}>
                  + Player
                </button>
                <button
                  type="button"
                  style={COACH_HUB_ACTION_BUTTON_STYLE}
                  disabled={isPlaybackLocked}
                  onClick={removeTacticalPlayer}
                >
                  - Player
                </button>
                <button type="button" style={{ ...COACH_HUB_ACTION_BUTTON_STYLE, gridColumn: "1 / -1" }} onClick={() => {}}>
                  Clear Players
                </button>
              </div>
            </div>
            <div style={COACH_HUB_SECTION_STYLE}>
              <p style={COACH_HUB_SECTION_TITLE_STYLE}>Items</p>
              <div style={COACH_HUB_ACTION_GRID_STYLE}>
                <button
                  type="button"
                  style={{ ...COACH_HUB_ACTION_BUTTON_STYLE, gridColumn: "1 / -1" }}
                  disabled={isPlaybackLocked}
                  onClick={() => setItemMode((previous) => (previous === "edit" ? "locked" : "edit"))}
                >
                  {effectiveItemMode === "edit" ? "Lock Items" : "Edit Items"}
                </button>
                {TACTICAL_ITEM_CHOICES.map((choice) => (
                  <button
                    key={`item-${choice.type}`}
                    type="button"
                    style={COACH_HUB_ACTION_BUTTON_STYLE}
                    disabled={isPlaybackLocked}
                    onClick={() => addItem(choice.type)}
                  >
                    + {choice.label}
                  </button>
                ))}
                <button
                  type="button"
                  style={{ ...COACH_HUB_ACTION_BUTTON_STYLE, gridColumn: "1 / -1" }}
                  disabled={isPlaybackLocked}
                  onClick={clearItems}
                >
                  Clear Items
                </button>
              </div>
            </div>
            <div style={COACH_HUB_SECTION_STYLE}>
              <p style={COACH_HUB_SECTION_TITLE_STYLE}>Drawing</p>
              <div style={COACH_HUB_ACTION_GRID_STYLE}>
                <button
                  type="button"
                  style={COACH_HUB_ACTION_BUTTON_STYLE}
                  onClick={() => surfaceRef.current?.undoWhiteboardStroke()}
                >
                  Undo
                </button>
                <button type="button" style={COACH_HUB_ACTION_BUTTON_STYLE} onClick={clearTacticalDrawings}>
                  Clear Drawing
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {!isWhiteboardMode && actionsOpen ? (
          <div ref={actionsMenuRef} style={ACTIONS_POPOUT_STYLE}>
            <button type="button" className="control-button" style={ACTIONS_MENU_BUTTON_STYLE} onClick={openQuickShareEntry}>
              Quick Share
            </button>
            <button type="button" className="control-button" style={ACTIONS_MENU_BUTTON_STYLE} onClick={goHome}>
              Home
            </button>
          </div>
        ) : null}
        {!isWhiteboardMode ? (
          <button
            ref={actionsBubbleButtonRef}
            type="button"
            className="floating-bubble"
            style={ACTIONS_BUBBLE_STYLE}
            aria-label="Open actions"
            onClick={() =>
              setActionsOpen((open) => {
                const next = !open;
                if (next) {
                  setControlsOpen(false);
                  setQuickShareOpen(false);
                }
                return next;
              })
            }
          >
            ⋯
          </button>
        ) : null}
        {!isWhiteboardMode ? (
          <button
            type="button"
            className="floating-bubble"
            style={LEFT_BUBBLE_STYLE}
            aria-label="Open controls"
            onClick={() =>
              setControlsOpen((open) => {
                const next = !open;
                if (next) {
                  setActionsOpen(false);
                  setQuickShareOpen(false);
                }
                return next;
              })
            }
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
        {!isWhiteboardMode && quickShareOnboardingOpen ? (
          <div
            style={{
              ...QUICK_SHARE_ONBOARDING_OVERLAY_STYLE,
              opacity: quickShareOnboardingEntered ? 1 : 0,
            }}
            role="presentation"
          >
            <div
              ref={quickShareOnboardingCardRef}
              style={{
                ...QUICK_SHARE_ONBOARDING_CARD_STYLE,
                opacity: quickShareOnboardingEntered ? 1 : 0,
                transform: quickShareOnboardingEntered ? "scale(1)" : "scale(0.98)",
              }}
              role="dialog"
              aria-modal="false"
              aria-label="Quick Share onboarding"
            >
              <p style={QUICK_SHARE_ONBOARDING_TITLE_STYLE}>⚡ Quick Share</p>
              <p style={QUICK_SHARE_ONBOARDING_BODY_STYLE}>Share plays using the tools already on your phone.</p>
              <div style={QUICK_SHARE_ONBOARDING_ROW_STYLE}>
                <p style={QUICK_SHARE_ONBOARDING_ROW_TITLE_STYLE}>🎥 Record Play</p>
                <p style={QUICK_SHARE_ONBOARDING_ROW_TEXT_STYLE}>Swipe down → Screen Record → press Play</p>
              </div>
              <div style={QUICK_SHARE_ONBOARDING_ROW_STYLE}>
                <p style={QUICK_SHARE_ONBOARDING_ROW_TITLE_STYLE}>📸 Snapshot</p>
                <p style={QUICK_SHARE_ONBOARDING_ROW_TEXT_STYLE}>Take a screenshot → send it to WhatsApp</p>
              </div>
              <p style={QUICK_SHARE_ONBOARDING_NOTE_STYLE}>Fast, reliable, matchday-safe.</p>
              <button
                type="button"
                className="control-button"
                style={QUICK_SHARE_ONBOARDING_BUTTON_STYLE}
                onClick={() => dismissQuickShareOnboarding(true)}
              >
                Got it 👍
              </button>
            </div>
          </div>
        ) : null}
        {!isWhiteboardMode && quickShareOpen ? (
          <div ref={quickSharePopoverRef} style={QUICK_SHARE_POPOUT_STYLE} role="dialog" aria-modal="false" aria-label="Quick Share">
            <p style={QUICK_SHARE_TITLE_STYLE}>⚡ Quick Share</p>
            <button type="button" className="control-button" style={QUICK_SHARE_OPTION_BUTTON_STYLE} onClick={handleQuickShareRecordClip}>
              <span style={QUICK_SHARE_OPTION_TITLE_STYLE}>🎥 Record Clip</span>
              <span style={QUICK_SHARE_OPTION_SUBTITLE_STYLE}>Best for movement & plays</span>
            </button>
            <button type="button" className="control-button" style={QUICK_SHARE_OPTION_BUTTON_STYLE} onClick={handleQuickShareSnapshot}>
              <span style={QUICK_SHARE_OPTION_TITLE_STYLE}>📸 Share Snapshot</span>
              <span style={QUICK_SHARE_OPTION_SUBTITLE_STYLE}>Best for setups & drills</span>
            </button>
          </div>
        ) : null}
        {!isWhiteboardMode && shareTipMessage ? (
          <div style={SHARE_TIP_TOAST_STYLE} role="status" aria-live="polite">
            <p style={SHARE_TIP_TEXT_STYLE}>{shareTipMessage}</p>
          </div>
        ) : null}
        {isWhiteboardMode ? (
          <>
            <button
              ref={whiteboardHomeButtonRef}
              type="button"
              style={WHITEBOARD_HOME_BUTTON_STYLE}
              onClick={openWhiteboardHomeConfirm}
              aria-label="Go to Home"
              aria-expanded={whiteboardHomeConfirmOpen}
            >
              ⌂
            </button>
            {whiteboardHomeConfirmOpen ? (
              <div ref={whiteboardHomeConfirmRef} style={WHITEBOARD_HOME_CONFIRM_STYLE} role="dialog" aria-modal="false">
                <p style={WHITEBOARD_HOME_CONFIRM_TITLE_STYLE}>Leave Whiteboard?</p>
                <p style={WHITEBOARD_HOME_CONFIRM_MESSAGE_STYLE}>Your current board may not be saved.</p>
                <div style={WHITEBOARD_HOME_CONFIRM_ACTIONS_STYLE}>
                  <button type="button" style={WHITEBOARD_HOME_CONFIRM_BUTTON_STYLE} onClick={closeWhiteboardHomeConfirm}>
                    Cancel
                  </button>
                  <button type="button" style={WHITEBOARD_HOME_CONFIRM_GO_BUTTON_STYLE} onClick={confirmWhiteboardGoHome}>
                    Go Home
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </OrientationGate>
  );
}
