import { type NormalizedPoint } from "../shared/normalization";
import { interpolateMovementPathPoint } from "./movementInterpolation";
import {
  cloneMovementPathPoints,
  type MovementPathEntityType,
  type MovementPathRecord,
} from "./movementTypes";

export type MovementPlaybackDebugEvent = {
  entityId: string;
  entityType: MovementPathEntityType;
  phaseIndex: number;
  pointCount: number;
  progress: number;
  source: "movement-path" | "fallback-path";
};

export type MovementPlaybackDebugSink = (event: MovementPlaybackDebugEvent) => void;

export function findMovementPath(
  paths: readonly MovementPathRecord[],
  entityType: MovementPathEntityType,
  entityId: string,
  phaseIndex: number,
): MovementPathRecord | null {
  const normalizedPhaseIndex = Math.max(0, Math.floor(phaseIndex));
  return (
    paths.find(
      (path) =>
        path.entityType === entityType &&
        path.entityId === entityId &&
        path.phaseIndex === normalizedPhaseIndex,
    ) ?? null
  );
}

export function resolveMovementPathPoints(args: {
  paths: readonly MovementPathRecord[];
  entityType: MovementPathEntityType;
  entityId: string;
  phaseIndex: number;
  fromPoint: NormalizedPoint;
  toPoint: NormalizedPoint;
  fallbackPath?: readonly NormalizedPoint[];
  minPointDistance: number;
}): { points: NormalizedPoint[]; source: MovementPlaybackDebugEvent["source"] } | null {
  const movementPath = findMovementPath(args.paths, args.entityType, args.entityId, args.phaseIndex);
  const pathPoints = movementPath?.points ?? args.fallbackPath ?? [];
  if (pathPoints.length < 2) return null;
  const normalizedPoints = cloneMovementPathPoints(pathPoints);
  const firstPoint = normalizedPoints[0];
  const lastPoint = normalizedPoints[normalizedPoints.length - 1];
  if (
    firstPoint &&
    Math.hypot(firstPoint.x - args.fromPoint.x, firstPoint.y - args.fromPoint.y) >= args.minPointDistance
  ) {
    normalizedPoints.unshift({ x: args.fromPoint.x, y: args.fromPoint.y });
  }
  if (
    lastPoint &&
    Math.hypot(lastPoint.x - args.toPoint.x, lastPoint.y - args.toPoint.y) >= args.minPointDistance
  ) {
    normalizedPoints.push({ x: args.toPoint.x, y: args.toPoint.y });
  }
  return {
    points: normalizedPoints,
    source: movementPath ? "movement-path" : "fallback-path",
  };
}

export function interpolateMovementEntity(args: {
  paths: readonly MovementPathRecord[];
  entityType: MovementPathEntityType;
  entityId: string;
  phaseIndex: number;
  fromPoint: NormalizedPoint;
  toPoint: NormalizedPoint;
  progress: number;
  fallbackPath?: readonly NormalizedPoint[];
  minPointDistance: number;
  debug?: MovementPlaybackDebugSink;
}): NormalizedPoint | null {
  // This is the reusable entity -> path -> interpolation bridge. Player paths,
  // free-ball paths, and later synchronized groups can all route through this
  // helper by choosing the entity id/type and phase index for the current
  // playback segment.
  const resolved = resolveMovementPathPoints(args);
  if (!resolved || resolved.points.length < 2) return null;
  args.debug?.({
    entityId: args.entityId,
    entityType: args.entityType,
    phaseIndex: args.phaseIndex,
    pointCount: resolved.points.length,
    progress: Math.max(0, Math.min(1, Number.isFinite(args.progress) ? args.progress : 0)),
    source: resolved.source,
  });
  return interpolateMovementPathPoint(resolved.points, args.progress);
}
