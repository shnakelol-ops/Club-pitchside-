import { useEffect, useRef, useState } from "react";

import { createPixiPitchSurface } from "./core/pitch/create-pixi-pitch-surface";
import { type MatchEventKind } from "./core/stats/stats-event-model";

type VisibilityMode = "ALL" | "LAST_5" | "LAST_10";

const EVENT_GROUPS: Array<{
  title: string;
  columns: string;
  items: Array<{ label: string; kind: MatchEventKind }>;
}> = [
  {
    title: "Scoring / attacking",
    columns: "repeat(5, minmax(0, 1fr))",
    items: [
      { label: "GOAL", kind: "GOAL" },
      { label: "POINT", kind: "POINT" },
      { label: "2PT", kind: "TWO_POINTER" },
      { label: "WIDE", kind: "WIDE" },
      { label: "Ṣ", kind: "SHOT" },
    ],
  },
  {
    title: "Matchday essentials",
    columns: "repeat(6, minmax(0, 1fr))",
    items: [
      { label: "T+", kind: "TURNOVER_WON" },
      { label: "T−", kind: "TURNOVER_LOST" },
      { label: "K+", kind: "KICKOUT_WON" },
      { label: "K−", kind: "KICKOUT_CONCEDED" },
      { label: "F+", kind: "FREE_WON" },
      { label: "F−", kind: "FREE_CONCEDED" },
    ],
  },
];

const EVENT_LABEL_BY_KIND: Record<MatchEventKind, string> = {
  GOAL: "GOAL",
  POINT: "POINT",
  TWO_POINTER: "2PT",
  WIDE: "WIDE",
  SHOT: "Ṣ",
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
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("ALL");
  const selectedEventRef = useRef<MatchEventKind>("POINT");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const handleRef = useRef<{
    destroy: () => void;
    setActiveEventKind: (kind: MatchEventKind) => void;
    undoLastEvent: () => void;
    setVisibleEventLimit: (limit: number | null) => void;
  } | null>(null);

  const selectEventKind = (kind: MatchEventKind) => {
    setSelectedEventKind(kind);
    selectedEventRef.current = kind;
    handleRef.current?.setActiveEventKind(kind);
    setIsPickerOpen(false);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let handle: {
      destroy: () => void;
      setActiveEventKind: (kind: MatchEventKind) => void;
      undoLastEvent: () => void;
      setVisibleEventLimit: (limit: number | null) => void;
    } | null = null;
    void createPixiPitchSurface(host, {
      sport: "gaelic",
      activeEventKind: selectedEventRef.current,
    }).then((nextHandle) => {
      if (disposed) {
        nextHandle.destroy();
        return;
      }
      handle = nextHandle;
      handleRef.current = nextHandle;
    });
    return () => {
      disposed = true;
      handleRef.current = null;
      handle?.destroy();
    };
  }, []);

  useEffect(() => {
    const visibleLimit =
      visibilityMode === "LAST_5" ? 5 : visibilityMode === "LAST_10" ? 10 : null;
    handleRef.current?.setVisibleEventLimit(visibleLimit);
  }, [visibilityMode]);

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

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100dvw",
        height: "100dvh",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0f0c",
        overflow: "hidden",
      }}
    >
      <div
        ref={floatingControlsRef}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {isPickerOpen ? (
          <div
            style={{
              position: "fixed",
              right: 16,
              bottom: 90,
              display: "flex",
              flexDirection: "column",
              gap: 7,
              padding: 7,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(10, 20, 35, 0.75)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              boxShadow: "0 8px 18px rgba(4, 12, 24, 0.26)",
              width: "min(calc(100vw - 32px), 420px)",
            }}
          >
            {EVENT_GROUPS.map((group, groupIndex) => (
              <div
                key={group.title}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    lineHeight: 1.1,
                    color: "#cbd5e1",
                    opacity: 0.8,
                    paddingLeft: 2,
                    letterSpacing: 0.28,
                    textTransform: "uppercase",
                  }}
                >
                  {group.title}
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: group.columns,
                    gap: 4,
                    padding: "1px 0",
                  }}
                >
                  {group.items.map((item) => {
                    const isActive = item.kind === selectedEventKind;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          selectEventKind(item.kind);
                        }}
                        style={{
                          border: isActive
                            ? "1px solid rgba(34,197,94,0.96)"
                            : groupIndex === 0
                              ? "1px solid rgba(148,163,184,0.5)"
                              : "1px solid rgba(148,163,184,0.36)",
                          borderRadius: 8,
                          background: isActive
                            ? "rgba(22,101,52,0.68)"
                            : groupIndex === 0
                              ? "rgba(21, 39, 62, 0.84)"
                              : "rgba(14, 24, 40, 0.72)",
                          color: "#e2e8f0",
                          fontSize: 10,
                          fontWeight: isActive ? 700 : 600,
                          lineHeight: 1.1,
                          padding: "6px 4px",
                          cursor: "pointer",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          minHeight: 30,
                          letterSpacing: 0.25,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: 1,
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              {([
                { id: "ALL", label: "SHOW ALL" },
                { id: "LAST_5", label: "Last 5" },
                { id: "LAST_10", label: "Last 10" },
              ] as const).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setVisibilityMode(mode.id);
                  }}
                  style={{
                    border:
                      visibilityMode === mode.id
                        ? "1px solid rgba(125,211,252,0.9)"
                        : "1px solid rgba(148,163,184,0.4)",
                    borderRadius: 999,
                    background:
                      visibilityMode === mode.id
                        ? "rgba(14,116,144,0.42)"
                        : "rgba(15,23,42,0.9)",
                    color: "#e2e8f0",
                    fontSize: 10,
                    fontWeight: 600,
                    lineHeight: 1.1,
                    padding: "4px 7px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    letterSpacing: 0.25,
                    textTransform: "uppercase",
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  handleRef.current?.undoLastEvent();
                  setIsPickerOpen(false);
                }}
                style={{
                  border: "1px solid rgba(148,163,184,0.4)",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.9)",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  padding: "5px 8px",
                  cursor: "pointer",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  letterSpacing: 0.25,
                  textTransform: "uppercase",
                }}
              >
                UNDO LAST
              </button>
            </div>
          </div>
        ) : null}
        <div
          aria-live="polite"
          style={{
            border: "1px solid rgba(148,163,184,0.35)",
            borderRadius: 999,
            background: "rgba(15,23,42,0.72)",
            color: "#cbd5e1",
            fontSize: 10,
            fontWeight: 600,
            padding: "4px 8px",
            lineHeight: 1,
            whiteSpace: "nowrap",
            letterSpacing: 0.25,
          }}
        >
          {EVENT_LABEL_BY_KIND[selectedEventKind]}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsPickerOpen((prev) => !prev);
          }}
          aria-label="Toggle event picker"
          aria-expanded={isPickerOpen}
          style={{
            width: 48,
            height: 48,
            borderRadius: "999px",
            border: isPickerOpen
              ? "1px solid rgba(34,197,94,0.78)"
              : "1px solid rgba(148,163,184,0.45)",
            background: "rgba(15,23,42,0.76)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            color: "#e2e8f0",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
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
