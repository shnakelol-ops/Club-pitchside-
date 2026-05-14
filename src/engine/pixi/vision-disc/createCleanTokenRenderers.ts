import { Container, Graphics, Text } from "pixi.js";

import { contrastStrokeColor, luminance, mixColor, readableTextColor } from "./tokenColor";
import type { VisionDiscKitPattern, VisionDiscTokenInput, VisionDiscTokenOutput } from "./tokenRendererTypes";

const FONT_STACK = "\"Barlow Condensed\", \"Inter Tight\", Inter, Arial Narrow, Arial, system-ui, sans-serif";

function createTokenRoot(scale?: number): Container {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(scale ?? 1);
  return token;
}

function createGroundShadow(radius: number, color: number, alpha = 0.24): Graphics {
  return new Graphics()
    .ellipse(0, radius * 0.78, radius * 1.08, radius * 0.26)
    .fill({ color: 0x020617, alpha })
    .ellipse(radius * 0.08, radius * 0.72, radius * 0.7, radius * 0.14)
    .fill({ color: mixColor(color, 0x020617, 0.5), alpha: alpha * 0.42 });
}

function addSelectedHalo(token: Container, radius: number, color: number): void {
  token.addChild(
    new Graphics()
      .circle(0, 0, radius * 1.34)
      .stroke({ color: 0xf8fafc, width: Math.max(0.5, radius * 0.13), alpha: 0.86 })
      .circle(0, 0, radius * 1.55)
      .stroke({ color, width: Math.max(0.42, radius * 0.1), alpha: 0.5 }),
  );
}

