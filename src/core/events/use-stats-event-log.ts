import { useCallback, useReducer } from "react";

import type { StatsPitchTapPayload } from "./stats-pitch-tap";
import {
  createStatsLoggedEvent,
  type StatsLoggedEvent,
} from "./stats-logged-event";
import type { StatsV1EventKind } from "./stats-v1-event-kind";

export type StatsArmSelection = StatsV1EventKind | null;

type State = {
  events: StatsLoggedEvent[];
  arm: StatsArmSelection;
};

type Action =
  | { type: "arm"; kind: StatsV1EventKind }
  | { type: "clearArm" }
  | { type: "logTap"; payload: StatsPitchTapPayload }
  | { type: "undoLastEvent" }
  | { type: "resetEvents" };

const initialState: State = {
  events: [],
  arm: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "arm":
      return { ...state, arm: action.kind };
    case "clearArm":
      return { ...state, arm: null };
    case "resetEvents":
      return { ...state, events: [] };
    case "undoLastEvent":
      if (state.events.length === 0) return state;
      return { ...state, events: state.events.slice(0, -1) };
    case "logTap": {
      if (!state.arm) return state;
      const event = createStatsLoggedEvent({
        kind: state.arm,
        nx: action.payload.nx,
        ny: action.payload.ny,
        timestampMs: action.payload.atMs,
      });
      return { ...state, events: [...state.events, event] };
    }
  }
}

export function useStatsEventLog() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const armKind = useCallback((kind: StatsV1EventKind) => {
    dispatch({ type: "arm", kind });
  }, []);

  const clearArm = useCallback(() => {
    dispatch({ type: "clearArm" });
  }, []);

  const logTap = useCallback((payload: StatsPitchTapPayload) => {
    dispatch({
      type: "logTap",
      payload,
    });
  }, []);

  const undoLastEvent = useCallback(() => {
    dispatch({ type: "undoLastEvent" });
  }, []);

  const resetEvents = useCallback(() => {
    dispatch({ type: "resetEvents" });
  }, []);

  return {
    events: state.events,
    arm: state.arm,
    armKind,
    clearArm,
    logTap,
    undoLastEvent,
    resetEvents,
  };
}
