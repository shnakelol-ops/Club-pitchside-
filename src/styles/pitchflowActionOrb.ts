import type { CSSProperties } from "react";

export const PITCHFLOW_ACTION_ORB_SHELL_STYLE: CSSProperties = {
  background:
    "radial-gradient(circle at 30% 24%, rgba(30, 47, 24, 0.9) 0%, rgba(8, 12, 10, 0.94) 60%, rgba(5, 8, 10, 0.99) 100%)",
  border: "1.35px solid rgba(119, 210, 55, 0.68)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  boxShadow:
    "0 8px 20px rgba(0, 0, 0, 0.54), 0 0 8px rgba(119, 210, 55, 0.44), 0 0 18px rgba(119, 210, 55, 0.18), inset 0 0 0 1px rgba(228, 240, 233, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -4px 8px rgba(0, 0, 0, 0.34)",
};

export const PITCHFLOW_ACTION_ORB_WATERMARK_IMAGE_WRAP_STYLE: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  borderRadius: "inherit",
  overflow: "hidden",
};

export const PITCHFLOW_ACTION_ORB_WATERMARK_IMAGE_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "50% 34%",
  transform: "scale(1.9)",
  transformOrigin: "center",
  filter: "saturate(1.03) brightness(0.94) contrast(1.1)",
  WebkitMaskImage:
    "radial-gradient(circle at 50% 42%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0.86) 58%, rgba(0, 0, 0, 0.2) 74%, rgba(0, 0, 0, 0) 84%)",
  maskImage:
    "radial-gradient(circle at 50% 42%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0.86) 58%, rgba(0, 0, 0, 0.2) 74%, rgba(0, 0, 0, 0) 84%)",
};

export const PITCHFLOW_ACTION_ORB_WATERMARK_DARKEN_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(4, 7, 10, 0.24) 0%, rgba(4, 7, 10, 0.05) 46%, rgba(4, 7, 10, 0.34) 100%)",
  pointerEvents: "none",
};

export const PITCHFLOW_ACTION_ORB_WATERMARK_GLOSS_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 30% 17%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 24%, rgba(255, 255, 255, 0) 50%)",
  pointerEvents: "none",
};

export const PITCHFLOW_ACTION_ORB_WATERMARK_EDGE_BLEND_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  width: "35%",
  background: "linear-gradient(90deg, rgba(5, 8, 10, 0) 0%, rgba(5, 8, 10, 0.9) 100%)",
  pointerEvents: "none",
};

export const PITCHFLOW_ACTION_ORB_WATERMARK_RING_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  boxShadow: "inset 0 0 0 1px rgba(136, 220, 84, 0.46), inset 0 0 6px rgba(119, 210, 55, 0.15)",
  pointerEvents: "none",
};

export const PITCHFLOW_ACTION_ORB_TAG_BUTTON_STYLE: CSSProperties = {
  ...PITCHFLOW_ACTION_ORB_SHELL_STYLE,
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  color: "rgba(232, 247, 234, 0.96)",
  fontSize: "13px",
  lineHeight: 1,
  textShadow: "0 0 6px rgba(119, 210, 55, 0.3)",
};
