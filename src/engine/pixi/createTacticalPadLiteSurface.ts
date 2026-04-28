import { Application, Container, Graphics, Text } from "pixi.js";

import { createWorldViewport } from "./createWorldViewport";
import {
  NORMALIZED_MAX,
  NORMALIZED_MIN,
  type NormalizedPoint,
} from "../shared/normalization";

type TacticalPlayer = {
  id: "P1" | "P2" | "P3";
  number: number;
  current: NormalizedPoint;
  start: NormalizedPoint;
  target: NormalizedPoint;
  token: Container;
};

export type TacticalPlayerPositionSnapshot = {
  id: TacticalPlayer["id"];
  current: NormalizedPoint;
};

type TacticalPlayerId = TacticalPlayer["id"];
type TacticalPlayerPositionMap = Record<TacticalPlayerId, NormalizedPoint>;

export type TacticalPadLiteSurface = {
  setStart: () => void;
  play: () => void;
  reset: () => void;
  getCurrentPlayerPositions: () => TacticalPlayerPositionSnapshot[];
  destroy: () => void;
};

const WORLD_SIZE = { width: 160, height: 100 } as const;
const PLAYER_RADIUS = 4.1;
const PLAYER_TOUCH_HIT_DIAMETER_PX = 48;

const INITIAL_PLAYERS: Array<{ id: "P1" | "P2" | "P3"; number: number; position: NormalizedPoint }> = [
  { id: "P1", number: 1, position: { x: 30, y: 50 } },
  { id: "P2", number: 2, position: { x: 50, y: 50 } },
  { id: "P3", number: 3, position: { x: 70, y: 50 } },
];

function clampWorld(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

function drawPitchBackground(pitch: Graphics): void {
  pitch.clear();
  pitch.roundRect(0, 0, WORLD_SIZE.width, WORLD_SIZE.height, 3.5).fill({ color: 0x204e39 });

  pitch.roundRect(0.8, 0.8, WORLD_SIZE.width - 1.6, WORLD_SIZE.height - 1.6, 2.9).stroke({
    color: 0xe2f7ea,
    alpha: 0.95,
    width: 0.6,
  });

  const centerLineX = WORLD_SIZE.width * 0.5;
  pitch.moveTo(centerLineX, 1.4).lineTo(centerLineX, WORLD_SIZE.height - 1.4).stroke({
    color: 0xe2f7ea,
    alpha: 0.85,
    width: 0.45,
  });

  pitch.circle(centerLineX, WORLD_SIZE.height * 0.5, 9.5).stroke({
    color: 0xe2f7ea,
    alpha: 0.8,
    width: 0.45,
  });
}

function createPlayerToken(number: number): Container {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";

  const shadow = new Graphics();
  shadow.ellipse(0.7, 3.4, PLAYER_RADIUS * 0.92, PLAYER_RADIUS * 0.58).fill({
    color: 0x020706,
    alpha: 0.25,
  });
  token.addChild(shadow);

  const jersey = new Graphics();
  jersey.circle(0, 0, PLAYER_RADIUS).fill({ color: 0x2f80ed, alpha: 1 });
  jersey.roundRect(-1.65, -PLAYER_RADIUS - 1.6, 3.3, 2.35, 0.8).fill({
    color: 0x4ea0ff,
    alpha: 0.92,
  });
  jersey.circle(0, 0, PLAYER_RADIUS).stroke({
    color: 0xe5f2ff,
    alpha: 0.96,
    width: 0.5,
  });
  token.addChild(jersey);

  const numberLabel = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: 3.1,
      fontWeight: "700",
      align: "center",
      fontFamily: "Inter, system-ui, sans-serif",
    },
  });
  numberLabel.anchor.set(0.5, 0.54);
  token.addChild(numberLabel);

  return token;
}

function setPlayerTouchHitArea(
  player: TacticalPlayer,
  mapper: ReturnType<typeof createWorldViewport>,
): void {
  const touchRadiusInWorld = (PLAYER_TOUCH_HIT_DIAMETER_PX * 0.5) / mapper.transform.scale;
  const hitRadius = Math.max(PLAYER_RADIUS, touchRadiusInWorld);
  const hitRadiusSquared = hitRadius * hitRadius;
  player.token.hitArea = {
    contains: (x: number, y: number) => x * x + y * y <= hitRadiusSquared,
  };
}

