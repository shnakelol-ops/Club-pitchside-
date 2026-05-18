import { Graphics } from "pixi.js";

import {
  smoothMovementPathPoints,
  type MovementPathRecord,
} from "../../engine/shared/movementPaths";
import {
  normalizedToUnit,
  type NormalizedPoint,
  unitToNormalized,
} from "../../engine/shared/normalization";

type WorldPoint = { x: number; y: number };

export type SandboxViewportMapper = {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
  readonly fieldLeft: number;
  readonly fieldTop: number;
  readonly fieldWidth: number;
  readonly fieldHeight: number;
  normalizedToWorld: (point: NormalizedPoint) => WorldPoint;
  worldToNormalized: (point: WorldPoint) => NormalizedPoint;
};

export function createSandboxViewportMapper(
  width: number,
  height: number,
  padding = 24,
): SandboxViewportMapper {
  const safeWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
  const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
  const safePadding = Number.isFinite(padding) ? Math.max(0, padding) : 0;
  const fieldLeft = safePadding;
  const fieldTop = safePadding;
  const fieldWidth = Math.max(1, safeWidth - safePadding * 2);
  const fieldHeight = Math.max(1, safeHeight - safePadding * 2);
  return {
    width: safeWidth,
    height: safeHeight,
    padding: safePadding,
    fieldLeft,
    fieldTop,
    fieldWidth,
    fieldHeight,
    normalizedToWorld: (point) => ({
      x: fieldLeft + normalizedToUnit(point.x) * fieldWidth,
      y: fieldTop + normalizedToUnit(point.y) * fieldHeight,
    }),
    worldToNormalized: (point) => ({
      x: unitToNormalized((point.x - fieldLeft) / fieldWidth),
      y: unitToNormalized((point.y - fieldTop) / fieldHeight),
    }),
  };
}

export function drawSandboxPitch(graphic: Graphics, mapper: SandboxViewportMapper): void {
  const x = mapper.fieldLeft;
  const y = mapper.fieldTop;
  const w = mapper.fieldWidth;
  const h = mapper.fieldHeight;
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const centerRadius = Math.min(w, h) * 0.12;

  graphic.clear();
  graphic
    .roundRect(x, y, w, h, 12)
    .fill({ color: 0x114a32, alpha: 1 })
    .stroke({ color: 0xd9f99d, alpha: 0.8, width: 2, alignment: 0.5 });

  graphic
    .moveTo(centerX, y)
    .lineTo(centerX, y + h)
    .stroke({ color: 0xd9f99d, alpha: 0.65, width: 1.5, alignment: 0.5 });

  graphic
    .circle(centerX, centerY, centerRadius)
    .stroke({ color: 0xd9f99d, alpha: 0.65, width: 1.5, alignment: 0.5 });
}

function drawPathArrow(
  graphic: Graphics,
  points: readonly NormalizedPoint[],
  mapper: SandboxViewportMapper,
  color: number,
): void {
  const sampled = smoothMovementPathPoints(points, 6);
  const end = sampled[sampled.length - 1];
  const prev = sampled[sampled.length - 2];
  if (!end || !prev) return;
  const endWorld = mapper.normalizedToWorld(end);
  const prevWorld = mapper.normalizedToWorld(prev);
  const angle = Math.atan2(endWorld.y - prevWorld.y, endWorld.x - prevWorld.x);
  const arrowLength = 11;
  const arrowHalfWidth = 5;
  const backX = endWorld.x - Math.cos(angle) * arrowLength;
  const backY = endWorld.y - Math.sin(angle) * arrowLength;
  const nx = -Math.sin(angle) * arrowHalfWidth;
  const ny = Math.cos(angle) * arrowHalfWidth;
  graphic
    .poly([
      endWorld.x,
      endWorld.y,
      backX + nx,
      backY + ny,
      backX - nx,
      backY - ny,
    ])
    .fill({ color, alpha: 0.92 });
}

export function drawSandboxMovementPath(args: {
  graphic: Graphics;
  mapper: SandboxViewportMapper;
  path: Pick<MovementPathRecord, "entityType" | "points">;
  emphasized?: boolean;
}): void {
  const sampled = smoothMovementPathPoints(args.path.points, 8);
  if (sampled.length < 2) return;
  const color = args.path.entityType === "ball" ? 0xfef08a : 0x93c5fd;
  const alpha = args.emphasized ? 0.96 : 0.64;
  const width = args.emphasized ? 2.4 : 1.6;
  const worldPoints = sampled.map((point) => args.mapper.normalizedToWorld(point));
  for (let index = 1; index < worldPoints.length; index += 1) {
    const previous = worldPoints[index - 1];
    const current = worldPoints[index];
    if (!previous || !current) continue;
    args.graphic
      .moveTo(previous.x, previous.y)
      .lineTo(current.x, current.y)
      .stroke({
        color,
        alpha,
        width,
        cap: "round",
        join: "round",
        alignment: 0.5,
      });
  }
  drawPathArrow(args.graphic, sampled, args.mapper, color);
}

export function drawSandboxPathAnchors(args: {
  graphic: Graphics;
  mapper: SandboxViewportMapper;
  points: readonly NormalizedPoint[];
  color?: number;
}): void {
  for (const point of args.points) {
    const worldPoint = args.mapper.normalizedToWorld(point);
    args.graphic
      .circle(worldPoint.x, worldPoint.y, 4)
      .fill({ color: args.color ?? 0xffffff, alpha: 0.9 });
  }
}
