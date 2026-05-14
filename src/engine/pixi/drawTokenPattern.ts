import type { Graphics } from "pixi.js";

import type { TokenPatternType } from "./tokenConfig";
import { mixColor, type TokenPatternLodTier } from "./tokenPatternContrast";

function isV7(graphics: Graphics): boolean {
  return typeof (graphics as Graphics & { stroke?: unknown }).stroke !== "function";
}

function strokePath(
  graphics: Graphics,
  color: number,
  width: number,
  alpha: number,
): void {
  if (isV7(graphics)) {
    const g = graphics as Graphics & {
      lineStyle: (lineWidth: number, lineColor: number, lineAlpha?: number) => Graphics;
    };
    g.lineStyle(width, color, alpha);
    return;
  }
  graphics.stroke({ color, width, alpha, cap: "round", join: "round" });
}

function fillCircle(graphics: Graphics, color: number, alpha: number, radius: number): void {
  if (isV7(graphics)) {
    const g = graphics as Graphics & {
      beginFill: (fillColor: number, fillAlpha?: number) => Graphics;
      drawCircle: (x: number, y: number, r: number) => Graphics;
      endFill: () => Graphics;
    };
    g.beginFill(color, alpha);
    g.drawCircle(0, 0, radius);
    g.endFill();
    return;
  }
  graphics.circle(0, 0, radius).fill({ color, alpha });
}

export type DrawTokenPatternOptions = {
  target: Graphics;
  pattern: TokenPatternType;
  patternColor: number;
  radius: number;
  lodTier: TokenPatternLodTier;
  alpha?: number;
};

export function drawTokenPattern({
  target,
  pattern,
  patternColor,
  radius,
  lodTier,
  alpha = 0.6,
}: DrawTokenPatternOptions): void {
  if (pattern === "plain") return;
  if (lodTier === "tiny" && pattern !== "gradient") return;

  if (pattern === "gradient") {
    const stops = lodTier === "small" ? 5 : 7;
    const outer = Math.max(0.2, radius);
    for (let index = 0; index < stops; index += 1) {
      const t = (index + 1) / stops;
      const color = mixColor(patternColor, 0x0b1220, t * 0.2);
      fillCircle(target, color, 0.05 + t * 0.09, outer * (1 - t * 0.11));
    }
    return;
  }

  const strokeWidth = Math.max(
    0.34,
    radius * (lodTier === "tiny" ? 0.3 : lodTier === "small" ? 0.24 : 0.2),
  );

  if (pattern === "hoops") {
    const yOffsets = [-radius * 0.32, radius * 0.05, radius * 0.42];
    const marks = lodTier === "regular" ? yOffsets : [yOffsets[0] ?? 0, yOffsets[2] ?? 0];
    for (const y of marks) {
      target.moveTo(-radius * 0.68, y).lineTo(radius * 0.68, y);
    }
    strokePath(target, patternColor, strokeWidth, alpha);
    return;
  }

  if (pattern === "stripes") {
    const xOffsets = [-radius * 0.36, 0, radius * 0.36];
    const marks = lodTier === "regular" ? xOffsets : [xOffsets[0] ?? 0, xOffsets[2] ?? 0];
    for (const x of marks) {
      target.moveTo(x, -radius * 0.68).lineTo(x, radius * 0.68);
    }
    strokePath(target, patternColor, strokeWidth, alpha);
    return;
  }

  if (pattern === "chestDash") {
    target.moveTo(-radius * 0.66, radius * 0.08).lineTo(radius * 0.66, radius * 0.08);
    strokePath(target, patternColor, strokeWidth * 1.06, alpha);
    return;
  }

  target.moveTo(-radius * 0.62, radius * 0.54).lineTo(radius * 0.62, -radius * 0.54);
  strokePath(target, patternColor, strokeWidth * 1.08, alpha);
}
