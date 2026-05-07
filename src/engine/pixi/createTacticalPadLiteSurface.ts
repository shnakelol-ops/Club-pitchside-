import { Application, Container, Graphics, Text } from "pixi.js";

import { createWorldViewport } from "./createWorldViewport";
import {
  createPremiumPlayerToken,
  PREMIUM_TOKEN_DRAG_SCALE,
  PREMIUM_TOKEN_DRAG_SHADOW_ALPHA,
  PREMIUM_TOKEN_IDLE_SCALE,
  PREMIUM_TOKEN_IDLE_SHADOW_ALPHA,
  type PremiumPlayerTokenColor,
} from "./createPremiumPlayerToken";
import { createMicroAthleteToken } from "./createMicroAthleteToken";
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
  tokenShadow: Graphics;
  dragScaleTarget: number;
  dragShadowAlphaTarget: number;
};

export type WhiteboardDrawTool = "move" | "pen" | "line" | "arrow" | "dashed";
export type WhiteboardTokenColor = PremiumPlayerTokenColor;
export type FlowItemType = "cone" | "pole" | "ladder" | "tackleBag" | "football" | "sliotar";
export type ItemMode = "edit" | "locked";
export type TacticalItem = {
  id: string;
  type: FlowItemType;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
};

export type TacticalPadLiteSurface = {
  setStart: () => void;
  addPhase: () => void;
  jumpToPhase: (phaseIndex: number) => void;
  undoPhase: () => void;
  play: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  addTacticalPlayer: () => void;
  removeTacticalPlayer: () => void;
  setItems: (items: TacticalItem[]) => void;
  setItemMode: (mode: ItemMode) => void;
  reset: () => void;
  reflow: () => void;
  setWhiteboardTeamConfig: (config: {
    counts: { blue: number; red: number };
    colors: { blue: WhiteboardTokenColor; red: WhiteboardTokenColor };
  }) => void;
  setWhiteboardDrawTool: (tool: WhiteboardDrawTool) => void;
  setWhiteboardDrawColor: (color: number) => void;
  eraseWhiteboardPenStroke: () => void;
  undoWhiteboardStroke: () => void;
  clearWhiteboardStrokes: () => void;
  exportImageCanvas: () => HTMLCanvasElement | null;
  destroy: () => void;
};

type TacticalPadLiteSurfaceOptions = {
  onPhaseCountChange?: (count: number) => void;
  onSelectedPhaseChange?: (phaseIndex: number) => void;
  onPlaybackStateChange?: (state: { isPlaying: boolean; isPaused: boolean }) => void;
  surfaceVariant?: "tactical" | "whiteboard";
  whiteboardTeamCounts?: {
    blue: number;
    red: number;
  };
  whiteboardTeamColors?: {
    blue: WhiteboardTokenColor;
    red: WhiteboardTokenColor;
  };
  whiteboardDrawColor?: number;
  onItemMove?: (id: string, x: number, y: number) => void;
};

type PhaseBallSnapshot = {
  id: string;
  x: number;
  y: number;
};
type PhaseSnapshot = {
  players: NormalizedPoint[];
  football: PhaseBallSnapshot[];
};
type WhiteboardPoint = { x: number; y: number };
type WhiteboardDrawingType = "pen" | "line" | "arrow" | "dashedArrow";
type WhiteboardPenGeometry = {
  points: WhiteboardPoint[];
};
type WhiteboardLinearGeometry = {
  start: WhiteboardPoint;
  end: WhiteboardPoint;
  controlPoint: WhiteboardPoint | null;
};
type WhiteboardDrawingGeometry = WhiteboardPenGeometry | WhiteboardLinearGeometry;
type WhiteboardDrawingObject = {
  id: string;
  type: WhiteboardDrawingType;
  color: number;
  geometry: WhiteboardDrawingGeometry;
  createdAt: number;
};

function isWhiteboardPenGeometry(
  geometry: WhiteboardDrawingGeometry,
): geometry is WhiteboardPenGeometry {
  return "points" in geometry;
}

function isWhiteboardLinearGeometry(
  geometry: WhiteboardDrawingGeometry,
): geometry is WhiteboardLinearGeometry {
  return "start" in geometry && "end" in geometry;
}

const WORLD_SIZE = { width: 160, height: 100 } as const;
const PLAYER_RADIUS = 4.1;
const PLAYER_TOUCH_HIT_DIAMETER_PX = 48;
const TACTICAL_ITEM_HALF_SIZE = 2.2;
const TACTICAL_ITEM_DRAG_THRESHOLD_PX = 5;
const TACTICAL_ITEM_TOUCH_HIT_DIAMETER_PX = 46;
const WHITEBOARD_DEFAULT_STROKE_COLOR = 0x111111;
const WHITEBOARD_STROKE_WIDTH = 1.1;
const WHITEBOARD_BLUE_START_X = 30;
const WHITEBOARD_RED_START_X = 70;

type PlayerSeed = {
  id: string;
  number: number;
  team: "BLUE" | "RED";
  color: WhiteboardTokenColor;
  position: NormalizedPoint;
};

type TacticalSurfaceItem = TacticalItem & {
  graphic: Graphics;
  selectionGraphic: Graphics;
};

type DragPointerState = {
  pointerId: number | null;
  startStagePoint: { x: number; y: number } | null;
  hasCrossedThreshold: boolean;
};

type ActiveDragState =
  | ({
      type: "item";
      itemId: string;
      dragOffset: { x: number; y: number };
    } & DragPointerState)
  | ({
      type: "player";
      playerId: string;
    } & DragPointerState)
  | null;

const TACTICAL_INITIAL_PLAYERS: PlayerSeed[] = [
  { id: "P1", number: 1, team: "BLUE", color: "blue", position: { x: 30, y: 50 } },
  { id: "P2", number: 2, team: "BLUE", color: "blue", position: { x: 50, y: 50 } },
  { id: "P3", number: 3, team: "BLUE", color: "blue", position: { x: 70, y: 50 } },
];

