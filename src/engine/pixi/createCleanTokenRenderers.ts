import { Container, Graphics, Text } from "pixi.js";

import type { VisionV3KitPattern } from "./createVisionV3PlayerToken";

export type CleanTokenRendererInput = {
  label: string;
  radius: number;
  scale?: number;
  baseColor: number;
  patternColor: number;
  numberColor?: number;
  outlineColor?: number;
  pattern: VisionV3KitPattern;
};

export type CleanTokenRendererOutput = {
  token: Container;
  shadow: Graphics;
};

const LABEL_FONT_STACK = "\"Barlow Condensed\", \"Inter Tight\", Inter, Arial Narrow, Arial, system-ui, sans-serif";

function clampColorChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(base: number, target: number, amount: number): number {
  const baseR = (base >> 16) & 0xff;
  const baseG = (base >> 8) & 0xff;
  const baseB = base & 0xff;
  const targetR = (target >> 16) & 0xff;
  const targetG = (target >> 8) & 0xff;
  const targetB = target & 0xff;

  const r = clampColorChannel(baseR + (targetR - baseR) * amount);
  const g = clampColorChannel(baseG + (targetG - baseG) * amount);
  const b = clampColorChannel(baseB + (targetB - baseB) * amount);

  return (r << 16) | (g << 8) | b;
}

