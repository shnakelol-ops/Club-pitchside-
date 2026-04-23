import { useMemo } from "react";

import { PixiPitchSurface } from "./components/board/PixiPitchSurface";
import { useStatsEventLog } from "./lib/events/use-stats-event-log";
import { STATS_V1_EVENT_KINDS, type StatsV1EventKind } from "./lib/events/stats-v1-event-kind";

function firstKind(kinds: readonly StatsV1EventKind[]): StatsV1EventKind {
  return kinds[0] ?? "SHOT";
}

export default function App() {
  const { events, arm, armKind, clearArm, logTap, undoLastEvent, resetEvents } =
    useStatsEventLog();

  const selected = arm ?? useMemo(() => firstKind(STATS_V1_EVENT_KINDS), []);

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: 12,
          borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.9 }}>Stats arm:</span>
        {STATS_V1_EVENT_KINDS.map((kind) => {
          const active = arm === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => armKind(kind)}
              style={{
                fontSize: 11,
                padding: "6px 9px",
                borderRadius: 8,
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: active ? "#22c55e" : "transparent",
                color: active ? "#042f2e" : "#e2e8f0",
                cursor: "pointer",
              }}
            >
              {kind}
            </button>
          );
        })}
        <button
          type="button"
          onClick={clearArm}
          style={{
            fontSize: 11,
            padding: "6px 9px",
            borderRadius: 8,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "transparent",
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          Clear arm
        </button>
        <button
          type="button"
          onClick={undoLastEvent}
          style={{
            fontSize: 11,
            padding: "6px 9px",
            borderRadius: 8,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "transparent",
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={resetEvents}
          style={{
            fontSize: 11,
            padding: "6px 9px",
            borderRadius: 8,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "transparent",
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
        <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
          Events: {events.length}
        </span>
      </header>
      <section style={{ minHeight: 0 }}>
        <PixiPitchSurface
          sport="gaelic"
          statsArm={selected}
          statsLoggedEvents={events}
          onStatsPitchTap={logTap}
        />
      </section>
    </main>
  );
}
