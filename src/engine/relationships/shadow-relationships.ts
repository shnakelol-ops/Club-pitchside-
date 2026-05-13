import type { EntityId } from "../entities/models";

export interface ShadowRelationship {
  id: string;
  leaderEntityId: EntityId;
  followerEntityId: EntityId;
  offsetMs?: number;
  offsetDistance?: number;
  enabled: boolean;
}
