import { Container, FillGradient, Graphics, Text } from "pixi.js";

import type { VisionDiscRenderInput, VisionDiscRenderOutput, VisionDiscResolvedStyle } from "./contracts";
import { VISION_DISC_GEOMETRY } from "./constants";
import type { VisionDiscGeometry } from "./geometry";
import { drawVisionDiscPattern } from "./patternPainter";

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(base: number, target: number, amount: number): number {
  const br = (base >> 16) & 0xff;
  const bg = (base >> 8) & 0xff;
  const bb = base & 0xff;
  const tr = (target >> 16) & 0xff;
  const tg = (target >> 8) & 0xff;
  const tb = target & 0xff;
  const r = clampByte(br + (tr - br) * amount);
  const g = clampByte(bg + (tg - bg) * amount);
  const b = clampByte(bb + (tb - bb) * amount);
  return (r << 16) | (g << 8) | b;
}

function resolveLabel(input: VisionDiscRenderInput): string {
  const safeInitials = input.label.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  if (input.labelMode === "initials" && safeInitials.length > 0) return safeInitials;
  if (Number.isFinite(input.number)) return String(Math.max(0, Math.floor(input.number))).slice(0, 3);
  return safeInitials || "?";
}

function resolveLabelFontSize(label: string, geometry: VisionDiscGeometry): number {
  const isNumeric = /^\d+$/.test(label);
  const base = !isNumeric
    ? geometry.initialsFont
    : label.length >= 2 ? geometry.numberFontMulti : geometry.numberFontSingle;
  if (!isNumeric) {
    if (geometry.outerRadius <= 20) return base * 1.04;
    return base;
  }
  if (geometry.outerRadius <= 14) return base * 1.18;
  if (geometry.outerRadius <= 20) return base * 1.15;
  if (geometry.outerRadius <= 28) return base * 1.12;
  return base * 1.08;
}

function drawGlyph(graphics: Graphics, geometry: VisionDiscGeometry, color: number, alpha: number): void {
  const radius = geometry.innerRadius;
  graphics
    .roundRect(-radius * 0.4, -radius * 0.1, radius * 0.8, radius * 0.52, radius * 0.2)
    .fill({ color, alpha: alpha * 0.2 })
    .circle(0, -radius * 0.35, radius * 0.24)
    .fill({ color, alpha: alpha * 0.26 });
}

