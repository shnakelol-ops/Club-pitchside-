import { Container, Graphics, Text } from "pixi.js";

import { contrastStrokeColor, luminance, mixColor, readableTextColor } from "./tokenDebugColor";
import type { DebugTokenPattern, DebugTokenRenderer, DebugTokenRenderInput } from "./tokenDebugTypes";

const FONT_STACK = "\"Barlow Condensed\", \"Inter Tight\", Inter, Arial Narrow, Arial, system-ui, sans-serif";

function addGroundShadow(token: Container, radius: number, color: number, alpha = 0.24): void {
  const shadow = new Graphics();
  shadow
    .ellipse(0, radius * 0.78, radius * 1.05, radius * 0.25)
    .fill({ color: 0x020617, alpha })
    .ellipse(radius * 0.08, radius * 0.72, radius * 0.68, radius * 0.14)
    .fill({ color: mixColor(color, 0x020617, 0.5), alpha: alpha * 0.42 });
  token.addChild(shadow);
}

function addSelectedHalo(token: Container, radius: number, color: number): void {
  const halo = new Graphics();
  halo
    .circle(0, 0, radius * 1.36)
    .stroke({ color: 0xf8fafc, width: Math.max(1.4, radius * 0.15), alpha: 0.88, alignment: 0.5 })
    .circle(0, 0, radius * 1.58)
    .stroke({ color, width: Math.max(1.1, radius * 0.12), alpha: 0.52, alignment: 0.5 });
  token.addChild(halo);
}

function addNumber(token: Container, label: string, radius: number, fill: number, y = 0): void {
  const safeLabel = label.trim().slice(0, 2) || "?";
  const text = new Text({
    text: safeLabel,
    style: {
      fill,
      fontFamily: FONT_STACK,
      fontSize: safeLabel.length > 1 ? radius * 1.16 : radius * 1.42,
      fontWeight: "900",
      align: "center",
      letterSpacing: safeLabel.length > 1 ? -0.6 : 0,
      stroke: {
        color: contrastStrokeColor(fill),
        width: Math.max(1.1, radius * 0.19),
        join: "round",
      },
    },
  });
  text.anchor.set(0.5);
  text.position.y = y;
  text.resolution = typeof window === "undefined" ? 2 : Math.max(2, Math.min(3, window.devicePixelRatio || 1));
  text.roundPixels = true;
  token.addChild(text);
}

function addPatternBars(
  target: Graphics,
  pattern: DebugTokenPattern,
  radius: number,
  accentColor: number,
  strength = 0.88,
): void {
  const band = Math.max(2, radius * 0.26);
  if (pattern === "solid") return;
  if (pattern === "hoops") {
    for (const y of [-radius * 0.34, radius * 0.34]) {
      target
        .roundRect(-radius * 0.78, y - band * 0.5, radius * 1.56, band, band * 0.45)
        .fill({ color: accentColor, alpha: strength });
    }
    return;
  }
  if (pattern === "stripes") {
    for (const x of [-radius * 0.36, radius * 0.36]) {
      target
        .roundRect(x - band * 0.48, -radius * 0.76, band * 0.96, radius * 1.52, band * 0.38)
        .fill({ color: accentColor, alpha: strength });
    }
    return;
  }
  if (pattern === "slash") {
    target
      .moveTo(-radius * 0.72, radius * 0.54)
      .lineTo(radius * 0.72, -radius * 0.54)
      .stroke({ color: accentColor, width: Math.max(3, radius * 0.35), alpha: strength, cap: "round" });
    return;
  }
  target
    .roundRect(-radius * 0.62, radius * 0.22, radius * 1.24, Math.max(2, radius * 0.24), radius * 0.12)
    .fill({ color: accentColor, alpha: strength })
    .roundRect(-radius * 0.38, radius * 0.5, radius * 0.76, Math.max(1.4, radius * 0.13), radius * 0.08)
    .fill({ color: mixColor(accentColor, 0x020617, 0.28), alpha: strength * 0.82 });
}

function addDiscClipPattern(token: Container, pattern: DebugTokenPattern, radius: number, accentColor: number): void {
  const patternLayer = new Container();
  const bars = new Graphics();
  addPatternBars(bars, pattern, radius, accentColor);
  patternLayer.addChild(bars);

  const mask = new Graphics();
  mask.circle(0, 0, radius * 0.84).fill({ color: 0xffffff });
  mask.renderable = false;
  patternLayer.mask = mask;
  token.addChild(mask);
  token.addChild(patternLayer);
}

function drawVisionDisc(input: DebugTokenRenderInput): Container {
  const token = new Container();
  const radius = input.radius;
  const base = input.baseColor;
  const accent = input.accentColor;
  const edge = luminance(base) > 145 ? 0x12301e : 0xf8fafc;
  const core = mixColor(base, 0x020617, luminance(base) > 145 ? 0.1 : 0.2);
  const labelColor = readableTextColor(core);

  if (input.selected) addSelectedHalo(token, radius, accent);
  addGroundShadow(token, radius, base);

  const outer = new Graphics();
  outer
    .circle(0, 0, radius)
    .fill({ color: mixColor(base, accent, 0.18) })
    .circle(0, 0, radius * 0.83)
    .fill({ color: core })
    .circle(0, 0, radius)
    .stroke({ color: mixColor(edge, 0x020617, 0.12), width: Math.max(1.1, radius * 0.14), alpha: 0.88 })
    .circle(0, 0, radius * 0.83)
    .stroke({ color: mixColor(accent, edge, 0.25), width: Math.max(0.8, radius * 0.09), alpha: 0.55 });
  token.addChild(outer);

  addDiscClipPattern(token, input.pattern, radius, mixColor(accent, labelColor, 0.1));

  const plate = new Graphics();
  plate
    .roundRect(-radius * 0.62, -radius * 0.42, radius * 1.24, radius * 0.88, radius * 0.24)
    .fill({ color: mixColor(core, 0x020617, 0.34), alpha: 0.58 });
  token.addChild(plate);
  addNumber(token, input.label, radius, labelColor, -radius * 0.01);
  return token;
}

