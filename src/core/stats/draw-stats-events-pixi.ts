import { Graphics } from "pixi.js";

import type { StatsLoggedEvent } from "../events/stats-logged-event";
import { boardNormToWorld } from "../coordinates/pitch-coordinates";
import {
  getStatsEventMarkerStyle,
  type StatsEventMarkerStyleOptions,
} from "./stats-event-marker-style";

type ParsedCssColor = { color: number; alpha: number };

export type DrawStatsEventsOptions = StatsEventMarkerStyleOptions & {
  worldToScreenScale?: number;
  minScreenRadiusPx?: number;
};

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
  if (!m) {
    if (s.startsWith("#")) {
      const hex = s.slice(1);
      if (hex.length === 6 && /^[0-9a-f]+$/i.test(hex)) {
        return { color: parseInt(hex, 16), alpha: 1 };
      }
      if (hex.length === 3 && /^[0-9a-f]{3}$/i.test(hex)) {
        return {
          color: rgbToPixiColor(
            parseInt(hex[0]! + hex[0]!, 16),
            parseInt(hex[1]! + hex[1]!, 16),
            parseInt(hex[2]! + hex[2]!, 16),
          ),
          alpha: 1,
        };
      }
    }
    return { color: 0xffffff, alpha: 1 };
  }

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

export function drawStatsEventsPixi(
  g: Graphics,
  events: readonly StatsLoggedEvent[],
  opts?: DrawStatsEventsOptions,
): void {
  g.clear();
  const scale = Math.max(opts?.worldToScreenScale ?? 1, 0.004);
  const minPx = opts?.minScreenRadiusPx ?? 3.35;
  const minWorldR = minPx / scale;

  for (const ev of events) {
    const st = getStatsEventMarkerStyle(ev);
    const p = boardNormToWorld(ev.nx, ev.ny);
    const effR = Math.max(st.radius, minWorldR);
    const fillC = parseCssColorForPixi(st.fill);
    const strokeC = parseCssColorForPixi(st.stroke);
    g.circle(p.x, p.y, effR)
      .fill({ color: fillC.color, alpha: fillC.alpha })
      .stroke({ width: st.strokeWidth, color: strokeC.color, alpha: strokeC.alpha });
  }
}
