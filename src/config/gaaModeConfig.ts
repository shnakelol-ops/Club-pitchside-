import type { MatchEventKind } from "../core/stats/stats-event-model";

type GaaModeDefinition = {
  modeName: string;
  eventButtons: ReadonlyArray<{ label: string; kind: MatchEventKind }>;
  eventLabels: Record<MatchEventKind, string>;
  scoringEvents: ReadonlyArray<MatchEventKind>;
  reviewGroups: Record<string, { label: string; kinds: ReadonlyArray<MatchEventKind> }>;
  restartLabel: string;
};

const FOOTBALL_EVENT_BUTTONS: ReadonlyArray<{ label: string; kind: MatchEventKind }> = [
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
];

const FOOTBALL_EVENT_LABELS: Record<MatchEventKind, string> = {
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
};

const FOOTBALL_SCORING_EVENTS: ReadonlyArray<MatchEventKind> = ["GOAL", "POINT", "TWO_POINTER"];

const FOOTBALL_REVIEW_GROUPS = {
  SCORES: { label: "SCORES", kinds: ["GOAL", "POINT", "TWO_POINTER"] },
  WIDES: { label: "WIDES", kinds: ["WIDE"] },
  SHOTS: { label: "SHOTS", kinds: ["SHOT"] },
  TURNOVERS: { label: "TURNOVERS", kinds: ["TURNOVER_WON", "TURNOVER_LOST"] },
  KICKOUTS: { label: "KICKOUTS", kinds: ["KICKOUT_WON", "KICKOUT_CONCEDED"] },
  FREES: { label: "FREES", kinds: ["FREE_WON", "FREE_CONCEDED"] },
} as const satisfies Record<string, { label: string; kinds: ReadonlyArray<MatchEventKind> }>;

export const gaaModeConfig = {
  football: {
    modeName: "Football",
    eventButtons: FOOTBALL_EVENT_BUTTONS,
    eventLabels: FOOTBALL_EVENT_LABELS,
    scoringEvents: FOOTBALL_SCORING_EVENTS,
    reviewGroups: FOOTBALL_REVIEW_GROUPS,
    restartLabel: "Kickout",
  },
  ladiesFootball: {
    modeName: "Ladies Football",
    eventButtons: FOOTBALL_EVENT_BUTTONS,
    eventLabels: FOOTBALL_EVENT_LABELS,
    scoringEvents: FOOTBALL_SCORING_EVENTS,
    reviewGroups: FOOTBALL_REVIEW_GROUPS,
    restartLabel: "Kickout",
  },
  hurling: {
    modeName: "Hurling",
    eventButtons: FOOTBALL_EVENT_BUTTONS,
    eventLabels: FOOTBALL_EVENT_LABELS,
    scoringEvents: FOOTBALL_SCORING_EVENTS,
    reviewGroups: FOOTBALL_REVIEW_GROUPS,
    restartLabel: "Kickout",
  },
  camogie: {
    modeName: "Camogie",
    eventButtons: FOOTBALL_EVENT_BUTTONS,
    eventLabels: FOOTBALL_EVENT_LABELS,
    scoringEvents: FOOTBALL_SCORING_EVENTS,
    reviewGroups: FOOTBALL_REVIEW_GROUPS,
    restartLabel: "Kickout",
  },
} as const satisfies Record<string, GaaModeDefinition>;

export type GaaModeKey = keyof typeof gaaModeConfig;

