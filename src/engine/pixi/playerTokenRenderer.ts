import type { Container, Graphics } from "pixi.js";

import { createMicroAthleteToken, type MicroAthleteKitPattern, type MicroAthleteStyle } from "./createMicroAthleteToken";
import { createJerseyToken } from "./createJerseyToken";
import { createPremiumGlowPlayerToken } from "./createPremiumGlowPlayerToken";
import { createTorsoPlayerToken } from "./createTorsoPlayerToken";
import { createVisionV3PlayerToken } from "./createVisionV3PlayerToken";
import type { CleanTokenRendererInput } from "./createCleanTokenRenderers";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";

export type PlayerTokenStyle = "vision-v3" | "classic" | "premium" | "torso" | "jersey-v2";

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

const DEFAULT_CLEAN_BASE_BY_TEAM: Record<PremiumPlayerTokenColor, number> = {
  blue: 0x2563eb,
  red: 0xdc2626,
  yellow: 0xfacc15,
  black: 0x1f2937,
};

export const JerseyV2Renderer: PlayerTokenRenderer = ({
  label,
  number,
  teamColor,
  scale,
  style,
  radius,
}) => {
  const cleanInput: CleanTokenRendererInput = {
    label,
    number,
    scale,
    radius,
    baseColor: style.primaryColor ?? DEFAULT_CLEAN_BASE_BY_TEAM[teamColor],
    outlineColor: style.outlineColor,
  };
  return createJerseyToken(cleanInput);
};

export function resolvePlayerTokenRenderer(style: PlayerTokenStyle): PlayerTokenRenderer {
  if (style === "vision-v3") return VisionV3Renderer;
  if (style === "premium") return PremiumGlowRenderer;
  if (style === "torso") return TorsoRenderer;
  if (style === "jersey-v2") return JerseyV2Renderer;
  return ClassicRingRenderer;
}

export function sanitizePlayerTokenStyle(value: unknown): PlayerTokenStyle {
  if (
    value === "vision-v3" ||
    value === "classic" ||
    value === "premium" ||
    value === "torso" ||
    value === "jersey-v2"
  ) {
    return value;
  }
  return "vision-v3";
}
