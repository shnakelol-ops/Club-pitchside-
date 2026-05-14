import type { Container, Graphics } from "pixi.js";

import { createMicroAthleteToken, type MicroAthleteKitPattern, type MicroAthleteStyle } from "./createMicroAthleteToken";
import { createPremiumGlowPlayerToken } from "./createPremiumGlowPlayerToken";
import { createTorsoPlayerToken } from "./createTorsoPlayerToken";
import { createVisionV3PlayerToken } from "./createVisionV3PlayerToken";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";
import type { TokenConfig } from "./tokenConfig";

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
  ring?: string | number;
  numberColor?: string | number;
  glowOnSelect?: boolean;
  tokenConfig?: TokenConfig;
};

export type PlayerTokenRendererOutput = {
  token: Container;
  shadow: Graphics;
};

export type PlayerTokenRenderer = (input: PlayerTokenRendererInput) => PlayerTokenRendererOutput;

type LegacyKitPattern = "plain" | "hoops" | "slash" | "stripes";

function toLegacyPattern(pattern: MicroAthleteKitPattern): LegacyKitPattern {
  if (pattern === "hoops" || pattern === "slash" || pattern === "stripes") return pattern;
  return "plain";
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
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
  teamColor,
  scale,
  style,
  kitPattern,
  kitPatternColor,
  radius,
  ring,
  numberColor,
  glowOnSelect,
  tokenConfig,
}) =>
  createVisionV3PlayerToken({
    label,
    teamColor,
    radius: toNumber(radius, 3.66),
    scale: toNumber(scale, 1),
    style,
    kitPattern: toLegacyPattern(kitPattern),
    kitPatternColor,
    ring: typeof ring === "string" ? ring : (Number.isFinite(ring as number) ? Number(ring) : undefined),
    numberColor: typeof numberColor === "string" ? numberColor : (Number.isFinite(numberColor as number) ? Number(numberColor) : undefined),
    glowOnSelect,
    tokenConfig,
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
