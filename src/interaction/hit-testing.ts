import type { WorldViewportMapper } from "../renderer/pixi/surface/viewport-mapper";

export function createCircularHitArea(radius: number): { contains: (x: number, y: number) => boolean } {
  const hitRadiusSquared = radius * radius;
  return { contains: (x: number, y: number) => x * x + y * y <= hitRadiusSquared };
}

export function resolvePlayerTouchRadiusWorld(mapper: Pick<WorldViewportMapper, "transform">, playerRadius: number, playerTouchHitDiameterPx: number): number {
  const touchRadiusInWorld = (playerTouchHitDiameterPx * 0.5) / mapper.transform.scale;
  return Math.max(playerRadius, touchRadiusInWorld);
}

export function resolveItemTouchRadiusWorld(
  mapper: Pick<WorldViewportMapper, "transform">,
  itemVisualHalfSize: number,
  itemTouchHitDiameterPx: number,
): number {
  const touchRadiusInWorld = (itemTouchHitDiameterPx * 0.5) / mapper.transform.scale;
  const itemVisualRadius = itemVisualHalfSize * 1.35;
  return Math.max(itemVisualRadius, touchRadiusInWorld);
}
