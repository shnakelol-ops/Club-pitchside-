import type { Container, Graphics } from "pixi.js";

import { createMicroAthleteToken, type MicroAthleteKitPattern, type MicroAthleteStyle } from "./createMicroAthleteToken";
import { createPremiumGlowPlayerToken } from "./createPremiumGlowPlayerToken";
import { createTorsoPlayerToken } from "./createTorsoPlayerToken";
import { createPhosphorToken, createProceduralPixiToken } from "./vision-disc/createCleanTokenRenderers";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";

export type PlayerTokenStyle = "phosphor" | "pixi" | "classic" | "premium" | "torso";

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

export function resolvePlayerTokenRenderer(style: PlayerTokenStyle): PlayerTokenRenderer {
  if (style === "pixi") return ProceduralPixiRenderer;
  if (style === "phosphor") return PhosphorRenderer;
  if (style === "premium") return PremiumGlowRenderer;
  if (style === "torso") return TorsoRenderer;
  return ClassicRingRenderer;
}

export function sanitizePlayerTokenStyle(value: unknown): PlayerTokenStyle {
  if (value === "phosphor" || value === "pixi" || value === "classic" || value === "premium" || value === "torso") return value;
  return "phosphor";
}
