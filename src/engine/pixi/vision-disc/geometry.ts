import { VISION_DISC_GEOMETRY } from "./constants";

export type VisionDiscGeometry = {
  outerRadius: number;
  innerRadius: number;
  ringThickness: number;
  selectedHaloRadius: number;
  selectedHaloStroke: number;
  shadowOffsetY: number;
  shadowRx: number;
  shadowRy: number;
  ambientRadius: number;
  patternStroke: number;
  numberFontSingle: number;
  numberFontMulti: number;
  initialsFont: number;
};

export function resolveVisionDiscGeometry(radiusPx: number): VisionDiscGeometry {
  const outerRadius = Math.max(4, radiusPx);
  const innerRadius = outerRadius * VISION_DISC_GEOMETRY.innerDiscRadiusRatio;
  const ringThickness = outerRadius * VISION_DISC_GEOMETRY.ringThicknessRatio;
  return {
    outerRadius,
    innerRadius,
    ringThickness,
    selectedHaloRadius: outerRadius * (1 + VISION_DISC_GEOMETRY.selectedHaloOffsetRatio),
    selectedHaloStroke: outerRadius * VISION_DISC_GEOMETRY.selectedHaloStrokeRatio,
    shadowOffsetY: outerRadius * VISION_DISC_GEOMETRY.shadowOffsetYRatio,
    shadowRx: outerRadius * VISION_DISC_GEOMETRY.shadowRxRatio,
    shadowRy: outerRadius * VISION_DISC_GEOMETRY.shadowRyRatio,
    ambientRadius: outerRadius * VISION_DISC_GEOMETRY.ambientShadowRadiusRatio,
    patternStroke: outerRadius * VISION_DISC_GEOMETRY.patternStrokeRatio,
    numberFontSingle: outerRadius * VISION_DISC_GEOMETRY.numberFontRatioSingle,
    numberFontMulti: outerRadius * VISION_DISC_GEOMETRY.numberFontRatioMulti,
    initialsFont: outerRadius * VISION_DISC_GEOMETRY.initialsFontRatio,
  };
}