function drawProceduralPixi(input: DebugTokenRenderInput): Container {
  const token = new Container();
  const radius = input.radius;
  const base = input.baseColor;
  const accent = input.accentColor;
  const edge = luminance(base) > 150 ? 0x0f2418 : 0xf8fafc;
  const labelPlate = luminance(base) > 150 ? mixColor(base, 0xffffff, 0.32) : mixColor(base, 0x020617, 0.28);
  const labelColor = readableTextColor(labelPlate);

  if (input.selected) addSelectedHalo(token, radius, accent);
  addGroundShadow(token, radius, base, 0.28);

  const disc = new Graphics();
  disc
    .circle(0, 0, radius)
    .fill({ color: base })
    .circle(0, 0, radius)
    .stroke({ color: edge, width: Math.max(1.5, radius * 0.17), alpha: 0.86 })
    .circle(0, 0, radius * 0.76)
    .stroke({ color: mixColor(edge, base, 0.45), width: Math.max(0.7, radius * 0.08), alpha: 0.42 });
  token.addChild(disc);

  addDiscClipPattern(token, input.pattern, radius, accent);

  const plate = new Graphics();
  plate
    .roundRect(-radius * 0.64, -radius * 0.48, radius * 1.28, radius * 0.95, radius * 0.2)
    .fill({ color: labelPlate, alpha: 0.82 })
    .roundRect(-radius * 0.64, -radius * 0.48, radius * 1.28, radius * 0.95, radius * 0.2)
    .stroke({ color: edge, width: Math.max(0.7, radius * 0.08), alpha: 0.48 });
  token.addChild(plate);
  addNumber(token, input.label, radius, labelColor, -radius * 0.01);
  return token;
}

function addPhosphorGeometry(target: Graphics, radius: number, accent: number): void {
  const tick = Math.max(1.2, radius * 0.12);
  target
    .moveTo(0, -radius * 1.03)
    .lineTo(0, -radius * 0.76)
    .moveTo(radius * 1.03, 0)
    .lineTo(radius * 0.76, 0)
    .moveTo(0, radius * 1.03)
    .lineTo(0, radius * 0.76)
    .moveTo(-radius * 1.03, 0)
    .lineTo(-radius * 0.76, 0)
    .stroke({ color: accent, width: tick, alpha: 0.9, cap: "round" });
}

function drawPhosphor(input: DebugTokenRenderInput): Container {
  const token = new Container();
  const radius = input.radius;
  const base = input.baseColor;
  const accent = input.accentColor;
  const darkBase = mixColor(base, 0x020617, luminance(base) > 150 ? 0.08 : 0.18);
  const centralFill = luminance(base) > 150 ? 0xf8fafc : 0x07110c;
  const labelColor = readableTextColor(centralFill);

  if (input.selected) addSelectedHalo(token, radius, accent);
  addGroundShadow(token, radius, base, 0.22);

  const body = new Graphics();
  body
    .poly([
      0,
      -radius,
      radius * 0.72,
      -radius * 0.72,
      radius,
      0,
      radius * 0.72,
      radius * 0.72,
      0,
      radius,
      -radius * 0.72,
      radius * 0.72,
      -radius,
      0,
      -radius * 0.72,
      -radius * 0.72,
    ])
    .fill({ color: darkBase })
    .circle(0, 0, radius)
    .stroke({ color: mixColor(accent, 0xf8fafc, 0.16), width: Math.max(1.2, radius * 0.13), alpha: 0.9 });
  token.addChild(body);

  addDiscClipPattern(token, input.pattern, radius, mixColor(accent, 0xf8fafc, 0.08));

  const geometry = new Graphics();
  addPhosphorGeometry(geometry, radius, mixColor(accent, 0xf8fafc, 0.14));
  token.addChild(geometry);

  const numberCircle = new Graphics();
  numberCircle
    .circle(0, 0, radius * 0.58)
    .fill({ color: centralFill, alpha: 0.96 })
    .circle(0, 0, radius * 0.58)
    .stroke({ color: mixColor(accent, centralFill, 0.32), width: Math.max(1, radius * 0.11), alpha: 0.95 });
  token.addChild(numberCircle);
  addNumber(token, input.label, radius * 0.78, labelColor, 0);
  return token;
}

export const VisionDiscRenderer: DebugTokenRenderer = {
  id: "vision-disc",
  label: "VisionDiscRenderer",
  description: "Current clean disc baseline: tactical ring, subdued field shadow, high-contrast number plate.",
  render: drawVisionDisc,
};

export const ProceduralPixiRenderer: DebugTokenRenderer = {
  id: "procedural-pixi",
  label: "ProceduralPixiRenderer",
  description: "Flat broadcast marker: pure Pixi geometry, thick pattern marks, grounded shadow, minimal gloss.",
  render: drawProceduralPixi,
};

export const PhosphorRenderer: DebugTokenRenderer = {
  id: "phosphor",
  label: "PhosphorRenderer",
  description: "MIT-safe Phosphor-inspired geometry: number-circle priority with tactical minimalism.",
  render: drawPhosphor,
};

export const DEBUG_TOKEN_RENDERERS: readonly DebugTokenRenderer[] = [
  VisionDiscRenderer,
  ProceduralPixiRenderer,
  PhosphorRenderer,
];
