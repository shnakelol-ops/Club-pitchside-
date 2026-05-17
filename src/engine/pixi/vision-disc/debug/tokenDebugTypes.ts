import type { Container } from "pixi.js";

export type DebugTokenPattern = "solid" | "hoops" | "stripes" | "slash" | "chestDash";

export type DebugTokenColorway = {
  id: string;
  label: string;
  baseColor: number;
  accentColor: number;
};

export type DebugTokenRenderInput = {
  label: string;
  radius: number;
  baseColor: number;
  accentColor: number;
  pattern: DebugTokenPattern;
  selected?: boolean;
};

export type DebugTokenRenderer = {
  id: string;
  label: string;
  description: string;
  render: (input: DebugTokenRenderInput) => Container;
};

export type TokenDebugView = "full" | "stress" | "close" | "zoom";

export const DEBUG_TOKEN_PATTERNS: readonly DebugTokenPattern[] = [
  "solid",
  "hoops",
  "stripes",
  "slash",
  "chestDash",
];

export const DEBUG_TOKEN_COLORWAYS: readonly DebugTokenColorway[] = [
  {
    id: "yellow-green",
    label: "yellow / green",
    baseColor: 0xfacc15,
    accentColor: 0x15803d,
  },
  {
    id: "blue-white",
    label: "blue / white",
    baseColor: 0x2563eb,
    accentColor: 0xf8fafc,
  },
  {
    id: "red-white",
    label: "red / white",
    baseColor: 0xdc2626,
    accentColor: 0xf8fafc,
  },
];

export const DEBUG_TOKEN_SIZES = [14, 20, 28] as const;
