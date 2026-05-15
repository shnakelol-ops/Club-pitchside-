import {
  clampNormalizedPoint,
  type NormalizedPoint,
} from "./normalization";

export type MovementPathEntityType = "player" | "ball";

export type MovementPathMetadata = Record<string, unknown>;

export type MovementPathRecord = {
  id: string;
  entityId: string;
  entityType: MovementPathEntityType;
  phaseIndex: number;
  points: NormalizedPoint[];
  metadata?: MovementPathMetadata;
};

const DEFAULT_SMOOTHING_SAMPLES_PER_SEGMENT = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeMovementPathEntityType(value: unknown): MovementPathEntityType | null {
  if (value === "player" || value === "ball") return value;
  return null;
}

function sanitizeMovementPathPoint(value: unknown): NormalizedPoint | null {
  if (!isRecord(value)) return null;
  if (typeof value.x !== "number" || typeof value.y !== "number") return null;
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) return null;
  return clampNormalizedPoint({ x: value.x, y: value.y });
}

function sanitizeMovementPathPoints(value: unknown): NormalizedPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((point) => sanitizeMovementPathPoint(point))
    .filter((point): point is NormalizedPoint => point != null);
}

function sanitizeMovementPathMetadata(value: unknown): MovementPathMetadata | undefined {
  if (!isRecord(value)) return undefined;
  return { ...value };
}

export function sanitizeMovementPathRecord(value: unknown): MovementPathRecord | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "string" ? value.id.trim() : "";
  const entityId = typeof value.entityId === "string" ? value.entityId.trim() : "";
  const entityType = sanitizeMovementPathEntityType(value.entityType);
  const phaseIndex =
    typeof value.phaseIndex === "number" && Number.isFinite(value.phaseIndex)
      ? Math.max(0, Math.floor(value.phaseIndex))
      : null;
  const points = sanitizeMovementPathPoints(value.points);
  if (!id || !entityId || !entityType || phaseIndex == null || points.length < 2) return null;
  const metadata = sanitizeMovementPathMetadata(value.metadata);
  return {
    id,
    entityId,
    entityType,
    phaseIndex,
    points,
    ...(metadata ? { metadata } : {}),
  };
}

export function cloneMovementPathRecord(path: MovementPathRecord): MovementPathRecord {
  return {
    id: path.id,
    entityId: path.entityId,
    entityType: path.entityType,
    phaseIndex: path.phaseIndex,
    points: path.points.map((point) => ({ x: point.x, y: point.y })),
    ...(path.metadata ? { metadata: { ...path.metadata } } : {}),
  };
}

function catmullRomScalar(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function catmullRomPoint(points: readonly NormalizedPoint[], segmentIndex: number, t: number): NormalizedPoint {
  const p0 = points[Math.max(0, segmentIndex - 1)] ?? points[0]!;
  const p1 = points[segmentIndex] ?? points[0]!;
  const p2 = points[Math.min(points.length - 1, segmentIndex + 1)] ?? p1;
  const p3 = points[Math.min(points.length - 1, segmentIndex + 2)] ?? p2;
  return clampNormalizedPoint({
    x: catmullRomScalar(p0.x, p1.x, p2.x, p3.x, t),
    y: catmullRomScalar(p0.y, p1.y, p2.y, p3.y, t),
  });
}

export function smoothMovementPathPoints(
  points: readonly NormalizedPoint[],
  samplesPerSegment = DEFAULT_SMOOTHING_SAMPLES_PER_SEGMENT,
): NormalizedPoint[] {
  if (points.length <= 2) {
    return points.map((point) => clampNormalizedPoint(point));
  }
  const samples = Math.max(2, Math.floor(samplesPerSegment));
  const smoothed: NormalizedPoint[] = [];
  for (let segmentIndex = 0; segmentIndex < points.length - 1; segmentIndex += 1) {
    for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
      const t = sampleIndex / samples;
      smoothed.push(catmullRomPoint(points, segmentIndex, t));
    }
  }
  smoothed.push(clampNormalizedPoint(points[points.length - 1]!));
  return smoothed;
}

export function interpolateMovementPathPoint(
  points: readonly NormalizedPoint[],
  progress: number,
): NormalizedPoint | null {
  if (points.length <= 0) return null;
  const boundedProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  if (points.length === 1) return clampNormalizedPoint(points[0]!);
  const smoothed = smoothMovementPathPoints(points);
  let totalDistance = 0;
  for (let index = 1; index < smoothed.length; index += 1) {
    const previous = smoothed[index - 1];
    const current = smoothed[index];
    if (!previous || !current) continue;
    totalDistance += Math.hypot(current.x - previous.x, current.y - previous.y);
  }
  if (totalDistance <= 0) return clampNormalizedPoint(smoothed[smoothed.length - 1]!);

  const targetDistance = totalDistance * boundedProgress;
  let traveledDistance = 0;
  for (let index = 1; index < smoothed.length; index += 1) {
    const previous = smoothed[index - 1];
    const current = smoothed[index];
    if (!previous || !current) continue;
    const segmentDistance = Math.hypot(current.x - previous.x, current.y - previous.y);
    if (segmentDistance <= 0) continue;
    if (traveledDistance + segmentDistance >= targetDistance) {
      const segmentProgress = (targetDistance - traveledDistance) / segmentDistance;
      return clampNormalizedPoint({
        x: previous.x + (current.x - previous.x) * segmentProgress,
        y: previous.y + (current.y - previous.y) * segmentProgress,
      });
    }
    traveledDistance += segmentDistance;
  }
  return clampNormalizedPoint(smoothed[smoothed.length - 1]!);
}
