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
  if (!isNumeric) return radius * 0.5;
  if (radius <= 14) return label.length <= 1 ? radius * 0.84 : radius * 0.72;
  if (radius <= 20) return label.length <= 1 ? radius * 0.8 : radius * 0.68;
  return label.length <= 1 ? radius * 0.74 : radius * 0.64;
}

export function createPixiFoundDiscToken(input: VisionDiscRenderInput): VisionDiscRenderOutput {
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
    .ellipse(0, geometry.shadowOffsetY * 0.94, geometry.shadowRx * 0.9, geometry.shadowRy * 0.78)
    .fill({ color: style.colors.shadowColor, alpha: style.alpha.shadowColor * 0.2 });
  token.addChild(shadow);

  const ambient = new Graphics();
  ambient
    .circle(0, 0, geometry.ambientRadius * 0.78)
    .fill({ color: style.colors.shadowColor, alpha: style.alpha.shadowColor * 0.03 });
  token.addChild(ambient);

  const ring = new Graphics();
  const ringBase = mixColor(style.colors.ringColor, 0x101825, 0.24);
  ring
    .circle(0, 0, geometry.outerRadius)
    .fill({ color: ringBase, alpha: 0.98 })
    .circle(0, 0, geometry.outerRadius)
    .stroke({
      color: mixColor(style.colors.ringStrokeColor, 0x0f172a, 0.24),
      width: Math.max(1, geometry.ringThickness * 0.16),
      alpha: style.alpha.ringStrokeColor * 0.86,
      alignment: 0.5,
    });
  token.addChild(ring);

  const disc = new Graphics();
  disc
    .circle(0, 0, geometry.innerRadius)
    .fill({ color: style.colors.discBaseColor, alpha: style.alpha.discBaseColor })
    .circle(0, 0, geometry.innerRadius * 0.96)
    .fill({ color: mixColor(style.colors.discBaseColor, 0xffffff, 0.06), alpha: 0.92 })
    .circle(0, 0, geometry.innerRadius)
    .stroke({
      color: mixColor(style.colors.discEdgeColor, 0x000000, 0.12),
      width: Math.max(1, geometry.ringThickness * 0.1),
      alpha: 0.88,
      alignment: 0.5,
    });
  token.addChild(disc);

  const pattern = new Graphics();
  drawVisionDiscPattern(
    pattern,
    input.pattern,
    style.colors.patternColor,
    Math.min(1, style.alpha.patternColor * 1.02),
    geometry,
  );
  token.addChild(pattern);

  const glyph = new Graphics();
  token.addChild(glyph);

  const labelPlate = new Graphics();
  labelPlate
    .roundRect(
      -geometry.innerRadius * 0.7,
      -geometry.innerRadius * 0.35,
      geometry.innerRadius * 1.4,
      geometry.innerRadius * 0.68,
      geometry.innerRadius * 0.14,
    )
    .fill({ color: style.colors.labelPlateColor, alpha: style.alpha.labelPlateColor * 0.62 });
  labelPlate.position.y = geometry.innerRadius * 0.3;
  token.addChild(labelPlate);

  const labelText = new Text({
    text: label,
    style: {
      fill: 0xffffff,
      fontSize: labelFont,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: /^\d+$/.test(label) ? 0 : 0.08,
      stroke: {
        color: style.colors.labelStrokeColor,
        width: Math.max(1, geometry.outerRadius * 0.108),
        join: "miter",
      },
    },
  });
  labelText.anchor.set(0.5);
  labelText.position.y = geometry.innerRadius * 0.3;
  labelText.roundPixels = true;
  labelText.resolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  token.addChild(labelText);

  const orientationTick = new Graphics();
  orientationTick
    .roundRect(
      -geometry.innerRadius * 0.15,
      -geometry.outerRadius + geometry.ringThickness * 0.2,
      geometry.innerRadius * 0.3,
      Math.max(1, geometry.outerRadius * 0.11),
      geometry.innerRadius * 0.06,
    )
    .fill({ color: style.colors.ringStrokeColor, alpha: style.alpha.ringStrokeColor * 0.46 });
  token.addChild(orientationTick);

  let selectedHalo: Graphics | undefined;
  if (input.selected) {
    selectedHalo = new Graphics();
    selectedHalo
      .circle(0, 0, geometry.selectedHaloRadius)
      .stroke({
        color: style.colors.haloColor,
        width: Math.max(1, geometry.selectedHaloStroke),
        alpha: style.alpha.haloColor * 0.62,
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
