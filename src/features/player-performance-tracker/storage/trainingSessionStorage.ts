import { createDefaultPlayers } from "../model/trainingScoring";
import { type TrainingSessionState } from "../model/trainingTypes";

const STORAGE_KEY = "pitchside.player-performance-tracker.v1";

export function getInitialSessionState(): TrainingSessionState {
  return {
    sessionName: "Training",
    players: createDefaultPlayers(),
    hasStarted: false,
    isRunning: false,
    elapsedSeconds: 0,
    period: "PRE",
    logs: [],
    activeTab: "tracker",
    activeEventKey: null,
    lastDeleted: null,
  };
}

export function loadSessionState(): TrainingSessionState {
  const fallback = getInitialSessionState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<TrainingSessionState>;
    return { ...fallback, ...parsed, elapsedSeconds: Number.isFinite(parsed.elapsedSeconds) ? Number(parsed.elapsedSeconds) : 0 };
  } catch {
    return fallback;
  }
}

export function saveSessionState(state: TrainingSessionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