function addNumber(token: Container, label: string, radius: number, fill: number, y = 0): void {
  const safeLabel = label.trim().slice(0, 3) || "?";
  const numeric = /^\d+$/.test(safeLabel);
  const text = new Text({
    text: safeLabel,
    style: {
      fill,
      fontFamily: FONT_STACK,
      fontSize: numeric ? (safeLabel.length > 1 ? radius * 1.16 : radius * 1.38) : radius * 0.94,
      fontWeight: "900",
      align: "center",
      letterSpacing: numeric && safeLabel.length > 1 ? -0.18 : 0,
      stroke: {
        color: contrastStrokeColor(fill),
        width: numeric ? Math.max(0.44, radius * 0.18) : Math.max(0.34, radius * 0.13),
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

function drawPatternBars(
  target: Graphics,
  pattern: VisionDiscKitPattern,
  radius: number,
  color: number,
  alpha = 0.88,
): void {
  const band = Math.max(0.82, radius * 0.3);
  if (pattern === "plain") return;
  if (pattern === "hoops") {
    for (const y of [-radius * 0.34, radius * 0.34]) {
      target
        .roundRect(-radius * 0.78, y - band * 0.5, radius * 1.56, band, band * 0.45)
        .fill({ color, alpha });
    }
    return;
  }
  if (pattern === "stripes") {
    for (const x of [-radius * 0.36, radius * 0.36]) {
      target
        .roundRect(x - band * 0.48, -radius * 0.76, band * 0.96, radius * 1.52, band * 0.38)
        .fill({ color, alpha });
    }
    return;
  }
  if (pattern === "slash") {
    target
      .moveTo(-radius * 0.72, radius * 0.54)
      .lineTo(radius * 0.72, -radius * 0.54)
      .stroke({ color, width: Math.max(1, radius * 0.36), alpha, cap: "round" });
    return;
  }
  target
    .roundRect(-radius * 0.63, radius * 0.22, radius * 1.26, Math.max(0.76, radius * 0.26), radius * 0.12)
    .fill({ color, alpha })
    .roundRect(-radius * 0.4, radius * 0.52, radius * 0.8, Math.max(0.46, radius * 0.14), radius * 0.08)
    .fill({ color: mixColor(color, 0x020617, 0.28), alpha: alpha * 0.84 });
}

function addClippedPattern(token: Container, pattern: VisionDiscKitPattern, radius: number, color: number): void {
  const patternLayer = new Container();
  const bars = new Graphics();
  drawPatternBars(bars, pattern, radius, color);
  patternLayer.addChild(bars);

  const mask = new Graphics();
  mask.circle(0, 0, radius * 0.84).fill({ color: 0xffffff });
  mask.renderable = false;
  patternLayer.mask = mask;
  token.addChild(mask);
  token.addChild(patternLayer);
}

export function createProceduralPixiToken(input: VisionDiscTokenInput): VisionDiscTokenOutput {
  const token = createTokenRoot(input.scale);
  const radius = input.radius;
  const base = input.baseColor;
  const pattern = input.patternColor;
  const edge = input.outlineColor ?? (luminance(base) > 150 ? 0x0f2418 : 0xf8fafc);
  const plateColor = luminance(base) > 150 ? mixColor(base, 0xffffff, 0.32) : mixColor(base, 0x020617, 0.28);
  const numberColor = input.numberColor ?? readableTextColor(plateColor);
  const shadow = createGroundShadow(radius, base, 0.28);

  if (input.selected) addSelectedHalo(token, radius, pattern);
  token.addChild(shadow);
  token.addChild(
    new Graphics()
      .circle(0, 0, radius)
      .fill({ color: base })
      .circle(0, 0, radius)
      .stroke({ color: edge, width: Math.max(0.54, radius * 0.16), alpha: 0.88 })
      .circle(0, 0, radius * 0.76)
      .stroke({ color: mixColor(edge, base, 0.45), width: Math.max(0.28, radius * 0.08), alpha: 0.42 }),
  );
  addClippedPattern(token, input.pattern, radius, pattern);
  token.addChild(
    new Graphics()
      .roundRect(-radius * 0.64, -radius * 0.48, radius * 1.28, radius * 0.95, radius * 0.2)
      .fill({ color: plateColor, alpha: 0.84 })
      .roundRect(-radius * 0.64, -radius * 0.48, radius * 1.28, radius * 0.95, radius * 0.2)
      .stroke({ color: edge, width: Math.max(0.24, radius * 0.07), alpha: 0.48 }),
  );
  addNumber(token, input.label, radius, numberColor);
  return { token, shadow };
}

function addPhosphorTicks(target: Graphics, radius: number, color: number): void {
  const width = Math.max(0.42, radius * 0.12);
  target
    .moveTo(0, -radius * 1.03)
    .lineTo(0, -radius * 0.76)
    .moveTo(radius * 1.03, 0)
    .lineTo(radius * 0.76, 0)
    .moveTo(0, radius * 1.03)
    .lineTo(0, radius * 0.76)
    .moveTo(-radius * 1.03, 0)
    .lineTo(-radius * 0.76, 0)
    .stroke({ color, width, alpha: 0.9, cap: "round" });
}

export function createPhosphorToken(input: VisionDiscTokenInput): VisionDiscTokenOutput {
  const token = createTokenRoot(input.scale);
  const radius = input.radius;
  const base = input.baseColor;
  const pattern = input.patternColor;
  const markerFill = mixColor(base, 0x020617, luminance(base) > 150 ? 0.08 : 0.18);
  const centerFill = input.numberColor == null
    ? luminance(base) > 150 ? 0xf8fafc : 0x07110c
    : mixColor(input.numberColor, luminance(input.numberColor) > 142 ? 0xffffff : 0x020617, 0.08);
  const numberColor = input.numberColor == null ? readableTextColor(centerFill) : input.numberColor;
  const outline = input.outlineColor ?? mixColor(pattern, 0xf8fafc, 0.16);
  const shadow = createGroundShadow(radius, base, 0.22);

  if (input.selected) addSelectedHalo(token, radius, pattern);
  token.addChild(shadow);
  token.addChild(
    new Graphics()
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
      .fill({ color: markerFill })
      .circle(0, 0, radius)
      .stroke({ color: outline, width: Math.max(0.46, radius * 0.13), alpha: 0.92 }),
  );
  addClippedPattern(token, input.pattern, radius, mixColor(pattern, 0xf8fafc, 0.08));

  const ticks = new Graphics();
  addPhosphorTicks(ticks, radius, mixColor(pattern, 0xf8fafc, 0.14));
  token.addChild(ticks);
  token.addChild(
    new Graphics()
      .circle(0, 0, radius * 0.59)
      .fill({ color: centerFill, alpha: 0.97 })
      .circle(0, 0, radius * 0.59)
      .stroke({ color: mixColor(pattern, centerFill, 0.32), width: Math.max(0.38, radius * 0.11), alpha: 0.95 }),
  );
  addNumber(token, input.label, radius * 0.78, numberColor);
  return { token, shadow };
}