function clampWorld(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

function clampTeamCount(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Math.floor(value as number) : 1;
  return Math.max(1, Math.min(15, parsed));
}

function createWhiteboardPlayerSeeds(
  counts: TacticalPadLiteSurfaceOptions["whiteboardTeamCounts"],
  colors: TacticalPadLiteSurfaceOptions["whiteboardTeamColors"],
): PlayerSeed[] {
  const blueCount = clampTeamCount(counts?.blue);
  const redCount = clampTeamCount(counts?.red);
  const blueColor = colors?.blue ?? "blue";
  const redColor = colors?.red ?? "red";

  const bluePlayers: PlayerSeed[] = Array.from({ length: blueCount }, (_, index) => ({
    id: `B${index + 1}`,
    number: index + 1,
    team: "BLUE",
    color: blueColor,
    position: {
      x: WHITEBOARD_BLUE_START_X,
      y: ((index + 1) * WORLD_SIZE.height) / (blueCount + 1),
    },
  }));

  const redPlayers: PlayerSeed[] = Array.from({ length: redCount }, (_, index) => ({
    id: `R${index + 1}`,
    number: index + 1,
    team: "RED",
    color: redColor,
    position: {
      x: WHITEBOARD_RED_START_X,
      y: ((index + 1) * WORLD_SIZE.height) / (redCount + 1),
    },
  }));

  return [...bluePlayers, ...redPlayers];
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

function setItemTouchHitArea(
  item: Pick<TacticalSurfaceItem, "graphic">,
  mapper: ReturnType<typeof createWorldViewport>,
): void {
  const touchRadiusInWorld = (TACTICAL_ITEM_TOUCH_HIT_DIAMETER_PX * 0.5) / mapper.transform.scale;
  const itemVisualRadius = TACTICAL_ITEM_HALF_SIZE * 1.35;
  const hitRadius = Math.max(itemVisualRadius, touchRadiusInWorld);
  const hitRadiusSquared = hitRadius * hitRadius;
  item.graphic.hitArea = {
    contains: (x: number, y: number) => x * x + y * y <= hitRadiusSquared,
  };
}

function clampNormalizedValue(value: number): number {
  if (!Number.isFinite(value)) return NORMALIZED_MIN;
  return Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, value));
}

