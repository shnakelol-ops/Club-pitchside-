export type EntityId = string;

export type TeamSide = "HOME" | "AWAY" | "NEUTRAL";

export type EntityKind = "player" | "ball" | "marker";

export type NormalizedPoint = {
  x: number;
  y: number;
};

export interface TacticalEntity {
  id: EntityId;
  kind: EntityKind;
  label?: string;
  visible: boolean;
  locked?: boolean;
}

export interface PlayerEntity extends TacticalEntity {
  kind: "player";
  number?: number;
  team: TeamSide;
  role?: "outfield" | "goalkeeper";
  position: NormalizedPoint;
  style?: {
    tokenStyle?: "classic" | "premium" | "torso";
    color?: "blue" | "red" | "yellow" | "black";
    initials?: string;
  };
}
