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
import { createMicroAthleteToken, type MicroAthleteKitPattern } from "./createMicroAthleteToken";
import {
  createTacticalPitchVisualRoot,
  type TacticalPitchTheme,
} from "../../tactical-lite/pixi/renderTacticalPitch";
import {
  NORMALIZED_MAX,
  NORMALIZED_MIN,
  type NormalizedPoint,
} from "../shared/normalization";
import { createTacticalDrawingController } from "../../features/quickboard/drawing/tacticalDrawingController";
import {
  drawingToolToWhiteboardTool,
  sanitizeDrawingSnapshot,
  sanitizeDrawingTool,
  type TacticalDrawingSnapshot,
  type WhiteboardDrawTool,
} from "../../features/quickboard/drawing/tacticalDrawingTypes";

export type TacticalKitPattern = MicroAthleteKitPattern;
export type TacticalLabelMode = "number" | "initials";
export type TacticalPlayerKitFields = {
  kitBaseColor?: string;
  kitPattern?: TacticalKitPattern;
  kitPatternColor?: string;
  labelMode?: TacticalLabelMode;
  initials?: string;
};
export type TacticalPlayerKitPatch = Partial<TacticalPlayerKitFields>;
export type TacticalPlayerKitSnapshot = TacticalPlayerKitFields & {
  id: string;
  number: number;
  team: "BLUE" | "RED";
};

type TacticalPlayer = TacticalPlayerKitFields & {
  id: string;
  number: number;
  team: "BLUE" | "RED";
  teamColor: WhiteboardTokenColor;
  current: NormalizedPoint;
  token: Container;
  tokenShadow: Graphics;
  dragScaleTarget: number;
  dragShadowAlphaTarget: number;
};

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

export type TacticalBoardState = {
  version: number;
  players: unknown[];
  items: unknown[];
  drawings: unknown[];
  phases: unknown[];
  movementPaths: unknown[];
  kits?: unknown;
  teamKits?: unknown;
  teamState?: unknown;
  viewport?: unknown;
  startSnapshot?: unknown;
  drawTool?: unknown;
  drawColor?: unknown;
  itemMode?: unknown;
};

export type TacticalPadLiteSurface = {
  setStart: () => void;
  addPhase: () => void;
  undoPhase: () => void;
  play: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  addTacticalPlayer: (team?: "BLUE" | "RED") => void;
  removeTacticalPlayer: (team?: "BLUE" | "RED") => void;
  getTacticalPlayer: (playerId: string) => TacticalPlayerKitSnapshot | null;
  patchTacticalPlayer: (playerId: string, patch: TacticalPlayerKitPatch) => void;
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
  exportBoardState: () => TacticalBoardState;
  importBoardState: (state: TacticalBoardState) => boolean;
  exportImageCanvas: () => HTMLCanvasElement | null;
  destroy: () => void;
};

type TacticalPadLiteSurfaceOptions = {
  onPhaseCountChange?: (count: number) => void;
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
  onTacticalPlayerDoubleTap?: (payload: { playerId: string; clientX: number; clientY: number }) => void;
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

const WORLD_SIZE = { width: 160, height: 100 } as const;
const PLAYER_RADIUS = 4.1;
const PLAYER_TOUCH_HIT_DIAMETER_PX = 48;
const TACTICAL_ITEM_HALF_SIZE = 2.2;
const TACTICAL_ITEM_DRAG_THRESHOLD_PX = 5;
const TACTICAL_ITEM_TOUCH_HIT_DIAMETER_PX = 46;
const WHITEBOARD_DEFAULT_STROKE_COLOR = 0x111111;
const WHITEBOARD_BLUE_START_X = 30;
const WHITEBOARD_RED_START_X = 70;
const DOUBLE_TAP_WINDOW_MS = 300;
const KIT_COLOR_NAMES = [
  "navy",
  "blue",
  "sky",
  "cyan",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
  "maroon",
  "purple",
  "pink",
  "white",
  "grey",
  "black",
] as const;
const KIT_COLOR_NUMERIC: Record<(typeof KIT_COLOR_NAMES)[number], number> = {
  navy: 0x1e3a8a,
  blue: 0x2563eb,
  sky: 0x0ea5e9,
  cyan: 0x06b6d4,
  green: 0x16a34a,
  lime: 0x84cc16,
  red: 0xdc2626,
  orange: 0xf97316,
  maroon: 0x7f1d1d,
  purple: 0x7c3aed,
  pink: 0xec4899,
  yellow: 0xfacc15,
  white: 0xffffff,
  grey: 0x6b7280,
  black: 0x111827,
};
type TacticalKitColor = (typeof KIT_COLOR_NAMES)[number];

type PlayerSeed = {
  id: string;
  number: number;
  team: "BLUE" | "RED";
  color: WhiteboardTokenColor;
  position: NormalizedPoint;
  kitBaseColor?: TacticalKitColor;
  kitPattern?: TacticalKitPattern;
  kitPatternColor?: TacticalKitColor;
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

type TacticalBoardPlayerState = TacticalPlayerKitFields & {
  id: string;
  number: number;
  team: "BLUE" | "RED";
  teamColor: WhiteboardTokenColor;
  x: number;
  y: number;
};

type TacticalBoardDrawingSnapshot = TacticalDrawingSnapshot;

type TacticalBoardTeamState = {
  colors: {
    blue: WhiteboardTokenColor;
    red: WhiteboardTokenColor;
  };
  counts: {
    blue: number;
    red: number;
  };
};

type TacticalTeamKitState = {
  primaryColor: TacticalKitColor;
  secondaryColor: TacticalKitColor;
  pattern: TacticalKitPattern;
};

type TacticalBoardTeamKitsState = {
  A: TacticalTeamKitState;
  B: TacticalTeamKitState;
};

const TACTICAL_INITIAL_TEAM_COUNTS = {
  blue: 1,
  red: 1,
} as const;

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

function sanitizeKitColor(value: string | undefined): TacticalKitColor | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if ((KIT_COLOR_NAMES as readonly string[]).includes(normalized)) {
    return normalized as TacticalKitColor;
  }
  return undefined;
}

function sanitizeKitPattern(value: TacticalKitPattern | undefined): TacticalKitPattern | undefined {
  if (!value) return undefined;
  if (value === "plain" || value === "hoops" || value === "slash" || value === "stripes") return value;
  return undefined;
}

function sanitizeLabelMode(value: TacticalLabelMode | undefined): TacticalLabelMode | undefined {
  if (value === "number" || value === "initials") return value;
  return undefined;
}

export function sanitizeInitials(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const sanitized = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  return sanitized.length > 0 ? sanitized : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeWhiteboardTokenColor(value: unknown): WhiteboardTokenColor | null {
  if (value === "blue" || value === "red" || value === "yellow" || value === "black") {
    return value;
  }
  return null;
}

function sanitizeTeam(value: unknown): "BLUE" | "RED" | null {
  if (value === "BLUE" || value === "RED") return value;
  return null;
}

function sanitizeNormalizedPoint(point: unknown): NormalizedPoint | null {
  if (!isRecord(point)) return null;
  const x = typeof point.x === "number" && Number.isFinite(point.x) ? clampNormalizedValue(point.x) : null;
  const y = typeof point.y === "number" && Number.isFinite(point.y) ? clampNormalizedValue(point.y) : null;
  if (x == null || y == null) return null;
  return { x, y };
}

function sanitizeSnapshotFootball(input: unknown): PhaseBallSnapshot[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const id = typeof entry.id === "string" ? entry.id.trim() : "";
      if (!id) return null;
      const x = typeof entry.x === "number" && Number.isFinite(entry.x) ? clampNormalizedValue(entry.x) : null;
      const y = typeof entry.y === "number" && Number.isFinite(entry.y) ? clampNormalizedValue(entry.y) : null;
      if (x == null || y == null) return null;
      return { id, x, y };
    })
    .filter((entry): entry is PhaseBallSnapshot => entry != null);
}

