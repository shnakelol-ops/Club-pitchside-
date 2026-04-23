import { clamp01 } from "../coordinates/pitch-coordinates";
import type { StatsV1EventKind } from "./stats-v1-event-kind";

export type StatsPeriodPhase =
  | "unspecified"
  | "first_half"
  | "second_half"
  | "extra_time"
  | "half_time"
  | "full_time";

export type StatsLoggedEvent = {
  id: string;
  kind: StatsV1EventKind;
  nx: number;
  ny: number;
  timestampMs: number;
  periodPhase: StatsPeriodPhase;
};

export type CreateStatsLoggedEventInput = {
  id?: string;
  kind: StatsV1EventKind;
  nx: number;
  ny: number;
  timestampMs: number;
  periodPhase?: StatsPeriodPhase;
};

function newStatsEventId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `stats-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createStatsLoggedEvent(
  input: CreateStatsLoggedEventInput,
): StatsLoggedEvent {
  return {
    id: input.id ?? newStatsEventId(),
    kind: input.kind,
    nx: clamp01(input.nx),
    ny: clamp01(input.ny),
    timestampMs: input.timestampMs,
    periodPhase: input.periodPhase ?? "unspecified",
  };
}
