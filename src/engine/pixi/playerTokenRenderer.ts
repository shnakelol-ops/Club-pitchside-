import type { Container, Graphics } from "pixi.js";

import {
  createCleanTacticalPlayerToken,
  type CleanTacticalKitPattern,
  type CleanTacticalPlayerTokenStyle,
} from "./createCleanTacticalPlayerToken";
import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";

export type PlayerTokenStyle = "pixi" | "phosphor";
export type PlayerTokenKitPattern = CleanTacticalKitPattern;

export type PlayerTokenRendererInput = {
  label: string;
  number: number;
  teamColor: PremiumPlayerTokenColor;
  scale: number;
  style: Partial<CleanTacticalPlayerTokenStyle>;
  kitPattern: PlayerTokenKitPattern;
  kitPatternColor: number;
  radius: number;
};

export type PlayerTokenRendererOutput = {
  token: Container;
  shadow: Graphics;
};

export type PlayerTokenRenderer = (input: PlayerTokenRendererInput) => PlayerTokenRendererOutput;

export const ProceduralPixiRenderer: PlayerTokenRenderer = ({
  label,
  style,
  kitPattern,
  kitPatternColor,
  radius,
}) =>
  createCleanTacticalPlayerToken({
    label,
    style,
    radius,
    kitPattern,
    kitPatternColor,
    variant: "pixi",
  });

export const PhosphorRenderer: PlayerTokenRenderer = ({
  label,
  style,
  kitPattern,
  kitPatternColor,
  radius,
}) =>
  createCleanTacticalPlayerToken({
    label,
    style,
    radius,
    kitPattern,
    kitPatternColor,
    variant: "phosphor",
  });

export function resolvePlayerTokenRenderer(style: PlayerTokenStyle): PlayerTokenRenderer {
  if (style === "phosphor") return PhosphorRenderer;
  return ProceduralPixiRenderer;
}

export function sanitizePlayerTokenStyle(value: unknown): PlayerTokenStyle {
  if (value === "pixi" || value === "phosphor") return value;
  return "pixi";
}
