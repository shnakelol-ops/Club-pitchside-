import type {
  MatchEvent,
  MatchEventKind,
} from "./stats-event-model";

export type StatsMarkerStyle = {
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

function styleForType(type: MatchEventKind): StatsMarkerStyle {
  switch (type) {
    case "GOAL":
      return {
        radius: 3.2,
        fill: "rgba(22, 163, 74, 1)",
        stroke: "rgba(250, 204, 21, 1)",
        strokeWidth: 0.75,
      };
    case "POINT":
      return {
        radius: 2.7,
        fill: "rgba(153, 246, 228, 1)",
        stroke: "rgba(13, 148, 136, 1)",
        strokeWidth: 0.5,
      };
    case "WIDE":
      return {
        radius: 3.1,
        fill: "rgba(220, 38, 38, 1)",
        stroke: "rgba(127, 29, 29, 1)",
        strokeWidth: 0.65,
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
    default: {
      const _never: never = type;
      return _never;
    }
  }
}

export function getStatsMarkerStyle(event: MatchEvent): StatsMarkerStyle {
  return styleForType(event.kind);
}
