import { Application, Container, Graphics } from "pixi.js";

import { BOARD_PITCH_VIEWBOX } from "./pitch-space";
import { createPitchRoot } from "./create-pitch-root";
import {
  letterboxPitchWorld,
  viewportCssToBoardNorm,
} from "../coordinates/pitch-coordinates";
import { drawStatsMarkers } from "../stats/draw-stats-markers";
import {
  createMatchEvent,
  type MatchEvent,
  type MatchEventKind,
} from "../stats/stats-event-model";
import { createMatchEventStore } from "../stats/match-event-store";

export type CreatePixiPitchSurfaceOptions = {
  sport: "soccer" | "gaelic" | "hurling";
  events?: readonly MatchEvent[];
  activeEventKind?: MatchEventKind;
  onPitchTap?: (nx: number, ny: number) => void;
};

export type PixiPitchSurfaceHandle = {
  setEvents: (events: readonly MatchEvent[]) => void;
  setActiveEventKind: (kind: MatchEventKind) => void;
  destroy: () => void;
};

function fitWorld(host: HTMLElement, app: Application, world: Container): void {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (width <= 0 || height <= 0) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  app.renderer.resolution = dpr;
  app.renderer.resize(width, height);

  const scale = Math.min(
    width / BOARD_PITCH_VIEWBOX.w,
    height / BOARD_PITCH_VIEWBOX.h,
  );
  const { offsetX, offsetY } = letterboxPitchWorld(width, height);
  world.scale.set(scale, scale);
  world.position.set(offsetX, offsetY);
}

export async function createPixiPitchSurface(
  host: HTMLElement,
  options: CreatePixiPitchSurfaceOptions,
): Promise<PixiPitchSurfaceHandle> {
  const app = new Application();
  await app.init({
    width: host.clientWidth || 640,
    height: host.clientHeight || 400,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });

  host.appendChild(app.canvas as HTMLCanvasElement);
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  app.canvas.style.display = "block";
  app.canvas.style.touchAction = "none";
  app.canvas.style.userSelect = "none";

  const world = new Container();
  app.stage.addChild(world);

  const pitchRoot = createPitchRoot(options.sport);
  world.addChild(pitchRoot.root);
  const statsMarkers = new Graphics();
  statsMarkers.eventMode = "none";
  world.addChild(statsMarkers);

  const eventStore = createMatchEventStore(options.events ?? []);
  let eventsState: readonly MatchEvent[] = eventStore.getAll();
  let activeEventKindState: MatchEventKind = options.activeEventKind ?? "POINT";
  const onPitchTapState = options.onPitchTap;

  const redrawMarkers = () => {
    drawStatsMarkers(statsMarkers, eventsState);
  };

  const hitArea = new Graphics();
  hitArea
    .rect(0, 0, BOARD_PITCH_VIEWBOX.w, BOARD_PITCH_VIEWBOX.h)
    .fill({ color: 0xffffff, alpha: 0.0001 });
  hitArea.eventMode = "static";
  hitArea.zIndex = 100;
  world.addChild(hitArea);
  world.sortableChildren = true;
  world.sortChildren();

  hitArea.on("pointerdown", (event) => {
    const rect = host.getBoundingClientRect();
    const hostX = event.clientX - rect.left;
    const hostY = event.clientY - rect.top;
    const { nx, ny } = viewportCssToBoardNorm(hostX, hostY, rect.width, rect.height);

    if (onPitchTapState) {
      onPitchTapState(nx, ny);
      return;
    }

    const nextEvent: MatchEvent = createMatchEvent({
      kind: activeEventKindState,
      nx,
      ny,
      timestampMs: Date.now(),
    });
    eventStore.add(nextEvent);
    eventsState = eventStore.getAll();
    redrawMarkers();
  });

  const resizeObserver = new ResizeObserver(() => fitWorld(host, app, world));
  resizeObserver.observe(host);
  fitWorld(host, app, world);
  redrawMarkers();

  return {
    setEvents: (events) => {
      eventStore.clear();
      for (const event of events) eventStore.add(event);
      eventsState = eventStore.getAll();
      redrawMarkers();
    },
    setActiveEventKind: (kind) => {
      activeEventKindState = kind;
    },
    destroy: () => {
      resizeObserver.disconnect();
      pitchRoot.dispose();
      hitArea.destroy();
      statsMarkers.destroy();
      try {
        host.removeChild(app.canvas as HTMLCanvasElement);
      } catch {
        // canvas may already be detached
      }
      app.destroy(true, { children: true, texture: true });
    },
  };
}

