import type { TacticalKitPattern } from "./createTacticalPadLiteSurface";

function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function resolvePatternMarkColor(
  base: string,
  secondary: string,
  pattern: TacticalKitPattern | string,
): string {
  if (pattern === "gradient") return secondary;

  const baseLum = luminance(base);
  const secLum = luminance(secondary);
  const ratio = Math.max(baseLum, secLum) / (Math.min(baseLum, secLum) + 0.05);
  if (ratio >= 2.5) return secondary;

  return baseLum > 0.4 ? "#2a2a2a" : "#ffffff";
}

export function resolvePatternDetailTier(
  pattern: TacticalKitPattern | string,
  radius: number,
): 0 | 1 | 2 {
  if (pattern === "gradient" || pattern === "plain") return 0;

  if (pattern === "chestDash") {
    if (radius <= 12) return 0;
    if (radius <= 20) return 1;
    return 2;
  }

  if (pattern === "slash") {
    if (radius <= 12) return 0;
    if (radius <= 18) return 1;
    return 2;
  }

  if (pattern === "hoops" || pattern === "stripes") {
    if (radius <= 14) return 0;
    if (radius <= 22) return 1;
    return 2;
  }

  return 0;
}

export function resolveRingColor(ringHex: string | undefined): string {
  if (!ringHex || ringHex === "#000000") return "#2a2a2a";
  return ringHex;
}