function sanitizePhaseSnapshot(input: unknown): PhaseSnapshot | null {
  if (!isRecord(input)) return null;
  const players = Array.isArray(input.players)
    ? input.players
        .map((entry) => sanitizeNormalizedPoint(entry))
        .filter((entry): entry is NormalizedPoint => entry != null)
    : [];
  const football = sanitizeSnapshotFootball(input.football);
  return {
    players,
    football,
  };
}

function sanitizeBoardDrawingSnapshot(
  input: unknown,
  drawingMapper: Pick<ReturnType<typeof createWorldViewport>, "worldToNormalized">,
): TacticalBoardDrawingSnapshot | null {
  return sanitizeDrawingSnapshot(input, drawingMapper);
}

function sanitizeBoardPlayerState(input: unknown): TacticalBoardPlayerState | null {
  if (!isRecord(input)) return null;
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (id.length <= 0) return null;
  const team = sanitizeTeam(input.team);
  const teamColor = sanitizeWhiteboardTokenColor(input.teamColor);
  if (!team || !teamColor) return null;
  const number =
    typeof input.number === "number" && Number.isFinite(input.number)
      ? Math.max(1, Math.floor(input.number))
      : 1;
  const normalizedPoint = sanitizeNormalizedPoint({ x: input.x, y: input.y });
  if (!normalizedPoint) return null;
  return {
    id,
    number,
    team,
    teamColor,
    x: normalizedPoint.x,
    y: normalizedPoint.y,
    kitBaseColor: sanitizeKitColor(typeof input.kitBaseColor === "string" ? input.kitBaseColor : undefined),
    kitPattern: sanitizeKitPattern((input.kitPattern as TacticalKitPattern | undefined) ?? undefined),
    kitPatternColor: sanitizeKitColor(typeof input.kitPatternColor === "string" ? input.kitPatternColor : undefined),
    labelMode: sanitizeLabelMode((input.labelMode as TacticalLabelMode | undefined) ?? undefined),
    initials: sanitizeInitials(typeof input.initials === "string" ? input.initials : undefined),
  };
}

function sanitizeTacticalItemCandidate(input: unknown): TacticalItem | null {
  if (!isRecord(input)) return null;
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (id.length <= 0) return null;
  const type = input.type;
  if (
    type !== "cone" &&
    type !== "pole" &&
    type !== "ladder" &&
    type !== "tackleBag" &&
    type !== "football" &&
    type !== "sliotar"
  ) {
    return null;
  }
  const x = typeof input.x === "number" && Number.isFinite(input.x) ? input.x : null;
  const y = typeof input.y === "number" && Number.isFinite(input.y) ? input.y : null;
  if (x == null || y == null) return null;
  return normalizeTacticalItem({
    id,
    type,
    x,
    y,
    rotation: typeof input.rotation === "number" ? input.rotation : undefined,
    scale: typeof input.scale === "number" ? input.scale : undefined,
  });
}

function sanitizePlayerKitPatch(patch: TacticalPlayerKitPatch): TacticalPlayerKitFields {
  const nextBaseColor = sanitizeKitColor(patch.kitBaseColor);
  const nextPattern = sanitizeKitPattern(patch.kitPattern);
  const nextPatternColor = sanitizeKitColor(patch.kitPatternColor);
  const nextLabelMode = sanitizeLabelMode(patch.labelMode);
  const nextInitials = sanitizeInitials(patch.initials);
  return {
    ...(patch.kitBaseColor !== undefined ? { kitBaseColor: nextBaseColor } : {}),
    ...(patch.kitPattern !== undefined ? { kitPattern: nextPattern } : {}),
    ...(patch.kitPatternColor !== undefined ? { kitPatternColor: nextPatternColor } : {}),
    ...(patch.labelMode !== undefined ? { labelMode: nextLabelMode } : {}),
    ...(patch.initials !== undefined ? { initials: nextInitials } : {}),
  };
}

function defaultKitPatternColor(baseColor: TacticalKitColor): TacticalKitColor {
  return baseColor === "white" ? "black" : "white";
}

function createTeamKitState(primaryColor: TacticalKitColor, pattern: TacticalKitPattern = "plain"): TacticalTeamKitState {
  return {
    primaryColor,
    secondaryColor: defaultKitPatternColor(primaryColor),
    pattern,
  };
}

function createDefaultTacticalTeamKits(
  colors: TacticalPadLiteSurfaceOptions["whiteboardTeamColors"],
): TacticalBoardTeamKitsState {
  const bluePrimary = sanitizeKitColor(colors?.blue) ?? "blue";
  const redPrimary = sanitizeKitColor(colors?.red) ?? "red";
  return {
    A: createTeamKitState(bluePrimary, "plain"),
    B: createTeamKitState(redPrimary, "plain"),
  };
}

function sanitizeTeamKitState(input: unknown): TacticalTeamKitState | null {
  if (!isRecord(input)) return null;
  const primaryColor = sanitizeKitColor(typeof input.primaryColor === "string" ? input.primaryColor : undefined);
  if (!primaryColor) return null;
  const pattern = sanitizeKitPattern((input.pattern as TacticalKitPattern | undefined) ?? undefined) ?? "plain";
  const secondaryColor = sanitizeKitColor(typeof input.secondaryColor === "string" ? input.secondaryColor : undefined)
    ?? defaultKitPatternColor(primaryColor);
  return {
    primaryColor,
    secondaryColor,
    pattern,
  };
}

