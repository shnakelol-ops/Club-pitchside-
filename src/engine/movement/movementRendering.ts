import { Graphics } from "pixi.js";

import type { WorldViewportMapper } from "../pixi/createWorldViewport";
import { type NormalizedPoint } from "../shared/normalization";
import { smoothMovementPathPoints } from "./movementInterpolation";
import { type MovementPathRecord } from "./movementTypes";

export type MovementPathRenderOptions = {
  dashLength: number;
  dashGap: number;
  strokeWidth: number;
  arrowLength: number;
  arrowHalfWidth: number;
  defaultBallColor: number;
  defaultPlayerColor: number;
};

export const DEFAULT_MOVEMENT_PATH_RENDER_OPTIONS: MovementPathRenderOptions = {
  dashLength: 2.4,
  dashGap: 1.25,
  strokeWidth: 0.42,
  arrowLength: 2.1,
  arrowHalfWidth: 1.05,
  defaultBallColor: 0xf8fafc,
  defaultPlayerColor: 0x7dd3fc,
};

function getMovementPathColor(path: Pick<MovementPathRecord, "entityType" | "metadata">, options: MovementPathRenderOptions): number {
  const metadataColor = path.metadata?.color;
  if (typeof metadataColor === "number" && Number.isFinite(metadataColor)) {
    return Math.max(0, Math.floor(metadataColor));
  }
  return path.entityType === "ball" ? options.defaultBallColor : options.defaultPlayerColor;
}

function drawDashedWorldPath(args: {
  graphic: Graphics;
  mapper: Pick<WorldViewportMapper, "normalizedToWorld">;
  points: readonly NormalizedPoint[];
  color: number;
  alpha: number;
  options: MovementPathRenderOptions;
}): void {
  if (args.points.length < 2) return;
  const worldPoints = smoothMovementPathPoints(args.points).map((point) => args.mapper.normalizedToWorld(point));
  let dashRemaining = args.options.dashLength;
  let gapRemaining = 0;
  for (let index = 1; index < worldPoints.length; index += 1) {
    const previous = worldPoints[index - 1];
    const current = worldPoints[index];
    if (!previous || !current) continue;
    const segmentDx = current.x - previous.x;
    const segmentDy = current.y - previous.y;
    const segmentLength = Math.hypot(segmentDx, segmentDy);
    if (segmentLength <= 0) continue;
    let consumed = 0;
    while (consumed < segmentLength) {
      const remainingSegment = segmentLength - consumed;
      if (gapRemaining > 0) {
        const gapStep = Math.min(gapRemaining, remainingSegment);
        consumed += gapStep;
        gapRemaining -= gapStep;
        if (gapRemaining <= 0) {
          dashRemaining = args.options.dashLength;
        }
        continue;
      }
      const dashStep = Math.min(dashRemaining, remainingSegment);
      const startRatio = consumed / segmentLength;
      const endRatio = (consumed + dashStep) / segmentLength;
      args.graphic
        .moveTo(previous.x + segmentDx * startRatio, previous.y + segmentDy * startRatio)
        .lineTo(previous.x + segmentDx * endRatio, previous.y + segmentDy * endRatio)
        .stroke({
          color: args.color,
          alpha: args.alpha,
          width: args.options.strokeWidth,
          cap: "round",
          join: "round",
          alignment: 0.5,
        });
      consumed += dashStep;
      dashRemaining -= dashStep;
      if (dashRemaining <= 0) {
        gapRemaining = args.options.dashGap;
      }
    }
  }
}

function drawMovementPathArrowhead(args: {
  graphic: Graphics;
  mapper: Pick<WorldViewportMapper, "normalizedToWorld">;
  points: readonly NormalizedPoint[];
  color: number;
  alpha: number;
  options: MovementPathRenderOptions;
}): void {
  if (args.points.length < 2) return;
  const smoothed = smoothMovementPathPoints(args.points);
  const end = smoothed[smoothed.length - 1];
  if (!end) return;
  let previous = smoothed[smoothed.length - 2];
  for (let index = smoothed.length - 2; index >= 0; index -= 1) {
    const candidate = smoothed[index];
    if (!candidate) continue;
    if (Math.hypot(end.x - candidate.x, end.y - candidate.y) >= 0.1) {
      previous = candidate;
      break;
    }
  }
  if (!previous) return;
  const endWorld = args.mapper.normalizedToWorld(end);
  const previousWorld = args.mapper.normalizedToWorld(previous);
  const angle = Math.atan2(endWorld.y - previousWorld.y, endWorld.x - previousWorld.x);
  const backX = endWorld.x - Math.cos(angle) * args.options.arrowLength;
  const backY = endWorld.y - Math.sin(angle) * args.options.arrowLength;
  const normalX = -Math.sin(angle) * args.options.arrowHalfWidth;
  const normalY = Math.cos(angle) * args.options.arrowHalfWidth;
  args.graphic
    .poly([
      endWorld.x,
      endWorld.y,
      backX + normalX,
      backY + normalY,
      backX - normalX,
      backY - normalY,
    ])
    .fill({ color: args.color, alpha: args.alpha });
}

export function drawMovementPathRecord(args: {
  graphic: Graphics;
  mapper: Pick<WorldViewportMapper, "normalizedToWorld">;
  path: MovementPathRecord;
  alpha?: number;
  options?: MovementPathRenderOptions;
}): void {
  // Pixi-only renderer for tactical guide paths. It is intentionally stateless
  // so future shadow-run or synchronized-run visuals can be layered by passing
  // metadata-derived colors/alpha without touching player token rendering.
  if (args.path.points.length < 2) return;
  const options = args.options ?? DEFAULT_MOVEMENT_PATH_RENDER_OPTIONS;
  const alpha = args.alpha ?? 0.72;
  const color = getMovementPathColor(args.path, options);
  drawDashedWorldPath({
    graphic: args.graphic,
    mapper: args.mapper,
    points: args.path.points,
    color,
    alpha,
    options,
  });
  drawMovementPathArrowhead({
    graphic: args.graphic,
    mapper: args.mapper,
    points: args.path.points,
    color,
    alpha: Math.min(0.9, alpha + 0.12),
    options,
  });
}