function luminance(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function createTokenRoot(scale?: number): Container {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(scale ?? 1);
  return token;
}

function createGroundShadow(radius: number, color: number): Graphics {
  return new Graphics()
    .ellipse(0.2, radius * 0.98, radius * 0.98, radius * 0.24)
    .fill({ color: 0x020617, alpha: 0.15 })
    .ellipse(0.24, radius * 0.92, radius * 0.72, radius * 0.14)
    .fill({ color: mixColor(color, 0x020617, 0.44), alpha: 0.14 });
}

function createLabelLayer({
  label,
  radius,
  fill,
  stroke,
}: {
  label: string;
  radius: number;
  fill: number;
  stroke: number;
}): Container {
  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumeric = /^\d+$/.test(safeLabel);
  const fontSize = isNumeric
    ? safeLabel.length > 1 ? radius * 1.48 : radius * 1.62
    : radius * 1.04;
  const textResolution =
    typeof window === "undefined" ? 2 : Math.max(2, Math.min(3, window.devicePixelRatio || 1));

  const layer = new Container();
  const shadow = new Text({
    text: safeLabel,
    style: {
      fill: 0x020617,
      fontSize,
      fontWeight: "900",
      fontFamily: LABEL_FONT_STACK,
      align: "center",
      letterSpacing: isNumeric && safeLabel.length > 1 ? -0.12 : 0,
    },
  });
  shadow.anchor.set(0.5);
  shadow.position.y = 0.08;
  shadow.alpha = 0.26;
  shadow.resolution = textResolution;
  shadow.roundPixels = true;
  layer.addChild(shadow);

  const text = new Text({
    text: safeLabel,
    style: {
      fill,
      fontSize,
      fontWeight: "900",
      fontFamily: LABEL_FONT_STACK,
      align: "center",
      letterSpacing: isNumeric && safeLabel.length > 1 ? -0.12 : 0,
      stroke: {
        color: stroke,
        width: isNumeric ? Math.max(0.48, radius * 0.2) : Math.max(0.34, radius * 0.13),
        join: "round",
      },
    },
  });
  text.anchor.set(0.5);
  text.resolution = textResolution;
  text.roundPixels = true;
  layer.addChild(text);
  return layer;
}

function drawPattern(target: Graphics, pattern: VisionV3KitPattern, radius: number, color: number, alpha: number): void {
  if (pattern === "plain" || pattern === "gradient") return;

  if (pattern === "hoops") {
    const bandH = radius * 0.3;
    for (const y of [-radius * 0.62, -radius * 0.08, radius * 0.46]) {
      target.rect(-radius, y, radius * 2, bandH).fill({ color, alpha });
    }
    return;
  }

  if (pattern === "stripes") {
    const bandW = radius * 0.31;
    for (const x of [-radius * 0.58, -radius * 0.14, radius * 0.3]) {
      target.rect(x, -radius, bandW, radius * 2).fill({ color, alpha });
    }
    return;
  }

  if (pattern === "slash") {
    const thickness = radius * 0.9;
    const length = radius * 2.3;
    const angle = -38 * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const half = thickness / 2;
    const corners: [number, number][] = [
      [-length / 2, -half],
      [length / 2, -half],
      [length / 2, half],
      [-length / 2, half],
    ];
    const rotated = corners.flatMap(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
    target.poly(rotated).fill({ color, alpha });
    return;
  }

  target
    .rect(-radius, -radius * 0.33, radius * 2, radius * 0.66)
    .fill({ color, alpha });
}

function addMaskedPattern(
  token: Container,
  pattern: VisionV3KitPattern,
  radius: number,
  patternColor: number,
  alpha: number,
): void {
  const patternLayer = new Container();
  const mask = new Graphics();
  mask.circle(0, 0, radius * 0.88).fill({ color: 0xffffff });
  patternLayer.mask = mask;
  const graphic = new Graphics();
  drawPattern(graphic, pattern, radius * 0.9, patternColor, alpha);
  patternLayer.addChild(graphic);
  token.addChild(mask);
  token.addChild(patternLayer);
}

export function createPhosphorToken(input: CleanTokenRendererInput): CleanTokenRendererOutput {
  const token = createTokenRoot(input.scale);
  const radius = input.radius;
  const ringBlue = mixColor(input.patternColor, 0x60a5fa, 0.42);
  const ringWhite = 0xf8fafc;
  const faceColor = mixColor(input.baseColor, 0x020617, luminance(input.baseColor) > 150 ? 0.08 : 0.16);
  const numberPlateColor = mixColor(faceColor, 0xffffff, 0.86);
  const numberColor = input.numberColor ?? (luminance(numberPlateColor) > 150 ? 0x0f172a : 0xf8fafc);
  const outlineColor = input.outlineColor ?? mixColor(ringBlue, 0x0f172a, 0.22);
  const shadow = createGroundShadow(radius, input.baseColor);

  token.addChild(shadow);
  token.addChild(
    new Graphics()
      .circle(0, 0, radius)
      .fill({ color: ringBlue })
      .circle(0, 0, radius * 0.86)
      .fill({ color: ringWhite })
      .circle(0, 0, radius * 0.74)
      .fill({ color: faceColor })
      .circle(0, 0, radius)
      .stroke({ color: outlineColor, width: Math.max(0.46, radius * 0.14), alpha: 0.9 }),
  );

  addMaskedPattern(token, input.pattern, radius, mixColor(input.patternColor, 0xffffff, 0.1), 0.62);
  token.addChild(
    new Graphics()
      .circle(0, 0, radius * 0.54)
      .fill({ color: numberPlateColor, alpha: 0.96 })
      .circle(0, 0, radius * 0.54)
      .stroke({ color: mixColor(ringBlue, numberPlateColor, 0.3), width: Math.max(0.3, radius * 0.11), alpha: 0.9 })
      .ellipse(0, -radius * 0.16, radius * 0.38, radius * 0.12)
      .fill({ color: 0xffffff, alpha: 0.12 }),
  );
  token.addChild(createLabelLayer({
    label: input.label,
    radius: radius * 0.74,
    fill: numberColor,
    stroke: mixColor(numberColor, luminance(numberColor) > 140 ? 0x0f172a : 0xffffff, 0.62),
  }));
  return { token, shadow };
}

export function createProceduralPixiToken(input: CleanTokenRendererInput): CleanTokenRendererOutput {
  const token = createTokenRoot(input.scale);
  const radius = input.radius;
  const outerColor = mixColor(input.baseColor, 0x0f172a, 0.14);
  const innerColor = mixColor(input.baseColor, 0xffffff, 0.08);
  const patternColor = mixColor(input.patternColor, 0xffffff, 0.06);
  const edgeColor = input.outlineColor ?? mixColor(innerColor, 0x0f172a, 0.26);
  const numberPlateColor = mixColor(innerColor, 0xf8fafc, 0.58);
  const numberColor = input.numberColor ?? (luminance(numberPlateColor) > 150 ? 0x0f172a : 0xf8fafc);
  const shadow = createGroundShadow(radius, input.baseColor);

  token.addChild(shadow);
  token.addChild(
    new Graphics()
      .circle(0, 0, radius)
      .fill({ color: outerColor })
      .circle(0, 0, radius * 0.86)
      .fill({ color: innerColor })
      .circle(0, 0, radius)
      .stroke({ color: edgeColor, width: Math.max(0.42, radius * 0.13), alpha: 0.84 })
      .circle(0, 0, radius * 0.74)
      .stroke({ color: mixColor(edgeColor, 0xffffff, 0.14), width: Math.max(0.2, radius * 0.06), alpha: 0.42 }),
  );

  addMaskedPattern(token, input.pattern, radius, patternColor, 0.66);
  if (input.pattern === "gradient") {
    token.addChild(
      new Graphics()
        .ellipse(0, -radius * 0.3, radius * 0.74, radius * 0.24)
        .fill({ color: 0xffffff, alpha: 0.2 })
        .ellipse(0, radius * 0.34, radius * 0.72, radius * 0.28)
        .fill({ color: 0x020617, alpha: 0.12 }),
    );
  }

  token.addChild(
    new Graphics()
      .roundRect(-radius * 0.62, -radius * 0.5, radius * 1.24, radius * 1.02, radius * 0.22)
      .fill({ color: numberPlateColor, alpha: 0.88 })
      .roundRect(-radius * 0.62, -radius * 0.5, radius * 1.24, radius * 1.02, radius * 0.22)
      .stroke({ color: mixColor(edgeColor, 0xffffff, 0.12), width: Math.max(0.2, radius * 0.06), alpha: 0.5 }),
  );
  token.addChild(createLabelLayer({
    label: input.label,
    radius: radius * 0.82,
    fill: numberColor,
    stroke: mixColor(numberColor, luminance(numberColor) > 140 ? 0x0f172a : 0xffffff, 0.56),
  }));
  return { token, shadow };
}

export { createPhosphorJerseyToken } from "./createPhosphorJerseyToken";
