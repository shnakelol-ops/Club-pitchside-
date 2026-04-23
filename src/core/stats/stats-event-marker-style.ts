import type { StatsLoggedEvent } from "../events/stats-logged-event";

export type StatsEventMarkerStyle = {
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export type StatsEventMarkerStyleOptions = {
  reviewMode?: "live" | "halftime" | "full_time";
};

export function getStatsEventMarkerStyle(
  event: StatsLoggedEvent,
): StatsEventMarkerStyle {
  switch (event.kind) {
    case "GOAL":
      return {
        radius: 3.2,
        fill: "rgba(22, 163, 74, 1)",
        stroke: "rgba(250, 204, 21, 1)",
        strokeWidth: 0.7,
      };
    case "POINT":
      return {
        radius: 2.6,
        fill: "rgba(153, 246, 228, 1)",
        stroke: "rgba(15, 118, 110, 1)",
        strokeWidth: 0.45,
      };
    case "TWO_POINT":
      return {
        radius: 2.8,
        fill: "rgba(16, 185, 129, 1)",
        stroke: "rgba(109, 40, 217, 1)",
        strokeWidth: 0.5,
      };
    case "WIDE":
      return {
        radius: 3.2,
        fill: "rgba(220, 38, 38, 1)",
        stroke: "rgba(127, 29, 29, 1)",
        strokeWidth: 0.65,
      };
    case "SHOT":
      return {
        radius: 2.8,
        fill: "rgba(248, 250, 252, 0.96)",
        stroke: "rgba(29, 78, 216, 1)",
        strokeWidth: 0.5,
      };
    case "TURNOVER_WON":
      return {
        radius: 2.5,
        fill: "rgba(6, 182, 212, 1)",
        stroke: "rgba(14, 116, 144, 1)",
        strokeWidth: 0.5,
      };
    case "TURNOVER_LOST":
      return {
        radius: 2.5,
        fill: "rgba(251, 113, 133, 1)",
        stroke: "rgba(190, 18, 60, 1)",
        strokeWidth: 0.5,
      };
    case "KICKOUT_WON":
      return {
        radius: 2.4,
        fill: "rgba(56, 189, 248, 1)",
        stroke: "rgba(3, 105, 161, 1)",
        strokeWidth: 0.45,
      };
    case "KICKOUT_LOST":
      return {
        radius: 2.4,
        fill: "rgba(165, 180, 252, 1)",
        stroke: "rgba(67, 56, 202, 1)",
        strokeWidth: 0.45,
      };
    case "FREE_WON":
      return {
        radius: 2.4,
        fill: "rgba(251, 191, 36, 1)",
        stroke: "rgba(180, 83, 9, 1)",
        strokeWidth: 0.45,
      };
    case "FREE_CONCEDED":
      return {
        radius: 2.4,
        fill: "rgba(168, 162, 158, 1)",
        stroke: "rgba(87, 83, 78, 1)",
        strokeWidth: 0.45,
      };
    default: {
      const _exhaustive: never = event.kind;
      return _exhaustive;
    }
  }
}
