import type { MatchEventKind } from "../core/stats/stats-event-model";

type GaaModeDefinition = {
  eventButtons: ReadonlyArray<{ label: string; kind: MatchEventKind }>;
  eventLabels: Record<MatchEventKind, string>;
  scoringEvents: ReadonlyArray<MatchEventKind>;
  reviewGroups: Record<string, { label: string; kinds: ReadonlyArray<MatchEventKind> }>;
  restartLabel: string;
};

export const gaaModeConfig = {
  football: {
    eventButtons: [
      { label: "GOAL", kind: "GOAL" },
      { label: "POINT", kind: "POINT" },
      { label: "2PT", kind: "TWO_POINTER" },
      { label: "WIDE", kind: "WIDE" },
      { label: "SHOT", kind: "SHOT" },
      { label: "T+", kind: "TURNOVER_WON" },
      { label: "T−", kind: "TURNOVER_LOST" },
      { label: "K+", kind: "KICKOUT_WON" },
      { label: "K−", kind: "KICKOUT_CONCEDED" },
      { label: "F+", kind: "FREE_WON" },
      { label: "F−", kind: "FREE_CONCEDED" },
    ],
    eventLabels: {
      GOAL: "GOAL",
      POINT: "POINT",
      TWO_POINTER: "2PT",
      WIDE: "WIDE",
      SHOT: "SHOT",
      TURNOVER_WON: "T+",
      TURNOVER_LOST: "T−",
      KICKOUT_WON: "K+",
      KICKOUT_CONCEDED: "K−",
      FREE_WON: "F+",
      FREE_CONCEDED: "F−",
    },
    scoringEvents: ["GOAL", "POINT", "TWO_POINTER"],
    reviewGroups: {
      SCORES: { label: "SCORES", kinds: ["GOAL", "POINT", "TWO_POINTER"] },
      WIDES: { label: "WIDES", kinds: ["WIDE"] },
      SHOTS: { label: "SHOTS", kinds: ["SHOT"] },
      TURNOVERS: { label: "TURNOVERS", kinds: ["TURNOVER_WON", "TURNOVER_LOST"] },
      KICKOUTS: { label: "KICKOUTS", kinds: ["KICKOUT_WON", "KICKOUT_CONCEDED"] },
      FREES: { label: "FREES", kinds: ["FREE_WON", "FREE_CONCEDED"] },
    },
    restartLabel: "Kickout",
  },
} as const satisfies Record<string, GaaModeDefinition>;

