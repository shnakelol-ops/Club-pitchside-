import type { Graphics } from "pixi.js";
import type { TokenPattern } from "./tokenConfig";

const LOD_SKIP = 14;
const LOD_SIMPLE = 22;

export type PatternLOD = 0 | 1 | 2;

export function resolvePatternLOD(radius: number): PatternLOD {
  if (radius <= LOD_SKIP) return 0;
  if (radius <= LOD_SIMPLE) return 1;
  return 2;
}

function isV7(g: Graphics): boolean {
  return typeof (g as any).beginFill === "function";
}

function fillRect(g: Graphics, color: number, alpha: number, x: number, y: number, w: number, h: number): void {
  if (isV7(g)) {
    (g as any).beginFill(color, alpha);
    (g as any).drawRect(x, y, w, h);
    (g as any).endFill();
  } else {
    (g as any).rect(x, y, w, h).fill({ color, alpha });
  }
}

function fillPoly(g: Graphics, color: number, alpha: number, points: number[]): void {
  if (isV7(g)) {
    (g as any).beginFill(color, alpha);
    (g as any).drawPolygon(points);
    (g as any).endFill();
  } else {
    (g as any).poly(points).fill({ color, alpha });
  }
}

export function hexToPixi(hex: string): number {
  return parseInt(hex.replace("#", "0x"), 16);
}

export interface DrawPatternOptions {
  g: Graphics;
  pattern: TokenPattern;
  secondary: string;
  cx: number;
  cy: number;
  r: number;
  lod: PatternLOD;
}

export function drawTokenPattern(opts: DrawPatternOptions): void {
  const { g, pattern, secondary, cx, cy, r, lod } = opts;
  if (lod === 0) return;
  if (pattern === "plain" || pattern === "gradient" || pattern === "solid") return;

  const col = hexToPixi(secondary);
  const alpha = 1;

  switch (pattern) {
    case "hoops": drawHoops(g, col, alpha, cx, cy, r, lod); break;
    case "stripes": drawStripes(g, col, alpha, cx, cy, r, lod); break;
    case "slash": drawSlash(g, col, alpha, cx, cy, r, lod); break;
    case "chestDash": drawChestDash(g, col, alpha, cx, cy, r, lod); break;
    default: break;
  }
}

function drawHoops(g: Graphics, col: number, alpha: number, cx: number, cy: number, r: number, lod: PatternLOD): void {
  const d = r * 2;
  const bh = d / 7;
  const top = cy - r;
  if (lod === 1) return fillRect(g, col, alpha, cx - r, cy - bh / 2, d, bh);
  for (const yPos of [top + bh * 0.5, top + bh * 2.5, top + bh * 4.5]) fillRect(g, col, alpha, cx - r, yPos, d, bh);
}

function drawStripes(g: Graphics, col: number, alpha: number, cx: number, cy: number, r: number, lod: PatternLOD): void {
  const d = r * 2;
  const sw = d / 7;
  const left = cx - r;
  if (lod === 1) return fillRect(g, col, alpha, cx - sw / 2, cy - r, sw, d);
  for (const xPos of [left + sw * 0.5, left + sw * 2.5, left + sw * 4.5]) fillRect(g, col, alpha, xPos, cy - r, sw, d);
}

function drawSlash(g: Graphics, col: number, alpha: number, cx: number, cy: number, r: number, lod: PatternLOD): void {
  const d = r * 2;
  const sashW = lod === 1 ? d * 0.55 : d * 0.42;
  const halfSash = sashW / 2;
  const angle = -38 * (Math.PI / 180);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const len = d * 1.6;
  const corners = [[-len / 2, -halfSash],[len / 2, -halfSash],[len / 2, halfSash],[-len / 2, halfSash]];
  const rotated = corners.flatMap(([x,y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos]);
  fillPoly(g, col, alpha, rotated);
}

function drawChestDash(g: Graphics, col: number, alpha: number, cx: number, cy: number, r: number, lod: PatternLOD): void {
  const d = r * 2;
  const bh = lod === 1 ? d * 0.48 : d * 0.38;
  fillRect(g, col, alpha, cx - r, cy - bh / 2, d, bh);
}
