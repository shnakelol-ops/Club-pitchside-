import { Graphics } from "pixi.js";

import type { MatchEvent } from "./stats-event-model";
import { getStatsMarkerStyle } from "./stats-marker-style";
import { boardNormToWorld } from "../coordinates/pitch-coordinates";

type ParsedCssColor = { color: number; alpha: number };

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 1));
}

function rgbToPixiColor(r: number, g: number, b: number): number {
  return (clampByte(r) << 16) | (clampByte(g) << 8) | clampByte(b);
}

function parseCssColorForPixi(css: string): ParsedCssColor {
  const s = css.trim();
  const m = s.match(/^rgba?\(\s*(.+?)\s*\)$/i);
  if (!m) return { color: 0xffffff, alpha: 1 };

  const commaSegs = m[1]!.split(",").map((x) => x.trim());
  if (commaSegs.length === 4) {
    return {
      color: rgbToPixiColor(
        parseFloat(commaSegs[0]!),
        parseFloat(commaSegs[1]!),
        parseFloat(commaSegs[2]!),
      ),
      alpha: clamp01(parseFloat(commaSegs[3]!)),
    };
  }
  if (commaSegs.length === 3) {
    return {
      color: rgbToPixiColor(
        parseFloat(commaSegs[0]!),
        parseFloat(commaSegs[1]!),
        parseFloat(commaSegs[2]!),
      ),
      alpha: 1,
    };
  }
  return { color: 0xffffff, alpha: 1 };
}

export function drawStatsMarkers(
  g: Graphics,
  events: readonly MatchEvent[],
  opts?: { worldToScreenScale?: number; minScreenRadiusPx?: number },
): void {
  g.clear();

  const worldToScreenScale = Math.max(opts?.worldToScreenScale ?? 1, 0.004);
  const minPx = opts?.minScreenRadiusPx ?? 4;
  const minWorldRadius = minPx / worldToScreenScale;
  const minRingWidth = 1 / worldToScreenScale;
  const minHaloRadius = 2 / worldToScreenScale;

  for (const event of events) {
    const style = getStatsMarkerStyle(event);
    const worldPoint = boardNormToWorld(event.nx, event.ny);
    const radius = Math.max(style.radius, minWorldRadius);
    const fill = parseCssColorForPixi(style.fill);
    const stroke = parseCssColorForPixi(style.stroke);
    const ringWidth = Math.max(style.strokeWidth, minRingWidth);
    const haloRadius = radius + minHaloRadius;

    // Subtle dark halo improves readability against bright turf stripes.
    g.circle(worldPoint.x, worldPoint.y, haloRadius).fill({
      color: 0x020617,
      alpha: 0.22,
    });

    g.circle(worldPoint.x, worldPoint.y, radius)
      .fill({ color: fill.color, alpha: fill.alpha })
      .stroke({
        width: ringWidth,
        color: stroke.color,
        alpha: stroke.alpha,
      });

    // Bright center dot helps identify stacked/overlapping markers quickly.
    g.circle(worldPoint.x, worldPoint.y, Math.max(radius * 0.32, 1.25 / worldToScreenScale))
      .fill({ color: 0xffffff, alpha: 0.9 });
  }
}
