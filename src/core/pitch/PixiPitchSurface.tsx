import { useEffect, useRef } from "react";
import { Application, Container } from "pixi.js";

import type { PitchSport } from "./pitch-config";
import { mountGaelicPitchRenderer } from "./gaelic-pitch-renderer";
import { BOARD_PITCH_VIEWBOX } from "./pitch-space";

export type PixiPitchSurfaceProps = {
  sport?: PitchSport;
};

export function PixiPitchSurface({ sport = "gaelic" }: PixiPitchSurfaceProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let pitchDispose: (() => void) | null = null;
    let app: Application | null = null;
    let world: Container | null = null;

    const layout = () => {
      if (!app || !world) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w <= 0 || h <= 0) return;

      app.renderer.resolution = Math.min(2, window.devicePixelRatio || 1);
      app.renderer.resize(w, h);

      const scale = Math.min(w / BOARD_PITCH_VIEWBOX.w, h / BOARD_PITCH_VIEWBOX.h);
      const offsetX = (w - BOARD_PITCH_VIEWBOX.w * scale) / 2;
      const offsetY = (h - BOARD_PITCH_VIEWBOX.h * scale) / 2;

      world.scale.set(scale);
      world.position.set(offsetX, offsetY);
    };

    void (async () => {
      app = new Application();
      await app.init({
        width: host.clientWidth || 640,
        height: host.clientHeight || 400,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
      });

      if (cancelled || !app) {
        app?.destroy(true);
        return;
      }

      host.appendChild(app.canvas as HTMLCanvasElement);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";

      world = new Container();
      app.stage.addChild(world);

      const { root, dispose } = mountGaelicPitchRenderer(
        sport === "soccer" ? "gaelic" : sport,
      );
      pitchDispose = dispose;
      world.addChild(root);

      layout();
      resizeObserver = new ResizeObserver(layout);
      resizeObserver.observe(host);
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      pitchDispose?.();

      if (app) {
        try {
          host.removeChild(app.canvas as HTMLCanvasElement);
        } catch {
          // Canvas was already detached.
        }
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, [sport]);

  return (
    <div
      ref={hostRef}
      style={{ width: "100%", height: "100%" }}
      aria-label="PitchsideCLUB Pixi pitch"
      role="img"
    />
  );
}
