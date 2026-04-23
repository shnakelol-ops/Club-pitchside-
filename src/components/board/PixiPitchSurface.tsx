"use client";

import { useEffect, useMemo, useRef } from "react";
import { Application, Container, Graphics } from "pixi.js";

import type { PitchSport } from "../../lib/pitch/pitch-config";
import { mountGaelicPitchRenderer } from "../../lib/pixi/gaelic-pitch-renderer";
import { BOARD_PITCH_VIEWBOX } from "../../lib/pitch/pitch-space";
import { viewportCssToBoardNorm } from "../../lib/coordinates/pitch-coordinates";
import type { StatsPitchTapPayload } from "../../lib/events/stats-pitch-tap";
import type { StatsLoggedEvent } from "../../lib/events/stats-logged-event";
import type { StatsReviewMode } from "../../lib/events/stats-v1-event-kind";
import { drawStatsEventsPixi } from "../../lib/stats/draw-stats-events-pixi";

export type PixiPitchSurfaceProps = {
  sport?: PitchSport;
  statsArm?: unknown;
  statsLoggedEvents?: readonly StatsLoggedEvent[];
  onStatsPitchTap?: (payload: StatsPitchTapPayload) => void;
  statsReviewMode?: StatsReviewMode;
  statsPitchInteractive?: boolean;
};

type PixiApp = import("pixi.js").Application;
type PixiContainer = import("pixi.js").Container;

export function PixiPitchSurface({
  sport = "gaelic",
  statsLoggedEvents = [],
  onStatsPitchTap,
  statsReviewMode = "live",
  statsPitchInteractive = true,
}: PixiPitchSurfaceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PixiApp | null>(null);
  const worldRef = useRef<PixiContainer | null>(null);
  const pitchHolderRef = useRef<PixiContainer | null>(null);
  const statsDotsRef = useRef<Graphics | null>(null);
  const statsHitRef = useRef<Graphics | null>(null);
  const worldScaleRef = useRef(1);

  const canLog = useMemo(
    () => statsPitchInteractive && typeof onStatsPitchTap === "function",
    [onStatsPitchTap, statsPitchInteractive],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let pitchDispose: (() => void) | null = null;

    const layout = () => {
      const app = appRef.current;
      const world = worldRef.current;
      const hostEl = hostRef.current;
      if (!app || !world || !hostEl) return;
      const w = hostEl.clientWidth;
      const h = hostEl.clientHeight;
      if (w <= 0 || h <= 0) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      app.renderer.resolution = dpr;
      app.renderer.resize(w, h);
      const scale = Math.min(
        w / BOARD_PITCH_VIEWBOX.w,
        h / BOARD_PITCH_VIEWBOX.h,
      );
      const offsetX = (w - BOARD_PITCH_VIEWBOX.w * scale) / 2;
      const offsetY = (h - BOARD_PITCH_VIEWBOX.h * scale) / 2;
      worldScaleRef.current = scale;
      world.scale.set(scale);
      world.position.set(offsetX, offsetY);
      if (statsDotsRef.current) {
        drawStatsEventsPixi(statsDotsRef.current, statsLoggedEvents, {
          reviewMode: statsReviewMode,
          worldToScreenScale: worldScaleRef.current,
        });
      }
    };

    void (async () => {
      const app = new Application();
      await app.init({
        width: host.clientWidth || 640,
        height: host.clientHeight || 400,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
      });

      if (cancelled) {
        app.destroy(true);
        return;
      }

      appRef.current = app;
      host.appendChild(app.canvas as HTMLCanvasElement);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";
      app.canvas.style.touchAction = "none";
      app.canvas.style.userSelect = "none";

      const world = new Container();
      worldRef.current = world;
      app.stage.addChild(world);

      const pitchHolder = new Container();
      pitchHolderRef.current = pitchHolder;
      world.addChild(pitchHolder);

      const statsLayer = new Container();
      const statsHit = new Graphics();
      statsHit
        .rect(0, 0, BOARD_PITCH_VIEWBOX.w, BOARD_PITCH_VIEWBOX.h)
        .fill({ color: 0xffffff, alpha: 0.0001 });
      statsHit.eventMode = canLog ? "static" : "none";

      const statsDots = new Graphics();
      statsDots.eventMode = "none";

      statsLayer.addChild(statsHit);
      statsLayer.addChild(statsDots);
      world.addChild(statsLayer);
      statsHitRef.current = statsHit;
      statsDotsRef.current = statsDots;

      statsHit.on("pointerdown", (e) => {
        if (!canLog) return;
        const fire = onStatsPitchTap;
        if (!fire) return;
        e.stopPropagation();
        const hostEl = hostRef.current;
        if (!hostEl) return;
        const r = hostEl.getBoundingClientRect();
        const stageX = e.clientX - r.left;
        const stageY = e.clientY - r.top;
        const { nx, ny } = viewportCssToBoardNorm(
          stageX,
          stageY,
          r.width,
          r.height,
        );
        fire({
          nx,
          ny,
          atMs: Date.now(),
          stageX,
          stageY,
        });
      });

      const { root, dispose } = mountGaelicPitchRenderer(
        sport === "soccer" ? "gaelic" : sport,
      );
      pitchDispose = dispose;
      pitchHolder.addChild(root);

      drawStatsEventsPixi(statsDots, statsLoggedEvents, {
        reviewMode: statsReviewMode,
        worldToScreenScale: worldScaleRef.current,
      });

      layout();
      resizeObserver = new ResizeObserver(() => layout());
      resizeObserver.observe(host);
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      pitchDispose?.();
      statsDotsRef.current = null;
      statsHitRef.current = null;
      pitchHolderRef.current = null;
      const app = appRef.current;
      appRef.current = null;
      worldRef.current = null;
      if (app) {
        try {
          host.removeChild(app.canvas as HTMLCanvasElement);
        } catch {
          // canvas already detached
        }
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, [canLog, onStatsPitchTap, sport, statsLoggedEvents, statsReviewMode]);

  useEffect(() => {
    if (statsHitRef.current) {
      statsHitRef.current.eventMode = canLog ? "static" : "none";
    }
  }, [canLog]);

  useEffect(() => {
    if (statsDotsRef.current) {
      drawStatsEventsPixi(statsDotsRef.current, statsLoggedEvents, {
        reviewMode: statsReviewMode,
        worldToScreenScale: worldScaleRef.current,
      });
    }
  }, [statsLoggedEvents, statsReviewMode]);

  return (
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
      aria-label="PitchsideCLUB Pixi board"
      role="img"
    />
  );
}
