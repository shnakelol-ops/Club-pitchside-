import type { TacticalEntity, PlayerEntity } from "../entities/models";
import type { TacticalPath } from "../paths/path-models";
import type { ShadowRelationship } from "../relationships/shadow-relationships";
import type { TacticalTimeline } from "../timeline/timeline-models";

export type ScenarioId = string;

export interface ScenarioMetadata {
  id: ScenarioId;
  name: string;
  sport: "football" | "hurling" | "camogie" | "ladiesFootball";
  createdAt: number;
  updatedAt: number;
  version: 1;
  tags?: string[];
}

export interface TacticalScenario {
  metadata: ScenarioMetadata;
  entities: TacticalEntity[];
  players: PlayerEntity[];
  paths: TacticalPath[];
  timeline: TacticalTimeline;
  relationships: ShadowRelationship[];
  drawings?: unknown[];
}
