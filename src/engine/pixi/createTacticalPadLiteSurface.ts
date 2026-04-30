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

export type WhiteboardDrawTool = "pen" | "line" | "arrow" | "dashed";

export type TacticalPadLiteSurface = {
  setStart: () => void;
  addPhase: () => void;
  play: () => void;
  reset: () => void;
  reflow: () => void;
  setWhiteboardDrawTool: (tool: WhiteboardDrawTool) => void;
  undoWhiteboardStroke: () => void;
  clearWhiteboardStrokes: () => void;
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
const WHITEBOARD_STROKE_COLOR = 0x29333d;
const WHITEBOARD_STROKE_WIDTH = 1.1;

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
  const darkEdgeColor = team === "BLUE" ? 0x143f86 : 0x8f2332;
  const innerShadeColor = team === "BLUE" ? 0x1f63bf : 0xbf3546;

  const shadow = new Graphics();
  shadow.ellipse(0.75, 3.25, PLAYER_RADIUS * 0.98, PLAYER_RADIUS * 0.62).fill({
    color: 0x020406,
    alpha: 0.24,
  });
  token.addChild(shadow);

  const jersey = new Graphics();
  jersey.circle(0, 0, PLAYER_RADIUS).fill({ color: teamColor, alpha: 1 });
  jersey
    .circle(0, 0, PLAYER_RADIUS - 0.52)
    .fill({ color: innerShadeColor, alpha: 0.14 });
  jersey.circle(0, 0, PLAYER_RADIUS).stroke({
    color: darkEdgeColor,
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
        alpha: 0.42,
        blur: 0.9,
        color: 0x020406,
        distance: 0.24,
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

function getStagePointFromEvent(
  event: unknown,
  stage: Container,
): { x: number; y: number } | null {
  const stagePoint = (event as {
    data?: { getLocalPosition?: (target: Container) => { x: number; y: number } };
    getLocalPosition?: (target: Container) => { x: number; y: number };
  }).data?.getLocalPosition?.(stage) ??
    (event as { getLocalPosition?: (target: Container) => { x: number; y: number } }).getLocalPosition?.(
      stage,
    );
  return stagePoint ?? null;
}

function drawSolidSegment(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  g.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({
    color: WHITEBOARD_STROKE_COLOR,
    width: WHITEBOARD_STROKE_WIDTH,
    cap: "round",
    join: "round",
    alignment: 0.5,
  });
}

function drawDashedSegment(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-4) return;
  const ux = dx / length;
  const uy = dy / length;
  const dash = 2.2;
  const gap = 1.35;
  let offset = 0;
  while (offset < length) {
    const segStart = offset;
    const segEnd = Math.min(length, segStart + dash);
    drawSolidSegment(
      g,
      { x: from.x + ux * segStart, y: from.y + uy * segStart },
      { x: from.x + ux * segEnd, y: from.y + uy * segEnd },
    );
    offset += dash + gap;
  }
}

function drawArrowSegment(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  drawSolidSegment(g, from, to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-4) return;
  const ux = dx / length;
  const uy = dy / length;
  const headLength = 2.6;
  const sideX = -uy;
  const sideY = ux;
  const left = {
    x: to.x - ux * headLength + sideX * 1.05,
    y: to.y - uy * headLength + sideY * 1.05,
  };
  const right = {
    x: to.x - ux * headLength - sideX * 1.05,
    y: to.y - uy * headLength - sideY * 1.05,
  };
  drawSolidSegment(g, to, left);
  drawSolidSegment(g, to, right);
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
    const watermarkLabel = new Text({
      text: "P",
      style: {
        fill: 0x202934,
        fontSize: 3.3,
        fontWeight: "800",
        fontFamily: "Inter, Arial Narrow, Arial, system-ui, sans-serif",
        letterSpacing: 0.32,
      },
    });
    watermarkLabel.anchor.set(1, 1);
    watermarkLabel.position.set(WORLD_SIZE.width - 2.2, WORLD_SIZE.height - 1.8);
    watermarkLabel.alpha = 0.15;
    watermarkLabel.eventMode = "none";
    world.addChild(watermarkLabel);

    const watermarkAccent = new Graphics();
    watermarkAccent
      .roundRect(WORLD_SIZE.width - 6.1, WORLD_SIZE.height - 1.35, 3.9, 0.34, 0.2)
      .fill({ color: 0xf2c94c, alpha: 0.15 });
    watermarkAccent.eventMode = "none";
    world.addChild(watermarkAccent);
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
  const isWhiteboardSurface = surfaceVariant === "whiteboard";
  let activeWhiteboardTool: WhiteboardDrawTool = "pen";
  const whiteboardDrawingLayer = new Container();
  whiteboardDrawingLayer.eventMode = "none";
  world.addChild(whiteboardDrawingLayer);
  const whiteboardStrokes: Graphics[] = [];
  let whiteboardPenStroke: Graphics | null = null;
  let whiteboardPenLastPoint: { x: number; y: number } | null = null;
  let whiteboardLineStartPoint: { x: number; y: number } | null = null;
  let whiteboardLinePreview: Graphics | null = null;

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

    const stagePoint = getStagePointFromEvent(event, app.stage);
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

  function getBoundedWorldPointFromEvent(event: unknown): { x: number; y: number } | null {
    const stagePoint = getStagePointFromEvent(event, app.stage);
    if (!stagePoint) return null;
    const worldPoint = mapper.viewportToWorld({ x: stagePoint.x, y: stagePoint.y });
    return {
      x: clampWorld(worldPoint.x, WORLD_SIZE.width),
      y: clampWorld(worldPoint.y, WORLD_SIZE.height),
    };
  }

  function drawLineWithTool(
    tool: WhiteboardDrawTool,
    graphics: Graphics,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    if (tool === "dashed") {
      drawDashedSegment(graphics, from, to);
      return;
    }
    if (tool === "arrow") {
      drawArrowSegment(graphics, from, to);
      return;
    }
    drawSolidSegment(graphics, from, to);
  }

  function resetActiveWhiteboardStroke(): void {
    whiteboardPenStroke = null;
    whiteboardPenLastPoint = null;
    whiteboardLineStartPoint = null;
    if (whiteboardLinePreview) {
      whiteboardLinePreview.destroy();
      whiteboardLinePreview = null;
    }
  }

  function startWhiteboardDrawing(event: unknown): void {
    if (!isWhiteboardSurface || isPlaying || activeDrag) return;
    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) return;

    if (activeWhiteboardTool === "pen") {
      const stroke = new Graphics();
      stroke.eventMode = "none";
      whiteboardDrawingLayer.addChild(stroke);
      whiteboardStrokes.push(stroke);
      whiteboardPenStroke = stroke;
      whiteboardPenLastPoint = worldPoint;
      return;
    }

    whiteboardLineStartPoint = worldPoint;
    const preview = new Graphics();
    preview.eventMode = "none";
    whiteboardDrawingLayer.addChild(preview);
    whiteboardLinePreview = preview;
  }

  function updateWhiteboardDrawing(event: unknown): void {
    if (!isWhiteboardSurface || isPlaying || activeDrag) return;
    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) return;

    if (activeWhiteboardTool === "pen") {
      if (!whiteboardPenStroke || !whiteboardPenLastPoint) return;
      drawSolidSegment(whiteboardPenStroke, whiteboardPenLastPoint, worldPoint);
      whiteboardPenLastPoint = worldPoint;
      return;
    }

    if (!whiteboardLineStartPoint || !whiteboardLinePreview) return;
    whiteboardLinePreview.clear();
    drawLineWithTool(activeWhiteboardTool, whiteboardLinePreview, whiteboardLineStartPoint, worldPoint);
  }

  function endWhiteboardDrawing(event?: unknown): void {
    if (!isWhiteboardSurface || isPlaying || activeDrag) return;

    if (activeWhiteboardTool === "pen") {
      whiteboardPenStroke = null;
      whiteboardPenLastPoint = null;
      return;
    }

    if (!whiteboardLineStartPoint || !whiteboardLinePreview || event == null) {
      resetActiveWhiteboardStroke();
      return;
    }

    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) {
      resetActiveWhiteboardStroke();
      return;
    }
    whiteboardLinePreview.clear();
    drawLineWithTool(activeWhiteboardTool, whiteboardLinePreview, whiteboardLineStartPoint, worldPoint);
    whiteboardStrokes.push(whiteboardLinePreview);
    whiteboardLinePreview = null;
    whiteboardLineStartPoint = null;
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
    updateWhiteboardDrawing(event);
  });
  app.stage.on("pointerup", () => {
    endWhiteboardDrawing();
    releaseDrag();
  });
  app.stage.on("pointerupoutside", () => {
    endWhiteboardDrawing();
    releaseDrag();
  });
  app.stage.on("pointerdown", (event) => {
    startWhiteboardDrawing(event);
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
    reflow: () => {
      fitToHost();
    },
    setWhiteboardDrawTool: (tool) => {
      if (!isWhiteboardSurface) return;
      activeWhiteboardTool = tool;
      resetActiveWhiteboardStroke();
    },
    undoWhiteboardStroke: () => {
      if (!isWhiteboardSurface) return;
      resetActiveWhiteboardStroke();
      const stroke = whiteboardStrokes.pop();
      if (!stroke) return;
      stroke.destroy();
    },
    clearWhiteboardStrokes: () => {
      if (!isWhiteboardSurface) return;
      resetActiveWhiteboardStroke();
      while (whiteboardStrokes.length > 0) {
        const stroke = whiteboardStrokes.pop();
        stroke?.destroy();
      }
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
