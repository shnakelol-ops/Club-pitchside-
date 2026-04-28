import { Application, Container, Graphics, Text } from "pixi.js";

import { createWorldViewport } from "./createWorldViewport";
import {
  clampNormalizedPoint,
  NORMALIZED_MAX,
  NORMALIZED_MIN,
  type NormalizedPoint,
} from "../shared/normalization";

type TacticalPlayer = {
  id: "P1" | "P2" | "P3";
  number: number;
  position: NormalizedPoint;
  token: Container;
};

export type TacticalPadLiteSurface = {
  destroy: () => void;
};

const WORLD_SIZE = { width: 160, height: 100 } as const;
const PLAYER_RADIUS = 4.1;
const PATH_STROKE_WIDTH = 1.15;
const PATH_STROKE_COLOR = 0xffe07a;
const PATH_STROKE_ALPHA = 0.98;

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

function setTokenWorldPosition(player: TacticalPlayer, mapper: ReturnType<typeof createWorldViewport>): void {
  const world = mapper.normalizedToWorld(player.position);
  player.token.position.set(world.x, world.y);
}

function isWorldPointInsidePitch(point: { x: number; y: number }): boolean {
  return point.x >= 0 && point.x <= WORLD_SIZE.width && point.y >= 0 && point.y <= WORLD_SIZE.height;
}

