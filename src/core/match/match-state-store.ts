export type MatchState =
  | "PRE_MATCH"
  | "FIRST_HALF"
  | "HALF_TIME"
  | "SECOND_HALF"
  | "FULL_TIME";

export type MatchEngineState = {
  matchState: MatchState;
  currentHalf: 1 | 2;
  matchTimeSeconds: number;
  isRunning: boolean;
};

export function createInitialMatchEngineState(): MatchEngineState {
  return {
    matchState: "PRE_MATCH",
    currentHalf: 1,
    matchTimeSeconds: 0,
    isRunning: false,
  };
}

export function startFirstHalf(_: MatchEngineState): MatchEngineState {
  return {
    matchState: "FIRST_HALF",
    currentHalf: 1,
    matchTimeSeconds: 0,
    isRunning: true,
  };
}

export function goToHalfTime(state: MatchEngineState): MatchEngineState {
  return {
    ...state,
    matchState: "HALF_TIME",
    isRunning: false,
  };
}

export function startSecondHalf(_: MatchEngineState): MatchEngineState {
  return {
    matchState: "SECOND_HALF",
    currentHalf: 2,
    matchTimeSeconds: 0,
    isRunning: true,
  };
}

export function endMatch(state: MatchEngineState): MatchEngineState {
  return {
    ...state,
    matchState: "FULL_TIME",
    isRunning: false,
  };
}

export function tickMatchClock(state: MatchEngineState): MatchEngineState {
  if (!state.isRunning) return state;
  return {
    ...state,
    matchTimeSeconds: state.matchTimeSeconds + 1,
  };
}

export function isLoggingActive(matchState: MatchState): boolean {
  return matchState === "FIRST_HALF" || matchState === "SECOND_HALF";
}

export function formatMatchClock(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const ss = (clamped % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
