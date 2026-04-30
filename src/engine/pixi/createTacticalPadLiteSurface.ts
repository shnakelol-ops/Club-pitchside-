import { Application, Container, Graphics, Text } from "pixi.js";

import { createWorldViewport } from "./createWorldViewport";
import { createTacticalPitchVisualRoot } from "../../tactical-lite/pixi/renderTacticalPitch";
import {
  NORMALIZED_MAX,
  NORMALIZED_MIN,
  type NormalizedPoint,
} from "../shared/normalization";

type TacticalPlayer = {
  id: "P1" | "P2" | "P3";
  number: number;
  current: NormalizedPoint;
  token: Container;
};

export type TacticalPadLiteSurface = {
  setStart: () => void;
  addPhase: () => void;
  play: () => void;
  reset: () => void;
  destroy: () => void;
};

type TacticalPadLiteSurfaceOptions = {
  onPhaseCountChange?: (count: number) => void;
  surfaceVariant?: "tactical" | "whiteboard";
};

type PhaseSnapshot = NormalizedPoint[];

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

function setTokenWorldPositionForPoint(
  player: TacticalPlayer,
  point: NormalizedPoint,
  mapper: ReturnType<typeof createWorldViewport>,
): void {
  const world = mapper.normalizedToWorld(point);
  player.token.position.set(world.x, world.y);
}

