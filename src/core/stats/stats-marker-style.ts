import type {
  MatchEvent,
  MatchEventKind,
} from "./stats-event-model";

export type StatsMarkerStyle = {
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  contrastStroke: string;
  contrastStrokeWidth: number;
  centerDot: string;
  centerDotRadiusScale: number;
};

function styleForType(type: MatchEventKind): StatsMarkerStyle {
  switch (type) {
    case "GOAL":
      return {
        radius: 3.35,
        fill: "rgba(22, 163, 74, 1)",
        stroke: "rgba(250, 204, 21, 1)",
        strokeWidth: 0.95,
        contrastStroke: "rgba(4, 15, 10, 0.62)",
        contrastStrokeWidth: 0.65,
        centerDot: "rgba(255, 255, 240, 0.96)",
        centerDotRadiusScale: 0.27,
      };
    case "POINT":
      return {
        radius: 3.0,
        fill: "rgba(167, 243, 208, 1)",
        stroke: "rgba(5, 150, 105, 1)",
        strokeWidth: 0.78,
        contrastStroke: "rgba(3, 18, 14, 0.58)",
        contrastStrokeWidth: 0.56,
        centerDot: "rgba(248, 255, 252, 0.92)",
        centerDotRadiusScale: 0.24,
      };
    case "WIDE":
      return {
        radius: 3.15,
        fill: "rgba(244, 63, 94, 1)",
        stroke: "rgba(190, 18, 60, 1)",
        strokeWidth: 0.85,
        contrastStroke: "rgba(28, 5, 10, 0.66)",
        contrastStrokeWidth: 0.62,
        centerDot: "rgba(255, 238, 242, 0.9)",
        centerDotRadiusScale: 0.22,
      };
    case "TURNOVER_WON":
      return {
        radius: 2.85,
        fill: "rgba(6, 182, 212, 1)",
        stroke: "rgba(3, 105, 161, 1)",
        strokeWidth: 0.74,
        contrastStroke: "rgba(6, 18, 24, 0.58)",
        contrastStrokeWidth: 0.52,
        centerDot: "rgba(236, 254, 255, 0.9)",
        centerDotRadiusScale: 0.2,
      };
    case "TURNOVER_LOST":
      return {
        radius: 2.85,
        fill: "rgba(194, 65, 12, 1)",
        stroke: "rgba(124, 45, 18, 1)",
        strokeWidth: 0.74,
        contrastStroke: "rgba(36, 18, 8, 0.62)",
        contrastStrokeWidth: 0.52,
        centerDot: "rgba(255, 237, 213, 0.9)",
        centerDotRadiusScale: 0.2,
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
