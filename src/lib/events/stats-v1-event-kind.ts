export const STATS_V1_FIELD_KINDS = [
  "TURNOVER_WON",
  "TURNOVER_LOST",
  "KICKOUT_WON",
  "KICKOUT_LOST",
  "FREE_WON",
  "FREE_CONCEDED",
  "WIDE",
  "SHOT",
] as const;

export type StatsV1FieldKind = (typeof STATS_V1_FIELD_KINDS)[number];

export const STATS_V1_SCORE_KINDS = ["GOAL", "POINT", "TWO_POINT"] as const;

export type StatsV1ScoreKind = (typeof STATS_V1_SCORE_KINDS)[number];

export type StatsV1EventKind = StatsV1FieldKind | StatsV1ScoreKind;

export const STATS_V1_EVENT_KINDS: readonly StatsV1EventKind[] = [
  ...STATS_V1_FIELD_KINDS,
  ...STATS_V1_SCORE_KINDS,
];

export type StatsReviewMode = "live" | "halftime" | "full_time";

export function isStatsV1ScoreKind(k: StatsV1EventKind): k is StatsV1ScoreKind {
  return (STATS_V1_SCORE_KINDS as readonly string[]).includes(k);
}
