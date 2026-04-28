import { useEffect, useMemo, useRef, useState } from "react";

import {
  createTacticalPadLiteSurface,
  type TacticalPadLiteSurface,
} from "../engine/pixi/createTacticalPadLiteSurface";
import "./tactical-pad-lite-shell.css";

function isLandscapeViewport(): boolean {
  return window.innerWidth > window.innerHeight;
}

export default function TacticalPadLitePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<TacticalPadLiteSurface | null>(null);
  const [phaseCount, setPhaseCount] = useState(0);
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window === "undefined" ? false : isLandscapeViewport(),
  );
  const [isToolsOpen, setIsToolsOpen] = useState(() =>
    typeof window === "undefined" ? false : isLandscapeViewport(),
  );

  const phaseDots = useMemo(() => Array.from({ length: phaseCount }, (_, index) => index + 1), [phaseCount]);
  const buttonClass = "tactical-pad-lite__button";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let destroySurface: (() => void) | null = null;

    void createTacticalPadLiteSurface(host, {
      onPhaseCountChange: (count) => {
        if (!disposed) {
          setPhaseCount(count);
        }
      },
    }).then((surface) => {
      if (disposed) {
        surface.destroy();
        return;
      }
      surfaceRef.current = surface;
      destroySurface = surface.destroy;
    });

    return () => {
      disposed = true;
      surfaceRef.current = null;
      destroySurface?.();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const landscape = isLandscapeViewport();
      setIsLandscape(landscape);
      setIsToolsOpen((previous) => (landscape ? previous : false));
      if (landscape) {
        setIsToolsOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const rootClassName = [
    "tactical-pad-lite",
    isLandscape ? "is-landscape" : "is-portrait",
    isToolsOpen ? "is-tools-open" : "is-tools-closed",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div className="tactical-pad-lite__layout">
        <section className="tactical-pad-lite__pitch-column">
          <div className="tactical-pad-lite__pitch-shell">
            <div ref={hostRef} className="tactical-pad-lite__pitch-host" />
          </div>
          <section className="tactical-pad-lite__playback-strip" aria-label="Playback controls">
            <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.play()}>
              Play
            </button>
            <button type="button" className={`${buttonClass} tactical-pad-lite__button--muted`} disabled>
              Pause
            </button>
            <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.reset()}>
              Reset
            </button>
          </section>
        </section>

        <aside className="tactical-pad-lite__tools-column" aria-label="Edit tools">
          <div className={`tactical-pad-lite__tools-panel ${isToolsOpen ? "is-open" : ""}`}>
            <div className="tactical-pad-lite__tools-inner">
              <div className="tactical-pad-lite__drawer-row">
                <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.setStart()}>
                  Set Start
                </button>
                <button type="button" className={buttonClass} onClick={() => surfaceRef.current?.addPhase()}>
                  Add Phase
                </button>
                <div className="tactical-pad-lite__phase-count">Phases: {phaseCount}</div>
              </div>
              <div className="tactical-pad-lite__phase-dots-scroll">
                <div className="tactical-pad-lite__phase-dots">
                  {phaseDots.length > 0 ? (
                    phaseDots.map((phase) => (
                      <span key={phase} className="tactical-pad-lite__phase-dot" aria-label={`Phase ${phase}`}>
                        {phase}
                      </span>
                    ))
                  ) : (
                    <span className="tactical-pad-lite__phase-dot tactical-pad-lite__phase-dot--placeholder">No phases</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <button
        type="button"
        className="tactical-pad-lite__hamburger"
        aria-label={isToolsOpen ? "Close tactical tools menu" : "Open tactical tools menu"}
        aria-expanded={isToolsOpen}
        onClick={() => setIsToolsOpen((isOpen) => !isOpen)}
      >
        <span className="tactical-pad-lite__hamburger-icon" aria-hidden="true">
          {isToolsOpen ? "×" : "☰"}
        </span>
      </button>
    </div>
  );
}
