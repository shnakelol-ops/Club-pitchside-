import { useEffect, useRef } from "react";

import { createPixiPitchSurface } from "./core/pitch/create-pixi-pitch-surface";
import {
  MATCH_EVENT_KINDS,
  type MatchEventKind,
} from "./core/stats/stats-event-model";

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectedEventRef = useRef<MatchEventKind>("POINT");
  const handleRef = useRef<{
    destroy: () => void;
    setActiveEventKind: (kind: MatchEventKind) => void;
  } | null>(null);

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

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: 16,
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 20,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          maxWidth: "calc(100vw - 24px)",
        }}
      >
        {MATCH_EVENT_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              selectedEventRef.current = kind;
              handleRef.current?.setActiveEventKind(kind);
            }}
            style={{
              border: "1px solid rgba(148,163,184,0.45)",
              borderRadius: 8,
              background: "rgba(15,23,42,0.85)",
              color: "#e2e8f0",
              fontSize: 11,
              padding: "6px 8px",
              cursor: "pointer",
            }}
          >
            {kind}
          </button>
        ))}
      </div>
      <div
        ref={hostRef}
        style={{
          width: "min(calc(100vw - 32px), calc((100vh - 32px) * (35 / 24)))",
          maxWidth: "100%",
          maxHeight: "calc(100vh - 32px)",
          aspectRatio: "35 / 24",
          borderRadius: "12px",
          background: "#0a0f0c",
          overflow: "hidden",
        }}
        aria-label="PitchsideCLUB Pixi pitch"
        role="img"
      />
    </main>
  );
}
