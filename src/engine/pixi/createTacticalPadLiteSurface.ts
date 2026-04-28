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
  token: Container;
};

export type TacticalPadLiteSurface = {
  setStart: () => void;
  addPhase: () => void;
  jumpToPhase: (phaseIndex: number) => void;
  play: () => void;
  reset: () => void;
  destroy: () => void;
};

type TacticalPadLiteSurfaceOptions = {
  onPhaseCountChange?: (count: number) => void;
  onSelectedPhaseChange?: (phaseIndex: number) => void;
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
  let selectedPhaseIndex = 0;

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

  function setSelectedPhase(nextPhaseIndex: number): void {
    selectedPhaseIndex = nextPhaseIndex;
    options.onSelectedPhaseChange?.(selectedPhaseIndex);
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

  function jumpToPhase(phaseIndex: number): void {
    if (!Number.isInteger(phaseIndex)) return;
    if (phaseIndex < 0 || phaseIndex > phases.length) return;
    releaseDrag();
    cancelPlaybackAnimation();
    const phaseSnapshot = phaseIndex === 0 ? startPositions : phases[phaseIndex - 1];
    if (!phaseSnapshot) return;
    applySnapshotToPlayers(phaseSnapshot);
    setSelectedPhase(phaseIndex);
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
  options.onSelectedPhaseChange?.(0);

  return {
    setStart: () => {
      releaseDrag();
      cancelPlaybackAnimation();
      startPositions = captureCurrentSnapshot();
      phases = [];
      options.onPhaseCountChange?.(0);
      setSelectedPhase(0);
    },
    addPhase: () => {
      releaseDrag();
      cancelPlaybackAnimation();
      const nextPhases = [...phases, captureCurrentSnapshot()];
      phases = nextPhases;
      options.onPhaseCountChange?.(phases.length);
      setSelectedPhase(nextPhases.length);
    },
    jumpToPhase,
    play: handlePlay,
    reset: () => {
      releaseDrag();
      cancelPlaybackAnimation();
      applySnapshotToPlayers(startPositions);
      setSelectedPhase(0);
    },
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
