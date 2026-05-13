import type { EntityId } from "../entities/models";
import type { PathId, SegmentId } from "../paths/path-models";

export type TimelineTrackId = string;

export interface TimelineSegment {
  id: SegmentId;
  trackId: TimelineTrackId;
  pathId?: PathId;
  startMs: number;
  endMs: number;
  enabled: boolean;
}

export interface TimelineTrack {
  id: TimelineTrackId;
  entityId: EntityId;
  segments: TimelineSegment[];
  muted?: boolean;
}

export interface TacticalTimeline {
  durationMs: number;
  currentMs: number;
  isPlaying: boolean;
  speed: 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5;
  tracks: TimelineTrack[];
  loop?: boolean;
}
