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
  const minPx = opts?.minScreenRadiusPx ?? 3.2;
  const minWorldRadius = minPx / worldToScreenScale;

  for (const event of events) {
    const style = getStatsMarkerStyle(event);
    const worldPoint = boardNormToWorld(event.nx, event.ny);
    const radius = Math.max(style.radius, minWorldRadius);
    const fill = parseCssColorForPixi(style.fill);
    const stroke = parseCssColorForPixi(style.stroke);

    g.circle(worldPoint.x, worldPoint.y, radius)
      .fill({ color: fill.color, alpha: fill.alpha })
      .stroke({
        width: style.strokeWidth,
        color: stroke.color,
        alpha: stroke.alpha,
      });
  }
}