export async function createTacticalPadLiteSurface(
  host: HTMLElement,
  options: TacticalPadLiteSurfaceOptions = {},
): Promise<TacticalPadLiteSurface> {
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

  const surfaceVariant = options.surfaceVariant ?? "tactical";
  const pitchMount =
    surfaceVariant === "tactical" ? createTacticalPitchVisualRoot("gaelic") : null;
  if (pitchMount) {
    world.addChild(pitchMount.root);
  } else {
    const whiteboardBackground = new Graphics();
    whiteboardBackground.rect(0, 0, WORLD_SIZE.width, WORLD_SIZE.height).fill({
      color: 0xffffff,
      alpha: 1,
    });
    whiteboardBackground.rect(0, 0, WORLD_SIZE.width, WORLD_SIZE.height).stroke({
      color: 0xd6dce2,
      alpha: 1,
      width: 0.7,
    });
    whiteboardBackground.eventMode = "none";
    world.addChild(whiteboardBackground);
  }

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
      token,
    };
  });

  const PLAY_DURATION_MS = 1200;
  let isPlaying = false;
  let playElapsedMs = 0;
  let playbackPath: PhaseSnapshot[] = [];
  let activeSegmentIndex = 0;
  let loggedSegmentIndex = -1;
  let startPositions: PhaseSnapshot = players.map((player) => ({ ...player.current }));
  let phases: PhaseSnapshot[] = [];

  let activeDrag:
    | {
        player: TacticalPlayer;
      }
    | null = null;

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
      setTokenWorldPositionForPoint(player, player.current, mapper);
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
    setTokenWorldPositionForPoint(activeDrag.player, activeDrag.player.current, mapper);
  }

  function releaseDrag(): void {
    if (!activeDrag) return;
    activeDrag.player.token.cursor = "grab";
    activeDrag = null;
  }

  function cloneSnapshot(snapshot: PhaseSnapshot): PhaseSnapshot {
    return snapshot.map((point) => ({ x: point.x, y: point.y }));
  }

  function captureCurrentSnapshot(): PhaseSnapshot {
    return players.map((player) => ({ x: player.current.x, y: player.current.y }));
  }

  function applySnapshotToPlayers(snapshot: PhaseSnapshot): void {
    for (const player of players) {
      const point = snapshot[players.indexOf(player)];
      if (!point) continue;
      player.current = { x: point.x, y: point.y };
      setTokenWorldPositionForPoint(player, player.current, mapper);
    }
  }

  function cancelPlaybackAnimation(): void {
    isPlaying = false;
    playElapsedMs = 0;
    playbackPath = [];
    activeSegmentIndex = 0;
    loggedSegmentIndex = -1;
  }

  function startPlayback(path: PhaseSnapshot[]): void {
    if (path.length < 2) return;
    playbackPath = path;
    activeSegmentIndex = 0;
    loggedSegmentIndex = -1;
    isPlaying = true;
    playElapsedMs = 0;
    applySnapshotToPlayers(path[0]!);
  }

  function playSingleStartToCurrent(): void {
    const playbackTarget = captureCurrentSnapshot();
    startPlayback([cloneSnapshot(startPositions), playbackTarget]);
  }

  function playSavedPhaseSequence(): void {
    const sequence = [cloneSnapshot(startPositions), ...phases.map((phase) => cloneSnapshot(phase))];
    console.debug("PLAYING_PHASE_SEQUENCE");
    startPlayback(sequence);
  }

  function handlePlay(): void {
    releaseDrag();
    cancelPlaybackAnimation();
    console.debug("PLAY_CLICKED");
    console.debug("PHASE_COUNT", phases.length);
    if (phases.length > 0) {
      playSavedPhaseSequence();
      return;
    }
    playSingleStartToCurrent();
  }

  function stepPlayback(deltaMs: number): void {
    if (!isPlaying || playbackPath.length < 2) return;

    let remainingMs = deltaMs;
    while (remainingMs > 0 && isPlaying) {
      const fromSnapshot = playbackPath[activeSegmentIndex];
      const toSnapshot = playbackPath[activeSegmentIndex + 1];
      if (!fromSnapshot || !toSnapshot) {
        cancelPlaybackAnimation();
        return;
      }
      if (loggedSegmentIndex !== activeSegmentIndex) {
        console.debug("SEGMENT", activeSegmentIndex);
        loggedSegmentIndex = activeSegmentIndex;
      }

      const stepMs = Math.min(remainingMs, PLAY_DURATION_MS - playElapsedMs);
      playElapsedMs += stepMs;
      remainingMs -= stepMs;
      const progress = Math.max(0, Math.min(1, playElapsedMs / PLAY_DURATION_MS));

      for (const player of players) {
        const idx = players.indexOf(player);
        const fromPoint = fromSnapshot[idx];
        const toPoint = toSnapshot[idx];
        if (!fromPoint || !toPoint) continue;
        player.current = {
          x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
          y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
        };
        setTokenWorldPositionForPoint(player, player.current, mapper);
      }

      if (progress >= 1) {
        applySnapshotToPlayers(toSnapshot);
        activeSegmentIndex += 1;
        playElapsedMs = 0;
        if (activeSegmentIndex >= playbackPath.length - 1) {
          cancelPlaybackAnimation();
          return;
        }
        // Avoid a boundary stall when a segment ends exactly on a frame.
        // Carry a tiny delta so the next segment begins in the same tick.
        if (remainingMs <= 0) {
          remainingMs = 0.0001;
        }
      }
    }
  }

  for (const player of players) {
    setPlayerTouchHitArea(player, mapper);
    setTokenWorldPositionForPoint(player, player.current, mapper);

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
  options.onPhaseCountChange?.(0);

  return {
    setStart: () => {
      releaseDrag();
      cancelPlaybackAnimation();
      startPositions = captureCurrentSnapshot();
      phases = [];
      options.onPhaseCountChange?.(0);
    },
    addPhase: () => {
      releaseDrag();
      cancelPlaybackAnimation();
      phases = [...phases, captureCurrentSnapshot()];
      options.onPhaseCountChange?.(phases.length);
    },
    play: handlePlay,
    reset: () => {
      releaseDrag();
      cancelPlaybackAnimation();
      applySnapshotToPlayers(startPositions);
    },
    destroy: () => {
      resizeObserver.disconnect();
      app.stage.removeAllListeners();
      app.ticker.stop();
      pitchMount?.dispose();
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
