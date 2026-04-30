import { Application, Container, Graphics, Text } from "pixi.js";

import { createWorldViewport } from "./createWorldViewport";
import {
  createTacticalPitchVisualRoot,
  type TacticalPitchTheme,
} from "../../tactical-lite/pixi/renderTacticalPitch";
import {
  NORMALIZED_MAX,
  NORMALIZED_MIN,
  type NormalizedPoint,
} from "../shared/normalization";

type TacticalPlayer = {
  id: string;
  number: number;
  team: "BLUE" | "RED";
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
  whiteboardTeamCounts?: {
    blue: number;
    red: number;
  };
};

type PhaseSnapshot = NormalizedPoint[];

const WORLD_SIZE = { width: 160, height: 100 } as const;
const PLAYER_RADIUS = 4.1;
const PLAYER_TOUCH_HIT_DIAMETER_PX = 48;

type PlayerSeed = {
  id: string;
  number: number;
  team: "BLUE" | "RED";
  position: NormalizedPoint;
};

const TACTICAL_INITIAL_PLAYERS: PlayerSeed[] = [
  { id: "P1", number: 1, team: "BLUE", position: { x: 30, y: 50 } },
  { id: "P2", number: 2, team: "BLUE", position: { x: 50, y: 50 } },
  { id: "P3", number: 3, team: "BLUE", position: { x: 70, y: 50 } },
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

function clampTeamCount(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Math.floor(value as number) : 1;
  return Math.max(1, Math.min(15, parsed));
}

function createWhiteboardPlayerSeeds(
  counts: TacticalPadLiteSurfaceOptions["whiteboardTeamCounts"],
): PlayerSeed[] {
  const blueCount = clampTeamCount(counts?.blue);
  const redCount = clampTeamCount(counts?.red);

  const bluePlayers: PlayerSeed[] = Array.from({ length: blueCount }, (_, index) => ({
    id: `B${index + 1}`,
    number: index + 1,
    team: "BLUE",
    position: {
      x: 34,
      y: ((index + 1) * WORLD_SIZE.height) / (blueCount + 1),
    },
  }));

  const redPlayers: PlayerSeed[] = Array.from({ length: redCount }, (_, index) => ({
    id: `R${index + 1}`,
    number: index + 1,
    team: "RED",
    position: {
      x: WORLD_SIZE.width - 34,
      y: ((index + 1) * WORLD_SIZE.height) / (redCount + 1),
    },
  }));

  return [...bluePlayers, ...redPlayers];
}

function createWhiteboardPlayerToken(team: "BLUE" | "RED", number: number): Container {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";

  const teamColor = team === "BLUE" ? 0x2f7df3 : 0xe14f4f;
  const rimColor = team === "BLUE" ? 0x0f3b79 : 0x7f1d1d;

  const shadow = new Graphics();
  shadow.ellipse(0.75, 3.25, PLAYER_RADIUS * 0.98, PLAYER_RADIUS * 0.62).fill({
    color: 0x020406,
    alpha: 0.24,
  });
  token.addChild(shadow);

  const jersey = new Graphics();
  jersey.circle(0, 0, PLAYER_RADIUS).fill({ color: teamColor, alpha: 1 });
  jersey.circle(0, 0, PLAYER_RADIUS).stroke({
    color: rimColor,
    alpha: 0.9,
    width: 0.56,
  });
  jersey.circle(0, 0, PLAYER_RADIUS - 0.68).stroke({
    color: 0xffffff,
    alpha: 0.32,
    width: 0.42,
  });
  jersey
    .ellipse(-0.9, -1.45, PLAYER_RADIUS * 0.58, PLAYER_RADIUS * 0.42)
    .fill({ color: 0xffffff, alpha: 0.22 });
  token.addChild(jersey);

  const numberLabel = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: 3.25,
      fontWeight: "700",
      align: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      dropShadow: {
        alpha: 0.35,
        blur: 0.9,
        color: 0x020406,
        distance: 0.15,
        angle: Math.PI / 2,
      },
    },
  });
  numberLabel.anchor.set(0.5, 0.53);
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
  const pitchTheme: TacticalPitchTheme =
    surfaceVariant === "whiteboard" ? "whiteboard" : "default";
  const pitchMount = createTacticalPitchVisualRoot("gaelic", { theme: pitchTheme });
  world.addChild(pitchMount.root);

  if (surfaceVariant === "whiteboard") {
    const watermarkBadge = new Graphics();
    watermarkBadge
      .roundRect(WORLD_SIZE.width - 13.8, WORLD_SIZE.height - 10.8, 10.2, 7.2, 1.6)
      .fill({ color: 0xf2f5f8, alpha: 0.8 })
      .stroke({ color: 0x69717a, alpha: 0.38, width: 0.36 });
    watermarkBadge.eventMode = "none";
    world.addChild(watermarkBadge);

    const watermarkLabel = new Text({
      text: "P",
      style: {
        fill: 0x313a44,
        fontSize: 3.8,
        fontWeight: "700",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    });
    watermarkLabel.anchor.set(0.5, 0.5);
    watermarkLabel.position.set(WORLD_SIZE.width - 8.7, WORLD_SIZE.height - 7.2);
    watermarkLabel.alpha = 0.55;
    watermarkLabel.eventMode = "none";
    world.addChild(watermarkLabel);
  }

  const playersLayer = new Container();
  world.addChild(playersLayer);

  let mapper = createWorldViewport(
    WORLD_SIZE,
    { width: host.clientWidth || 800, height: host.clientHeight || 520 },
  );

  const playerSeeds =
    surfaceVariant === "whiteboard"
      ? createWhiteboardPlayerSeeds(options.whiteboardTeamCounts)
      : TACTICAL_INITIAL_PLAYERS;

  const players: TacticalPlayer[] = playerSeeds.map((base) => {
    const token =
      surfaceVariant === "whiteboard"
        ? createWhiteboardPlayerToken(base.team, base.number)
        : createPlayerToken(base.number);
    playersLayer.addChild(token);
    return {
      id: base.id,
      number: base.number,
      team: base.team,
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