function sanitizeBoardTeamKitsState(input: unknown): TacticalBoardTeamKitsState | null {
  if (!isRecord(input)) return null;
  const teamA = sanitizeTeamKitState(input.A);
  const teamB = sanitizeTeamKitState(input.B);
  if (!teamA || !teamB) return null;
  return {
    A: teamA,
    B: teamB,
  };
}

function buildTeamKitFromPlayerStates(
  team: "BLUE" | "RED",
  players: TacticalBoardPlayerState[],
  fallback: TacticalTeamKitState,
): TacticalTeamKitState {
  const firstTeamPlayer = players.find((player) => player.team === team);
  if (!firstTeamPlayer) {
    return { ...fallback };
  }
  const primaryColor = sanitizeKitColor(firstTeamPlayer.kitBaseColor) ?? fallback.primaryColor;
  const pattern = sanitizeKitPattern(firstTeamPlayer.kitPattern) ?? fallback.pattern;
  const secondaryColor = sanitizeKitColor(firstTeamPlayer.kitPatternColor) ?? fallback.secondaryColor;
  return {
    primaryColor,
    secondaryColor,
    pattern,
  };
}

function safePlayerNumberLabel(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.max(0, Math.floor(value)));
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

function teamPrefix(team: "BLUE" | "RED"): "B" | "R" {
  return team === "RED" ? "R" : "B";
}

function teamLaneX(team: "BLUE" | "RED"): number {
  return team === "RED" ? WHITEBOARD_RED_START_X : WHITEBOARD_BLUE_START_X;
}

