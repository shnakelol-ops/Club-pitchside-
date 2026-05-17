import {
  normalizedToWorld,
  worldToNormalized,
  type WorldPoint,
  type WorldSize,
} from "../shared/coordinates";
import { type NormalizedPoint } from "../shared/normalization";

export type ViewportSize = {
  width: number;
  height: number;
};

export type ViewportTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type ViewportFitMode = "contain" | "cover";

export type WorldViewportBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorldViewportOptions = {
  viewBounds?: WorldViewportBounds;
  fitMode?: ViewportFitMode;
};

export type WorldViewportMapper = {
  readonly worldSize: WorldSize;
  readonly viewportSize: ViewportSize;
  readonly viewBounds: WorldViewportBounds;
  readonly fitMode: ViewportFitMode;
  readonly transform: ViewportTransform;
  normalizedToWorld: (point: NormalizedPoint) => WorldPoint;
  worldToNormalized: (point: WorldPoint) => NormalizedPoint;
  worldToViewport: (point: WorldPoint) => WorldPoint;
  viewportToWorld: (point: WorldPoint) => WorldPoint;
  normalizedToViewport: (point: NormalizedPoint) => WorldPoint;
  viewportToNormalized: (point: WorldPoint) => NormalizedPoint;
};

function safeDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function resolveFitMode(value: ViewportFitMode | undefined): ViewportFitMode {
  return value === "cover" ? "cover" : "contain";
}

function resolveViewBounds(worldSize: WorldSize, viewBounds: WorldViewportBounds | undefined): WorldViewportBounds {
  const worldWidth = safeDimension(worldSize.width);
  const worldHeight = safeDimension(worldSize.height);
  const fallback: WorldViewportBounds = {
    x: 0,
    y: 0,
    width: worldWidth,
    height: worldHeight,
  };
  if (!viewBounds || worldWidth <= 0 || worldHeight <= 0) {
    return fallback;
  }

  const boundedWidth = safeDimension(viewBounds.width);
  const boundedHeight = safeDimension(viewBounds.height);
  if (boundedWidth <= 0 || boundedHeight <= 0) {
    return fallback;
  }

  return {
    x: Number.isFinite(viewBounds.x) ? viewBounds.x : 0,
    y: Number.isFinite(viewBounds.y) ? viewBounds.y : 0,
    width: boundedWidth,
    height: boundedHeight,
  };
}

function getFitScale(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  fitMode: ViewportFitMode,
): number {
  const fitX = viewportWidth / sourceWidth;
  const fitY = viewportHeight / sourceHeight;
  return fitMode === "cover" ? Math.max(fitX, fitY) : Math.min(fitX, fitY);
}

/**
 * Computes a letterbox fit so the full world is visible in the viewport.
 * Offsets center the scaled world in whichever axis has spare room.
 */
export function getLetterboxTransform(
  worldSize: WorldSize,
  viewportSize: ViewportSize,
  fitMode: ViewportFitMode = "contain",
): ViewportTransform {
  const worldWidth = safeDimension(worldSize.width);
  const worldHeight = safeDimension(worldSize.height);
  const viewportWidth = safeDimension(viewportSize.width);
  const viewportHeight = safeDimension(viewportSize.height);
  const resolvedFitMode = resolveFitMode(fitMode);

  if (worldWidth <= 0 || worldHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { scale: 0, offsetX: 0, offsetY: 0 };
  }

  const scale = getFitScale(worldWidth, worldHeight, viewportWidth, viewportHeight, resolvedFitMode);
  const offsetX = (viewportWidth - worldWidth * scale) / 2;
  const offsetY = (viewportHeight - worldHeight * scale) / 2;

  return { scale, offsetX, offsetY };
}

/**
 * Creates pure mappers for normalized(0-100), world, and viewport coordinates.
 * Flow: normalized <-> world handles pitch semantics, then world <-> viewport applies letterbox transform.
 */
export function createWorldViewport(
  worldSize: WorldSize,
  viewportSize: ViewportSize,
  options: WorldViewportOptions = {},
): WorldViewportMapper {
  const fitMode = resolveFitMode(options.fitMode);
  const viewBounds = resolveViewBounds(worldSize, options.viewBounds);
  const boundsTransform = getLetterboxTransform(
    { width: viewBounds.width, height: viewBounds.height },
    viewportSize,
    fitMode,
  );
  const transform = {
    scale: boundsTransform.scale,
    offsetX: boundsTransform.offsetX - viewBounds.x * boundsTransform.scale,
    offsetY: boundsTransform.offsetY - viewBounds.y * boundsTransform.scale,
  };
  const scale = transform.scale;

  const toViewport = (point: WorldPoint): WorldPoint => ({
    x: point.x * scale + transform.offsetX,
    y: point.y * scale + transform.offsetY,
  });

  const toWorld = (point: WorldPoint): WorldPoint => {
    if (scale <= 0) return { x: 0, y: 0 };
    return {
      x: (point.x - transform.offsetX) / scale,
      y: (point.y - transform.offsetY) / scale,
    };
  };

  return {
    worldSize,
    viewportSize,
    viewBounds,
    fitMode,
    transform,
    normalizedToWorld: (point) => normalizedToWorld(point, worldSize),
    worldToNormalized: (point) => worldToNormalized(point, worldSize),
    worldToViewport: toViewport,
    viewportToWorld: toWorld,
    normalizedToViewport: (point) => toViewport(normalizedToWorld(point, worldSize)),
    viewportToNormalized: (point) => worldToNormalized(toWorld(point), worldSize),
  };
}
