import { createWorldViewport } from "../../../engine/pixi/createWorldViewport";
import type { NormalizedPoint } from "../../../engine/shared/normalization";

export interface ViewportPoint { x: number; y: number }
export interface WorldSize { width: number; height: number }
export interface ViewportSize { width: number; height: number }
export interface ViewportTransform { scale: number; offsetX: number; offsetY: number }

export interface ViewportState {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  worldWidth: number;
  worldHeight: number;
}

export interface WorldViewportMapper {
  readonly worldSize: WorldSize;
  readonly viewportSize: ViewportSize;
  readonly transform: ViewportTransform;
  normalizedToWorld: (point: NormalizedPoint) => ViewportPoint;
  worldToNormalized: (point: ViewportPoint) => NormalizedPoint;
  worldToViewport: (point: ViewportPoint) => ViewportPoint;
  viewportToWorld: (point: ViewportPoint) => ViewportPoint;
  normalizedToViewport: (point: NormalizedPoint) => ViewportPoint;
  viewportToNormalized: (point: ViewportPoint) => NormalizedPoint;
}

export function createViewportMapper(worldSize: WorldSize, viewportSize: ViewportSize): WorldViewportMapper {
  return createWorldViewport(worldSize, viewportSize);
}

export function toViewportState(mapper: WorldViewportMapper): ViewportState {
  return {
    width: mapper.viewportSize.width,
    height: mapper.viewportSize.height,
    scale: mapper.transform.scale,
    offsetX: mapper.transform.offsetX,
    offsetY: mapper.transform.offsetY,
    worldWidth: mapper.worldSize.width,
    worldHeight: mapper.worldSize.height,
  };
}
