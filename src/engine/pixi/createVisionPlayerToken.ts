import { Container, FillGradient, Graphics, Text } from "pixi.js";

import type { PremiumPlayerTokenColor } from "./createPremiumPlayerToken";

export type VisionTokenRingPattern = "plain" | "hoops" | "slash" | "stripes";

export type VisionPlayerTokenState = {
  active?: boolean;
  possession?: boolean;
  captain?: boolean;
  moving?: boolean;
  headingRadians?: number;
  pulseTimeMs?: number;
};

export type VisionPlayerTokenController = {
  applyState: (state: VisionPlayerTokenState) => void;
};

type VisionTokenPalette = {
  halo: number;
  ring: number;
  accent: number;
  notch: number;
};

type VisionCoreTone = {
  inner: number;
  mid: number;
  edge: number;
  rim: number;
  centerLift: number;
};

const PALETTE_BY_TEAM_COLOR: Record<PremiumPlayerTokenColor, VisionTokenPalette> = {
  blue: {
    halo: 0x66c9ff,
    ring: 0x2f8dff,
    accent: 0x16d4c9,
    notch: 0x9be7ff,
  },
  red: {
    halo: 0xff8b6d,
    ring: 0xff4d5a,
    accent: 0xffb347,
    notch: 0xffd4c9,
  },
  yellow: {
    halo: 0xffd773,
    ring: 0xffb22d,
    accent: 0xff8a2a,
    notch: 0xfff0c5,
  },
  black: {
    halo: 0x73e8de,
    ring: 0x2fd4bf,
    accent: 0x5ea8ff,
    notch: 0xc7f7f2,
  },
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

function colorToHsl(color: number): { h: number; s: number; l: number } {
  const r = ((color >> 16) & 0xff) / 255;
  const g = ((color >> 8) & 0xff) / 255;
  const b = (color & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) * 0.5;

  if (delta > 1e-6) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = delta <= 1e-6 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToColor(h: number, s: number, l: number): number {
  const normalizedHue = ((h % 360) + 360) % 360;
  const clampedS = Math.max(0, Math.min(1, s));
  const clampedL = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * clampedL - 1)) * clampedS;
  const x = c * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const m = clampedL - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (normalizedHue < 60) {
    rp = c;
    gp = x;
  } else if (normalizedHue < 120) {
    rp = x;
    gp = c;
  } else if (normalizedHue < 180) {
    gp = c;
    bp = x;
  } else if (normalizedHue < 240) {
    gp = x;
    bp = c;
  } else if (normalizedHue < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  const r = clampColorChannel((rp + m) * 255);
  const g = clampColorChannel((gp + m) * 255);
  const b = clampColorChannel((bp + m) * 255);
  return (r << 16) | (g << 8) | b;
}

function createCoreTone(ringColor: number): VisionCoreTone {
  const { h, s } = colorToHsl(ringColor);
  const tonalS = Math.max(0.34, Math.min(0.9, s * 0.84 + 0.1));
  const inner = hslToColor(h, tonalS, 0.4);
  const mid = hslToColor(h, tonalS * 0.9, 0.31);
  const edge = hslToColor(h, tonalS * 0.84, 0.22);
  return {
    inner,
    mid,
    edge,
    rim: mixColor(inner, 0xffffff, 0.3),
    centerLift: mixColor(inner, 0xffffff, 0.5),
  };
}

function drawRingPattern(
  graphics: Graphics,
  pattern: VisionTokenRingPattern,
  radius: number,
  ringWidth: number,
  color: number,
): void {
  if (pattern === "plain") return;
  if (pattern === "hoops") {
    graphics
      .circle(0, 0, radius + ringWidth * 0.2)
      .stroke({ color, alpha: 0.44, width: ringWidth * 0.34, alignment: 0.5 })
      .circle(0, 0, radius - ringWidth * 0.2)
      .stroke({ color, alpha: 0.38, width: ringWidth * 0.32, alignment: 0.5 });
    return;
  }
  if (pattern === "stripes") {
    const stripeCount = 12;
    const step = (Math.PI * 2) / stripeCount;
    for (let index = 0; index < stripeCount; index += 1) {
      if (index % 2 !== 0) continue;
      const start = -Math.PI / 2 + index * step;
      const end = start + step * 0.62;
      graphics
        .arc(0, 0, radius, start, end)
        .stroke({ color, alpha: 0.58, width: ringWidth * 0.56, cap: "round", alignment: 0.5 });
    }
    return;
  }
  graphics
    .arc(0, 0, radius, -Math.PI * 0.82, Math.PI * 0.18)
    .stroke({ color, alpha: 0.52, width: ringWidth * 0.68, cap: "round", alignment: 0.5 })
    .arc(0, 0, radius, Math.PI * 0.18, Math.PI * 1.18)
    .stroke({
      color: mixColor(color, 0xffffff, 0.26),
      alpha: 0.36,
      width: ringWidth * 0.3,
      cap: "round",
      alignment: 0.5,
    });
}

export function createVisionPlayerToken({
  label,
  teamColor,
  radius,
  ringColor,
  ringPattern = "plain",
  ringPatternColor,
}: {
  label: string;
  teamColor: PremiumPlayerTokenColor;
  radius: number;
  ringColor?: number;
  ringPattern?: VisionTokenRingPattern;
  ringPatternColor?: number;
}): { token: Container; shadow: Graphics; controller: VisionPlayerTokenController } {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(1, 1);

  const teamPalette = PALETTE_BY_TEAM_COLOR[teamColor];
  const primaryRingColor = ringColor ?? teamPalette.ring;
  const patternColor = ringPatternColor ?? mixColor(primaryRingColor, 0xffffff, 0.35);
  const coreTone = createCoreTone(primaryRingColor);
  const ringWidth = radius * 0.24;
  const outerRingRadius = radius * 0.96;
  const coreRadius = radius * 0.7;

  const shadow = new Graphics();
  shadow
    .ellipse(0.35, radius * 1.05, radius * 0.9, radius * 0.3)
    .fill({ color: 0x020617, alpha: 0.14 })
    .ellipse(0.35, radius * 1.09, radius * 0.68, radius * 0.2)
    .fill({ color: 0x020617, alpha: 0.06 });
  token.addChild(shadow);

  const ambientHalo = new Graphics();
  ambientHalo
    .circle(0, 0, radius * 1.22)
    .fill({ color: teamPalette.halo, alpha: 0.095 })
    .circle(0, 0, radius * 1.1)
    .fill({ color: teamPalette.halo, alpha: 0.078 });
  token.addChild(ambientHalo);

  const activeHalo = new Graphics();
  activeHalo
    .circle(0, 0, radius * 1.36)
    .fill({ color: teamPalette.halo, alpha: 0.26 })
    .circle(0, 0, radius * 1.17)
    .fill({ color: mixColor(teamPalette.halo, 0xffffff, 0.2), alpha: 0.14 });
  activeHalo.alpha = 0;
  token.addChild(activeHalo);

  const ringBase = new Graphics();
  ringBase
    .circle(0, 0, outerRingRadius)
    .stroke({
      color: mixColor(primaryRingColor, 0x020617, 0.06),
      width: ringWidth,
      alignment: 0.5,
      join: "round",
    });
  token.addChild(ringBase);

  const ringPatternLayer = new Graphics();
  drawRingPattern(ringPatternLayer, ringPattern, outerRingRadius, ringWidth, patternColor);
  token.addChild(ringPatternLayer);

  const captainRing = new Graphics();
  captainRing
    .circle(0, 0, radius * 1.16)
    .stroke({ color: 0xf8fafc, width: radius * 0.07, alpha: 0.84, alignment: 0.5 });
  captainRing.alpha = 0;
  token.addChild(captainRing);

  const possessionGlow = new Graphics();
  possessionGlow
    .circle(0, 0, radius * 1.06)
    .stroke({ color: 0xffc857, width: radius * 0.1, alpha: 0.66, alignment: 0.5 });
  possessionGlow.alpha = 0;
  token.addChild(possessionGlow);

  const coreGradient = new FillGradient({
    type: "radial",
    center: { x: 0.38, y: 0.32 },
    innerRadius: 0,
    outerRadius: 1,
    outerCenter: { x: 0.5, y: 0.5 },
    textureSpace: "local",
    colorStops: [
      { offset: 0, color: `#${coreTone.inner.toString(16).padStart(6, "0")}` },
      { offset: 0.56, color: `#${coreTone.mid.toString(16).padStart(6, "0")}` },
      { offset: 1, color: `#${coreTone.edge.toString(16).padStart(6, "0")}` },
    ],
  });
  const core = new Graphics();
  core
    .circle(0, 0, coreRadius)
    .fill(coreGradient)
    .circle(0, 0, coreRadius * 0.9)
    .fill({ color: coreTone.inner, alpha: 0.07 })
    .circle(-radius * 0.09, -radius * 0.12, coreRadius * 0.52)
    .fill({ color: coreTone.centerLift, alpha: 0.12 })
    .circle(0, 0, coreRadius)
    .stroke({ color: coreTone.rim, width: radius * 0.06, alpha: 0.23 });
  token.addChild(core);

  const specular = new Graphics();
  specular
    .ellipse(-radius * 0.22, -radius * 0.27, radius * 0.25, radius * 0.1)
    .fill({ color: 0xffffff, alpha: 0.15 })
    .circle(-radius * 0.05, -radius * 0.03, radius * 0.065)
    .fill({ color: 0xffffff, alpha: 0.22 })
    .circle(-radius * 0.05, -radius * 0.03, radius * 0.11)
    .fill({ color: 0xffffff, alpha: 0.06 })
    .ellipse(radius * 0.19, radius * 0.19, radius * 0.22, radius * 0.09)
    .fill({ color: 0xffffff, alpha: 0.035 });
  token.addChild(specular);

  const movementIndicator = new Graphics();
  movementIndicator
    .circle(0, -radius * 1.12, radius * 0.08)
    .fill({ color: teamPalette.accent, alpha: 0.9 });
  movementIndicator.alpha = 0;
  token.addChild(movementIndicator);

  const directionMarker = new Container();
  const directionBridge = new Graphics();
  directionBridge
    .arc(0, 0, outerRingRadius + ringWidth * 0.06, -Math.PI * 0.58, -Math.PI * 0.42)
    .stroke({
      color: mixColor(teamPalette.notch, primaryRingColor, 0.35),
      width: ringWidth * 0.28,
      cap: "round",
      alignment: 0.5,
    });
  directionMarker.addChild(directionBridge);
  const notch = new Graphics();
  notch
    .poly([0, -radius * 1.04, radius * 0.08, -radius * 0.9, -radius * 0.08, -radius * 0.9])
    .fill({ color: teamPalette.notch, alpha: 0.84 });
  directionMarker.addChild(notch);
  token.addChild(directionMarker);

  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const numericLabel = /^\d+$/.test(label.trim());
  const labelShadow = new Text({
    text: label,
    style: {
      fill: 0x020617,
      fontSize: numericLabel && label.length >= 2 ? radius * 0.62 : radius * 0.68,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: numericLabel && label.length >= 2 ? 0.04 : 0.08,
    },
  });
  labelShadow.anchor.set(0.5);
  labelShadow.position.set(0, radius * 0.065);
  labelShadow.alpha = 0.22;
  labelShadow.resolution = textResolution;
  labelShadow.roundPixels = true;
  token.addChild(labelShadow);

  const labelText = new Text({
    text: label,
    style: {
      fill: 0xf8fbff,
      fontSize: numericLabel && label.length >= 2 ? radius * 0.62 : radius * 0.68,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: numericLabel && label.length >= 2 ? 0.04 : 0.08,
      stroke: {
        color: 0x020617,
        width: numericLabel && label.length >= 2 ? 0.72 : 0.62,
        join: "round",
      },
    },
  });
  labelText.anchor.set(0.5);
  labelText.position.set(0, radius * 0.01);
  labelText.resolution = textResolution;
  labelText.roundPixels = true;
  token.addChild(labelText);

  const labelSheen = new Text({
    text: label,
    style: {
      fill: 0xffffff,
      fontSize: numericLabel && label.length >= 2 ? radius * 0.62 : radius * 0.68,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: numericLabel && label.length >= 2 ? 0.04 : 0.08,
    },
  });
  labelSheen.anchor.set(0.5);
  labelSheen.position.set(0, -radius * 0.05);
  labelSheen.alpha = 0.12;
  labelSheen.resolution = textResolution;
  labelSheen.roundPixels = true;
  token.addChild(labelSheen);

  const controller: VisionPlayerTokenController = {
    applyState: ({
      active = false,
      possession = false,
      captain = false,
      moving = false,
      headingRadians,
      pulseTimeMs = 0,
    }) => {
      const pulse = active ? (Math.sin(pulseTimeMs / 220) + 1) * 0.5 : 0;
      ambientHalo.alpha = active ? 1 : possession ? 0.96 : 0.86;
      activeHalo.alpha = active ? 0.26 + pulse * 0.12 : 0;
      const activeScale = active ? 1 + pulse * 0.05 : 1;
      activeHalo.scale.set(activeScale, activeScale);
      possessionGlow.alpha = possession ? 0.62 : 0;
      captainRing.alpha = captain ? 0.72 : 0;
      movementIndicator.alpha = moving ? 0.66 : 0;
      if (typeof headingRadians === "number" && Number.isFinite(headingRadians)) {
        directionMarker.rotation = headingRadians + Math.PI / 2;
      }
    },
  };

  controller.applyState({
    active: false,
    possession: false,
    captain: false,
    moving: false,
    headingRadians: -Math.PI / 2,
    pulseTimeMs: 0,
  });

  return { token, shadow, controller };
}
