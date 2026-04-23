import { useEffect, useRef, useState } from "react";

import { createPixiPitchSurface } from "./core/pitch/create-pixi-pitch-surface";
import {
  MATCH_EVENT_KINDS,
  type MatchEvent,
  type MatchEventKind,
} from "./core/stats/stats-event-model";

type VisibilityMode = "ALL" | "LAST_5" | "LAST_10";

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const floatingControlsRef = useRef<HTMLDivElement>(null);
  const [selectedEventKind, setSelectedEventKind] = useState<MatchEventKind>("POINT");
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("ALL");
  const selectedEventRef = useRef<MatchEventKind>("POINT");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const allEventsRef = useRef<MatchEvent[]>([]);
  const handleRef = useRef<{
    destroy: () => void;
    setActiveEventKind: (kind: MatchEventKind) => void;
    undoLastEvent: () => void;
    setEvents: (events: readonly MatchEvent[]) => void;
  } | null>(null);

  const getVisibleEvents = (
    events: readonly MatchEvent[],
    mode: VisibilityMode,
  ): MatchEvent[] => {
    if (mode === "LAST_5") return events.slice(-5);
    if (mode === "LAST_10") return events.slice(-10);
    return [...events];
  };

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
    const host = hostRef.current;
    if (!host) return;

    const onPitchTap = (event: PointerEvent) => {
      const appCanvas = host.querySelector("canvas");
      if (!appCanvas || event.target !== appCanvas) return;
      if (floatingControlsRef.current?.contains(event.target as Node)) return;

      const kind = selectedEventRef.current;
      const nx = 0; // placeholder to satisfy type narrowing if needed
      void nx;
      const now = Date.now();
      const rect = host.getBoundingClientRect();
      const hostX = event.clientX - rect.left;
      const hostY = event.clientY - rect.top;
      const normalizedX = rect.width > 0 ? hostX / rect.width : 0.5;
      const normalizedY = rect.height > 0 ? hostY / rect.height : 0.5;
      allEventsRef.current = [
        ...allEventsRef.current,
        {
          id: `evt-${now}-${Math.random().toString(36).slice(2, 8)}`,
          kind,
          nx: Math.max(0, Math.min(1, normalizedX)),
          ny: Math.max(0, Math.min(1, normalizedY)),
          timestampMs: now,
        },
      ];
      handleRef.current?.setEvents(
        getVisibleEvents(allEventsRef.current, visibilityMode),
      );
    };

    host.addEventListener("pointerdown", onPitchTap);
    return () => {
      host.removeEventListener("pointerdown", onPitchTap);
    };
  }, [visibilityMode]);

  useEffect(() => {
    handleRef.current?.setEvents(getVisibleEvents(allEventsRef.current, visibilityMode));
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
          right: 12,
          bottom: 12,
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
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: 8,
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.72)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            {MATCH_EVENT_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  selectEventKind(kind);
                }}
                style={{
                  border:
                    kind === selectedEventKind
                      ? "1px solid rgba(34,197,94,0.82)"
                      : "1px solid rgba(148,163,184,0.4)",
                  borderRadius: 8,
                  background:
                    kind === selectedEventKind
                      ? "rgba(22,101,52,0.52)"
                      : "rgba(15,23,42,0.9)",
                  color: "#e2e8f0",
                  fontSize: 11,
                  fontWeight: kind === selectedEventKind ? 700 : 500,
                  lineHeight: 1.2,
                  padding: "6px 8px",
                  cursor: "pointer",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {kind === selectedEventKind ? `✓ ${kind}` : kind}
              </button>
            ))}
            <div
              style={{
                marginTop: 2,
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              {([
                { id: "ALL", label: "Show All" },
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
                    padding: "5px 8px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                handleRef.current?.undoLastEvent();
                allEventsRef.current = allEventsRef.current.slice(0, -1);
                handleRef.current?.setEvents(
                  getVisibleEvents(allEventsRef.current, visibilityMode),
                );
                setIsPickerOpen(false);
              }}
              style={{
                marginTop: 2,
                border: "1px solid rgba(148,163,184,0.4)",
                borderRadius: 8,
                background: "rgba(15,23,42,0.9)",
                color: "#cbd5e1",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.2,
                padding: "6px 8px",
                cursor: "pointer",
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
            >
              Undo last
            </button>
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
          {selectedEventKind}
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