export function buildVisionDiscLayers(
  input: VisionDiscRenderInput,
  style: VisionDiscResolvedStyle,
  geometry: VisionDiscGeometry,
): VisionDiscRenderOutput {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(input.scale ?? 1);

  const layers: VisionDiscRenderOutput["layers"] = {
    shadow: new Graphics(),
    ambient: new Graphics(),
    ring: new Graphics(),
    disc: new Graphics(),
    pattern: new Graphics(),
    glyph: new Graphics(),
    labelPlate: new Graphics(),
    labelText: new Text({ text: "?" }),
    orientationTick: new Graphics(),
  };

  layers.shadow
    .ellipse(0, geometry.shadowOffsetY, geometry.shadowRx, geometry.shadowRy)
    .fill({
      color: style.colors.shadowColor,
      alpha: style.alpha.shadowColor * VISION_DISC_GEOMETRY.shadowAlpha,
    });
  token.addChild(layers.shadow);

  layers.ambient
    .circle(0, 0, geometry.ambientRadius)
    .fill({
      color: style.colors.shadowColor,
      alpha: style.alpha.shadowColor * VISION_DISC_GEOMETRY.ambientShadowAlpha * 0.84,
    });
  token.addChild(layers.ambient);

  const softenedRingColor = mixColor(style.colors.ringColor, style.colors.shadowColor, 0.06);
  const ringEdgeColor = mixColor(style.colors.ringStrokeColor, style.colors.shadowColor, 0.16);
  layers.ring
    .circle(0, 0, geometry.outerRadius)
    .fill({ color: softenedRingColor, alpha: style.alpha.ringColor * 0.96 })
    .circle(0, 0, geometry.outerRadius)
    .stroke({
      color: style.colors.ringStrokeColor,
      alpha: style.alpha.ringStrokeColor * 0.9,
      width: Math.max(1, geometry.ringThickness * 0.19),
      alignment: 0.5,
    })
    .circle(0, 0, geometry.outerRadius)
    .stroke({
      color: ringEdgeColor,
      alpha: style.alpha.ringStrokeColor * 0.32,
      width: Math.max(1, geometry.ringThickness * 0.1),
      alignment: 1,
    });
  token.addChild(layers.ring);

  if (input.pattern === "gradient") {
    const gradient = new FillGradient({
      type: "linear",
      start: { x: 0.5, y: 0 },
      end: { x: 0.5, y: 1 },
      textureSpace: "local",
      colorStops: [
        { offset: 0, color: input.styleTokens.discHighlightColor },
        { offset: 1, color: input.styleTokens.discBaseColor },
      ],
    });
    layers.disc
      .circle(0, 0, geometry.innerRadius)
      .fill(gradient)
      .ellipse(0, -geometry.innerRadius * 0.36, geometry.innerRadius * 0.62, geometry.innerRadius * 0.08)
      .fill({ color: style.colors.discHighlightColor, alpha: style.alpha.discHighlightColor * 0.12 })
      .circle(0, 0, geometry.innerRadius)
      .stroke({
        color: style.colors.discEdgeColor,
        alpha: style.alpha.discEdgeColor * 0.9,
        width: Math.max(1, geometry.ringThickness * 0.16),
        alignment: 0.5,
      });
  } else {
    layers.disc
      .circle(0, 0, geometry.innerRadius)
      .fill({ color: style.colors.discBaseColor, alpha: style.alpha.discBaseColor })
      .ellipse(0, -geometry.innerRadius * 0.35, geometry.innerRadius * 0.6, geometry.innerRadius * 0.085)
      .fill({ color: style.colors.discHighlightColor, alpha: style.alpha.discHighlightColor * 0.12 })
      .circle(0, 0, geometry.innerRadius)
      .stroke({
        color: style.colors.discEdgeColor,
        alpha: style.alpha.discEdgeColor * 0.9,
        width: Math.max(1, geometry.ringThickness * 0.16),
        alignment: 0.5,
      });
  }
  token.addChild(layers.disc);

  drawVisionDiscPattern(
    layers.pattern,
    input.pattern,
    style.colors.patternColor,
    style.alpha.patternColor * 0.9,
    geometry,
  );
  token.addChild(layers.pattern);

  drawGlyph(layers.glyph, geometry, style.colors.glyphColor, style.alpha.glyphColor);
  token.addChild(layers.glyph);

  const compactLabelNudge = geometry.outerRadius <= 20 ? -geometry.outerRadius * 0.025 : 0;
  const labelY = geometry.innerRadius * 0.4 + compactLabelNudge;
  layers.labelPlate
    .roundRect(
      -geometry.innerRadius * 0.82,
      -geometry.innerRadius * 0.4,
      geometry.innerRadius * 1.64,
      geometry.innerRadius * 0.8,
      geometry.innerRadius * 0.24,
    )
    .fill({
      color: style.colors.labelPlateColor,
      alpha: style.alpha.labelPlateColor * 0.86,
    });
  layers.labelPlate.position.y = labelY;
  token.addChild(layers.labelPlate);

  const label = resolveLabel(input);
  const isNumericLabel = /^\d+$/.test(label);
  const labelFontSize = resolveLabelFontSize(label, geometry);
  const labelStrokeWidth = Math.max(
    1,
    geometry.outerRadius * 0.09 * (geometry.outerRadius <= 20 ? 1.14 : 1.02),
  );
  layers.labelText = new Text({
    text: label,
    style: {
      fill: isNumericLabel ? 0xffffff : style.colors.labelColor,
      fontSize: labelFontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      stroke: {
        color: style.colors.labelStrokeColor,
        width: labelStrokeWidth,
        join: "miter",
      },
      letterSpacing: isNumericLabel ? 0 : 0.08,
    },
  });
  layers.labelText.anchor.set(0.5);
  layers.labelText.position.y = labelY;
  layers.labelText.roundPixels = true;
  layers.labelText.resolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  token.addChild(layers.labelText);

  layers.orientationTick
    .roundRect(
      -geometry.innerRadius * 0.16,
      -geometry.outerRadius + geometry.ringThickness * 0.24,
      geometry.innerRadius * 0.32,
      Math.max(1, geometry.outerRadius * 0.12),
      geometry.innerRadius * 0.08,
    )
    .fill({
      color: style.colors.ringStrokeColor,
      alpha: style.alpha.ringStrokeColor * 0.68,
    });
  token.addChild(layers.orientationTick);

  if (input.selected) {
    const selectedHalo = new Graphics();
    const haloColor = mixColor(style.colors.haloColor, style.colors.shadowColor, 0.38);
    selectedHalo
      .circle(0, 0, geometry.selectedHaloRadius)
      .stroke({
        color: style.colors.shadowColor,
        alpha: style.alpha.shadowColor * 0.2,
        width: Math.max(1, geometry.selectedHaloStroke * 1.2),
        alignment: 0.5,
      })
      .circle(0, 0, geometry.selectedHaloRadius)
      .stroke({
        color: haloColor,
        alpha: style.alpha.haloColor * 0.66,
        width: Math.max(1, geometry.selectedHaloStroke),
        alignment: 0.5,
      });
    token.addChild(selectedHalo);
    layers.selectedHalo = selectedHalo;
  }

  return {
    token,
    shadow: layers.shadow,
    layers,
  };
}
