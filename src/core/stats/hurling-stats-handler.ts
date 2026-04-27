import type { MatchEvent, MatchEventKind } from "./stats-event-model";

type TeamSide = "HOME" | "AWAY";

export type HurlingReviewEventGroup =
  | "SCORES"
  | "WIDES"
  | "SHOTS"
  | "TURNOVERS"
  | "PUCKOUTS"
  | "FREES";

type PlayerLabelSource = { name: string; number: number };

export type HurlingTeamScore = { goals: number; points: number; total: number };

export const HURLING_EVENT_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
  { label: "GOAL", kind: "GOAL" },
  { label: "POINT", kind: "POINT" },
  { label: "SHOT", kind: "SHOT" },
  { label: "WIDE", kind: "WIDE" },
  { label: "T+", kind: "TURNOVER_WON" },
  { label: "T−", kind: "TURNOVER_LOST" },
  { label: "P+", kind: "PUCKOUT_WON" },
  { label: "P−", kind: "PUCKOUT_LOST" },
  { label: "F+", kind: "FREE_WON" },
  { label: "F−", kind: "FREE_CONCEDED" },
];

const HURLING_EVENT_KIND_SET = new Set<MatchEventKind>(
  HURLING_EVENT_BUTTONS.map((item) => item.kind),
);

export const HURLING_AWAY_INSTANT_SCORING_KINDS = new Set<MatchEventKind>([
  "GOAL",
  "POINT",
]);

export const HURLING_SCORE_EVENT_KINDS = new Set<MatchEventKind>([
  "GOAL",
  "POINT",
]);

export const HURLING_REVIEW_EVENT_GROUP_KINDS: Record<
  HurlingReviewEventGroup,
  readonly MatchEventKind[]
> = {
  SCORES: ["GOAL", "POINT"],
  WIDES: ["WIDE"],
  SHOTS: ["SHOT"],
  TURNOVERS: ["TURNOVER_WON", "TURNOVER_LOST"],
  PUCKOUTS: ["PUCKOUT_WON", "PUCKOUT_LOST"],
  FREES: ["FREE_WON", "FREE_CONCEDED"],
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
];

export const HURLING_EVENT_LABEL_BY_KIND: Partial<Record<MatchEventKind, string>> = {
  GOAL: "GOAL",
  POINT: "POINT",
  SHOT: "SHOT",
  WIDE: "WIDE",
  TURNOVER_WON: "T+",
  TURNOVER_LOST: "T−",
  PUCKOUT_WON: "P+",
  PUCKOUT_LOST: "P−",
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
      puckoutsWon: number;
      freesWon: number;
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
      event.kind === "WIDE"
    ) {
      shots += 1;
    }
    if (event.kind === "GOAL" || event.kind === "POINT") scores += 1;

    const playerId = event.playerId;
    if (!playerId || !playerById.has(playerId)) continue;
    const stat = playerStats.get(playerId) ?? {
      goals: 0,
      points: 0,
      turnoversWon: 0,
      puckoutsWon: 0,
      freesWon: 0,
    };
    if (event.kind === "GOAL") stat.goals += 1;
    else if (event.kind === "POINT") stat.points += 1;
    else if (event.kind === "TURNOVER_WON") stat.turnoversWon += 1;
    else if (event.kind === "PUCKOUT_WON") stat.puckoutsWon += 1;
    else if (event.kind === "FREE_WON") stat.freesWon += 1;
    playerStats.set(playerId, stat);
  }

  const formatPlayer = (playerId: string) => {
    const player = playerById.get(playerId);
    return player ? `#${player.number} ${player.name}` : null;
  };
  const topBy = (
    key: "turnoversWon" | "puckoutsWon" | "freesWon",
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
    const total = stat.goals * 3 + stat.points;
    if (total <= 0 || total < bestScore) continue;
    const playerLabel = formatPlayer(playerId);
    if (!playerLabel) continue;
    bestScore = total;
    topScorerLine = `${playerLabel} — Top Scorer (${stat.goals}-${String(stat.points).padStart(2, "0")})`;
  }

  const lines = [
    topScorerLine,
    topBy("turnoversWon", "Most Turnovers Won"),
    topBy("puckoutsWon", "Most Puckouts Won"),
    topBy("freesWon", "Most Frees Won"),
  ].filter((line): line is string => line != null);
  if (wides > 0) lines.push(`Wides: ${wides}`);
  if (shots > 0) lines.push(`Conversion: ${Math.round((scores / shots) * 100)}%`);
  return lines;
}
