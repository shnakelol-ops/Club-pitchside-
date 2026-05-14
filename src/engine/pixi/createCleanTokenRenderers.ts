import type { Container, Graphics } from "pixi.js";

export type CleanTokenRendererInput = {
  label: string;
  number: number;
  radius: number;
  scale: number;
  baseColor: number;
  outlineColor?: number;
};

export type CleanTokenRendererOutput = {
  token: Container;
  shadow: Graphics;
};