function setTokenWorldPosition(player: TacticalPlayer, mapper: ReturnType<typeof createWorldViewport>): void {
  const world = mapper.normalizedToWorld(player.current);
  player.token.position.set(world.x, world.y);
}

export async function createTacticalPadLiteSurface(host: HTMLElement): Promise<TacticalPadLiteSurface> {
  const app = new Application();
  await app.init({
    width: host.clientWidth || 800,
    height: host.clientHeight || 520,
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

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const world = new Container();
  app.stage.addChild(world);

  const pitch = new Graphics();
  world.addChild(pitch);
  drawPitchBackground(pitch);

  const playersLayer = new Container();
  world.addChild(playersLayer);

  let mapper = createWorldViewport(
    WORLD_SIZE,
    { width: host.clientWidth || 800, height: host.clientHeight || 520 },
  );

  const players: TacticalPlayer[] = INITIAL_PLAYERS.map((base) => {
    const token = createPlayerToken(base.number);
    playersLayer.addChild(token);
    return {
      id: base.id,
      number: base.number,
      current: { ...base.position },
      start: { ...base.position },
      target: { ...base.position },
      token,
    };
  });

  const PLAY_DURATION_MS = 1200;
  let isPlaying = false;
  let playElapsedMs = 0;
  let playStartPositions: TacticalPlayerPositionMap = {
    P1: { ...players[0].current },
    P2: { ...players[1].current },
    P3: { ...players[2].current },
  };
  let playTargetPositions: TacticalPlayerPositionMap = {
    P1: { ...players[0].current },
    P2: { ...players[1].current },
    P3: { ...players[2].current },
  };
  let startPositions: TacticalPlayerPositionMap = {
    P1: { ...players[0].current },
    P2: { ...players[1].current },
    P3: { ...players[2].current },
  };
  let targetPositions: TacticalPlayerPositionMap = {
    P1: { ...players[0].current },
    P2: { ...players[1].current },
    P3: { ...players[2].current },
  };

  let activeDrag:
    | {
        player: TacticalPlayer;
      }
    | null = null;

  function cloneNormalizedPoint(point: NormalizedPoint): NormalizedPoint {
    return { x: point.x, y: point.y };
  }

  function clonePositionMap(source: TacticalPlayerPositionMap): TacticalPlayerPositionMap {
    return {
      P1: cloneNormalizedPoint(source.P1),
      P2: cloneNormalizedPoint(source.P2),
      P3: cloneNormalizedPoint(source.P3),
    };
  }

  function readCurrentPositions(): TacticalPlayerPositionMap {
    const snapshot = {} as TacticalPlayerPositionMap;
    for (const player of players) {
      snapshot[player.id] = cloneNormalizedPoint(player.current);
    }
    return snapshot;
  }

  function applyCurrentPositions(snapshot: TacticalPlayerPositionMap): void {
    for (const player of players) {
      player.current = cloneNormalizedPoint(snapshot[player.id]);
      setTokenWorldPosition(player, mapper);
    }
  }

  function applyStartPositions(snapshot: TacticalPlayerPositionMap): void {
    for (const player of players) {
      player.start = cloneNormalizedPoint(snapshot[player.id]);
    }
  }

  function applyTargetPositions(snapshot: TacticalPlayerPositionMap): void {
    for (const player of players) {
      player.target = cloneNormalizedPoint(snapshot[player.id]);
    }
  }

  function cancelPlayback(): void {
    isPlaying = false;
    playElapsedMs = 0;
  }

  function positionsEqual(a: NormalizedPoint, b: NormalizedPoint): boolean {
    return a.x === b.x && a.y === b.y;
  }

  function fitToHost(): void {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width <= 0 || height <= 0) return;

    app.renderer.resolution = Math.min(2, window.devicePixelRatio || 1);
    app.renderer.resize(width, height);

    mapper = createWorldViewport(WORLD_SIZE, { width, height });
    world.scale.set(mapper.transform.scale, mapper.transform.scale);
    world.position.set(mapper.transform.offsetX, mapper.transform.offsetY);

    for (const player of players) {
      setPlayerTouchHitArea(player, mapper);
      setTokenWorldPosition(player, mapper);
    }
  }

  function updateDraggedPlayerFromEvent(event: unknown): void {
    if (!activeDrag || isPlaying) return;

    const stagePoint = (event as {
      data?: { getLocalPosition?: (target: Container) => { x: number; y: number } };
      getLocalPosition?: (target: Container) => { x: number; y: number };
    }).data?.getLocalPosition?.(app.stage) ??
      (event as { getLocalPosition?: (target: Container) => { x: number; y: number } }).getLocalPosition?.(
        app.stage,
      );
    if (!stagePoint) return;

    const worldPoint = mapper.viewportToWorld({ x: stagePoint.x, y: stagePoint.y });
    const boundedWorld = {
      x: clampWorld(worldPoint.x, WORLD_SIZE.width),
      y: clampWorld(worldPoint.y, WORLD_SIZE.height),
    };

    const normalized = mapper.worldToNormalized(boundedWorld);
    activeDrag.player.current = {
      x: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, normalized.x)),
      y: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, normalized.y)),
    };
    const playerTarget = cloneNormalizedPoint(activeDrag.player.current);
    activeDrag.player.target = playerTarget;
    targetPositions[activeDrag.player.id] = cloneNormalizedPoint(playerTarget);
    setTokenWorldPosition(activeDrag.player, mapper);
  }

  function releaseDrag(): void {
    if (!activeDrag) return;
    activeDrag.player.token.cursor = "grab";
    activeDrag = null;
  }

  function stepPlayback(deltaMs: number): void {
    if (!isPlaying) return;
    playElapsedMs += deltaMs;
    const progress = Math.max(0, Math.min(1, playElapsedMs / PLAY_DURATION_MS));

    for (const player of players) {
      const playStart = playStartPositions[player.id];
      const playTarget = playTargetPositions[player.id];
      player.current = {
        x: playStart.x + (playTarget.x - playStart.x) * progress,
        y: playStart.y + (playTarget.y - playStart.y) * progress,
      };
      setTokenWorldPosition(player, mapper);
    }

    if (progress >= 1) {
      applyCurrentPositions(playTargetPositions);
      cancelPlayback();
    }
  }

  for (const player of players) {
    setPlayerTouchHitArea(player, mapper);
    setTokenWorldPosition(player, mapper);

    player.token.on("pointerdown", (event) => {
      if (isPlaying) return;
      activeDrag = { player };
      player.token.cursor = "grabbing";
      updateDraggedPlayerFromEvent(event);
      (event as { stopPropagation?: () => void }).stopPropagation?.();
    });
  }

  app.stage.on("pointermove", (event) => {
    updateDraggedPlayerFromEvent(event);
  });
  app.stage.on("pointerup", () => {
    releaseDrag();
  });
  app.stage.on("pointerupoutside", () => {
    releaseDrag();
  });
  app.ticker.add(() => {
    stepPlayback(app.ticker.deltaMS);
  });

  const resizeObserver = new ResizeObserver(() => {
    fitToHost();
  });
  resizeObserver.observe(host);
  fitToHost();

  return {
    setStart: () => {
      releaseDrag();
      cancelPlayback();

      // Snapshot current player positions as a fresh immutable start state.
      startPositions = readCurrentPositions();
      targetPositions = clonePositionMap(startPositions);
      applyStartPositions(startPositions);
      applyTargetPositions(targetPositions);
    },
    play: () => {
      releaseDrag();
      cancelPlayback();

      const currentPositions = readCurrentPositions();
      const hasCurrentOffsetFromStart = players.some(
        (player) => !positionsEqual(currentPositions[player.id], startPositions[player.id]),
      );
      if (hasCurrentOffsetFromStart) {
        // Preserve the latest dragged layout as animation target.
        targetPositions = clonePositionMap(currentPositions);
      }

      playStartPositions = clonePositionMap(startPositions);
      playTargetPositions = clonePositionMap(targetPositions);
      applyStartPositions(playStartPositions);
      applyTargetPositions(playTargetPositions);
      applyCurrentPositions(playStartPositions);

      isPlaying = true;
      playElapsedMs = 0;
    },
    reset: () => {
      releaseDrag();
      cancelPlayback();
      applyStartPositions(startPositions);
      applyCurrentPositions(startPositions);
    },
    getCurrentPlayerPositions: () =>
      players.map((player) => ({
        id: player.id,
        current: { ...player.current },
      })),
    destroy: () => {
      resizeObserver.disconnect();
      app.stage.removeAllListeners();
      app.ticker.stop();
      for (const player of players) {
        player.token.removeAllListeners();
      }
      try {
        host.removeChild(app.canvas as HTMLCanvasElement);
      } catch {
        // Canvas may already be detached.
      }
      app.destroy(true, { children: true, texture: true });
    },
  };
}
