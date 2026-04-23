import { useEffect, useRef, useState } from "react";

import { createPixiPitchSurface } from "./core/pitch/create-pixi-pitch-surface";
import {
  MATCH_EVENT_KINDS,
  type MatchEventKind,
} from "./core/stats/stats-event-model";

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const floatingControlsRef = useRef<HTMLDivElement>(null);
  const [selectedEventKind, setSelectedEventKind] = useState<MatchEventKind>("POINT");
  const selectedEventRef = useRef<MatchEventKind>("POINT");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const handleRef = useRef<{
    destroy: () => void;
    setActiveEventKind: (kind: MatchEventKind) => void;
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