function getStagePointFromEvent(event: unknown, stage: Container): { x: number; y: number } | null {
  const stagePoint = (event as {
    data?: { getLocalPosition?: (target: Container) => { x: number; y: number } };
    getLocalPosition?: (target: Container) => { x: number; y: number };
  }).data?.getLocalPosition?.(stage) ??
    (event as { getLocalPosition?: (target: Container) => { x: number; y: number } }).getLocalPosition?.(stage);
  return stagePoint ?? null;
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

  const pathGraphics = new Graphics();
  world.addChild(pathGraphics);

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
      position: { ...base.position },
      token,
    };
  });

  let activeDrag:
    | {
        player: TacticalPlayer;
      }
    | null = null;
  let isPathDrawing = false;
  let activePathPoints: NormalizedPoint[] = [];
  let hasClampedOutsidePoint = false;

  function drawPathLine(points: readonly NormalizedPoint[]): void {
    pathGraphics.clear();
    if (points.length < 2) return;

    const worldPoints = points.map((point) => mapper.normalizedToWorld(point));
    const firstPoint = worldPoints[0];
    pathGraphics.moveTo(firstPoint.x, firstPoint.y);

    if (worldPoints.length === 2) {
      const endPoint = worldPoints[1];
      pathGraphics.lineTo(endPoint.x, endPoint.y);
    } else {
      for (let index = 1; index < worldPoints.length - 1; index += 1) {
        const control = worldPoints[index];
        const next = worldPoints[index + 1];
        const midpointX = (control.x + next.x) * 0.5;
        const midpointY = (control.y + next.y) * 0.5;
        pathGraphics.quadraticCurveTo(control.x, control.y, midpointX, midpointY);
      }
      const penultimate = worldPoints[worldPoints.length - 2];
      const last = worldPoints[worldPoints.length - 1];
      pathGraphics.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y);
    }

    pathGraphics.stroke({
      color: PATH_STROKE_COLOR,
      alpha: PATH_STROKE_ALPHA,
      width: PATH_STROKE_WIDTH,
      cap: "round",
      join: "round",
    });
  }

  function getNormalizedPointFromPointerEvent(
    event: unknown,
  ): { point: NormalizedPoint; wasClamped: boolean } | null {
    const stagePoint = getStagePointFromEvent(event, app.stage);
    if (!stagePoint) return null;

    const worldPoint = mapper.viewportToWorld(stagePoint);
    const isInside = isWorldPointInsidePitch(worldPoint);
    const boundedWorld = isInside
      ? worldPoint
      : {
          x: clampWorld(worldPoint.x, WORLD_SIZE.width),
          y: clampWorld(worldPoint.y, WORLD_SIZE.height),
        };

    return {
      point: clampNormalizedPoint(mapper.worldToNormalized(boundedWorld)),
      wasClamped: !isInside,
    };
  }

  function getPlayerAtPointerEvent(event: unknown): TacticalPlayer | null {
    const stagePoint = getStagePointFromEvent(event, app.stage);
    if (!stagePoint) return null;

    const worldPoint = mapper.viewportToWorld(stagePoint);
    for (const player of players) {
      const playerWorld = mapper.normalizedToWorld(player.position);
      const dx = worldPoint.x - playerWorld.x;
      const dy = worldPoint.y - playerWorld.y;
      if (dx * dx + dy * dy <= PLAYER_RADIUS * PLAYER_RADIUS) {
        return player;
      }
    }
    return null;
  }

  function setPlayerInteractionEnabled(enabled: boolean): void {
    const nextEventMode: Container["eventMode"] = enabled ? "static" : "none";
    const nextCursor = enabled ? "grab" : "default";
    for (const player of players) {
      player.token.eventMode = nextEventMode;
      if (!activeDrag || activeDrag.player !== player) {
        player.token.cursor = nextCursor;
      }
    }
  }

  function startDragFromEvent(player: TacticalPlayer, event: unknown): void {
    if (isPathDrawing) return;
    activeDrag = { player };
    player.token.cursor = "grabbing";
    updateDraggedPlayerFromEvent(event);
  }

  function startPathFromEvent(event: unknown): void {
    if (activeDrag) return;
    const pointData = getNormalizedPointFromPointerEvent(event);
    if (!pointData || pointData.wasClamped) return;
    activePathPoints = [pointData.point];
    isPathDrawing = true;
    hasClampedOutsidePoint = false;
    setPlayerInteractionEnabled(false);
    drawPathLine(activePathPoints);
  }

  function extendPathFromEvent(event: unknown): void {
    if (!isPathDrawing || activeDrag) return;
    const pointData = getNormalizedPointFromPointerEvent(event);
    if (!pointData) return;
    if (pointData.wasClamped) {
      if (hasClampedOutsidePoint) return;
      hasClampedOutsidePoint = true;
    } else {
      hasClampedOutsidePoint = false;
    }

    const nextPoint = pointData.point;
    const previous = activePathPoints[activePathPoints.length - 1];
    if (!previous || (previous.x === nextPoint.x && previous.y === nextPoint.y)) {
      return;
    }
    activePathPoints.push(nextPoint);
    drawPathLine(activePathPoints);
  }

  function finishPath(): void {
    if (!isPathDrawing) return;
    isPathDrawing = false;
    hasClampedOutsidePoint = false;
    setPlayerInteractionEnabled(true);
  }

  function handleStagePointerDown(event: unknown): void {
    if (activeDrag || isPathDrawing) return;
    const hitPlayer = getPlayerAtPointerEvent(event);
    if (hitPlayer) {
      startDragFromEvent(hitPlayer, event);
      return;
    }
    startPathFromEvent(event);
  }

  function releaseDrag(): void {
    if (!activeDrag) return;
    activeDrag.player.token.cursor = "grab";
    activeDrag = null;
  }

  function handleStagePointerMove(event: unknown): void {
    updateDraggedPlayerFromEvent(event);
    extendPathFromEvent(event);
  }

  function handleStagePointerUp(): void {
    releaseDrag();
    finishPath();
  }

  function updateDraggedPlayerFromEvent(event: unknown): void {
    if (!activeDrag || isPathDrawing) return;

    const stagePoint = getStagePointFromEvent(event, app.stage);
    if (!stagePoint) return;

    const worldPoint = mapper.viewportToWorld({ x: stagePoint.x, y: stagePoint.y });
    const boundedWorld = {
      x: clampWorld(worldPoint.x, WORLD_SIZE.width),
      y: clampWorld(worldPoint.y, WORLD_SIZE.height),
    };

    const normalized = mapper.worldToNormalized(boundedWorld);
    activeDrag.player.position = {
      x: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, normalized.x)),
      y: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, normalized.y)),
    };
    setTokenWorldPosition(activeDrag.player, mapper);
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
      setTokenWorldPosition(player, mapper);
    }
    drawPathLine(activePathPoints);
  }

  for (const player of players) {
    setTokenWorldPosition(player, mapper);
    player.token.on("pointerdown", (event) => {
      if (isPathDrawing) {
        (event as { stopPropagation?: () => void }).stopPropagation?.();
        return;
      }
      startDragFromEvent(player, event);
      (event as { stopPropagation?: () => void }).stopPropagation?.();
    });
  }
  setPlayerInteractionEnabled(true);

  app.stage.on("pointermove", (event) => {
    handleStagePointerMove(event);
  });
  app.stage.on("pointerdown", (event) => {
    handleStagePointerDown(event);
  });
  app.stage.on("pointerup", () => {
    handleStagePointerUp();
  });
  app.stage.on("pointerupoutside", () => {
    handleStagePointerUp();
  });

  const resizeObserver = new ResizeObserver(() => {
    fitToHost();
  });
  resizeObserver.observe(host);
  fitToHost();

  return {
    destroy: () => {
      resizeObserver.disconnect();
      app.stage.removeAllListeners();
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
