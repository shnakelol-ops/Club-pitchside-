import { useEffect, useRef } from "react";

import { createV2TacticalSurface } from "../../renderer/pixi/surface/createV2TacticalSurface";

export default function VisionLabsV2Page() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void createV2TacticalSurface(host).then((surface) => {
      if (disposed) {
        surface.destroy();
        return;
      }
      cleanup = () => surface.destroy();
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#08120f",
        padding: 8,
        boxSizing: "border-box",
      }}
    >
      <div
        ref={hostRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12,
          overflow: "hidden",
          background: "#0f1f1a",
        }}
      />
    </div>
  );
}
