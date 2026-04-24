import { useEffect, useMemo, useRef, useState } from "react";

import {
  createInitialMatchEngineState,
  goToHalfTime,
  endMatch,
  formatMatchClock,
  isLoggingActive,
  startFirstHalf,
  startSecondHalf,
  tickMatchClock,
  type MatchState,
} from "./core/match/match-state-store";
import { createPixiPitchSurface } from "./core/pitch/create-pixi-pitch-surface";
import { type MatchEvent, type MatchEventKind } from "./core/stats/stats-event-model";

type VisibilityMode = "ALL" | "LAST_5" | "LAST_10";
type TeamScore = { goals: number; points: number; total: number };
type TeamSide = "HOME" | "AWAY";

const EVENT_BUTTONS: Array<{ label: string; kind: MatchEventKind }> = [
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

const AWAY_INSTANT_SCORING_KINDS = new Set<MatchEventKind>(["GOAL", "POINT", "TWO_POINTER"]);

function newLocalEventId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function computeTeamScore(events: readonly MatchEvent[], team: TeamSide): TeamScore {
  let goals = 0;
  let points = 0;

  for (const event of events) {
    if (event.id.startsWith(`team-${team.toLowerCase()}-`) === false) continue;
    if (event.kind === "GOAL") {
      goals += 1;
      continue;
    }
    if (event.kind === "POINT") {
      points += 1;
      continue;
    }
    if (event.kind === "TWO_POINTER") {
      points += 2;
    }
  }

  return {
    goals,
    points,
    total: goals * 3 + points,
  };
}

function formatGaelicScore(score: TeamScore): string {
  return `${score.goals}-${String(score.points).padStart(2, "0")}`;
}

const PANEL_CSS = `
.app-root {
  position: fixed;
  inset: 0;
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0f0c;
  overflow: hidden;
}

.floating-controls {
  position: fixed;
  right: 16px;
  bottom: 14px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.event-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 35, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 8px 18px rgba(4, 12, 24, 0.26);
  width: min(calc(100vw - 32px), 308px);
  max-width: 95vw;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 3px;
}

.event-btn {
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 9.5px;
  line-height: 1.1;
  padding: 5px 4px;
  min-height: 27px;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  letter-spacing: 0.32px;
  text-transform: uppercase;
  transition: box-shadow 140ms ease, transform 120ms ease;
}

.event-btn:hover {
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.16), 0 0 10px rgba(148, 163, 184, 0.14);
}

.event-btn:active {
  transform: translateY(0.5px);
}

.visibility-row {
  margin-top: 1px;
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.visibility-btn {
  border-radius: 999px;
  color: #e2e8f0;
  font-size: 9.5px;
  font-weight: 600;
  line-height: 1.1;
  padding: 3px 7px;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.undo-wrap {
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.undo-btn {
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.9);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  padding: 5px 8px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  letter-spacing: 0.25px;
  text-transform: uppercase;
}

.active-chip {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  line-height: 1;
  white-space: nowrap;
  letter-spacing: 0.25px;
  text-transform: uppercase;
}

.bubble-btn {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.76);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #e2e8f0;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.landscape-toolbar {
  position: fixed;
  right: 92px;
  bottom: 30px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: fit-content;
  max-width: min(620px, calc(100vw - 154px));
  max-height: 120px;
  padding: 6px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(10, 20, 35, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 8px 16px rgba(4, 12, 24, 0.24);
}

.landscape-toolbar-row {
  display: flex;
  gap: 4px;
}

.landscape-toolbar-secondary {
  display: flex;
  gap: 3px;
  margin-top: 2px;
}

.landscape-toolbar-btn {
  min-width: 44px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.86);
  color: #e2e8f0;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  padding: 0 8px;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.22px;
  text-transform: uppercase;
}

.landscape-toolbar-secondary-btn {
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.36);
  background: rgba(15, 23, 42, 0.84);
  color: #dbe7f5;
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  padding: 0 7px;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.18px;
  text-transform: uppercase;
}

.scoreboard-strip {
  position: fixed;
  top: max(2px, env(safe-area-inset-top));
  left: max(4px, env(safe-area-inset-left));
  z-index: 19;
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: min(220px, calc(100vw - 12px));
  max-width: 220px;
  padding: 4px 6px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.38);
  background: rgba(15, 23, 42, 0.66);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(2, 6, 23, 0.3);
}

.scoreboard-strip-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 18px;
}

.scoreboard-side {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  min-width: 0;
}

.scoreboard-side-label {
  color: rgba(203, 213, 225, 0.9);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.18px;
  text-transform: uppercase;
}

.scoreboard-side-label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.scoreboard-name-edit-btn {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.42);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.86);
  color: #cbd5e1;
  font-size: 9px;
  line-height: 1;
  padding: 0;
  margin: 0 0 0 1px;
  cursor: pointer;
}

.scoreboard-name-input {
  width: 100%;
  min-width: 0;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.44);
  background: rgba(15, 23, 42, 0.88);
  color: #e2e8f0;
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  padding: 0 5px;
  letter-spacing: 0.18px;
  text-transform: uppercase;
}

.scoreboard-side-score {
  color: #f8fafc;
  font-size: 11px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0.24px;
}

.scoreboard-total {
  color: rgba(203, 213, 225, 0.9);
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.18px;
  margin-left: 2px;
}

.scoreboard-team-toggle {
  margin-top: 1px;
  display: flex;
  gap: 3px;
}

.scoreboard-team-btn {
  min-height: 28px;
  min-width: 54px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  background: rgba(15, 23, 42, 0.84);
  color: #dbe7f5;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.18px;
  text-transform: uppercase;
  cursor: pointer;
}

.scoreboard-rail {
  position: fixed;
  top: 50%;
  left: max(4px, env(safe-area-inset-left));
  transform: translateY(-50%);
  z-index: 19;
  width: clamp(72px, 11vw, 96px);
  min-height: clamp(220px, 52vh, 420px);
  max-height: min(80vh, 520px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 5px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.38);
  background: rgba(15, 23, 42, 0.66);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(2, 6, 23, 0.3);
}

.scoreboard-rail-score {
  color: #f8fafc;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0.22px;
}

.scoreboard-rail-separator {
  color: rgba(203, 213, 225, 0.84);
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.scoreboard-rail-total {
  color: rgba(203, 213, 225, 0.88);
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.18px;
  margin-left: 2px;
}

.scoreboard-rail-team-btn {
  min-height: 36px;
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  background: rgba(15, 23, 42, 0.84);
  color: #dbe7f5;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.18px;
  text-transform: uppercase;
  cursor: pointer;
}

.scoreboard-rail-team-wrap {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

.scoreboard-rail-name-line {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.scoreboard-rail-team-name {
  color: rgba(203, 213, 225, 0.9);
  font-size: 8.5px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.16px;
  text-transform: uppercase;
}

.scoreboard-team-btn-inner {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.scoreboard-team-btn-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scoreboard-rail-name-input {
  width: 100%;
  min-width: 0;
  height: 20px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.46);
  background: rgba(15, 23, 42, 0.9);
  color: #e2e8f0;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 0 4px;
  letter-spacing: 0.16px;
  text-transform: uppercase;
  text-align: center;
}

.match-stopwatch {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 19;
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    "state clock"
    "controls controls";
  align-items: center;
  row-gap: 4px;
  column-gap: 7px;
  justify-items: start;
  padding: 5px 8px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.14), 0 3px 10px rgba(2, 6, 23, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22px;
  text-transform: uppercase;
}

.match-stopwatch-state {
  grid-area: state;
  color: rgba(203, 213, 225, 0.84);
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
}

@media (orientation: landscape) {
  .scoreboard-rail {
    left: max(3px, env(safe-area-inset-left));
  }

  .match-stopwatch {
    top: max(2px, env(safe-area-inset-top));
    right: max(4px, env(safe-area-inset-right));
  }
}

.match-stopwatch-clock {
  grid-area: clock;
  justify-self: end;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.34px;
  line-height: 1;
  text-shadow: 0 0 7px rgba(148, 163, 184, 0.3);
}

.match-stopwatch-controls {
  grid-area: controls;
  width: 100%;
  display: flex;
}

.match-stopwatch-btn {
  position: relative;
  width: 100%;
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.62);
  background: rgba(22, 101, 52, 0.88);
  color: #dbe7f5;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.24px;
  padding: 0 10px;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.24), 0 0 10px rgba(34, 197, 94, 0.28);
}

.match-stopwatch-btn::before {
  content: "";
  position: absolute;
  inset: -5px;
}
`;

const EVENT_LABEL_BY_KIND: Record<MatchEventKind, string> = {
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

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const floatingControlsRef = useRef<HTMLDivElement>(null);
  const [selectedEventKind, setSelectedEventKind] = useState<MatchEventKind>("POINT");
  const [activeTeam, setActiveTeam] = useState<TeamSide>("HOME");
  const [teamNames, setTeamNames] = useState<{ HOME: string; AWAY: string }>({
    HOME: "HOME",
    AWAY: "AWAY",
  });
  const [editingTeam, setEditingTeam] = useState<TeamSide | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [loggedEvents, setLoggedEvents] = useState<readonly MatchEvent[]>([]);
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("ALL");
  const [matchState, setMatchState] = useState<MatchState>("PRE_MATCH");
  const [currentHalf, setCurrentHalf] = useState<1 | 2>(1);
  const [matchTimeSeconds, setMatchTimeSeconds] = useState(0);
  const [isLandscape, setIsLandscape] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(orientation: landscape)").matches,
  );
  const selectedEventRef = useRef<MatchEventKind>("POINT");
  const activeTeamRef = useRef<TeamSide>("HOME");
  const homeNameInputRef = useRef<HTMLInputElement>(null);
  const awayNameInputRef = useRef<HTMLInputElement>(null);
  const matchEngineStateRef = useRef(createInitialMatchEngineState());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const handleRef = useRef<{
    destroy: () => void;
    setEvents: (events: readonly import("./core/stats/stats-event-model").MatchEvent[]) => void;
    setActiveEventKind: (kind: MatchEventKind) => void;
    undoLastEvent: () => void;
    setVisibleEventLimit: (limit: number | null) => void;
    setEventContext: (context: { half: 1 | 2; timestamp: number; canLog: boolean }) => void;
  } | null>(null);
  const canEditTeamNames = matchState === "PRE_MATCH";

  const undoLastEventAction = () => {
    const lastEvent = loggedEvents.at(-1);
    if (!lastEvent) return;
    const isInstantAwayScore = lastEvent.id.includes("-instant-score-");
    if (!isInstantAwayScore) {
      handleRef.current?.undoLastEvent();
    }
    setLoggedEvents((prev) => prev.slice(0, -1));
  };

  const startTeamNameEdit = (team: TeamSide) => {
    if (!canEditTeamNames) return;
    setEditingTeam(team);
    setTeamNameDraft(teamNames[team]);
  };

  const commitTeamNameEdit = () => {
    if (!editingTeam) return;
    const nextName = teamNameDraft.trim();
    if (nextName.length > 0) {
      setTeamNames((prev) => ({ ...prev, [editingTeam]: nextName.slice(0, 15) }));
    }
    setEditingTeam(null);
    setTeamNameDraft("");
  };

  const selectEventKind = (kind: MatchEventKind) => {
    setSelectedEventKind(kind);
    selectedEventRef.current = kind;
    handleRef.current?.setActiveEventKind(kind);
    setIsPickerOpen(false);
  };

  const logAwayInstantScore = (kind: MatchEventKind) => {
    setLoggedEvents((prev) => [
      ...prev,
      {
        id: `team-away-instant-score-${newLocalEventId()}`,
        kind,
        nx: 0,
        ny: 0,
        half: matchEngineStateRef.current.currentHalf,
        timestamp: matchEngineStateRef.current.matchTimeSeconds,
      },
    ]);
  };

  const handleEventButtonPress = (kind: MatchEventKind) => {
    if (!isLoggingActive(matchState)) return;
    selectEventKind(kind);
    if (activeTeam === "AWAY" && AWAY_INSTANT_SCORING_KINDS.has(kind)) {
      logAwayInstantScore(kind);
    }
  };

  useEffect(() => {
    activeTeamRef.current = activeTeam;
  }, [activeTeam]);

  useEffect(() => {
    if (canEditTeamNames) return;
    setEditingTeam(null);
    setTeamNameDraft("");
  }, [canEditTeamNames]);

  useEffect(() => {
    if (!editingTeam) return;
    const target = editingTeam === "HOME" ? homeNameInputRef.current : awayNameInputRef.current;
    target?.focus();
    target?.select();
  }, [editingTeam]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let handle: {
      destroy: () => void;
      setEvents: (events: readonly import("./core/stats/stats-event-model").MatchEvent[]) => void;
      setActiveEventKind: (kind: MatchEventKind) => void;
      undoLastEvent: () => void;
      setVisibleEventLimit: (limit: number | null) => void;
      setEventContext: (context: { half: 1 | 2; timestamp: number; canLog: boolean }) => void;
    } | null = null;
    void createPixiPitchSurface(host, {
      sport: "gaelic",
      activeEventKind: selectedEventRef.current,
      onEventLogged: (event) => {
        const teamSide = activeTeamRef.current;
        setLoggedEvents((prev) => [
          ...prev,
          { ...event, id: `team-${teamSide.toLowerCase()}-${event.id}` },
        ]);
      },
    }).then((nextHandle) => {
      if (disposed) {
        nextHandle.destroy();
        return;
      }
      handle = nextHandle;
      handleRef.current = nextHandle;
      nextHandle.setEventContext({
        half: matchEngineStateRef.current.currentHalf,
        timestamp: matchEngineStateRef.current.matchTimeSeconds,
        canLog: isLoggingActive(matchEngineStateRef.current.matchState),
      });
    });
    return () => {
      disposed = true;
      handleRef.current = null;
      handle?.destroy();
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const next = tickMatchClock(matchEngineStateRef.current);
      if (next === matchEngineStateRef.current) return;
      matchEngineStateRef.current = next;
      setMatchTimeSeconds(next.matchTimeSeconds);
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const startFirstHalfAction = () => {
    const next = startFirstHalf(matchEngineStateRef.current);
    matchEngineStateRef.current = next;
    setMatchState(next.matchState);
    setCurrentHalf(next.currentHalf);
    setMatchTimeSeconds(next.matchTimeSeconds);
  };

  const goToHalfTimeAction = () => {
    const next = goToHalfTime(matchEngineStateRef.current);
    matchEngineStateRef.current = next;
    setMatchState(next.matchState);
    setCurrentHalf(next.currentHalf);
    setMatchTimeSeconds(next.matchTimeSeconds);
  };

  const startSecondHalfAction = () => {
    handleRef.current?.setEvents([]);
    const next = startSecondHalf(matchEngineStateRef.current);
    matchEngineStateRef.current = next;
    setMatchState(next.matchState);
    setCurrentHalf(next.currentHalf);
    setMatchTimeSeconds(next.matchTimeSeconds);
  };

  const endMatchAction = () => {
    const next = endMatch(matchEngineStateRef.current);
    matchEngineStateRef.current = next;
    setMatchState(next.matchState);
    setCurrentHalf(next.currentHalf);
    setMatchTimeSeconds(next.matchTimeSeconds);
  };

  useEffect(() => {
    handleRef.current?.setEventContext({
      half: currentHalf,
      timestamp: matchTimeSeconds,
      canLog: isLoggingActive(matchState),
    });
  }, [currentHalf, matchTimeSeconds, matchState]);

  useEffect(() => {
    const visibleLimit =
      visibilityMode === "LAST_5" ? 5 : visibilityMode === "LAST_10" ? 10 : null;
    handleRef.current?.setVisibleEventLimit(visibleLimit);
  }, [visibilityMode]);

  useEffect(() => {
    const updateLandscape = () => {
      setIsLandscape(window.matchMedia("(orientation: landscape)").matches);
    };
    updateLandscape();

    window.addEventListener("resize", updateLandscape);
    return () => {
      window.removeEventListener("resize", updateLandscape);
    };
  }, []);

  useEffect(() => {
    if (!isPickerOpen) return;

    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (floatingControlsRef.current?.contains(target)) return;
      setIsPickerOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDownOutside);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownOutside);
    };
  }, [isPickerOpen]);

  const matchStateToken =
    matchState === "FIRST_HALF" || matchState === "SECOND_HALF"
      ? `H${currentHalf}`
      : matchState === "HALF_TIME"
        ? "HT"
        : matchState === "FULL_TIME"
          ? "FT"
          : "PRE";

  const contextualAction: { label: string; onClick: () => void } | null =
    matchState === "PRE_MATCH"
      ? { label: "START", onClick: startFirstHalfAction }
      : matchState === "FIRST_HALF"
        ? { label: "HT", onClick: goToHalfTimeAction }
        : matchState === "HALF_TIME"
          ? { label: "2H", onClick: startSecondHalfAction }
          : matchState === "SECOND_HALF"
            ? { label: "FT", onClick: endMatchAction }
            : null;

  const homeScore = useMemo(() => computeTeamScore(loggedEvents, "HOME"), [loggedEvents]);
  const awayScore = useMemo(() => computeTeamScore(loggedEvents, "AWAY"), [loggedEvents]);

  const scoreboard = isLandscape ? (
    <div className="scoreboard-rail" aria-label="Match scoreboard">
      <div className="scoreboard-rail-team-wrap">
        <button
          type="button"
          className="scoreboard-rail-team-btn"
          onClick={() => setActiveTeam("HOME")}
          style={
            activeTeam === "HOME"
              ? {
                  border: "1px solid rgba(34,197,94,0.9)",
                  background: "rgba(22,101,52,0.72)",
                }
              : undefined
          }
        >
          HOME
        </button>
        {editingTeam === "HOME" ? (
          <input
            ref={homeNameInputRef}
            className="scoreboard-rail-name-input"
            value={teamNameDraft}
            onChange={(event) => {
              setTeamNameDraft(event.target.value.slice(0, 15));
            }}
            onBlur={commitTeamNameEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitTeamNameEdit();
              }
            }}
            maxLength={15}
            aria-label="Edit home team name"
          />
        ) : (
          <span className="scoreboard-rail-name-line">
            <span className="scoreboard-rail-team-name">{teamNames.HOME}</span>
            {canEditTeamNames ? (
              <button
                type="button"
                className="scoreboard-name-edit-btn"
                aria-label="Edit home team name"
                onClick={() => startTeamNameEdit("HOME")}
              >
                ✏️
              </button>
            ) : null}
          </span>
        )}
      </div>
      <div className="scoreboard-rail-score">
        {formatGaelicScore(homeScore)}
        <span className="scoreboard-rail-total">({homeScore.total})</span>
      </div>
      <div className="scoreboard-rail-separator">v</div>
      <div className="scoreboard-rail-score">
        {formatGaelicScore(awayScore)}
        <span className="scoreboard-rail-total">({awayScore.total})</span>
      </div>
      <div className="scoreboard-rail-team-wrap">
        <button
          type="button"
          className="scoreboard-rail-team-btn"
          onClick={() => setActiveTeam("AWAY")}
          style={
            activeTeam === "AWAY"
              ? {
                  border: "1px solid rgba(34,197,94,0.9)",
                  background: "rgba(22,101,52,0.72)",
                }
              : undefined
          }
        >
          AWAY
        </button>
        {editingTeam === "AWAY" ? (
          <input
            ref={awayNameInputRef}
            className="scoreboard-rail-name-input"
            value={teamNameDraft}
            onChange={(event) => {
              setTeamNameDraft(event.target.value.slice(0, 15));
            }}
            onBlur={commitTeamNameEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitTeamNameEdit();
              }
            }}
            maxLength={15}
            aria-label="Edit away team name"
          />
        ) : (
          <span className="scoreboard-rail-name-line">
            <span className="scoreboard-rail-team-name">{teamNames.AWAY}</span>
            {canEditTeamNames ? (
              <button
                type="button"
                className="scoreboard-name-edit-btn"
                aria-label="Edit away team name"
                onClick={() => startTeamNameEdit("AWAY")}
              >
                ✏️
              </button>
            ) : null}
          </span>
        )}
      </div>
    </div>
  ) : (
    <div className="scoreboard-strip" aria-label="Match scoreboard">
      <div className="scoreboard-strip-line">
        <span className="scoreboard-side">
          {editingTeam === "HOME" ? (
            <input
              ref={homeNameInputRef}
              className="scoreboard-name-input"
              value={teamNameDraft}
              onChange={(event) => {
                setTeamNameDraft(event.target.value.slice(0, 15));
              }}
              onBlur={commitTeamNameEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitTeamNameEdit();
                }
              }}
              maxLength={15}
              aria-label="Edit home team name"
            />
          ) : (
            <span className="scoreboard-side-label-wrap">
              <span className="scoreboard-side-label">{teamNames.HOME}</span>
              {canEditTeamNames ? (
                <button
                  type="button"
                  className="scoreboard-name-edit-btn"
                  aria-label="Edit home team name"
                  onClick={() => startTeamNameEdit("HOME")}
                >
                  ✏️
                </button>
              ) : null}
            </span>
          )}
          <span className="scoreboard-side-score">
            {formatGaelicScore(homeScore)}
            <span className="scoreboard-total">({homeScore.total})</span>
          </span>
        </span>
        <span className="scoreboard-side">
          {editingTeam === "AWAY" ? (
            <input
              ref={awayNameInputRef}
              className="scoreboard-name-input"
              value={teamNameDraft}
              onChange={(event) => {
                setTeamNameDraft(event.target.value.slice(0, 15));
              }}
              onBlur={commitTeamNameEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitTeamNameEdit();
                }
              }}
              maxLength={15}
              aria-label="Edit away team name"
            />
          ) : (
            <span className="scoreboard-side-label-wrap">
              <span className="scoreboard-side-label">{teamNames.AWAY}</span>
              {canEditTeamNames ? (
                <button
                  type="button"
                  className="scoreboard-name-edit-btn"
                  aria-label="Edit away team name"
                  onClick={() => startTeamNameEdit("AWAY")}
                >
                  ✏️
                </button>
              ) : null}
            </span>
          )}
          <span className="scoreboard-side-score">
            {formatGaelicScore(awayScore)}
            <span className="scoreboard-total">({awayScore.total})</span>
          </span>
        </span>
      </div>
      <div className="scoreboard-team-toggle">
        <button
          type="button"
          className="scoreboard-team-btn"
          onClick={() => setActiveTeam("HOME")}
          style={
            activeTeam === "HOME"
              ? {
                  border: "1px solid rgba(34,197,94,0.9)",
                  background: "rgba(22,101,52,0.72)",
                }
              : undefined
          }
        >
          HOME
        </button>
        <button
          type="button"
          className="scoreboard-team-btn"
          onClick={() => setActiveTeam("AWAY")}
          style={
            activeTeam === "AWAY"
              ? {
                  border: "1px solid rgba(34,197,94,0.9)",
                  background: "rgba(22,101,52,0.72)",
                }
              : undefined
          }
        >
          AWAY
        </button>
      </div>
    </div>
  );

  return (
    <main className="app-root">
      <style>{PANEL_CSS}</style>
      {scoreboard}
      <div className="match-stopwatch" aria-live="polite">
        <span className="match-stopwatch-state">{matchStateToken}</span>
        <span className="match-stopwatch-clock">{formatMatchClock(matchTimeSeconds)}</span>
        <div className="match-stopwatch-controls">
          {contextualAction ? (
            <button
              type="button"
              className="match-stopwatch-btn"
              onClick={contextualAction.onClick}
            >
              {contextualAction.label}
            </button>
          ) : null}
        </div>
      </div>
      <div
        ref={floatingControlsRef}
        className="floating-controls"
      >
          {!isLandscape && isPickerOpen ? (
            <div className="event-panel">
              <div className="event-grid">
                {EVENT_BUTTONS.map((item, idx) => {
                  const isActive = item.kind === selectedEventKind;
                  const isScoring = idx <= 4;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="event-btn"
                      onClick={() => {
                        handleEventButtonPress(item.kind);
                      }}
                      style={{
                        border: isActive
                          ? "1px solid rgba(34,197,94,0.96)"
                          : isScoring
                            ? "1px solid rgba(148,163,184,0.52)"
                            : "1px solid rgba(148,163,184,0.36)",
                        background: isActive
                          ? "rgba(22,101,52,0.7)"
                          : isScoring
                            ? "rgba(21, 39, 62, 0.84)"
                            : "rgba(14, 24, 40, 0.72)",
                        fontWeight: isActive ? 700 : 600,
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="visibility-row">
                {([
                  { id: "ALL", label: "Show All" },
                  { id: "LAST_5", label: "Last 5" },
                  { id: "LAST_10", label: "Last 10" },
                ] as const).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className="visibility-btn"
                    onClick={() => {
                      setVisibilityMode(mode.id);
                    }}
                    style={{
                      border:
                        visibilityMode === mode.id
                          ? "1px solid rgba(125,211,252,0.9)"
                          : "1px solid rgba(148,163,184,0.4)",
                      background:
                        visibilityMode === mode.id
                          ? "rgba(14,116,144,0.42)"
                          : "rgba(15,23,42,0.9)",
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <div className="undo-wrap">
                <button
                  type="button"
                  className="undo-btn"
                  onClick={() => {
                    undoLastEventAction();
                    setIsPickerOpen(false);
                  }}
                  style={{ border: "1px solid rgba(148,163,184,0.4)" }}
                >
                  Undo last
                </button>
              </div>
            </div>
          ) : null}
          {isLandscape && isPickerOpen ? (
            <div className="landscape-toolbar">
              <div className="landscape-toolbar-row">
                {EVENT_BUTTONS.slice(0, 5).map((item) => {
                  const isActive = item.kind === selectedEventKind;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="landscape-toolbar-btn"
                      onClick={() => {
                        handleEventButtonPress(item.kind);
                      }}
                      style={
                        isActive
                          ? {
                              border: "1px solid rgba(34,197,94,0.96)",
                              background: "rgba(22,101,52,0.7)",
                            }
                          : undefined
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="landscape-toolbar-row">
                {EVENT_BUTTONS.slice(5).map((item) => {
                  const isActive = item.kind === selectedEventKind;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="landscape-toolbar-btn"
                      onClick={() => {
                        handleEventButtonPress(item.kind);
                      }}
                      style={
                        isActive
                          ? {
                              border: "1px solid rgba(34,197,94,0.96)",
                              background: "rgba(22,101,52,0.7)",
                            }
                          : undefined
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="landscape-toolbar-secondary">
                {([
                  { id: "ALL", label: "Show All" },
                  { id: "LAST_5", label: "Last 5" },
                  { id: "LAST_10", label: "Last 10" },
                ] as const).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className="landscape-toolbar-secondary-btn"
                    onClick={() => {
                      setVisibilityMode(mode.id);
                    }}
                    style={{
                      border:
                        visibilityMode === mode.id
                          ? "1px solid rgba(125,211,252,0.9)"
                          : "1px solid rgba(148,163,184,0.36)",
                      background:
                        visibilityMode === mode.id
                          ? "rgba(14,116,144,0.4)"
                          : "rgba(15,23,42,0.84)",
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="landscape-toolbar-secondary-btn"
                  onClick={() => {
                    undoLastEventAction();
                  }}
                >
                  Undo
                </button>
              </div>
            </div>
          ) : null}
          {!isPickerOpen && !isLandscape ? (
            <div aria-live="polite" className="active-chip">
              {EVENT_LABEL_BY_KIND[selectedEventKind]}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setIsPickerOpen((prev) => !prev);
            }}
            aria-label="Toggle event picker"
            aria-expanded={isPickerOpen}
            className="bubble-btn"
            style={{
              border: isPickerOpen
                ? "1px solid rgba(34,197,94,0.78)"
                : "1px solid rgba(148,163,184,0.45)",
            }}
          >
            {isPickerOpen ? "×" : "●"}
          </button>
      </div>
      <div
        ref={hostRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0f0c",
          overflow: "hidden",
        }}
        aria-label="PitchsideCLUB Pixi pitch"
        role="img"
      />
    </main>
  );
}
