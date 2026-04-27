import type { MatchEventKind } from "../core/stats/stats-event-model";

type GaaModeDefinition = {
  modeName: string;
  eventButtons: ReadonlyArray<{ label: string; kind: MatchEventKind }>;
  eventLabels: Record<MatchEventKind, string>;
  scoringEvents: ReadonlyArray<MatchEventKind>;
  reviewGroups: Record<string, { label: string; kinds: ReadonlyArray<MatchEventKind> }>;
  restartLabel: string;
};

type ModeLabelOverrides = {
  includeTwoPointer: boolean;
  kickoutWonLabel: string;
  kickoutConcededLabel: string;
  placeBallLabel: string;
};

function buildEventButtons({
  includeTwoPointer,
  kickoutWonLabel,
  kickoutConcededLabel,
  placeBallLabel,
}: ModeLabelOverrides): ReadonlyArray<{ label: string; kind: MatchEventKind }> {
  const baseButtons: Array<{ label: string; kind: MatchEventKind }> = [
    { label: "GOAL", kind: "GOAL" },
    { label: "POINT", kind: "POINT" },
    { label: "WIDE", kind: "WIDE" },
    { label: "SHOT", kind: "SHOT" },
    { label: "T+", kind: "TURNOVER_WON" },
    { label: "T−", kind: "TURNOVER_LOST" },
    { label: kickoutWonLabel, kind: "KICKOUT_WON" },
    { label: kickoutConcededLabel, kind: "KICKOUT_CONCEDED" },
    { label: "F+", kind: "FREE_WON" },
    { label: "F−", kind: "FREE_CONCEDED" },
    { label: "FS", kind: "FREE_SCORED" },
    { label: "FM", kind: "FREE_MISSED" },
    { label: placeBallLabel, kind: "FREE_WON" },
  ];
  if (includeTwoPointer) {
    baseButtons.splice(2, 0, { label: "2PT", kind: "TWO_POINTER" });
  }
  return baseButtons;
}

function buildEventLabels({
  kickoutWonLabel,
  kickoutConcededLabel,
}: Pick<ModeLabelOverrides, "kickoutWonLabel" | "kickoutConcededLabel">): Record<
  MatchEventKind,
  string
> {
  return {
    GOAL: "GOAL",
    POINT: "POINT",
    TWO_POINTER: "2PT",
    WIDE: "WIDE",
    SHOT: "SHOT",
    TURNOVER_WON: "T+",
    TURNOVER_LOST: "T−",
    KICKOUT_WON: kickoutWonLabel,
    KICKOUT_CONCEDED: kickoutConcededLabel,
    FREE_WON: "F+",
    FREE_CONCEDED: "F−",
    FREE_SCORED: "FS",
    FREE_MISSED: "FM",
  };
}

function buildReviewGroups(includeTwoPointer: boolean) {
  return {
    SCORES: { label: "SCORES", kinds: includeTwoPointer ? ["GOAL", "POINT", "TWO_POINTER", "FREE_SCORED"] : ["GOAL", "POINT", "FREE_SCORED"] },
    WIDES: { label: "WIDES", kinds: ["WIDE"] },
    SHOTS: { label: "SHOTS", kinds: ["SHOT"] },
    TURNOVERS: { label: "TURNOVERS", kinds: ["TURNOVER_WON", "TURNOVER_LOST"] },
    KICKOUTS: { label: "KICKOUTS", kinds: ["KICKOUT_WON", "KICKOUT_CONCEDED"] },
    FREES: { label: "FREES", kinds: ["FREE_WON", "FREE_CONCEDED", "FREE_SCORED", "FREE_MISSED"] },
  } as const satisfies Record<string, { label: string; kinds: ReadonlyArray<MatchEventKind> }>;
}

export const gaaModeConfig = {
  football: {
    modeName: "Football",
    eventButtons: buildEventButtons({
      includeTwoPointer: true,
      kickoutWonLabel: "K+",
      kickoutConcededLabel: "K−",
      placeBallLabel: "45",
    }),
    eventLabels: buildEventLabels({
      kickoutWonLabel: "K+",
      kickoutConcededLabel: "K−",
    }),
    scoringEvents: ["GOAL", "POINT", "TWO_POINTER", "FREE_SCORED"],
    reviewGroups: buildReviewGroups(true),
    restartLabel: "Kickout",
  },
  ladiesFootball: {
    modeName: "Ladies Football",
    eventButtons: buildEventButtons({
      includeTwoPointer: true,
      kickoutWonLabel: "K+",
      kickoutConcededLabel: "K−",
      placeBallLabel: "45",
    }),
    eventLabels: buildEventLabels({
      kickoutWonLabel: "K+",
      kickoutConcededLabel: "K−",
    }),
    scoringEvents: ["GOAL", "POINT", "TWO_POINTER", "FREE_SCORED"],
    reviewGroups: buildReviewGroups(true),
    restartLabel: "Kickout",
  },
  hurling: {
    modeName: "Hurling",
    eventButtons: buildEventButtons({
      includeTwoPointer: false,
      kickoutWonLabel: "P+",
      kickoutConcededLabel: "P-",
      placeBallLabel: "65",
    }),
    eventLabels: buildEventLabels({
      kickoutWonLabel: "P+",
      kickoutConcededLabel: "P-",
    }),
    scoringEvents: ["GOAL", "POINT", "FREE_SCORED"],
    reviewGroups: buildReviewGroups(false),
    restartLabel: "Puckout",
  },
  camogie: {
    modeName: "Camogie",
    eventButtons: buildEventButtons({
      includeTwoPointer: false,
      kickoutWonLabel: "P+",
      kickoutConcededLabel: "P-",
      placeBallLabel: "65",
    }),
    eventLabels: buildEventLabels({
      kickoutWonLabel: "P+",
      kickoutConcededLabel: "P-",
    }),
    scoringEvents: ["GOAL", "POINT", "FREE_SCORED"],
    reviewGroups: buildReviewGroups(false),
    restartLabel: "Puckout",
  },
} as const satisfies Record<string, GaaModeDefinition>;

export type GaaModeKey = keyof typeof gaaModeConfig;