function normalizeTacticalItem(item: TacticalItem): TacticalItem {
  const normalizedRotation = Number.isFinite(item.rotation) ? Number(item.rotation) : undefined;
  const normalizedScale = Number.isFinite(item.scale) ? Math.max(0.5, Math.min(2, Number(item.scale))) : undefined;
  return {
    id: item.id,
    type: item.type,
    x: clampNormalizedValue(item.x),
    y: clampNormalizedValue(item.y),
    rotation: normalizedRotation,
    scale: normalizedScale,
  };
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

function getPointerIdFromEvent(event: unknown): number | null {
  const pointerId = (event as { pointerId?: unknown }).pointerId;
  return typeof pointerId === "number" ? pointerId : null;
}

function drawSolidSegment(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: number,
): void {
  g.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({
    color,
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
  color: number,
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
      color,
    );
    offset += dash + gap;
  }
}

function drawArrowSegment(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: number,
): void {
  drawSolidSegment(g, from, to, color);
  drawArrowHead(g, from, to, color);
}

function drawArrowHead(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: number,
): void {
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
  drawSolidSegment(g, to, left, color);
  drawSolidSegment(g, to, right, color);
}

function drawDashedArrowSegment(
  g: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: number,
): void {
  drawDashedSegment(g, from, to, color);
  drawArrowHead(g, from, to, color);
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
  const itemsLayer = new Container();
  itemsLayer.eventMode = "passive";
  world.addChild(itemsLayer);

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
      ? createWhiteboardPlayerSeeds(options.whiteboardTeamCounts, options.whiteboardTeamColors)
      : TACTICAL_INITIAL_PLAYERS;

  function createSurfacePlayer(base: PlayerSeed): TacticalPlayer {
    const tokenColor: PremiumPlayerTokenColor =
      surfaceVariant === "whiteboard" ? base.color : base.team === "RED" ? "red" : "blue";
    const tokenPack =
      surfaceVariant === "tactical"
        ? createMicroAthleteToken({
            label: String(base.number),
            teamColor: tokenColor,
            scale: PLAYER_RADIUS / 4.1,
          })
        : createPremiumPlayerToken({
            color: tokenColor,
            number: base.number,
            radius: PLAYER_RADIUS,
          });
    const { token, shadow } = tokenPack;
    playersLayer.addChild(token);
    return {
      id: base.id,
      number: base.number,
      team: base.team,
      current: { ...base.position },
      token,
      tokenShadow: shadow,
      dragScaleTarget: PREMIUM_TOKEN_IDLE_SCALE,
      dragShadowAlphaTarget: PREMIUM_TOKEN_IDLE_SHADOW_ALPHA,
    };
  }

  const players: TacticalPlayer[] = playerSeeds.map(createSurfacePlayer);

  const PLAY_DURATION_MS = 1200;
  let isPlaying = false;
  let isPaused = false;
  let playElapsedMs = 0;
  let playbackPath: PhaseSnapshot[] = [];
  let activeSegmentIndex = 0;
  let loggedSegmentIndex = -1;
  let selectedPhaseIndex = 0;
  let startPositions: PhaseSnapshot = {
    players: players.map((player) => ({ ...player.current })),
    football: [],
  };
  let phases: PhaseSnapshot[] = [];

  let activeDrag: ActiveDragState = null;
  let selectedItemId: string | null = null;
  let itemMode: ItemMode = "locked";
  const isWhiteboardSurface = surfaceVariant === "whiteboard";
  const isDrawingEnabledSurface = surfaceVariant === "whiteboard" || surfaceVariant === "tactical";
  let activeWhiteboardTool: WhiteboardDrawTool = "move";
  let activeWhiteboardColor = options.whiteboardDrawColor ?? WHITEBOARD_DEFAULT_STROKE_COLOR;
  const tacticalItems: TacticalSurfaceItem[] = [];
  const whiteboardDrawingsLayer = new Container();
  whiteboardDrawingsLayer.eventMode = "none";
  world.addChild(whiteboardDrawingsLayer);
  const whiteboardPreviewLayer = new Container();
  whiteboardPreviewLayer.eventMode = "none";
  world.addChild(whiteboardPreviewLayer);
  const whiteboardPreviewGraphic = new Graphics();
  whiteboardPreviewGraphic.eventMode = "none";
  whiteboardPreviewLayer.addChild(whiteboardPreviewGraphic);
  const itemSelectionLayer = new Container();
  itemSelectionLayer.eventMode = "none";
  world.addChild(itemSelectionLayer);
  const completedWhiteboardDrawingObjects: WhiteboardDrawingObject[] = [];
  let activeWhiteboardDrawing: WhiteboardDrawingObject | null = null;
  let whiteboardDrawingCounter = 0;

  function emitPlaybackStateChange(): void {
    syncWhiteboardTokenInputMode();
    options.onPlaybackStateChange?.({ isPlaying, isPaused });
  }

  function isPlaybackInputLocked(): boolean {
    return isPlaying || isPaused;
  }

  function isMatchingActivePointer(event: unknown): boolean {
    if (!activeDrag || activeDrag.pointerId == null) return true;
    const pointerId = getPointerIdFromEvent(event);
    if (pointerId == null) return true;
    return pointerId === activeDrag.pointerId;
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
      setTokenWorldPositionForPoint(player, player.current, mapper);
    }
    for (const item of tacticalItems) {
      setItemTouchHitArea(item, mapper);
    }
    renderTacticalItems();
    renderAllWhiteboardDrawings();
  }

  function isItemInteractionEnabled(): boolean {
    return (
      surfaceVariant === "tactical" &&
      itemMode === "edit" &&
      activeWhiteboardTool === "move" &&
      !isPlaybackInputLocked()
    );
  }

  function updateDraggedPlayerFromEvent(event: unknown): void {
    if (!activeDrag || activeDrag.type !== "player" || isPlaybackInputLocked()) return;
    const activePlayerId = activeDrag.playerId;
    if (activeWhiteboardTool !== "move") return;
    if (!isMatchingActivePointer(event)) return;

    const stagePoint = getStagePointFromEvent(event, app.stage);
    if (!stagePoint) return;
    if (!hasExceededDragThreshold(event, activeDrag)) return;
    if (!activeDrag.hasCrossedThreshold) {
      activeDrag.hasCrossedThreshold = true;
      const dragPlayer = players.find((player) => player.id === activePlayerId);
      if (dragPlayer) {
        setPlayerDragVisualTarget(dragPlayer, true);
      }
      syncWhiteboardTokenInputMode();
    }

    const worldPoint = mapper.viewportToWorld({ x: stagePoint.x, y: stagePoint.y });
    const boundedWorld = {
      x: clampWorld(worldPoint.x, WORLD_SIZE.width),
      y: clampWorld(worldPoint.y, WORLD_SIZE.height),
    };

    const normalized = mapper.worldToNormalized(boundedWorld);
    const dragPlayer = players.find((player) => player.id === activePlayerId);
    if (!dragPlayer) {
      activeDrag = null;
      return;
    }
    dragPlayer.current = {
      x: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, normalized.x)),
      y: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, normalized.y)),
    };
    setTokenWorldPositionForPoint(dragPlayer, dragPlayer.current, mapper);
  }

  function syncWhiteboardTokenInputMode(): void {
    if (!isDrawingEnabledSurface) return;
    const canInteractItems = isItemInteractionEnabled();
    let draggingItemId: string | null = null;
    let draggingPlayerId: string | null = null;
    if (activeDrag && activeDrag.type === "item" && activeDrag.hasCrossedThreshold) {
      draggingItemId = activeDrag.itemId;
    }
    if (activeDrag && activeDrag.type === "player" && activeDrag.hasCrossedThreshold) {
      draggingPlayerId = activeDrag.playerId;
    }
    for (const item of tacticalItems) {
      const isCurrentItemDragging = draggingItemId === item.id;
      item.graphic.eventMode = canInteractItems ? "static" : "none";
      item.graphic.cursor = isCurrentItemDragging ? "grabbing" : canInteractItems ? "grab" : "default";
    }
    if (!canInteractItems && selectedItemId !== null) {
      selectedItemId = null;
      renderTacticalItems();
    }
    const canDragPlayers = activeWhiteboardTool === "move" && !isPlaybackInputLocked();
    for (const player of players) {
      const isCurrentPlayerDragging = draggingPlayerId === player.id;
      player.token.eventMode = canDragPlayers ? "static" : "none";
      player.token.cursor = isCurrentPlayerDragging ? "grabbing" : canDragPlayers ? "grab" : "default";
    }
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

  function getBoundedNormalizedPointFromEvent(event: unknown): NormalizedPoint | null {
    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) return null;
    const normalized = mapper.worldToNormalized(worldPoint);
    return {
      x: clampNormalizedValue(normalized.x),
      y: clampNormalizedValue(normalized.y),
    };
  }

  function setItemWorldPosition(
    item: Pick<TacticalSurfaceItem, "x" | "y" | "rotation" | "scale" | "graphic" | "selectionGraphic">,
    itemMapper: ReturnType<typeof createWorldViewport>,
  ): void {
    const worldPoint = itemMapper.normalizedToWorld({ x: item.x, y: item.y });
    item.graphic.position.set(worldPoint.x, worldPoint.y);
    item.selectionGraphic.position.set(worldPoint.x, worldPoint.y);
    item.graphic.rotation = item.rotation ?? 0;
    item.graphic.scale.set(item.scale ?? 1);
    item.selectionGraphic.rotation = item.rotation ?? 0;
    item.selectionGraphic.scale.set(item.scale ?? 1);
  }

  function findTacticalItemById(itemId: string): TacticalSurfaceItem | null {
    return tacticalItems.find((item) => item.id === itemId) ?? null;
  }

  function drawTacticalItemGraphic(graphic: Graphics, item: TacticalItem): void {
    graphic.clear();
    if (item.type === "cone") {
      graphic
        .poly([
          -TACTICAL_ITEM_HALF_SIZE,
          TACTICAL_ITEM_HALF_SIZE,
          0,
          -TACTICAL_ITEM_HALF_SIZE,
          TACTICAL_ITEM_HALF_SIZE,
          TACTICAL_ITEM_HALF_SIZE,
        ])
        .fill(0xf59e0b)
        .stroke({ color: 0xb45309, width: 0.45 });
      return;
    }
    if (item.type === "pole") {
      graphic
        .roundRect(-0.45, -TACTICAL_ITEM_HALF_SIZE, 0.9, TACTICAL_ITEM_HALF_SIZE * 2, 0.35)
        .fill(0xfde68a)
        .stroke({ color: 0x92400e, width: 0.32 });
      return;
    }
    if (item.type === "ladder") {
      const width = TACTICAL_ITEM_HALF_SIZE * 2.7;
      const height = TACTICAL_ITEM_HALF_SIZE * 1.35;
      const left = -width / 2;
      const top = -height / 2;
      graphic
        .roundRect(left, top, width, height, 0.28)
        .stroke({ color: 0x475569, width: 0.28 });
      const railInset = 0.42;
      const rungCount = 4;
      graphic
        .moveTo(left + railInset, top)
        .lineTo(left + railInset, top + height)
        .moveTo(left + width - railInset, top)
        .lineTo(left + width - railInset, top + height)
        .stroke({ color: 0x64748b, width: 0.26 });
      for (let rung = 1; rung <= rungCount; rung += 1) {
        const y = top + (height * rung) / (rungCount + 1);
        graphic
          .moveTo(left + railInset, y)
          .lineTo(left + width - railInset, y)
          .stroke({ color: 0x94a3b8, width: 0.24 });
      }
      return;
    }
    if (item.type === "tackleBag") {
      const width = TACTICAL_ITEM_HALF_SIZE * 2.2;
      const height = TACTICAL_ITEM_HALF_SIZE * 1.55;
      graphic
        .roundRect(-width / 2, -height / 2, width, height, 0.65)
        .fill(0x334155)
        .stroke({ color: 0x0f172a, width: 0.36 });
      return;
    }
    if (item.type === "football") {
      graphic.circle(0, 0, TACTICAL_ITEM_HALF_SIZE * 0.95).fill(0xffffff).stroke({
        color: 0x334155,
        width: 0.32,
      });
      graphic
        .moveTo(-0.8, -0.62)
        .lineTo(0.8, 0.62)
        .moveTo(0.8, -0.62)
        .lineTo(-0.8, 0.62)
        .stroke({ color: 0x334155, width: 0.24 });
      return;
    }
    graphic
      .circle(0, 0, TACTICAL_ITEM_HALF_SIZE * 0.75)
      .fill(0xffffff)
      .stroke({ color: 0x6b7280, width: 0.28 });
    graphic.circle(0, 0, TACTICAL_ITEM_HALF_SIZE * 0.22).fill(0xdbeafe);
  }

  function drawSelectedItemGraphic(graphic: Graphics, selected: boolean): void {
    graphic.clear();
    if (!selected) return;
    graphic
      .circle(0, 0, TACTICAL_ITEM_HALF_SIZE * 1.45)
      .stroke({ color: 0x7dd3fc, alpha: 0.92, width: 0.42 });
  }

  function renderTacticalItems(): void {
    if (surfaceVariant !== "tactical") return;
    for (const item of tacticalItems) {
      setItemWorldPosition(item, mapper);
      drawTacticalItemGraphic(item.graphic, item);
      drawSelectedItemGraphic(item.selectionGraphic, item.id === selectedItemId);
    }
  }

  function hasExceededDragThreshold(event: unknown, dragState: ActiveDragState): boolean {
    if (!dragState) return false;
    if (dragState.hasCrossedThreshold) return true;
    const startPoint = dragState.startStagePoint;
    if (!startPoint) return false;
    const stagePoint = getStagePointFromEvent(event, app.stage);
    if (!stagePoint) return false;
    const distance = Math.hypot(stagePoint.x - startPoint.x, stagePoint.y - startPoint.y);
    return distance >= TACTICAL_ITEM_DRAG_THRESHOLD_PX;
  }

  function beginItemDrag(item: TacticalSurfaceItem, event: unknown): void {
    if (!isItemInteractionEnabled()) return;
    if (activeDrag) return;
    selectedItemId = item.id;
    const pointerId = getPointerIdFromEvent(event);
    const startStagePoint = getStagePointFromEvent(event, app.stage);
    const pointerNormalized = getBoundedNormalizedPointFromEvent(event);
    const dragOffset = pointerNormalized
      ? {
          x: item.x - pointerNormalized.x,
          y: item.y - pointerNormalized.y,
        }
      : { x: 0, y: 0 };
    activeDrag = {
      type: "item",
      itemId: item.id,
      dragOffset,
      pointerId,
      startStagePoint,
      hasCrossedThreshold: false,
    };
    renderTacticalItems();
    syncWhiteboardTokenInputMode();
  }

  function bindTacticalItemPointerDown(item: TacticalSurfaceItem): void {
    item.graphic.on("pointerdown", (event) => {
      beginItemDrag(item, event);
    });
  }

  function clearSelectedItem(): void {
    if (selectedItemId == null) return;
    selectedItemId = null;
    renderTacticalItems();
  }

  function upsertTacticalItems(nextItems: TacticalItem[]): void {
    if (surfaceVariant !== "tactical") return;
    const normalizedNextItems = nextItems.map(normalizeTacticalItem);
    const nextIds = new Set(normalizedNextItems.map((item) => item.id));

    for (let index = tacticalItems.length - 1; index >= 0; index -= 1) {
      const item = tacticalItems[index];
      if (!item || nextIds.has(item.id)) continue;
      item.graphic.removeAllListeners();
      item.graphic.destroy();
      item.selectionGraphic.destroy();
      tacticalItems.splice(index, 1);
      if (selectedItemId === item.id) {
        selectedItemId = null;
      }
      if (activeDrag && activeDrag.type === "item" && activeDrag.itemId === item.id) {
        activeDrag = null;
      }
    }

    for (const nextItem of normalizedNextItems) {
      const existingItem = findTacticalItemById(nextItem.id);
      if (existingItem) {
        existingItem.type = nextItem.type;
        existingItem.x = nextItem.x;
        existingItem.y = nextItem.y;
        continue;
      }
      const graphic = new Graphics();
      graphic.eventMode = "none";
      itemsLayer.addChild(graphic);
      const selectionGraphic = new Graphics();
      selectionGraphic.eventMode = "none";
      itemSelectionLayer.addChild(selectionGraphic);
      const createdItem: TacticalSurfaceItem = {
        ...nextItem,
        graphic,
        selectionGraphic,
      };
      setItemTouchHitArea(createdItem, mapper);
      bindTacticalItemPointerDown(createdItem);
      tacticalItems.push(createdItem);
    }

    renderTacticalItems();
    syncWhiteboardTokenInputMode();
  }

  function updateDraggedItemFromEvent(event: unknown): void {
    if (!activeDrag || activeDrag.type !== "item") return;
    if (!isItemInteractionEnabled()) return;
    if (!isMatchingActivePointer(event)) return;
    const itemId = activeDrag.itemId;
    const item = findTacticalItemById(itemId);
    if (!item) {
      activeDrag = null;
      return;
    }
    if (!hasExceededDragThreshold(event, activeDrag)) return;
    activeDrag.hasCrossedThreshold = true;
    const pointerNormalized = getBoundedNormalizedPointFromEvent(event);
    if (!pointerNormalized) return;
    const normalized = {
      x: clampNormalizedValue(pointerNormalized.x + activeDrag.dragOffset.x),
      y: clampNormalizedValue(pointerNormalized.y + activeDrag.dragOffset.y),
    };
    item.x = normalized.x;
    item.y = normalized.y;
    setItemWorldPosition(item, mapper);
    options.onItemMove?.(item.id, normalized.x, normalized.y);
  }

  function releaseActiveDrag(): void {
    if (!activeDrag) return;
    if (activeDrag.type === "player") {
      const activeState = activeDrag;
      const playerId = activeState.playerId;
      const player = players.find((entry) => entry.id === playerId);
      if (player) {
        setPlayerDragVisualTarget(player, false);
        player.token.cursor = "grab";
      }
    }
    activeDrag = null;
    syncWhiteboardTokenInputMode();
  }

  function drawLineWithTool(
    tool: WhiteboardDrawingType,
    graphics: Graphics,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: number,
  ): void {
    if (tool === "dashedArrow") {
      drawDashedArrowSegment(graphics, from, to, color);
      return;
    }
    if (tool === "arrow") {
      drawArrowSegment(graphics, from, to, color);
      return;
    }
    drawSolidSegment(graphics, from, to, color);
  }

  function createDrawingId(): string {
    whiteboardDrawingCounter += 1;
    return `wb-drawing-${whiteboardDrawingCounter}`;
  }

  function cloneWhiteboardDrawingObject(drawing: WhiteboardDrawingObject): WhiteboardDrawingObject {
    const geometry = drawing.geometry;
    const clonedGeometry: WhiteboardDrawingGeometry = isWhiteboardPenGeometry(geometry)
      ? {
          points: geometry.points.map((point) => ({ x: point.x, y: point.y })),
        }
      : {
          start: { x: geometry.start.x, y: geometry.start.y },
          end: { x: geometry.end.x, y: geometry.end.y },
          controlPoint: geometry.controlPoint
            ? { x: geometry.controlPoint.x, y: geometry.controlPoint.y }
            : null,
        };
    return {
      id: drawing.id,
      type: drawing.type,
      color: drawing.color,
      geometry: clonedGeometry,
      createdAt: drawing.createdAt,
    };
  }

  function renderWhiteboardDrawing(graphics: Graphics, drawing: WhiteboardDrawingObject): void {
    const geometry = drawing.geometry;
    if (drawing.type === "pen") {
      if (!isWhiteboardPenGeometry(geometry)) return;
      if (geometry.points.length < 2) return;
      for (let index = 1; index < geometry.points.length; index += 1) {
        const from = geometry.points[index - 1];
        const to = geometry.points[index];
        if (!from || !to) continue;
        drawSolidSegment(graphics, from, to, drawing.color);
      }
      return;
    }
    if (!isWhiteboardLinearGeometry(geometry)) return;
    const from = geometry.start;
    const to = geometry.end;
    drawLineWithTool(drawing.type, graphics, from, to, drawing.color);
  }

  function renderAllWhiteboardDrawings(): void {
    if (!isDrawingEnabledSurface) return;
    const existingChildren = whiteboardDrawingsLayer.removeChildren();
    for (const child of existingChildren) {
      child.destroy({ children: true });
    }
    for (const drawing of completedWhiteboardDrawingObjects) {
      const strokeGraphic = new Graphics();
      strokeGraphic.eventMode = "none";
      renderWhiteboardDrawing(strokeGraphic, drawing);
      whiteboardDrawingsLayer.addChild(strokeGraphic);
    }
  }

  function resetActiveWhiteboardDrawing(): void {
    activeWhiteboardDrawing = null;
    whiteboardPreviewGraphic.clear();
  }

  function startWhiteboardDrawing(event: unknown): void {
    if (!isDrawingEnabledSurface || isPlaybackInputLocked() || activeDrag) return;
    if (activeWhiteboardTool === "move") return;
    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) return;
    if (activeWhiteboardTool === "pen") {
      activeWhiteboardDrawing = {
        id: createDrawingId(),
        type: "pen",
        createdAt: Date.now(),
        color: activeWhiteboardColor,
        geometry: {
          points: [{ x: worldPoint.x, y: worldPoint.y }],
        },
      };
      whiteboardPreviewGraphic.clear();
      return;
    }
    const nextType: WhiteboardDrawingType =
      activeWhiteboardTool === "dashed" ? "dashedArrow" : activeWhiteboardTool;
    activeWhiteboardDrawing = {
      id: createDrawingId(),
      type: nextType,
      createdAt: Date.now(),
      color: activeWhiteboardColor,
      geometry: {
        start: { x: worldPoint.x, y: worldPoint.y },
        end: { x: worldPoint.x, y: worldPoint.y },
        controlPoint: null,
      },
    };
    whiteboardPreviewGraphic.clear();
  }

  function updateWhiteboardDrawing(event: unknown): void {
    if (!isDrawingEnabledSurface || isPlaybackInputLocked() || activeDrag) return;
    if (activeWhiteboardTool === "move") return;
    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) return;
    if (!activeWhiteboardDrawing) return;
    if (activeWhiteboardDrawing.type === "pen") {
      (activeWhiteboardDrawing.geometry as WhiteboardPenGeometry).points.push(worldPoint);
    } else {
      (activeWhiteboardDrawing.geometry as WhiteboardLinearGeometry).end = worldPoint;
    }
    whiteboardPreviewGraphic.clear();
    renderWhiteboardDrawing(whiteboardPreviewGraphic, activeWhiteboardDrawing);
  }

  function endWhiteboardDrawing(event?: unknown): void {
    if (!isDrawingEnabledSurface || isPlaybackInputLocked() || activeDrag) return;
    if (activeWhiteboardTool === "move") return;
    if (!activeWhiteboardDrawing) return;
    if (event != null) {
      const worldPoint = getBoundedWorldPointFromEvent(event);
      if (worldPoint) {
        if (activeWhiteboardDrawing.type === "pen") {
          (activeWhiteboardDrawing.geometry as WhiteboardPenGeometry).points.push(worldPoint);
        } else {
          (activeWhiteboardDrawing.geometry as WhiteboardLinearGeometry).end = worldPoint;
        }
      }
    }

    if (
      activeWhiteboardDrawing.type === "pen" &&
      (activeWhiteboardDrawing.geometry as WhiteboardPenGeometry).points.length < 2
    ) {
      resetActiveWhiteboardDrawing();
      return;
    }

    completedWhiteboardDrawingObjects.push(cloneWhiteboardDrawingObject(activeWhiteboardDrawing));
    renderAllWhiteboardDrawings();
    resetActiveWhiteboardDrawing();
  }

  function eraseLastPenStroke(): void {
    if (!isDrawingEnabledSurface) return;
    resetActiveWhiteboardDrawing();
    for (let index = completedWhiteboardDrawingObjects.length - 1; index >= 0; index -= 1) {
      const drawing = completedWhiteboardDrawingObjects[index];
      if (!drawing || drawing.type !== "pen") continue;
      completedWhiteboardDrawingObjects.splice(index, 1);
      renderAllWhiteboardDrawings();
      return;
    }
  }

  function setPlayerDragVisualTarget(player: TacticalPlayer, isDragging: boolean): void {
    player.dragScaleTarget = isDragging ? PREMIUM_TOKEN_DRAG_SCALE : PREMIUM_TOKEN_IDLE_SCALE;
    player.dragShadowAlphaTarget = isDragging
      ? PREMIUM_TOKEN_DRAG_SHADOW_ALPHA
      : PREMIUM_TOKEN_IDLE_SHADOW_ALPHA;
  }

  function animatePlayerDragVisuals(deltaMs: number): void {
    const blend = Math.min(1, Math.max(0.16, deltaMs / 72));
    for (const player of players) {
      const currentScale = player.token.scale.x;
      const nextScale = currentScale + (player.dragScaleTarget - currentScale) * blend;
      player.token.scale.set(nextScale, nextScale);

      const currentShadow = player.tokenShadow.alpha;
      player.tokenShadow.alpha =
        currentShadow + (player.dragShadowAlphaTarget - currentShadow) * blend;
    }
  }

  function cloneSnapshot(snapshot: PhaseSnapshot): PhaseSnapshot {
    return {
      players: snapshot.players.map((point) => ({ x: point.x, y: point.y })),
      football: snapshot.football.map((point) => ({ id: point.id, x: point.x, y: point.y })),
    };
  }

  function setSelectedPhase(nextPhaseIndex: number): void {
    selectedPhaseIndex = nextPhaseIndex;
    options.onSelectedPhaseChange?.(selectedPhaseIndex);
  }

  function captureCurrentSnapshot(): PhaseSnapshot {
    return {
      players: players.map((player) => ({ x: player.current.x, y: player.current.y })),
      football: tacticalItems
        .filter((item) => item.type === "football")
        .map((item) => ({ id: item.id, x: item.x, y: item.y })),
    };
  }

  function applySnapshotToSurface(snapshot: PhaseSnapshot): void {
    for (const player of players) {
      const point = snapshot.players[players.indexOf(player)];
      if (!point) continue;
      player.current = { x: point.x, y: point.y };
      setTokenWorldPositionForPoint(player, player.current, mapper);
    }
    for (const ball of snapshot.football) {
      const item = findTacticalItemById(ball.id);
      if (!item || item.type !== "football") continue;
      item.x = clampNormalizedValue(ball.x);
      item.y = clampNormalizedValue(ball.y);
      setItemWorldPosition(item, mapper);
    }
  }

  function cancelPlaybackAnimation(): void {
    isPlaying = false;
    isPaused = false;
    playElapsedMs = 0;
    playbackPath = [];
    activeSegmentIndex = 0;
    loggedSegmentIndex = -1;
    emitPlaybackStateChange();
  }

  function startPlayback(path: PhaseSnapshot[]): void {
    if (path.length < 2) return;
    playbackPath = path;
    activeSegmentIndex = 0;
    loggedSegmentIndex = -1;
    isPlaying = true;
    isPaused = false;
    playElapsedMs = 0;
    applySnapshotToSurface(path[0]!);
    emitPlaybackStateChange();
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
    releaseActiveDrag();
    clearSelectedItem();
    cancelPlaybackAnimation();
    const snapshot = phaseIndex === 0 ? startPositions : phases[phaseIndex - 1];
    if (!snapshot) return;
    applySnapshotToSurface(snapshot);
    setSelectedPhase(phaseIndex);
  }

  function handlePlay(): void {
    releaseActiveDrag();
    clearSelectedItem();
    if (isPaused && playbackPath.length >= 2) {
      isPaused = false;
      isPlaying = true;
      emitPlaybackStateChange();
      return;
    }
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
        const fromPoint = fromSnapshot.players[idx];
        const toPoint = toSnapshot.players[idx];
        if (!fromPoint || !toPoint) continue;
        player.current = {
          x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
          y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
        };
        setTokenWorldPositionForPoint(player, player.current, mapper);
      }
      for (const toBall of toSnapshot.football) {
        const fromBall = fromSnapshot.football.find((point) => point.id === toBall.id) ?? toBall;
        const item = findTacticalItemById(toBall.id);
        if (!item || item.type !== "football") continue;
        item.x = fromBall.x + (toBall.x - fromBall.x) * progress;
        item.y = fromBall.y + (toBall.y - fromBall.y) * progress;
        setItemWorldPosition(item, mapper);
      }

      if (progress >= 1) {
        applySnapshotToSurface(toSnapshot);
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

  function bindPlayerPointerDown(player: TacticalPlayer): void {
    player.token.on("pointerdown", (event) => {
      if (isPlaybackInputLocked()) return;
      if (activeWhiteboardTool !== "move") return;
      if (activeDrag) return;
      clearSelectedItem();
      const useDragThreshold = surfaceVariant === "tactical";
      const pointerId = getPointerIdFromEvent(event);
      const startStagePoint = getStagePointFromEvent(event, app.stage);
      activeDrag = {
        type: "player",
        playerId: player.id,
        pointerId,
        startStagePoint,
        hasCrossedThreshold: !useDragThreshold,
      };
      if (!useDragThreshold) {
        setPlayerDragVisualTarget(player, true);
        updateDraggedPlayerFromEvent(event);
      }
      syncWhiteboardTokenInputMode();
    });
  }

  function syncPlayersToViewport(): void {
    for (const player of players) {
      setPlayerTouchHitArea(player, mapper);
      setTokenWorldPositionForPoint(player, player.current, mapper);
    }
  }

  function rebuildWhiteboardPlayers(
    counts: TacticalPadLiteSurfaceOptions["whiteboardTeamCounts"],
    colors: TacticalPadLiteSurfaceOptions["whiteboardTeamColors"],
  ): void {
    if (!isWhiteboardSurface) return;
    releaseActiveDrag();
    // Preserve committed drawings; only clear in-progress preview state.
    resetActiveWhiteboardDrawing();
    for (const player of players) {
      player.token.removeAllListeners();
      player.token.destroy({ children: true });
    }
    players.length = 0;
    const nextSeeds = createWhiteboardPlayerSeeds(counts, colors);
    for (const seed of nextSeeds) {
      const nextPlayer = createSurfacePlayer(seed);
      players.push(nextPlayer);
      bindPlayerPointerDown(nextPlayer);
    }
    syncPlayersToViewport();
    syncWhiteboardTokenInputMode();
    renderAllWhiteboardDrawings();
  }

  function getTacticalPlayerSerial(player: TacticalPlayer): number {
    const serialMatch = /^P(\d+)$/.exec(player.id);
    const parsed = serialMatch?.[1] ? Number(serialMatch[1]) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : player.number;
  }

  function createNextTacticalPlayerSeed(): PlayerSeed | null {
    if (surfaceVariant !== "tactical") return null;
    if (players.length >= 15) return null;

    const maxSerial = players.reduce<number>(
      (maxValue, player) => Math.max(maxValue, getTacticalPlayerSerial(player)),
      0,
    );
    const nextSerial = Math.max(1, maxSerial + 1);
    const lastPlayer = players[players.length - 1];
    const basePoint = lastPlayer ? lastPlayer.current : { x: 50, y: 50 };
    let nextX = basePoint.x + (lastPlayer ? 5 : 0);
    let nextY = basePoint.y;
    if (nextX > NORMALIZED_MAX - 4) {
      nextX = 30;
      nextY += 6;
    }

    return {
      id: `P${nextSerial}`,
      number: nextSerial,
      team: "BLUE",
      color: "blue",
      position: {
        x: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, nextX)),
        y: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, nextY)),
      },
    };
  }

  function addTacticalPlayer(): void {
    if (surfaceVariant !== "tactical") return;
    const nextSeed = createNextTacticalPlayerSeed();
    if (!nextSeed) return;
    releaseActiveDrag();
    const nextPlayer = createSurfacePlayer(nextSeed);
    players.push(nextPlayer);
    bindPlayerPointerDown(nextPlayer);
    syncPlayersToViewport();
    syncWhiteboardTokenInputMode();
  }

  function removeLastTacticalPlayer(): void {
    if (surfaceVariant !== "tactical") return;
    if (players.length <= 0) return;
    releaseActiveDrag();
    const removedPlayer = players.pop();
    if (!removedPlayer) return;
    removedPlayer.token.removeAllListeners();
    removedPlayer.token.destroy({ children: true });
    syncPlayersToViewport();
    syncWhiteboardTokenInputMode();
  }

  for (const player of players) {
    bindPlayerPointerDown(player);
  }
  syncPlayersToViewport();

  function handleStagePointerMove(event: unknown): void {
    updateDraggedPlayerFromEvent(event);
    updateDraggedItemFromEvent(event);
    updateWhiteboardDrawing(event);
  }

  function handleStagePointerUp(event: unknown): void {
    if (!isMatchingActivePointer(event)) return;
    endWhiteboardDrawing(event);
    releaseActiveDrag();
  }

  app.stage.on("pointermove", handleStagePointerMove);
  app.stage.on("pointerup", handleStagePointerUp);
  app.stage.on("pointerupoutside", handleStagePointerUp);
  app.stage.on("pointerdown", (event) => {
    if (activeDrag == null && activeWhiteboardTool === "move" && !isPlaybackInputLocked()) {
      const stagePoint = getStagePointFromEvent(event, app.stage);
      if (stagePoint) {
        clearSelectedItem();
      }
    }
    startWhiteboardDrawing(event);
  });
  app.ticker.add(() => {
    stepPlayback(app.ticker.deltaMS);
    animatePlayerDragVisuals(app.ticker.deltaMS);
  });

  syncWhiteboardTokenInputMode();

  const resizeObserver = new ResizeObserver(() => {
    fitToHost();
  });
  resizeObserver.observe(host);
  fitToHost();
  options.onPhaseCountChange?.(0);
  options.onSelectedPhaseChange?.(0);
  emitPlaybackStateChange();

  return {
    setStart: () => {
      releaseActiveDrag();
      clearSelectedItem();
      cancelPlaybackAnimation();
      startPositions = captureCurrentSnapshot();
      phases = [];
      options.onPhaseCountChange?.(0);
      setSelectedPhase(0);
    },
    addPhase: () => {
      releaseActiveDrag();
      clearSelectedItem();
      cancelPlaybackAnimation();
      phases = [...phases, captureCurrentSnapshot()];
      options.onPhaseCountChange?.(phases.length);
      setSelectedPhase(phases.length);
    },
    jumpToPhase,
    undoPhase: () => {
      releaseActiveDrag();
      clearSelectedItem();
      cancelPlaybackAnimation();
      if (phases.length <= 0) return;
      phases = phases.slice(0, -1);
      const previousSnapshot = phases[phases.length - 1] ?? startPositions;
      applySnapshotToSurface(previousSnapshot);
      options.onPhaseCountChange?.(phases.length);
      setSelectedPhase(phases.length);
    },
    play: handlePlay,
    pausePlayback: () => {
      if (!isPlaying) return;
      releaseActiveDrag();
      clearSelectedItem();
      resetActiveWhiteboardDrawing();
      isPlaying = false;
      isPaused = true;
      emitPlaybackStateChange();
    },
    resumePlayback: () => {
      if (!isPaused || playbackPath.length < 2) return;
      isPaused = false;
      isPlaying = true;
      emitPlaybackStateChange();
    },
    addTacticalPlayer,
    removeTacticalPlayer: removeLastTacticalPlayer,
    setItems: (items) => {
      upsertTacticalItems(items);
    },
    setItemMode: (mode) => {
      if (surfaceVariant !== "tactical") return;
      itemMode = mode;
      if (itemMode === "locked") {
        releaseActiveDrag();
        clearSelectedItem();
      }
      syncWhiteboardTokenInputMode();
      renderTacticalItems();
    },
    reset: () => {
      releaseActiveDrag();
      cancelPlaybackAnimation();
      applySnapshotToSurface(startPositions);
      setSelectedPhase(0);
    },
    reflow: () => {
      fitToHost();
    },
    setWhiteboardTeamConfig: (config) => {
      if (!isWhiteboardSurface) return;
      rebuildWhiteboardPlayers(config.counts, config.colors);
    },
    setWhiteboardDrawTool: (tool) => {
      if (!isDrawingEnabledSurface) return;
      if (tool !== "move") {
        releaseActiveDrag();
        clearSelectedItem();
      }
      activeWhiteboardTool = tool;
      resetActiveWhiteboardDrawing();
      syncWhiteboardTokenInputMode();
      renderAllWhiteboardDrawings();
    },
    setWhiteboardDrawColor: (color) => {
      if (!isDrawingEnabledSurface) return;
      activeWhiteboardColor = color;
      resetActiveWhiteboardDrawing();
      renderAllWhiteboardDrawings();
    },
    eraseWhiteboardPenStroke: () => {
      if (!isDrawingEnabledSurface) return;
      eraseLastPenStroke();
    },
    undoWhiteboardStroke: () => {
      if (!isDrawingEnabledSurface) return;
      resetActiveWhiteboardDrawing();
      if (completedWhiteboardDrawingObjects.length === 0) return;
      completedWhiteboardDrawingObjects.pop();
      renderAllWhiteboardDrawings();
    },
    clearWhiteboardStrokes: () => {
      if (!isDrawingEnabledSurface) return;
      resetActiveWhiteboardDrawing();
      completedWhiteboardDrawingObjects.length = 0;
      renderAllWhiteboardDrawings();
    },
    exportImageCanvas: () => {
      const rendererWithExtract = app.renderer as typeof app.renderer & {
        extract?: {
          canvas?: (target: unknown) => unknown;
        };
      };
      const extractCanvas = rendererWithExtract.extract?.canvas;
      if (typeof extractCanvas !== "function") {
        return null;
      }

      const resolveHtmlCanvas = (candidate: unknown): HTMLCanvasElement | null =>
        typeof HTMLCanvasElement !== "undefined" && candidate instanceof HTMLCanvasElement ? candidate : null;

      try {
        const extractedFromStage = resolveHtmlCanvas(extractCanvas(app.stage));
        if (extractedFromStage) {
          return extractedFromStage;
        }
      } catch {
        // Fall back to texture extraction path.
      }

      const generatedTexture = app.renderer.textureGenerator.generateTexture(app.stage);
      try {
        return resolveHtmlCanvas(extractCanvas(generatedTexture));
      } catch {
        return null;
      } finally {
        generatedTexture.destroy(true);
      }
    },
    destroy: () => {
      resizeObserver.disconnect();
      app.stage.removeAllListeners();
      app.ticker.stop();
      pitchMount?.dispose();
      for (const item of tacticalItems) {
        item.graphic.removeAllListeners();
        item.graphic.destroy();
        item.selectionGraphic.destroy();
      }
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
