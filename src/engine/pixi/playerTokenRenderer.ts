import type { Container, Graphics } from "pixi.js";

import {
  createPhosphorJerseyToken,
  createPhosphorToken,
  createProceduralPixiToken,
} from "./createCleanTokenRenderers";
import {
  createVisionV3PlayerToken,
  type VisionV3KitPattern,
  type VisionV3PlayerTokenStyle,
} from "./createVisionV3PlayerToken";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";

export type PlayerTokenStyle = "vision-v3" | "pixi" | "jersey";
export type PlayerTokenKitPattern = VisionV3KitPattern;

export type PlayerTokenRendererInput = {
  label: string;
  number: number;
  teamColor: PremiumPlayerTokenColor;
  scale: number;
  style: Partial<VisionV3PlayerTokenStyle>;
  kitPattern: PlayerTokenKitPattern;
  kitPatternColor: number;
  radius: number;
};

export type PlayerTokenRendererOutput = {
  token: Container;
  shadow: Graphics;
};

export type PlayerTokenRenderer = (input: PlayerTokenRendererInput) => PlayerTokenRendererOutput;

type VisionDiscTeamSide = "BLUE" | "RED";
type VisionDiscTeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
type VisionDiscPattern = "solid" | "gradient" | "hoops" | "stripes" | "slash" | "chestDash";
type VisionDiscLabelMode = "number" | "initials";
type VisionDiscCssTokenSet = {
  ringColor: string;
  ringStrokeColor: string;
  discBaseColor: string;
  discHighlightColor: string;
  discEdgeColor: string;
  patternColor: string;
  glyphColor: string;
  labelColor: string;
  labelStrokeColor: string;
  labelPlateColor: string;
  shadowColor: string;
  haloColor: string;
};

type VisionDiscRenderInput = {
  label: string;
  number: number;
  labelMode: VisionDiscLabelMode;
  teamSide: VisionDiscTeamSide;
  teamColor: VisionDiscTeamColor;
  pattern: VisionDiscPattern;
  selected: boolean;
  radiusPx: number;
  scale?: number;
  styleTokens: VisionDiscCssTokenSet;
};

function colorToCssHex(color: number): string {
  const normalized = Number.isFinite(color) ? Math.max(0, Math.min(0xffffff, Math.round(color))) : 0;
  return `#${normalized.toString(16).padStart(6, "0")}`;
}

function cssHexToColor(value: string, fallback: number): number {
  if (!/^#[\da-f]{6}$/i.test(value)) return fallback;
  return Number.parseInt(value.slice(1), 16);
}

function toVisionDiscPattern(pattern: PlayerTokenKitPattern): VisionDiscPattern {
  if (pattern === "plain") return "solid";
  return pattern;
}

function toPlayerTokenPattern(pattern: VisionDiscPattern): PlayerTokenKitPattern {
  if (pattern === "solid") return "plain";
  return pattern;
}

function toVisionDiscTeamColor(teamColor: PremiumPlayerTokenColor): VisionDiscTeamColor {
  if (teamColor === "blue" || teamColor === "red" || teamColor === "yellow" || teamColor === "black") {
    return teamColor;
  }
  return "blue";
}

function createJerseyDiscToken(input: VisionDiscRenderInput): PlayerTokenRendererOutput {
  return createPhosphorJerseyToken({
    label: input.labelMode === "initials" ? input.label : String(input.number),
    radius: input.radiusPx,
    scale: input.scale,
    baseColor: cssHexToColor(input.styleTokens.discBaseColor, 0x2563eb),
    patternColor: cssHexToColor(input.styleTokens.patternColor, 0xffffff),
    numberColor: cssHexToColor(input.styleTokens.labelColor, 0xffffff),
    outlineColor: cssHexToColor(input.styleTokens.labelStrokeColor, 0x0f172a),
    pattern: toPlayerTokenPattern(input.pattern),
  });
}

export const VisionV3Renderer: PlayerTokenRenderer = ({
  label,
  teamColor,
  scale,
  style,
  kitPattern,
  kitPatternColor,
  radius,
}) =>
  createVisionV3PlayerToken({
    label,
    teamColor,
    radius,
    scale,
    style,
    kitPattern,
    kitPatternColor,
  });

export const PhosphorRenderer: PlayerTokenRenderer = ({
  label,
  scale,
  style,
  kitPattern,
  kitPatternColor,
  radius,
}) =>
  createPhosphorToken({
    label,
    scale,
    radius,
    baseColor: style.primaryColor ?? 0x2563eb,
    patternColor: kitPatternColor,
    numberColor: style.textColor,
    outlineColor: style.outlineColor,
    pattern: kitPattern,
  });

export const ProceduralPixiRenderer: PlayerTokenRenderer = ({
  label,
  scale,
  style,
  kitPattern,
  kitPatternColor,
  radius,
}) =>
  createProceduralPixiToken({
    label,
    scale,
    radius,
    baseColor: style.primaryColor ?? 0x2563eb,
    patternColor: kitPatternColor,
    numberColor: style.textColor,
    outlineColor: style.outlineColor,
    pattern: kitPattern,
  });

export const PhosphorJerseyRenderer: PlayerTokenRenderer = ({
  label,
  number,
  teamColor,
  scale,
  style,
  kitPattern,
  kitPatternColor,
  radius,
}) =>
  // Jersey renderer field mapping
  createJerseyDiscToken({
    label,
    number,
    radiusPx: radius,
    scale,
    pattern: toVisionDiscPattern(kitPattern),
    labelMode: "number",
    teamColor: toVisionDiscTeamColor(teamColor),
    teamSide: teamColor === "red" ? "RED" : "BLUE",
    selected: false,
    styleTokens: {
      ringColor: colorToCssHex(style.primaryColor ?? 0x2563eb),
      ringStrokeColor: colorToCssHex(style.outlineColor ?? 0x0f172a),
      discBaseColor: colorToCssHex(style.primaryColor ?? 0x2563eb),
      discHighlightColor: colorToCssHex(style.primaryColor ?? 0x2563eb),
      discEdgeColor: colorToCssHex(style.outlineColor ?? 0x0f172a),
      patternColor: colorToCssHex(kitPatternColor),
      glyphColor: colorToCssHex(style.textColor ?? 0xffffff),
      labelColor: colorToCssHex(style.textColor ?? 0xffffff),
      labelStrokeColor: colorToCssHex(style.outlineColor ?? 0x0f172a),
      labelPlateColor: colorToCssHex(style.outlineColor ?? 0x0f172a),
      shadowColor: colorToCssHex(style.outlineColor ?? 0x0f172a),
      haloColor: colorToCssHex(kitPatternColor),
    },
  });

export function resolvePlayerTokenRenderer(style: PlayerTokenStyle): PlayerTokenRenderer {
  if (style === "jersey") return PhosphorJerseyRenderer;
  if (style === "pixi") return ProceduralPixiRenderer;
  if (style === "vision-v3") return VisionV3Renderer;
  return VisionV3Renderer;
}

export function sanitizePlayerTokenStyle(value: unknown): PlayerTokenStyle {
  if (value === "vision-v3" || value === "pixi" || value === "jersey") return value;
  if (value === "procedural-pixi") return "pixi";
  return "vision-v3";
}
