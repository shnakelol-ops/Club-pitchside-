import type { Container, Graphics } from "pixi.js";

import { createPhosphorToken, createProceduralPixiToken } from "./createCleanTokenRenderers";
import {
  createVisionV3PlayerToken,
  type VisionV3KitPattern,
  type VisionV3PlayerTokenStyle,
} from "./createVisionV3PlayerToken";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";

export type PlayerTokenStyle = "vision-v3" | "phosphor" | "procedural-pixi";
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

export function resolvePlayerTokenRenderer(style: PlayerTokenStyle): PlayerTokenRenderer {
  if (style === "phosphor") return PhosphorRenderer;
  if (style === "procedural-pixi") return ProceduralPixiRenderer;
  if (style === "vision-v3") return VisionV3Renderer;
  return VisionV3Renderer;
}

export function sanitizePlayerTokenStyle(value: unknown): PlayerTokenStyle {
  if (value === "vision-v3" || value === "phosphor" || value === "procedural-pixi") return value;
  return "vision-v3";
}
