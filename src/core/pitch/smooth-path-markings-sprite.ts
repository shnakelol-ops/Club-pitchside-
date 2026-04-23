import { Sprite, Texture } from "pixi.js";

import type { PitchMarking } from "../pitch/pitch-config";
import { BOARD_PITCH_VIEWBOX } from "../pitch/pitch-space";

function parseLineDash(value?: string): number[] {
  if (!value || !value.trim()) return [];
  return value
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite);
}

export function createSmoothRasterPathMarkingsSprite(
  markings: readonly PitchMarking[],
  options: {
    pathPredicate: (marking: PitchMarking) => boolean;
    resolutionScale: number;
  },
): Sprite {
  const scale = Math.max(4, Math.min(16, options.resolutionScale));
  const { w, h } = BOARD_PITCH_VIEWBOX;
  const paths = markings.filter(
    (marking): marking is Extract<PitchMarking, { kind: "path" }> =>
      marking.kind === "path" && options.pathPredicate(marking),
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    const empty = new Sprite(Texture.EMPTY);
    empty.width = w;
    empty.height = h;
    return empty;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const path of paths) {
    if (!path.stroke || path.stroke === "none" || (path.strokeWidth ?? 0) <= 0) {
      continue;
    }
    try {
      const p = new Path2D(path.d);
      ctx.strokeStyle = path.stroke;
      ctx.lineWidth = path.strokeWidth;
      const dash = parseLineDash(path.strokeDasharray);
      ctx.setLineDash(dash.length ? dash : []);
      ctx.globalAlpha = path.opacity ?? 1;
      ctx.stroke(p);
    } catch {
      // Invalid path data; skip that marking.
    }
  }

  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const texture = Texture.from(canvas);
  texture.source.style.scaleMode = "linear";
  const sprite = new Sprite(texture);
  sprite.label = "smoothRasterPathMarkings";
  sprite.width = w;
  sprite.height = h;
  return sprite;
}

export function isGaelicSkipLineGlowPath(marking: PitchMarking): boolean {
  return marking.kind === "path" && marking.skipLineGlow === true;
}

export function smoothPathMarkingsResolutionScale(): number {
  if (typeof window === "undefined") return 8;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(16, Math.max(6, Math.ceil(dpr * 6)));
}
