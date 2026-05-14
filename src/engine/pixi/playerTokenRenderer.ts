import { Graphics, type Container } from "pixi.js";

import { createMicroAthleteToken, type MicroAthleteKitPattern, type MicroAthleteStyle } from "./createMicroAthleteToken";
import { createPremiumGlowPlayerToken } from "./createPremiumGlowPlayerToken";
import { createTorsoPlayerToken } from "./createTorsoPlayerToken";
import { createVisionV3PlayerToken } from "./createVisionV3PlayerToken";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";
import type { TokenConfig } from "./tokenConfig";

export type PlayerTokenStyle = "vision-v3" | "classic" | "premium" | "torso";
export type PlayerTokenPattern = MicroAthleteKitPattern | "chestDash" | "gradient";

export type PlayerTokenRendererInput = {
  label: string;
  number: number;
  teamColor: PremiumPlayerTokenColor;
  scale: number;
  style: Partial<MicroAthleteStyle>;
  kitPattern: PlayerTokenPattern;
  kitPatternColor: number;
  ring?: string;
  numberColor?: string;
  glowOnSelect?: boolean;
  tokenConfig?: TokenConfig;
  radius: number;
};

export type PlayerTokenRendererOutput = {
  token: Container;
  shadow: Graphics;
};

export type PlayerTokenRenderer = (input: PlayerTokenRendererInput) => PlayerTokenRendererOutput;

function toLegacyPattern(pattern: PlayerTokenPattern): MicroAthleteKitPattern {
  if (pattern === "chestDash") return "hoops";
  if (pattern === "gradient") return "plain";
  return pattern;
}

function numericToHex(color: number | undefined, fallback = "#2a2a2a"): string {
  if (!Number.isFinite(color)) return fallback;
  const safe = Math.max(0, Math.min(0xffffff, Math.floor(Number(color))));
  return `#${safe.toString(16).padStart(6, "0")}`;
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
    kitPattern: toLegacyPattern(kitPattern),
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
    kitPattern: toLegacyPattern(kitPattern),
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
    kitPattern: toLegacyPattern(kitPattern),
    kitPatternColor,
  });

export const VisionV3Renderer: PlayerTokenRenderer = ({
  label,
  style,
  kitPattern,
  kitPatternColor,
  ring,
  numberColor,
  glowOnSelect,
  tokenConfig,
  radius,
}) => {
  const baseColorHex = numericToHex(style.primaryColor, "#f5c518");
  const secondaryHex = numericToHex(kitPatternColor, "#2a2a2a");
  const safeToken = createVisionV3PlayerToken({
    radius,
    kitBaseColor: baseColorHex,
    kitPatternColor: secondaryHex,
    kitPattern,
    ring,
    numberColor,
    glowOnSelect,
    number: label,
    labelMode: /^\d+$/.test(label.trim()) ? "number" : "initials",
    tokenConfig,
  });
  const fallbackShadow = new Graphics();
  const firstChild = safeToken.children[0];
  const shadow = firstChild instanceof Graphics ? firstChild : fallbackShadow;
  return { token: safeToken, shadow };
};

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
