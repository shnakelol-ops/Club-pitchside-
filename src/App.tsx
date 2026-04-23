import { useEffect, useRef } from "react";

import { createPixiPitchSurface } from "./core/pitch/create-pixi-pitch-surface";

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let handle: { destroy: () => void } | null = null;
    void createPixiPitchSurface(host, { sport: "gaelic" }).then((nextHandle) => {
      if (disposed) {
        nextHandle.destroy();
        return;
      }
      handle = nextHandle;
    });
    return () => {
      disposed = true;
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
        ref={hostRef}
        style={{
          width: "100%",
          maxWidth: "1100px",
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
