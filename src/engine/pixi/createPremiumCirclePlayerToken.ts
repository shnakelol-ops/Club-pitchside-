import { Container, FillGradient, Graphics, Text } from "pixi.js";

import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";

export type PremiumCircleKitPattern = "plain" | "hoops" | "slash" | "stripes";

export type PremiumCircleTokenState = {
  active?: boolean;
  moving?: boolean;
  headingRadians?: number;
  pulseTimeMs?: number;
};

export type PremiumCircleTokenController = {
  applyState: (state: PremiumCircleTokenState) => void;
};

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

function colorToHexString(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function drawInnerPatternOverlay(
  target: Graphics,
  pattern: PremiumCircleKitPattern,
  radius: number,
  color: number,
): void {
  if (pattern === "plain") return;
  const alpha = 0.12;

  if (pattern === "hoops") {
    const bandHeight = Math.max(0.3, radius * 0.2);
    for (let y = -radius + 0.2; y < radius - 0.1; y += bandHeight * 1.65) {
      const nextY = Math.min(y + bandHeight, radius - 0.08);
      const topHalfWidth = Math.sqrt(Math.max(0, radius * radius - y * y));
      const bottomHalfWidth = Math.sqrt(Math.max(0, radius * radius - nextY * nextY));
      target
        .poly([
          -topHalfWidth,
          y,
          topHalfWidth,
          y,
          bottomHalfWidth,
          nextY,
          -bottomHalfWidth,
          nextY,
        ])
        .fill({ color, alpha });
    }
    return;
  }

  if (pattern === "stripes") {
    const stripeWidth = Math.max(0.28, radius * 0.24);
    for (let x = -radius + 0.22; x < radius - 0.12; x += stripeWidth * 1.68) {
      const nextX = Math.min(x + stripeWidth, radius - 0.04);
      const leftHalfHeight = Math.sqrt(Math.max(0, radius * radius - x * x));
      const rightHalfHeight = Math.sqrt(Math.max(0, radius * radius - nextX * nextX));
      target
        .poly([
          x,
          -leftHalfHeight,
          nextX,
          -rightHalfHeight,
          nextX,
          rightHalfHeight,
          x,
          leftHalfHeight,
        ])
        .fill({ color, alpha });
    }
    return;
  }

  target
    .poly([
      -radius * 0.78,
      -radius * 0.22,
      -radius * 0.32,
      -radius * 0.74,
      radius * 0.76,
      radius * 0.24,
      radius * 0.28,
      radius * 0.76,
    ])
    .fill({ color, alpha: alpha + 0.03 });
}

function glowToneForTeamColor(teamColor: PremiumPlayerTokenColor, ringColor: number): number {
  if (teamColor === "blue") return mixColor(ringColor, 0x46b6ff, 0.5);
  if (teamColor === "red") return mixColor(ringColor, 0xff745f, 0.48);
  if (teamColor === "yellow") return mixColor(ringColor, 0xffd369, 0.42);
  return mixColor(ringColor, 0x3ad7ba, 0.5);
}

export function createPremiumCirclePlayerToken({
  label,
  teamColor,
  ringColor,
  radius,
  kitPattern = "plain",
  kitPatternColor,
}: {
  label: string;
  teamColor: PremiumPlayerTokenColor;
  ringColor: number;
  radius: number;
  kitPattern?: PremiumCircleKitPattern;
  kitPatternColor?: number;
}): { token: Container; shadow: Graphics; controller: PremiumCircleTokenController } {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(1, 1);

  const glowTone = glowToneForTeamColor(teamColor, ringColor);
  const ringOuterColor = mixColor(ringColor, 0xffffff, 0.04);
  const bodyTop = mixColor(ringColor, 0xffffff, 0.72);
  const bodyMid = mixColor(ringColor, 0xffffff, 0.58);
  const bodyEdge = mixColor(ringColor, 0xffffff, 0.43);
  const patternTone = kitPatternColor ?? mixColor(ringColor, 0xffffff, 0.24);
  const textStroke = mixColor(ringColor, 0x0b1220, 0.74);

  const shadow = new Graphics();
  shadow
    .ellipse(0.36, radius * 1.02, radius * 0.86, radius * 0.28)
    .fill({ color: 0x020617, alpha: 0.2 })
    .ellipse(0.36, radius * 1.06, radius * 0.64, radius * 0.18)
    .fill({ color: 0x020617, alpha: 0.08 });
  token.addChild(shadow);

  const visualRoot = new Container();
  token.addChild(visualRoot);

  const ambientGlow = new Graphics();
  ambientGlow
    .circle(0, 0, radius * 1.24)
    .fill({ color: glowTone, alpha: 0.11 })
    .circle(0, 0, radius * 1.08)
    .fill({ color: glowTone, alpha: 0.085 });
  visualRoot.addChild(ambientGlow);

  const activeGlow = new Graphics();
  activeGlow
    .circle(0, 0, radius * 1.38)
    .fill({ color: glowTone, alpha: 0.22 })
    .circle(0, 0, radius * 1.18)
    .fill({ color: mixColor(glowTone, 0xffffff, 0.24), alpha: 0.15 });
  activeGlow.alpha = 0;
  visualRoot.addChild(activeGlow);

  const ringWidth = radius * 0.25;
  const ringRadius = radius * 0.93;
  const mainRing = new Graphics();
  mainRing
    .circle(0, 0, ringRadius)
    .stroke({
      color: ringOuterColor,
      width: ringWidth,
      alignment: 0.5,
      join: "round",
    });
  visualRoot.addChild(mainRing);

  const bodyRadius = radius * 0.72;
  const bodyGradient = new FillGradient({
    type: "radial",
    center: { x: 0.42, y: 0.32 },
    innerRadius: 0,
    outerRadius: 1,
    outerCenter: { x: 0.5, y: 0.52 },
    textureSpace: "local",
    colorStops: [
      { offset: 0, color: colorToHexString(bodyTop) },
      { offset: 0.58, color: colorToHexString(bodyMid) },
      { offset: 1, color: colorToHexString(bodyEdge) },
    ],
  });

  const innerBody = new Graphics();
  innerBody
    .circle(0, 0, bodyRadius)
    .fill(bodyGradient)
    .circle(0, 0, bodyRadius)
    .stroke({
      color: mixColor(ringColor, 0xffffff, 0.3),
      alpha: 0.42,
      width: radius * 0.052,
      alignment: 0.5,
    });
  drawInnerPatternOverlay(innerBody, kitPattern, bodyRadius * 0.96, patternTone);
  innerBody
    .ellipse(-radius * 0.2, -radius * 0.24, radius * 0.26, radius * 0.11)
    .fill({ color: 0xffffff, alpha: 0.12 });
  visualRoot.addChild(innerBody);

  const directionBezel = new Container();
  const bezelGraphic = new Graphics();
  bezelGraphic
    .poly([
      0,
      -radius * 1.09,
      radius * 0.14,
      -radius * 0.83,
      0,
      -radius * 0.91,
      -radius * 0.14,
      -radius * 0.83,
    ])
    .fill({ color: mixColor(ringColor, 0xffffff, 0.22), alpha: 0.98 })
    .circle(0, -radius * 0.9, radius * 0.055)
    .fill({ color: mixColor(ringColor, 0xffffff, 0.12), alpha: 0.68 });
  directionBezel.addChild(bezelGraphic);
  visualRoot.addChild(directionBezel);

  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const isNumeric = /^\d+$/.test(label.trim());
  const fontSize = isNumeric && label.length >= 2 ? radius * 0.92 : radius * 1.02;
  const labelY = -radius * 0.03;

  const numberShadow = new Text({
    text: label,
    style: {
      fill: textStroke,
      fontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: isNumeric && label.length >= 2 ? 0.05 : 0.08,
    },
  });
  numberShadow.anchor.set(0.5);
  numberShadow.position.set(0, labelY + radius * 0.05);
  numberShadow.alpha = 0.24;
  numberShadow.resolution = textResolution;
  numberShadow.roundPixels = true;
  visualRoot.addChild(numberShadow);

  const numberText = new Text({
    text: label,
    style: {
      fill: 0xffffff,
      fontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: isNumeric && label.length >= 2 ? 0.05 : 0.08,
      stroke: {
        color: textStroke,
        width: isNumeric && label.length >= 2 ? 0.72 : 0.64,
        join: "round",
      },
    },
  });
  numberText.anchor.set(0.5);
  numberText.position.set(0, labelY);
  numberText.resolution = textResolution;
  numberText.roundPixels = true;
  visualRoot.addChild(numberText);

  const controller: PremiumCircleTokenController = {
    applyState: ({ active = false, moving = false, headingRadians, pulseTimeMs = 0 }) => {
      const pulse = active ? (Math.sin(pulseTimeMs / 220) + 1) * 0.5 : 0;
      activeGlow.alpha = active ? 0.24 + pulse * 0.18 : 0;
      const activeScale = active ? 1.03 + pulse * 0.02 : 1;
      visualRoot.scale.set(activeScale, activeScale);
      ambientGlow.alpha = active ? 1 : 0.86;
      directionBezel.alpha = moving ? 0.98 : 0.86;
      if (typeof headingRadians === "number" && Number.isFinite(headingRadians)) {
        directionBezel.rotation = headingRadians + Math.PI / 2;
      }
    },
  };

  controller.applyState({
    active: false,
    moving: false,
    headingRadians: -Math.PI / 2,
    pulseTimeMs: 0,
  });

  return { token, shadow, controller };
}
