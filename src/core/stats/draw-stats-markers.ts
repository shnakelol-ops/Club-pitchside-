import { Container, Graphics, Text, TextStyle } from "pixi.js";

import type { MatchEvent } from "./stats-event-model";
import { getStatsMarkerStyle } from "./stats-marker-style";
import { boardNormToWorld } from "../coordinates/pitch-coordinates";

type ParsedCssColor = { color: number; alpha: number };
type RenderableMatchEvent = MatchEvent & {
  playerName?: string;
  team?: "HOME" | "AWAY";
};

const MARKER_INITIALS_STYLE = new TextStyle({
  fill: 0xffffff,
  fontSize: 9.5,
  fontWeight: "800",
  align: "center",
  letterSpacing: 0.2,
  stroke: { color: 0x07111f, width: 2.5 },
});

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
  events: readonly RenderableMatchEvent[],
  opts?: { worldToScreenScale?: number; minScreenRadiusPx?: number; showPlayerInitials?: boolean },
): void {
  g.clear();
  const oldChildren = g.removeChildren();
  for (const child of oldChildren) {
    child.destroy({ children: true });
  }

  const worldToScreenScale = Math.max(opts?.worldToScreenScale ?? 1, 0.004);
  const minPx = opts?.minScreenRadiusPx ?? 4;
  const minWorldRadius = minPx / worldToScreenScale;
  const minRingWidth = 1 / worldToScreenScale;
  const minHaloRadius = 2 / worldToScreenScale;
  const minTwoPointOuterRingWidth = 1.15 / worldToScreenScale;
  const showPlayerInitials = opts?.showPlayerInitials ?? true;

  for (const event of events) {
    const style = getStatsMarkerStyle(event);
    const worldPoint = boardNormToWorld(event.nx, event.ny);
    const isTwoPointer = event.kind === "TWO_POINTER";
    const styleRadius = isTwoPointer ? style.radius * 1.06 : style.radius;
    const radius = Math.max(styleRadius, minWorldRadius);
    const fill = parseCssColorForPixi(style.fill);
    const stroke = parseCssColorForPixi(style.stroke);
    const ringWidth = Math.max(style.strokeWidth, minRingWidth);
    const haloRadius = radius + minHaloRadius + (isTwoPointer ? 0.42 : 0);

    const markerContainer = new Container();
    markerContainer.position.set(worldPoint.x, worldPoint.y);
    const markerGraphic = new Graphics();
    markerContainer.addChild(markerGraphic);

    // Subtle dark halo improves readability against bright turf stripes.
    markerGraphic.circle(0, 0, haloRadius).fill({
      color: 0x020617,
      alpha: isTwoPointer ? 0.26 : 0.22,
    });

    if (isTwoPointer) {
      // Give 2PT a subtle mint aura to increase priority without GOAL-level intensity.
      markerGraphic.circle(0, 0, haloRadius + 0.8).fill({
        color: 0x6ee7b7,
        alpha: 0.13,
      });
    }

    markerGraphic.circle(0, 0, radius)
      .fill({ color: fill.color, alpha: fill.alpha })
      .stroke({
        width: ringWidth,
        color: stroke.color,
        alpha: stroke.alpha,
      });

    if (isTwoPointer) {
      markerGraphic.circle(0, 0, radius + 0.62).stroke({
        width: Math.max(1.02, minTwoPointOuterRingWidth),
        color: 0xecfdf5,
        alpha: 0.92,
      });
    }

    // Bright center dot helps identify stacked/overlapping markers quickly.
    markerGraphic.circle(0, 0, Math.max(radius * 0.32, 1.25 / worldToScreenScale))
      .fill({ color: 0xffffff, alpha: 0.9 });

    const shouldShowInitials =
      showPlayerInitials &&
      typeof event.playerName === "string" &&
      event.playerName.trim().length > 0 &&
      (event.team == null || event.team === "HOME");
    if (shouldShowInitials) {
      const initialsWords = event.playerName
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const initials =
        initialsWords.length >= 2
          ? `${initialsWords[0]![0] ?? ""}${initialsWords[1]![0] ?? ""}`.toUpperCase().slice(0, 2)
          : (initialsWords[0]?.slice(0, 2) ?? "").toUpperCase();
      if (initials.length > 0) {
        const initialsText = new Text({ text: initials, style: MARKER_INITIALS_STYLE });
        initialsText.anchor.set(0.5);
        initialsText.x = 0;
        initialsText.y = 0;
        markerContainer.addChild(initialsText);
      }
    }

    g.addChild(markerContainer);
  }
}
