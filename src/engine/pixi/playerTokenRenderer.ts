import type { Container, Graphics } from "pixi.js";

import { createMicroAthleteToken, type MicroAthleteKitPattern, type MicroAthleteStyle } from "./createMicroAthleteToken";
import { createPremiumGlowPlayerToken } from "./createPremiumGlowPlayerToken";
import { createTorsoPlayerToken } from "./createTorsoPlayerToken";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";
import { createVisionDiscToken, type VisionDiscCssTokenSet, type VisionDiscPattern } from "./vision-disc";

export type PlayerTokenStyle = "vision-v3" | "classic" | "premium" | "torso";

export type PlayerTokenRendererInput = {
  label: string;
  number: number;
  teamColor: PremiumPlayerTokenColor;
  scale: number;
  style: Partial<MicroAthleteStyle>;
  kitPattern: MicroAthleteKitPattern;
  kitPatternColor: number;
  radius: number;
};

export type PlayerTokenRendererOutput = {
  token: Container;
  shadow: Graphics;
};

export type PlayerTokenRenderer = (input: PlayerTokenRendererInput) => PlayerTokenRendererOutput;

const DEFAULT_BASE_COLOR_BY_TEAM: Record<PremiumPlayerTokenColor, number> = {
  blue: 0x2563eb,
  red: 0xdc2626,
  yellow: 0xfacc15,
  black: 0x1f2937,
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(base: number, target: number, amount: number): number {
  const baseR = (base >> 16) & 0xff;
  const baseG = (base >> 8) & 0xff;
  const baseB = base & 0xff;
  const targetR = (target >> 16) & 0xff;
  const targetG = (target >> 8) & 0xff;
  const targetB = target & 0xff;

  const r = clampByte(baseR + (targetR - baseR) * amount);
  const g = clampByte(baseG + (targetG - baseG) * amount);
  const b = clampByte(baseB + (targetB - baseB) * amount);

  return (r << 16) | (g << 8) | b;
}

function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function colorToRgba(color: number, alpha: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function mapKitPatternToVisionPattern(pattern: MicroAthleteKitPattern): VisionDiscPattern {
  if (pattern === "plain") return "solid";
  return pattern;
}

function buildVisionDiscTokens({
  teamColor,
  style,
  kitPatternColor,
}: Pick<PlayerTokenRendererInput, "teamColor" | "style" | "kitPatternColor">): VisionDiscCssTokenSet {
  const baseColor =
    Number.isFinite(style.primaryColor) ? Number(style.primaryColor) : DEFAULT_BASE_COLOR_BY_TEAM[teamColor];
  const accentColor =
    Number.isFinite(kitPatternColor)
      ? Number(kitPatternColor)
      : (Number.isFinite(style.secondaryColor) ? Number(style.secondaryColor) : mixColor(baseColor, 0xffffff, 0.42));
  const ringColor = mixColor(baseColor, 0x0f172a, 0.08);
  const ringStrokeColor = mixColor(baseColor, 0xe2e8f0, 0.3);
  const discBaseColor = mixColor(baseColor, 0xffffff, 0.05);
  const discHighlightColor = mixColor(baseColor, 0xffffff, 0.16);
  const discEdgeColor = mixColor(baseColor, 0x0f172a, 0.14);
  const labelColor = 0xffffff;
  const labelStrokeColor = mixColor(discBaseColor, 0x020617, 0.76);
  const haloColor = mixColor(accentColor, 0xf8fafc, 0.12);
  const shadowColor = mixColor(ringColor, 0x020617, 0.52);

  return {
    ringColor: colorToHex(ringColor),
    ringStrokeColor: colorToHex(ringStrokeColor),
    discBaseColor: colorToHex(discBaseColor),
    discHighlightColor: colorToHex(discHighlightColor),
    discEdgeColor: colorToHex(discEdgeColor),
    patternColor: colorToHex(accentColor),
    glyphColor: "#ffffff",
    labelColor: colorToHex(labelColor),
    labelStrokeColor: colorToHex(labelStrokeColor),
    labelPlateColor: colorToRgba(labelStrokeColor, 0.34),
    shadowColor: colorToRgba(shadowColor, 0.95),
    haloColor: colorToHex(haloColor),
  };
}

export const ClassicRingRenderer: PlayerTokenRenderer = ({
  label,
  teamColor,
  scale,
  style,
  kitPattern,
  kitPatternColor,
}) =>
  createMicroAthleteToken({
    label,
    teamColor,
    scale,
    style,
    kitPattern,
    kitPatternColor,
  });

export const PremiumGlowRenderer: PlayerTokenRenderer = ({
  label,
  teamColor,
  scale,
  style,
  kitPattern,
  kitPatternColor,
}) =>
  createPremiumGlowPlayerToken({
    label,
    teamColor,
    scale,
    style,
    kitPattern,
    kitPatternColor,
  });

export const TorsoRenderer: PlayerTokenRenderer = ({
  label,
  teamColor,
  scale,
  style,
  kitPattern,
  kitPatternColor,
}) =>
  createTorsoPlayerToken({
    label,
    teamColor,
    scale,
    style,
    kitPattern,
    kitPatternColor,
  });

export const VisionV3Renderer: PlayerTokenRenderer = ({
  label,
  number,
  teamColor,
  scale,
  style,
  kitPattern,
  kitPatternColor,
  radius,
}) =>
  createVisionDiscToken({
    label,
    number,
    labelMode: /^\d+$/.test(label.trim()) ? "number" : "initials",
    teamSide: teamColor === "red" ? "RED" : "BLUE",
    teamColor,
    radiusPx: radius,
    scale,
    selected: false,
    pattern: mapKitPatternToVisionPattern(kitPattern),
    styleTokens: buildVisionDiscTokens({
      teamColor,
      style,
      kitPatternColor,
    }),
  });

export function resolvePlayerTokenRenderer(style: PlayerTokenStyle): PlayerTokenRenderer {
  if (style === "vision-v3") return VisionV3Renderer;
  if (style === "premium") return PremiumGlowRenderer;
  if (style === "torso") return TorsoRenderer;
  return ClassicRingRenderer;
}

export function sanitizePlayerTokenStyle(value: unknown): PlayerTokenStyle {
  if (value === "vision-v3" || value === "classic" || value === "premium" || value === "torso") return value;
  return "vision-v3";
}
