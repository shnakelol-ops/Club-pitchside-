import type { EntityId, NormalizedPoint } from "../entities/models";

export type PathId = string;
export type SegmentId = string;

export type PathSegmentType = "line" | "quadratic" | "cubic";

export interface PathSegment {
  id: SegmentId;
  type: PathSegmentType;
  points: NormalizedPoint[];
  durationMs: number;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface TacticalPath {
  id: PathId;
  entityId: EntityId;
  segments: PathSegment[];
  closed?: false;
  totalDurationMs: number;
}
