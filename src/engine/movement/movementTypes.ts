import {
  clampNormalizedPoint,
  type NormalizedPoint,
} from "../shared/normalization";

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

// Keep this schema intentionally narrow. Future player runs, synchronized
// multi-entity timings, shadow runs, and GSAP adapter hints should extend
// metadata rather than changing the core entity/phase/points contract.

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

export function cloneMovementPathPoints(points: readonly NormalizedPoint[]): NormalizedPoint[] {
  return points.map((point) => clampNormalizedPoint(point));
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
    points: cloneMovementPathPoints(path.points),
    ...(path.metadata ? { metadata: { ...path.metadata } } : {}),
  };
}
