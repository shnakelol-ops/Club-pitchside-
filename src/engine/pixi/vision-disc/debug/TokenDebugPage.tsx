import { useEffect, useMemo, useRef } from "react";

import { createTokenDebugSurface, sanitizeTokenDebugView } from "./tokenDebugSurface";
import "./tokenDebugPage.css";

export default function TokenDebugPage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const view = useMemo(() => sanitizeTokenDebugView(new URLSearchParams(window.location.search).get("view")), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let disposed = false;
    let destroySurface: (() => void) | null = null;
    void createTokenDebugSurface(host, view).then((surface) => {
      if (disposed) {
        surface.destroy();
        return;
      }
      destroySurface = surface.destroy;
    });
    return () => {
      disposed = true;
      destroySurface?.();
      host.replaceChildren();
    };
  }, [view]);

  return (
    <main className="token-debug-page">
      <section className="token-debug-shell" aria-label="Pixi and Phosphor token debug comparison">
        <div className="token-debug-route-note">
          <strong>/token-debug</strong>
          <span>Debug-only token renderer comparison. Pixi + Phosphor only.</span>
          <nav aria-label="Token debug views">
            <a aria-current={view === "full" ? "page" : undefined} href="/token-debug">
              full comparison
            </a>
            <a aria-current={view === "stress" ? "page" : undefined} href="/token-debug?view=stress">
              15v15 stress
            </a>
            <a aria-current={view === "close" ? "page" : undefined} href="/token-debug?view=close">
              close-up
            </a>
            <a aria-current={view === "zoom" ? "page" : undefined} href="/token-debug?view=zoom">
              zoomed-out
            </a>
          </nav>
        </div>
        <div ref={hostRef} className="token-debug-canvas-host" />
      </section>
    </main>
  );
}
