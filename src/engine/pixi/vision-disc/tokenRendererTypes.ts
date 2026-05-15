import type { Container, Graphics } from "pixi.js";

export type VisionDiscKitPattern = "plain" | "hoops" | "stripes" | "slash" | "chestDash";

export type VisionDiscTokenInput = {
  label: string;
  radius: number;
  scale?: number;
  baseColor: number;
  patternColor: number;
  numberColor?: number;
  outlineColor?: number;
  pattern: VisionDiscKitPattern;
  selected?: boolean;
};

export type VisionDiscTokenOutput = {
  token: Container;
  shadow: Graphics;
};

export type VisionDiscTokenRenderer = (input: VisionDiscTokenInput) => VisionDiscTokenOutput;
