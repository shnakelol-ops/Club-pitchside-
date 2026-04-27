import type { MatchEvent, MatchEventKind } from "./stats-event-model";

type TeamSide = "HOME" | "AWAY";

export type HurlingReviewEventGroup =
  | "SCORES"
  | "WIDES"
  | "SHOTS"
  | "TURNOVERS"
  | "PUCKOUTS"
  | "FREES"
  | "SIXTY_FIVES";

type PlayerLabelSource = { name: string; number: number };

export type HurlingTeamScore = { goals: number; points: number; total: number };

export type HurlingEventGroupId =
  | "SCORE"
  | "SHOT"
  | "PUCKOUT"
  | "FREE"
  | "SIXTY_FIVE"
  | "TURNOVER";

export type HurlingEventGroupOption = {
  id: HurlingEventGroupId;
  label: string;
  events: Array<{ label: string; kind: MatchEventKind }>;
};

const HURLING_SCORE_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  { label: "GOAL", kind: "GOAL" },
  { label: "POINT", kind: "POINT" },
];

const HURLING_SHOT_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  { label: "SHOT", kind: "SHOT" },
  { label: "WIDE", kind: "WIDE" },
];

const HURLING_PUCKOUT_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  { label: "PS+", kind: "PUCKOUT_SHORT_WON" },
  { label: "PS−", kind: "PUCKOUT_SHORT_LOST" },
  { label: "PL+", kind: "PUCKOUT_LONG_WON" },
  { label: "PL−", kind: "PUCKOUT_LONG_LOST" },
  { label: "PDO", kind: "PUCKOUT_DIRECT_OUT" },
];

const HURLING_FREE_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  { label: "F+", kind: "FREE_WON" },
  { label: "F−", kind: "FREE_CONCEDED" },
  { label: "FS+", kind: "FREE_SCORED" },
  { label: "FS−", kind: "FREE_MISSED" },
];

const HURLING_SIXTY_FIVE_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  { label: "65+", kind: "SIXTY_FIVE_SCORED" },
  { label: "65−", kind: "SIXTY_FIVE_MISSED" },
];

const HURLING_TURNOVER_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  { label: "T+", kind: "TURNOVER_WON" },
  { label: "T−", kind: "TURNOVER_LOST" },
];

export const HURLING_EVENT_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  ...HURLING_SCORE_BUTTONS,
  ...HURLING_SHOT_BUTTONS,
  ...HURLING_PUCKOUT_BUTTONS,
  ...HURLING_FREE_BUTTONS,
  ...HURLING_SIXTY_FIVE_BUTTONS,
  ...HURLING_TURNOVER_BUTTONS,
];

export const HURLING_EVENT_GROUPS: HurlingEventGroupOption[] = [
  { id: "SCORE", label: "Score", events: HURLING_SCORE_BUTTONS },
  { id: "SHOT", label: "Shot", events: HURLING_SHOT_BUTTONS },
  { id: "PUCKOUT", label: "Puckout", events: HURLING_PUCKOUT_BUTTONS },
  { id: "FREE", label: "Free", events: HURLING_FREE_BUTTONS },
  { id: "SIXTY_FIVE", label: "65", events: HURLING_SIXTY_FIVE_BUTTONS },
  { id: "TURNOVER", label: "Turnover", events: HURLING_TURNOVER_BUTTONS },
];

const HURLING_EVENT_KIND_SET = new Set<MatchEventKind>(
  HURLING_EVENT_BUTTONS.map((item) => item.kind),
);

export const HURLING_AWAY_INSTANT_SCORING_KINDS = new Set<MatchEventKind>([
  "GOAL",
  "POINT",
  "FREE_SCORED",
  "SIXTY_FIVE_SCORED",
]);

export const HURLING_SCORE_EVENT_KINDS = new Set<MatchEventKind>([
  "GOAL",
  "POINT",
  "FREE_SCORED",
  "SIXTY_FIVE_SCORED",
]);

