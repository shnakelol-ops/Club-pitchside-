import { Container, Graphics, Text } from "pixi.js";

import { resolveVisionDiscStyle } from "../colorMath";
import type { VisionDiscRenderInput, VisionDiscRenderOutput } from "../contracts";
import { resolveVisionDiscGeometry } from "../geometry";
import { drawVisionDiscPattern } from "../patternPainter";

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
  const clean = input.label.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  if (input.labelMode === "initials" && clean.length > 0) return clean;
  return String(Math.max(0, Math.floor(input.number))).slice(0, 3);
}

function resolveLabelFont(label: string, radius: number): number {
  const isNumeric = /^\d+$/.test(label);
  if (!isNumeric) return radius * 0.52;
  if (radius <= 14) return (label.length <= 1 ? radius * 0.86 : radius * 0.74);
  if (radius <= 20) return (label.length <= 1 ? radius * 0.82 : radius * 0.7);
  return label.length <= 1 ? radius * 0.78 : radius * 0.66;
}

export function createJerseyDiscToken(input: VisionDiscRenderInput): VisionDiscRenderOutput {
  const style = resolveVisionDiscStyle(input.styleTokens);
  const geometry = resolveVisionDiscGeometry(input.radiusPx);
  const label = resolveLabel(input);
  const labelFont = resolveLabelFont(label, geometry.outerRadius);

  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(input.scale ?? 1);

  const shadow = new Graphics();
  shadow
    .ellipse(0, geometry.shadowOffsetY * 0.92, geometry.shadowRx * 0.84, geometry.shadowRy * 0.72)
    .fill({ color: style.colors.shadowColor, alpha: style.alpha.shadowColor * 0.18 });
  token.addChild(shadow);

  const ambient = new Graphics();
  ambient
    .circle(0, 0, geometry.ambientRadius * 0.72)
    .fill({ color: style.colors.shadowColor, alpha: style.alpha.shadowColor * 0.02 });
  token.addChild(ambient);

  const ring = new Graphics();
  const ringColor = mixColor(style.colors.discEdgeColor, 0x0f172a, 0.45);
  ring
    .circle(0, 0, geometry.outerRadius)
    .fill({ color: ringColor, alpha: 0.98 });
  token.addChild(ring);

  const disc = new Graphics();
  disc
    .circle(0, 0, geometry.innerRadius)
    .fill({ color: style.colors.discBaseColor, alpha: style.alpha.discBaseColor * 1 })
    .circle(0, 0, geometry.innerRadius)
    .stroke({
      color: mixColor(style.colors.discEdgeColor, 0x000000, 0.2),
      width: Math.max(1, geometry.ringThickness * 0.12),
      alpha: 0.9,
      alignment: 0.5,
    });
  token.addChild(disc);

  const pattern = new Graphics();
  drawVisionDiscPattern(
    pattern,
    input.pattern,
    style.colors.patternColor,
    Math.min(1, style.alpha.patternColor * 1.08),
    geometry,
  );
  token.addChild(pattern);

  const glyph = new Graphics();
  token.addChild(glyph);

  const labelPlate = new Graphics();
  labelPlate
    .roundRect(
      -geometry.innerRadius * 0.66,
      -geometry.innerRadius * 0.33,
      geometry.innerRadius * 1.32,
      geometry.innerRadius * 0.64,
      geometry.innerRadius * 0.12,
    )
    .fill({ color: style.colors.labelPlateColor, alpha: style.alpha.labelPlateColor * 0.66 });
  labelPlate.position.y = geometry.innerRadius * 0.28;
  token.addChild(labelPlate);

  const labelText = new Text({
    text: label,
    style: {
      fill: 0xffffff,
      fontSize: labelFont,
      fontWeight: "900",
      align: "center",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      letterSpacing: /^\d+$/.test(label) ? 0 : 0.06,
      stroke: {
        color: style.colors.labelStrokeColor,
        width: Math.max(1, geometry.outerRadius * 0.11),
        join: "miter",
      },
    },
  });
  labelText.anchor.set(0.5);
  labelText.position.y = geometry.innerRadius * 0.28;
  labelText.roundPixels = true;
  labelText.resolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  token.addChild(labelText);

  const orientationTick = new Graphics();
  orientationTick
    .roundRect(
      -geometry.innerRadius * 0.14,
      -geometry.outerRadius + geometry.ringThickness * 0.22,
      geometry.innerRadius * 0.28,
      Math.max(1, geometry.outerRadius * 0.1),
      geometry.innerRadius * 0.06,
    )
    .fill({ color: style.colors.ringStrokeColor, alpha: style.alpha.ringStrokeColor * 0.5 });
  token.addChild(orientationTick);

  let selectedHalo: Graphics | undefined;
  if (input.selected) {
    selectedHalo = new Graphics();
    selectedHalo
      .circle(0, 0, geometry.selectedHaloRadius)
      .stroke({
        color: style.colors.haloColor,
        width: Math.max(1, geometry.selectedHaloStroke),
        alpha: style.alpha.haloColor * 0.64,
        alignment: 0.5,
      });
    token.addChild(selectedHalo);
  }

  return {
    token,
    shadow,
    layers: {
      shadow,
      ambient,
      ring,
      disc,
      pattern,
      glyph,
      labelPlate,
      labelText,
      orientationTick,
      ...(selectedHalo ? { selectedHalo } : {}),
    },
  };
}