function teamColor(
  team: "BLUE" | "RED",
  colors: TacticalPadLiteSurfaceOptions["whiteboardTeamColors"],
): WhiteboardTokenColor {
  if (team === "RED") {
    return colors?.red ?? "red";
  }
  return colors?.blue ?? "blue";
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

function isBallItem(item: Pick<TacticalItem, "type">): boolean {
  return item.type === "football" || item.type === "sliotar";
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

  const whiteboardDrawingsLayer = new Container();
  whiteboardDrawingsLayer.eventMode = "none";
  world.addChild(whiteboardDrawingsLayer);

  const whiteboardPreviewLayer = new Container();
  whiteboardPreviewLayer.eventMode = "none";
  world.addChild(whiteboardPreviewLayer);

  const whiteboardPreviewGraphic = new Graphics();
  whiteboardPreviewGraphic.eventMode = "none";
  whiteboardPreviewLayer.addChild(whiteboardPreviewGraphic);

  const itemsLayer = new Container();
  itemsLayer.eventMode = "passive";
  world.addChild(itemsLayer);

  const playersLayer = new Container();
  world.addChild(playersLayer);

  const whiteboardInputLayer = new Container();
  whiteboardInputLayer.eventMode = "none";
  whiteboardInputLayer.hitArea = {
    contains: (x: number, y: number) =>
      x >= 0 && y >= 0 && x <= WORLD_SIZE.width && y <= WORLD_SIZE.height,
  };
  world.addChild(whiteboardInputLayer);

  let mapper = createWorldViewport(
    WORLD_SIZE,
    { width: host.clientWidth || 800, height: host.clientHeight || 520 },
  );

  let tacticalTeamColors: TacticalPadLiteSurfaceOptions["whiteboardTeamColors"] = {
    blue: options.whiteboardTeamColors?.blue ?? "blue",
    red: options.whiteboardTeamColors?.red ?? "red",
  };
  let tacticalTeamKits: TacticalBoardTeamKitsState = createDefaultTacticalTeamKits(tacticalTeamColors);

  const playerSeeds =
    surfaceVariant === "whiteboard"
      ? createWhiteboardPlayerSeeds(options.whiteboardTeamCounts, options.whiteboardTeamColors)
      : createWhiteboardPlayerSeeds(TACTICAL_INITIAL_TEAM_COUNTS, tacticalTeamColors);

  function getTeamKitForTeam(team: "BLUE" | "RED"): TacticalTeamKitState {
    return team === "BLUE" ? tacticalTeamKits.A : tacticalTeamKits.B;
  }

  function setTeamKitForTeam(team: "BLUE" | "RED", nextTeamKit: TacticalTeamKitState): void {
    if (team === "BLUE") {
      tacticalTeamKits = {
        ...tacticalTeamKits,
        A: nextTeamKit,
      };
      return;
    }
    tacticalTeamKits = {
      ...tacticalTeamKits,
      B: nextTeamKit,
    };
  }

  function teamKitToPlayerKitFields(teamKit: TacticalTeamKitState): TacticalPlayerKitFields {
    return {
      kitBaseColor: teamKit.primaryColor,
      kitPattern: teamKit.pattern,
      kitPatternColor: teamKit.secondaryColor,
    };
  }

  function syncPlayerKitFromTeamKit(player: TacticalPlayer): void {
    if (surfaceVariant !== "tactical") return;
    const teamKit = getTeamKitForTeam(player.team);
    const kitFields = teamKitToPlayerKitFields(teamKit);
    player.kitBaseColor = kitFields.kitBaseColor;
    player.kitPattern = kitFields.kitPattern;
    player.kitPatternColor = kitFields.kitPatternColor;
  }

  function rerenderAllTacticalPlayersOnTeam(team: "BLUE" | "RED"): void {
    if (surfaceVariant !== "tactical") return;
    for (const teammate of players) {
      if (teammate.team !== team) continue;
      syncPlayerKitFromTeamKit(teammate);
      rerenderTacticalPlayerToken(teammate);
    }
  }

  function getEffectiveKitBaseColor(player: Pick<TacticalPlayer, "team" | "teamColor" | "kitBaseColor">): TacticalKitColor {
    const fallbackColor =
      surfaceVariant === "tactical" ? getTeamKitForTeam(player.team).primaryColor : player.teamColor;
    return sanitizeKitColor(player.kitBaseColor) ?? fallbackColor;
  }

  function getEffectiveKitPattern(player: Pick<TacticalPlayer, "team" | "kitPattern">): TacticalKitPattern {
    const fallbackPattern = surfaceVariant === "tactical" ? getTeamKitForTeam(player.team).pattern : "plain";
    return sanitizeKitPattern(player.kitPattern) ?? fallbackPattern;
  }

  function getEffectiveKitPatternColor(
    player: Pick<TacticalPlayer, "team" | "kitPatternColor" | "kitBaseColor" | "teamColor">,
  ): TacticalKitColor {
    const baseColor = getEffectiveKitBaseColor(player);
    if (surfaceVariant === "tactical") {
      return sanitizeKitColor(player.kitPatternColor) ?? getTeamKitForTeam(player.team).secondaryColor;
    }
    return sanitizeKitColor(player.kitPatternColor) ?? defaultKitPatternColor(baseColor);
  }

  function resolvePlayerLabel(player: Pick<TacticalPlayer, "number" | "labelMode" | "initials">): string {
    const labelMode = sanitizeLabelMode(player.labelMode) ?? "number";
    const initials = sanitizeInitials(player.initials);
    if (labelMode === "initials" && initials) {
      return initials;
    }
    return safePlayerNumberLabel(player.number);
  }

  function createTokenPackForPlayer(player: Pick<TacticalPlayer, "number" | "team" | "teamColor" | "kitBaseColor" | "kitPattern" | "kitPatternColor" | "labelMode" | "initials">): {
    token: Container;
    shadow: Graphics;
  } {
    if (surfaceVariant !== "tactical") {
      return createPremiumPlayerToken({
        color: player.teamColor,
        number: player.number,
        radius: PLAYER_RADIUS,
      });
    }
    const baseColor = getEffectiveKitBaseColor(player);
    const pattern = getEffectiveKitPattern(player);
    const patternColor = getEffectiveKitPatternColor(player);
    const label = resolvePlayerLabel(player);
    return createMicroAthleteToken({
      label,
      teamColor: player.teamColor,
      scale: PLAYER_RADIUS / 4.1,
      style: {
        primaryColor: KIT_COLOR_NUMERIC[baseColor],
        secondaryColor: KIT_COLOR_NUMERIC[baseColor],
        badgeColor: KIT_COLOR_NUMERIC[baseColor],
      },
      kitPattern: pattern,
      kitPatternColor: KIT_COLOR_NUMERIC[patternColor],
    });
  }

  function createSurfacePlayer(base: PlayerSeed, kitFields?: TacticalPlayerKitFields): TacticalPlayer {
    const tokenColor: PremiumPlayerTokenColor = base.color;
    const canonicalTeamKit = surfaceVariant === "tactical" ? getTeamKitForTeam(base.team) : null;
    const seedKitFields: TacticalPlayerKitFields = {
      kitBaseColor: sanitizeKitColor(base.kitBaseColor),
      kitPattern: sanitizeKitPattern(base.kitPattern),
      kitPatternColor: sanitizeKitColor(base.kitPatternColor),
    };
    const fallbackTeamKitFields = canonicalTeamKit == null ? {} : teamKitToPlayerKitFields(canonicalTeamKit);
    const nextKitFields: TacticalPlayerKitFields =
      canonicalTeamKit == null
        ? {
            ...seedKitFields,
            ...(kitFields ?? {}),
          }
        : {
            ...fallbackTeamKitFields,
            ...seedKitFields,
            ...(kitFields ?? {}),
          };
    const tokenPack = createTokenPackForPlayer({
      number: base.number,
      team: base.team,
      teamColor: tokenColor,
      ...nextKitFields,
    });
    const { token, shadow } = tokenPack;
    playersLayer.addChild(token);
    return {
      id: base.id,
      number: base.number,
      team: base.team,
      teamColor: tokenColor,
      current: { ...base.position },
      token,
      tokenShadow: shadow,
      dragScaleTarget: PREMIUM_TOKEN_IDLE_SCALE,
      dragShadowAlphaTarget: PREMIUM_TOKEN_IDLE_SHADOW_ALPHA,
      kitBaseColor: sanitizeKitColor(nextKitFields.kitBaseColor),
      kitPattern: sanitizeKitPattern(nextKitFields.kitPattern),
      kitPatternColor: sanitizeKitColor(nextKitFields.kitPatternColor),
      labelMode: sanitizeLabelMode(nextKitFields.labelMode),
      initials: sanitizeInitials(nextKitFields.initials),
    };
  }

  const players: TacticalPlayer[] = playerSeeds.map((seed) => createSurfacePlayer(seed));

  const PLAY_DURATION_MS = 1200;
  let isPlaying = false;
  let isPaused = false;
  let playElapsedMs = 0;
  let playbackPath: PhaseSnapshot[] = [];
  let activeSegmentIndex = 0;
  let loggedSegmentIndex = -1;
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
  const itemSelectionLayer = new Container();
  itemSelectionLayer.eventMode = "none";
  world.addChild(itemSelectionLayer);
  let whiteboardDrawingCounter = 0;
  const tacticalDrawingController = createTacticalDrawingController({
    drawingsLayer: whiteboardDrawingsLayer,
    previewGraphic: whiteboardPreviewGraphic,
    mapperProvider: () => mapper,
    initialTool: "move",
    initialColor: activeWhiteboardColor,
    createDrawingId: () => {
      whiteboardDrawingCounter += 1;
      return `qb-drawing-${whiteboardDrawingCounter}`;
    },
  });
  let lastTappedPlayer: { playerId: string; atMs: number } | null = null;

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

  function getClientPointFromEvent(event: unknown): { x: number; y: number } | null {
    const nativeEvent = (event as { nativeEvent?: { clientX?: unknown; clientY?: unknown } }).nativeEvent;
    if (nativeEvent && typeof nativeEvent.clientX === "number" && typeof nativeEvent.clientY === "number") {
      return { x: nativeEvent.clientX, y: nativeEvent.clientY };
    }
    const stagePoint = getStagePointFromEvent(event, app.stage);
    if (!stagePoint) return null;
    const bounds = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
    return {
      x: bounds.left + stagePoint.x,
      y: bounds.top + stagePoint.y,
    };
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
    const isDrawingInteractionActive = activeWhiteboardTool !== "move" && !isPlaybackInputLocked();
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
    whiteboardInputLayer.eventMode = isDrawingInteractionActive ? "static" : "none";
    whiteboardInputLayer.cursor = activeWhiteboardTool === "eraser" ? "not-allowed" : "crosshair";
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
      const radius = TACTICAL_ITEM_HALF_SIZE * 0.9;
      graphic.circle(0, radius * 0.24, radius * 0.86).fill({ color: 0x020617, alpha: 0.12 });
      graphic.circle(0, 0, radius).fill(0xf8fafc).stroke({ color: 0x475569, width: 0.26 });
      graphic.circle(-radius * 0.22, -radius * 0.3, radius * 0.29).fill({ color: 0xffffff, alpha: 0.42 });
      graphic.arc(0, 0, radius * 0.58, Math.PI * 0.18, Math.PI * 0.82).stroke({
        color: 0x475569,
        width: 0.12,
        alpha: 0.82,
      });
      graphic.arc(0, 0, radius * 0.58, Math.PI * 1.18, Math.PI * 1.82).stroke({
        color: 0x475569,
        width: 0.12,
        alpha: 0.82,
      });
      graphic
        .moveTo(-radius * 0.56, 0)
        .lineTo(-radius * 0.2, 0)
        .moveTo(radius * 0.56, 0)
        .lineTo(radius * 0.2, 0)
        .stroke({ color: 0x64748b, width: 0.12, alpha: 0.74 });
      return;
    }
    if (item.type === "sliotar") {
      const radius = TACTICAL_ITEM_HALF_SIZE * 0.74;
      graphic.circle(0, radius * 0.22, radius * 0.82).fill({ color: 0x111827, alpha: 0.1 });
      graphic.circle(0, 0, radius).fill(0xfff3d6).stroke({ color: 0x6b7280, width: 0.24 });
      graphic.circle(-radius * 0.22, -radius * 0.32, radius * 0.26).fill({ color: 0xffffff, alpha: 0.45 });
      graphic.arc(0, 0, radius * 0.66, Math.PI * 0.32, Math.PI * 0.78).stroke({
        color: 0x4b5563,
        width: 0.15,
        alpha: 0.82,
      });
      graphic.arc(0, 0, radius * 0.66, Math.PI * 1.32, Math.PI * 1.78).stroke({
        color: 0x4b5563,
        width: 0.15,
        alpha: 0.82,
      });
      return;
    }
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

  function renderAllWhiteboardDrawings(): void {
    if (!isDrawingEnabledSurface) return;
    tacticalDrawingController.render();
  }

  function resetActiveWhiteboardDrawing(): void {
    tacticalDrawingController.cancelActiveDraft();
  }

  function startWhiteboardDrawing(event: unknown): void {
    if (!isDrawingEnabledSurface || isPlaybackInputLocked() || activeDrag) return;
    if (activeWhiteboardTool === "move") return;
    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) return;
    tacticalDrawingController.handlePointerDown(worldPoint, getPointerIdFromEvent(event));
  }

  function updateWhiteboardDrawing(event: unknown): void {
    if (!isDrawingEnabledSurface || isPlaybackInputLocked() || activeDrag) return;
    if (activeWhiteboardTool === "move") return;
    const worldPoint = getBoundedWorldPointFromEvent(event);
    if (!worldPoint) return;
    tacticalDrawingController.handlePointerMove(worldPoint, getPointerIdFromEvent(event));
  }

  function endWhiteboardDrawing(event?: unknown): void {
    if (!isDrawingEnabledSurface || isPlaybackInputLocked() || activeDrag) return;
    if (activeWhiteboardTool === "move") return;
    const worldPoint = event == null ? null : getBoundedWorldPointFromEvent(event);
    tacticalDrawingController.handlePointerUp(worldPoint, event == null ? null : getPointerIdFromEvent(event));
  }

  function eraseLastPenStroke(): void {
    if (!isDrawingEnabledSurface) return;
    tacticalDrawingController.deleteSelectedOrLast();
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

  function normalizePhaseForPlayerCount(snapshot: PhaseSnapshot, playerCount: number): PhaseSnapshot {
    const normalizedPlayers = Array.from({ length: playerCount }, (_, index) => {
      const existing = snapshot.players[index];
      if (existing) {
        return {
          x: clampNormalizedValue(existing.x),
          y: clampNormalizedValue(existing.y),
        };
      }
      const fallback = players[index]?.current;
      if (fallback) {
        return { x: clampNormalizedValue(fallback.x), y: clampNormalizedValue(fallback.y) };
      }
      return { x: 50, y: 50 };
    });
    return {
      players: normalizedPlayers,
      football: snapshot.football
        .map((ball) => ({
          id: ball.id,
          x: clampNormalizedValue(ball.x),
          y: clampNormalizedValue(ball.y),
        }))
        .filter((ball) => ball.id.trim().length > 0),
    };
  }

  function captureCurrentSnapshot(): PhaseSnapshot {
    return {
      players: players.map((player) => ({ x: player.current.x, y: player.current.y })),
      football: tacticalItems
        .filter((item) => isBallItem(item))
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
      if (!item || !isBallItem(item)) continue;
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
        if (!item || !isBallItem(item)) continue;
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

  function findTacticalPlayer(playerId: string): TacticalPlayer | null {
    if (surfaceVariant !== "tactical") return null;
    return players.find((player) => player.id === playerId) ?? null;
  }

  function getTacticalPlayerSnapshot(playerId: string): TacticalPlayerKitSnapshot | null {
    const player = findTacticalPlayer(playerId);
    if (!player) return null;
    return {
      id: player.id,
      number: Number.isFinite(player.number) ? Math.max(0, Math.floor(player.number)) : 0,
      team: player.team,
      kitBaseColor: sanitizeKitColor(player.kitBaseColor),
      kitPattern: sanitizeKitPattern(player.kitPattern),
      kitPatternColor: sanitizeKitColor(player.kitPatternColor),
      labelMode: sanitizeLabelMode(player.labelMode),
      initials: sanitizeInitials(player.initials),
    };
  }

  function rerenderTacticalPlayerToken(player: TacticalPlayer): void {
    if (surfaceVariant !== "tactical") return;
    const previousToken = player.token;
    const previousPositionX = previousToken.position.x;
    const previousPositionY = previousToken.position.y;
    const previousScaleX = previousToken.scale.x;
    const previousScaleY = previousToken.scale.y;
    const previousIndex = playersLayer.getChildIndex(previousToken);
    const nextPack = createTokenPackForPlayer(player);
    player.token = nextPack.token;
    player.tokenShadow = nextPack.shadow;
    player.token.position.set(previousPositionX, previousPositionY);
    player.token.scale.set(previousScaleX, previousScaleY);
    playersLayer.removeChild(previousToken);
    playersLayer.addChildAt(player.token, previousIndex);
    previousToken.removeAllListeners();
    previousToken.destroy({ children: true });
    bindPlayerTokenInteraction(player);
    setPlayerTouchHitArea(player, mapper);
    syncWhiteboardTokenInputMode();
  }

  function patchTacticalPlayer(playerId: string, patch: TacticalPlayerKitPatch): void {
    const player = findTacticalPlayer(playerId);
    if (!player) return;
    const sanitizedPatch = sanitizePlayerKitPatch(patch);
    if (Object.keys(sanitizedPatch).length <= 0) return;
    if ("labelMode" in sanitizedPatch) {
      player.labelMode = sanitizedPatch.labelMode;
    }
    if ("initials" in sanitizedPatch) {
      player.initials = sanitizedPatch.initials;
    }
    const hasTeamKitPatch =
      "kitBaseColor" in sanitizedPatch ||
      "kitPattern" in sanitizedPatch ||
      "kitPatternColor" in sanitizedPatch;
    if (surfaceVariant === "tactical" && hasTeamKitPatch) {
      const currentTeamKit = getTeamKitForTeam(player.team);
      const nextPrimaryColor = sanitizeKitColor(sanitizedPatch.kitBaseColor) ?? currentTeamKit.primaryColor;
      const nextPattern = sanitizeKitPattern(sanitizedPatch.kitPattern) ?? currentTeamKit.pattern;
      const nextSecondaryColor = sanitizeKitColor(sanitizedPatch.kitPatternColor) ?? currentTeamKit.secondaryColor;
      const nextTeamKit: TacticalTeamKitState = {
        primaryColor: nextPrimaryColor,
        pattern: nextPattern,
        secondaryColor: nextSecondaryColor,
      };
      const didTeamKitChange =
        nextTeamKit.primaryColor !== currentTeamKit.primaryColor ||
        nextTeamKit.pattern !== currentTeamKit.pattern ||
        nextTeamKit.secondaryColor !== currentTeamKit.secondaryColor;
      if (didTeamKitChange) {
        setTeamKitForTeam(player.team, nextTeamKit);
      }
      rerenderAllTacticalPlayersOnTeam(player.team);
      return;
    }
    if ("kitBaseColor" in sanitizedPatch) {
      player.kitBaseColor = sanitizedPatch.kitBaseColor;
    }
    if ("kitPattern" in sanitizedPatch) {
      player.kitPattern = sanitizedPatch.kitPattern;
    }
    if ("kitPatternColor" in sanitizedPatch) {
      player.kitPatternColor = sanitizedPatch.kitPatternColor;
    }
    rerenderTacticalPlayerToken(player);
  }

  function emitPlayerDoubleTap(player: TacticalPlayer, event: unknown): void {
    if (surfaceVariant !== "tactical") return;
    const now = Date.now();
    const lastTap = lastTappedPlayer;
    if (lastTap && lastTap.playerId === player.id && now - lastTap.atMs <= DOUBLE_TAP_WINDOW_MS) {
      lastTappedPlayer = null;
      const eventPoint = getClientPointFromEvent(event);
      if (eventPoint) {
        options.onTacticalPlayerDoubleTap?.({
          playerId: player.id,
          clientX: eventPoint.x,
          clientY: eventPoint.y,
        });
        return;
      }
      const fallbackViewportPoint = mapper.normalizedToViewport(player.current);
      const bounds = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
      options.onTacticalPlayerDoubleTap?.({
        playerId: player.id,
        clientX: bounds.left + fallbackViewportPoint.x,
        clientY: bounds.top + fallbackViewportPoint.y,
      });
      return;
    }
    lastTappedPlayer = {
      playerId: player.id,
      atMs: now,
    };
  }

  function bindPlayerTokenInteraction(player: TacticalPlayer): void {
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
    player.token.on("pointerup", (event) => {
      if (surfaceVariant !== "tactical") return;
      if (isPlaybackInputLocked()) return;
      if (activeWhiteboardTool !== "move") return;
      if (!activeDrag || activeDrag.type !== "player" || activeDrag.playerId !== player.id) return;
      if (activeDrag.hasCrossedThreshold) {
        lastTappedPlayer = null;
        return;
      }
      emitPlayerDoubleTap(player, event);
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
    lastTappedPlayer = null;
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
      bindPlayerTokenInteraction(nextPlayer);
    }
    syncPlayersToViewport();
    syncWhiteboardTokenInputMode();
    renderAllWhiteboardDrawings();
  }

  function rebuildTacticalPlayersWithColors(): void {
    if (surfaceVariant !== "tactical") return;
    releaseActiveDrag();
    const labelsByPlayerId = new Map(
      players.map((player) => [
        player.id,
        {
          labelMode: player.labelMode,
          initials: player.initials,
        } as TacticalPlayerKitFields,
      ]),
    );
    const nextSeeds: PlayerSeed[] = players.map((player) => ({
      id: player.id,
      number: Number.isFinite(player.number) ? player.number : 1,
      team: player.team,
      color: teamColor(player.team, tacticalTeamColors),
      position: { x: player.current.x, y: player.current.y },
    }));
    for (const player of players) {
      player.token.removeAllListeners();
      player.token.destroy({ children: true });
    }
    players.length = 0;
    for (const seed of nextSeeds) {
      const nextPlayer = createSurfacePlayer(seed, labelsByPlayerId.get(seed.id));
      players.push(nextPlayer);
      bindPlayerTokenInteraction(nextPlayer);
    }
    syncPlayersToViewport();
    syncWhiteboardTokenInputMode();
    renderAllWhiteboardDrawings();
  }

  function captureBoardState(): TacticalBoardState {
    const playerStates: TacticalBoardPlayerState[] = players.map((player) => ({
      id: player.id,
      number: Number.isFinite(player.number) ? Math.max(1, Math.floor(player.number)) : 1,
      team: player.team,
      teamColor: player.teamColor,
      x: clampNormalizedValue(player.current.x),
      y: clampNormalizedValue(player.current.y),
      kitBaseColor: sanitizeKitColor(player.kitBaseColor),
      kitPattern: sanitizeKitPattern(player.kitPattern),
      kitPatternColor: sanitizeKitColor(player.kitPatternColor),
      labelMode: sanitizeLabelMode(player.labelMode),
      initials: sanitizeInitials(player.initials),
    }));
    const kitsByPlayer = playerStates.reduce<Record<string, TacticalPlayerKitFields>>((acc, playerState) => {
      acc[playerState.id] = {
        kitBaseColor: playerState.kitBaseColor,
        kitPattern: playerState.kitPattern,
        kitPatternColor: playerState.kitPatternColor,
        labelMode: playerState.labelMode,
        initials: playerState.initials,
      };
      return acc;
    }, {});
    const itemStates: TacticalItem[] = tacticalItems.map((item) => ({
      id: item.id,
      type: item.type,
      x: clampNormalizedValue(item.x),
      y: clampNormalizedValue(item.y),
      ...(Number.isFinite(item.rotation) ? { rotation: Number(item.rotation) } : {}),
      ...(Number.isFinite(item.scale) ? { scale: Number(item.scale) } : {}),
    }));
    const drawingStates: TacticalBoardDrawingSnapshot[] = tacticalDrawingController.exportSnapshots();
    const phaseStates = phases.map((phase) => cloneSnapshot(phase));
    const currentTeamState: TacticalBoardTeamState = {
      colors: {
        blue: tacticalTeamColors.blue ?? "blue",
        red: tacticalTeamColors.red ?? "red",
      },
      counts: {
        blue: playerStates.filter((player) => player.team === "BLUE").length,
        red: playerStates.filter((player) => player.team === "RED").length,
      },
    };
    const currentTeamKits: TacticalBoardTeamKitsState = {
      A: {
        primaryColor: tacticalTeamKits.A.primaryColor,
        secondaryColor: tacticalTeamKits.A.secondaryColor,
        pattern: tacticalTeamKits.A.pattern,
      },
      B: {
        primaryColor: tacticalTeamKits.B.primaryColor,
        secondaryColor: tacticalTeamKits.B.secondaryColor,
        pattern: tacticalTeamKits.B.pattern,
      },
    };
    return {
      version: 2,
      players: playerStates,
      items: itemStates,
      drawings: drawingStates,
      phases: phaseStates,
      movementPaths: phaseStates.map((phase) => cloneSnapshot(phase)),
      kits: kitsByPlayer,
      teamKits: currentTeamKits,
      teamState: currentTeamState,
      viewport: {
        width: host.clientWidth,
        height: host.clientHeight,
      },
      startSnapshot: cloneSnapshot(startPositions),
      drawTool: activeWhiteboardTool,
      drawColor: activeWhiteboardColor,
      itemMode,
    };
  }

  function importBoardState(state: TacticalBoardState): boolean {
    if (surfaceVariant !== "tactical") return false;
    if (!isRecord(state)) return false;

    const parsedPlayers = Array.isArray(state.players)
      ? state.players.map((entry) => sanitizeBoardPlayerState(entry)).filter((entry): entry is TacticalBoardPlayerState => entry != null)
      : [];
    const parsedItems = Array.isArray(state.items)
      ? state.items
          .map((entry) => sanitizeTacticalItemCandidate(entry))
          .filter((entry): entry is TacticalItem => entry != null)
      : [];
    const parsedDrawings = Array.isArray(state.drawings)
      ? state.drawings
          .map((entry) => sanitizeBoardDrawingSnapshot(entry, mapper))
          .filter((entry): entry is TacticalBoardDrawingSnapshot => entry != null)
      : [];
    const parsedPhases = Array.isArray(state.phases)
      ? state.phases
          .map((entry) => sanitizePhaseSnapshot(entry))
          .filter((entry): entry is PhaseSnapshot => entry != null)
      : [];
    const parsedStart = sanitizePhaseSnapshot(state.startSnapshot);
    const parsedTeamState = isRecord(state.teamState) ? state.teamState : null;
    const nextBlueColor = sanitizeWhiteboardTokenColor(parsedTeamState?.colors && isRecord(parsedTeamState.colors) ? parsedTeamState.colors.blue : undefined);
    const nextRedColor = sanitizeWhiteboardTokenColor(parsedTeamState?.colors && isRecord(parsedTeamState.colors) ? parsedTeamState.colors.red : undefined);
    tacticalTeamColors = {
      blue: nextBlueColor ?? tacticalTeamColors.blue ?? "blue",
      red: nextRedColor ?? tacticalTeamColors.red ?? "red",
    };
    const defaultTeamKits = createDefaultTacticalTeamKits(tacticalTeamColors);
    const parsedTeamKits = sanitizeBoardTeamKitsState(state.teamKits);
    tacticalTeamKits = parsedTeamKits ?? {
      A: buildTeamKitFromPlayerStates("BLUE", parsedPlayers, defaultTeamKits.A),
      B: buildTeamKitFromPlayerStates("RED", parsedPlayers, defaultTeamKits.B),
    };

    releaseActiveDrag();
    clearSelectedItem();
    cancelPlaybackAnimation();
    resetActiveWhiteboardDrawing();
    lastTappedPlayer = null;

    for (const player of players) {
      player.token.removeAllListeners();
      player.token.destroy({ children: true });
    }
    players.length = 0;

    const playerSeeds: PlayerSeed[] = parsedPlayers.length > 0
      ? parsedPlayers.map((player) => ({
          id: player.id,
          number: player.number,
          team: player.team,
          color: player.teamColor,
          position: { x: player.x, y: player.y },
        }))
      : createWhiteboardPlayerSeeds(TACTICAL_INITIAL_TEAM_COUNTS, tacticalTeamColors);

    for (let index = 0; index < playerSeeds.length; index += 1) {
      const seed = playerSeeds[index];
      if (!seed) continue;
      const source = parsedPlayers[index];
      const nextPlayer = createSurfacePlayer(
        seed,
        source
          ? {
              labelMode: source.labelMode,
              initials: source.initials,
            }
          : undefined,
      );
      players.push(nextPlayer);
      bindPlayerTokenInteraction(nextPlayer);
    }

    upsertTacticalItems(parsedItems);

    tacticalDrawingController.importSnapshots(parsedDrawings);
    const parsedMaxDrawingSerial = parsedDrawings.reduce<number>((maxValue, drawing) => {
      const match = /(\d+)$/.exec(drawing.id);
      const serial = match?.[1] ? Number(match[1]) : Number.NaN;
      if (!Number.isFinite(serial)) return maxValue;
      return Math.max(maxValue, serial);
    }, 0);
    whiteboardDrawingCounter = Math.max(whiteboardDrawingCounter, parsedMaxDrawingSerial);

    const nextStartSnapshot = normalizePhaseForPlayerCount(
      parsedStart ?? captureCurrentSnapshot(),
      players.length,
    );
    startPositions = nextStartSnapshot;
    phases = parsedPhases.map((phase) => normalizePhaseForPlayerCount(phase, players.length));
    options.onPhaseCountChange?.(phases.length);

    const parsedDrawTool = sanitizeDrawingTool(state.drawTool);
    if (parsedDrawTool) {
      activeWhiteboardTool = drawingToolToWhiteboardTool(parsedDrawTool);
    }
    if (typeof state.drawColor === "number" && Number.isFinite(state.drawColor)) {
      activeWhiteboardColor = Math.max(0, Math.floor(state.drawColor));
    }
    if (state.itemMode === "edit" || state.itemMode === "locked") {
      itemMode = state.itemMode;
    }

    syncPlayersToViewport();
    if (itemMode === "locked") {
      clearSelectedItem();
    }
    syncWhiteboardTokenInputMode();
    renderTacticalItems();
    tacticalDrawingController.setColor(activeWhiteboardColor);
    tacticalDrawingController.setTool(sanitizeDrawingTool(activeWhiteboardTool) ?? "move");
    renderAllWhiteboardDrawings();
    return true;
  }

  function getTacticalPlayerSerial(player: TacticalPlayer, team: "BLUE" | "RED"): number {
    if (player.team !== team) return Number.NaN;
    const serialMatch = new RegExp(`^${teamPrefix(team)}(\\d+)$`).exec(player.id);
    const parsed = serialMatch?.[1] ? Number(serialMatch[1]) : Number.NaN;
    if (Number.isFinite(parsed)) return parsed;
    return Number.isFinite(player.number) ? player.number : 0;
  }

  function createNextTacticalPlayerSeed(team: "BLUE" | "RED"): PlayerSeed | null {
    if (surfaceVariant !== "tactical") return null;
    const teamPlayers = players.filter((player) => player.team === team);
    if (teamPlayers.length >= 15) return null;

    const maxSerial = teamPlayers.reduce<number>(
      (maxValue, player) => Math.max(maxValue, getTacticalPlayerSerial(player, team)),
      0,
    );
    const nextSerial = Math.max(1, maxSerial + 1);
    const nextIndex = teamPlayers.length + 1;
    const nextY = (nextIndex * WORLD_SIZE.height) / (teamPlayers.length + 2);

    const teamKit = getTeamKitForTeam(team);
    return {
      id: `${teamPrefix(team)}${nextSerial}`,
      number: nextSerial,
      team,
      color: team === "RED" ? "red" : "blue",
      position: {
        x: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, teamLaneX(team))),
        y: Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, nextY)),
      },
      kitBaseColor: teamKit.primaryColor,
      kitPattern: teamKit.pattern,
      kitPatternColor: teamKit.secondaryColor,
    };
  }

  function addTacticalPlayer(team: "BLUE" | "RED" = "BLUE"): void {
    if (surfaceVariant !== "tactical") return;
    const nextSeed = createNextTacticalPlayerSeed(team);
    if (!nextSeed) return;
    releaseActiveDrag();
    const nextPlayer = createSurfacePlayer(nextSeed);
    players.push(nextPlayer);
    bindPlayerTokenInteraction(nextPlayer);
    syncPlayersToViewport();
    syncWhiteboardTokenInputMode();
  }

  function removeLastTacticalPlayer(team: "BLUE" | "RED" = "BLUE"): void {
    if (surfaceVariant !== "tactical") return;
    const removablePlayers = players
      .map((player, index) => ({ index, serial: getTacticalPlayerSerial(player, team) }))
      .filter((entry) => players[entry.index]?.team === team);
    if (removablePlayers.length <= 0) return;
    releaseActiveDrag();
    const removalTarget = removablePlayers.reduce((current, next) => {
      if (next.serial > current.serial) return next;
      if (next.serial === current.serial && next.index > current.index) return next;
      return current;
    });
    const [removedPlayer] = players.splice(removalTarget.index, 1);
    if (!removedPlayer) return;
    if (lastTappedPlayer?.playerId === removedPlayer.id) {
      lastTappedPlayer = null;
    }
    removedPlayer.token.removeAllListeners();
    removedPlayer.token.destroy({ children: true });
    syncPlayersToViewport();
    syncWhiteboardTokenInputMode();
  }

  for (const player of players) {
    bindPlayerTokenInteraction(player);
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
  });
  whiteboardInputLayer.on("pointerdown", (event) => {
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
  emitPlaybackStateChange();

  return {
    setStart: () => {
      releaseActiveDrag();
      clearSelectedItem();
      cancelPlaybackAnimation();
      startPositions = captureCurrentSnapshot();
      phases = [];
      options.onPhaseCountChange?.(0);
    },
    addPhase: () => {
      releaseActiveDrag();
      clearSelectedItem();
      cancelPlaybackAnimation();
      phases = [...phases, captureCurrentSnapshot()];
      options.onPhaseCountChange?.(phases.length);
    },
    undoPhase: () => {
      releaseActiveDrag();
      clearSelectedItem();
      cancelPlaybackAnimation();
      if (phases.length <= 0) return;
      phases = phases.slice(0, -1);
      const previousSnapshot = phases[phases.length - 1] ?? startPositions;
      applySnapshotToSurface(previousSnapshot);
      options.onPhaseCountChange?.(phases.length);
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
    getTacticalPlayer: getTacticalPlayerSnapshot,
    patchTacticalPlayer,
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
    },
    reflow: () => {
      fitToHost();
    },
    setWhiteboardTeamConfig: (config) => {
      if (isWhiteboardSurface) {
        rebuildWhiteboardPlayers(config.counts, config.colors);
        return;
      }
      if (surfaceVariant !== "tactical") return;
      tacticalTeamColors = {
        blue: config.colors.blue,
        red: config.colors.red,
      };
      rebuildTacticalPlayersWithColors();
    },
    setWhiteboardDrawTool: (tool) => {
      if (!isDrawingEnabledSurface) return;
      if (tool !== "move") {
        releaseActiveDrag();
        clearSelectedItem();
      }
      activeWhiteboardTool = tool;
      tacticalDrawingController.setTool(sanitizeDrawingTool(tool) ?? "move");
      syncWhiteboardTokenInputMode();
      renderAllWhiteboardDrawings();
    },
    setWhiteboardDrawColor: (color) => {
      if (!isDrawingEnabledSurface) return;
      activeWhiteboardColor = color;
      tacticalDrawingController.setColor(activeWhiteboardColor);
      renderAllWhiteboardDrawings();
    },
    eraseWhiteboardPenStroke: () => {
      if (!isDrawingEnabledSurface) return;
      eraseLastPenStroke();
    },
    undoWhiteboardStroke: () => {
      if (!isDrawingEnabledSurface) return;
      tacticalDrawingController.undo();
    },
    clearWhiteboardStrokes: () => {
      if (!isDrawingEnabledSurface) return;
      tacticalDrawingController.clear();
    },
    exportBoardState: () => captureBoardState(),
    importBoardState: (state) => importBoardState(state),
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
