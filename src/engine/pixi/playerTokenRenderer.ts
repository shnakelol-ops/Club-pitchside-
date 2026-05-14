import type { Container, Graphics } from "pixi.js";

import { createMicroAthleteToken, type MicroAthleteKitPattern, type MicroAthleteStyle } from "./createMicroAthleteToken";
import { createPremiumGlowPlayerToken } from "./createPremiumGlowPlayerToken";
import { createTorsoPlayerToken } from "./createTorsoPlayerToken";
import { createVisionV3PlayerToken } from "./createVisionV3PlayerToken";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";
import type { TokenConfig, TokenNumberColorOverride, TokenRingStyle } from "./tokenConfig";

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
  ring?: TokenRingStyle;
  numberColor?: TokenNumberColorOverride;
  glowOnSelect?: boolean;
  tokenConfig?: Partial<TokenConfig>;
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
  ring,
  numberColor,
  glowOnSelect,
  tokenConfig,
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
    ring,
    numberColor,
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