export const HURLING_REVIEW_EVENT_GROUP_KINDS: Record<
  HurlingReviewEventGroup,
  readonly MatchEventKind[]
> = {
  SCORES: ["GOAL", "POINT", "FREE_SCORED", "SIXTY_FIVE_SCORED"],
  WIDES: ["WIDE"],
  SHOTS: ["SHOT", "FREE_MISSED", "SIXTY_FIVE_MISSED"],
  TURNOVERS: ["TURNOVER_WON", "TURNOVER_LOST"],
  PUCKOUTS: [
    "PUCKOUT_SHORT_WON",
    "PUCKOUT_SHORT_LOST",
    "PUCKOUT_LONG_WON",
    "PUCKOUT_LONG_LOST",
    "PUCKOUT_DIRECT_OUT",
  ],
  FREES: ["FREE_WON", "FREE_CONCEDED", "FREE_SCORED", "FREE_MISSED"],
  SIXTY_FIVES: ["SIXTY_FIVE_SCORED", "SIXTY_FIVE_MISSED"],
};

export const HURLING_REVIEW_EVENT_GROUP_OPTIONS: Array<{
  id: "ALL" | HurlingReviewEventGroup;
  label: string;
}> = [
  { id: "ALL", label: "ALL" },
  { id: "SCORES", label: "SCORES" },
  { id: "WIDES", label: "WIDES" },
  { id: "SHOTS", label: "SHOTS" },
  { id: "TURNOVERS", label: "TURNOVERS" },
  { id: "PUCKOUTS", label: "PUCKOUTS" },
  { id: "FREES", label: "FREES" },
  { id: "SIXTY_FIVES", label: "65S" },
];

export const HURLING_EVENT_LABEL_BY_KIND: Partial<Record<MatchEventKind, string>> = {
  GOAL: "GOAL",
  POINT: "POINT",
  SHOT: "SHOT",
  WIDE: "WIDE",
  FREE_SCORED: "FS+",
  FREE_MISSED: "FS−",
  SIXTY_FIVE_SCORED: "65+",
  SIXTY_FIVE_MISSED: "65−",
  TURNOVER_WON: "T+",
  TURNOVER_LOST: "T−",
  PUCKOUT_SHORT_WON: "PS+",
  PUCKOUT_SHORT_LOST: "PS−",
  PUCKOUT_LONG_WON: "PL+",
  PUCKOUT_LONG_LOST: "PL−",
  PUCKOUT_DIRECT_OUT: "PDO",
  FREE_WON: "F+",
  FREE_CONCEDED: "F−",
};

export function isHurlingEventKind(kind: MatchEventKind): boolean {
  return HURLING_EVENT_KIND_SET.has(kind);
}

export function computeHurlingTeamScore(
  events: readonly MatchEvent[],
  team: TeamSide,
): HurlingTeamScore {
  let goals = 0;
  let points = 0;
  for (const event of events) {
    if (!event.id.startsWith(`team-${team.toLowerCase()}-`)) continue;
    if (event.kind === "GOAL") goals += 1;
    else if (event.kind === "POINT") points += 1;
    else if (event.kind === "FREE_SCORED") points += 1;
    else if (event.kind === "SIXTY_FIVE_SCORED") points += 1;
  }
  return { goals, points, total: goals * 3 + points };
}

export function formatHurlingScore(score: { goals: number; points: number }): string {
  return `${score.goals}-${String(score.points).padStart(2, "0")}`;
}

