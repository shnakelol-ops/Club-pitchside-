import { buildVisionDiscLayers } from "./layerBuilder";
import { resolveVisionDiscStyle } from "./colorMath";
import { resolveVisionDiscGeometry } from "./geometry";
import type { VisionDiscRenderInput, VisionDiscRenderOutput } from "./contracts";

export function createVisionDiscToken(input: VisionDiscRenderInput): VisionDiscRenderOutput {
  const style = resolveVisionDiscStyle(input.styleTokens);
  const geometry = resolveVisionDiscGeometry(input.radiusPx);
  return buildVisionDiscLayers(input, style, geometry);
}