export function buildHurlingMatchSummaryLines(
  events: readonly (MatchEvent & { playerId?: string; team?: TeamSide })[],
  playerById: ReadonlyMap<string, PlayerLabelSource>,
): string[] {
  const playerStats = new Map<
    string,
    {
      goals: number;
      points: number;
      turnoversWon: number;
      puckoutsShortWon: number;
      puckoutsLongWon: number;
      freesWon: number;
      freesScored: number;
      sixtyFivesScored: number;
    }
  >();

  let wides = 0;
  let shots = 0;
  let scores = 0;

  for (const event of events) {
    if (event.team !== "HOME") continue;

    if (event.kind === "WIDE") wides += 1;
    if (
      event.kind === "SHOT" ||
      event.kind === "GOAL" ||
      event.kind === "POINT" ||
      event.kind === "WIDE" ||
      event.kind === "FREE_SCORED" ||
      event.kind === "FREE_MISSED" ||
      event.kind === "SIXTY_FIVE_SCORED" ||
      event.kind === "SIXTY_FIVE_MISSED"
    ) {
      shots += 1;
    }
    if (
      event.kind === "GOAL" ||
      event.kind === "POINT" ||
      event.kind === "FREE_SCORED" ||
      event.kind === "SIXTY_FIVE_SCORED"
    ) {
      scores += 1;
    }

    const playerId = event.playerId;
    if (!playerId || !playerById.has(playerId)) continue;
    const stat = playerStats.get(playerId) ?? {
      goals: 0,
      points: 0,
      turnoversWon: 0,
      puckoutsShortWon: 0,
      puckoutsLongWon: 0,
      freesWon: 0,
      freesScored: 0,
      sixtyFivesScored: 0,
    };
    if (event.kind === "GOAL") stat.goals += 1;
    else if (event.kind === "POINT") stat.points += 1;
    else if (event.kind === "FREE_SCORED") stat.freesScored += 1;
    else if (event.kind === "SIXTY_FIVE_SCORED") stat.sixtyFivesScored += 1;
    else if (event.kind === "TURNOVER_WON") stat.turnoversWon += 1;
    else if (event.kind === "PUCKOUT_SHORT_WON") stat.puckoutsShortWon += 1;
    else if (event.kind === "PUCKOUT_LONG_WON") stat.puckoutsLongWon += 1;
    else if (event.kind === "FREE_WON") stat.freesWon += 1;
    playerStats.set(playerId, stat);
  }

  const formatPlayer = (playerId: string) => {
    const player = playerById.get(playerId);
    return player ? `#${player.number} ${player.name}` : null;
  };
  const topBy = (
    key:
      | "turnoversWon"
      | "puckoutsShortWon"
      | "puckoutsLongWon"
      | "freesWon"
      | "freesScored"
      | "sixtyFivesScored",
    label: string,
  ) => {
    let best: { playerId: string; value: number } | null = null;
    for (const [playerId, stat] of playerStats) {
      if (stat[key] <= 0) continue;
      if (!best || stat[key] > best.value) {
        best = { playerId, value: stat[key] };
      }
    }
    if (!best) return null;
    const playerLabel = formatPlayer(best.playerId);
    return playerLabel ? `${playerLabel} — ${label} (${best.value})` : null;
  };

  let topScorerLine: string | null = null;
  let bestScore = 0;
  for (const [playerId, stat] of playerStats) {
    const total =
      stat.goals * 3 + stat.points + stat.freesScored + stat.sixtyFivesScored;
    if (total <= 0 || total < bestScore) continue;
    const playerLabel = formatPlayer(playerId);
    if (!playerLabel) continue;
    bestScore = total;
    topScorerLine = `${playerLabel} — Top Scorer (${stat.goals}-${String(stat.points + stat.freesScored + stat.sixtyFivesScored).padStart(2, "0")})`;
  }

  const lines = [
    topScorerLine,
    topBy("turnoversWon", "Most Turnovers Won"),
    topBy("puckoutsShortWon", "Most Short Puckouts Won"),
    topBy("puckoutsLongWon", "Most Long Puckouts Won"),
    topBy("freesWon", "Most Frees Won"),
    topBy("freesScored", "Most Frees Scored"),
    topBy("sixtyFivesScored", "Most 65s Scored"),
  ].filter((line): line is string => line != null);
  if (wides > 0) lines.push(`Wides: ${wides}`);
  if (shots > 0) lines.push(`Conversion: ${Math.round((scores / shots) * 100)}%`);
  return lines;
}
