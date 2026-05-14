import * as PIXI from "pixi.js";
import {
  drawTokenPattern,
  resolvePatternLOD,
  hexToPixi,
  type DrawPatternOptions,
} from "./drawTokenPattern";
import {
  normalisePattern,
  kitFieldsToTokenConfig,
  type TokenConfig,
  type TokenPattern,
} from "./tokenConfig";

const RING_THICKNESS = 2.8;
const CHARCOAL = "#2a2a2a";
const CHARCOAL_NUM = 0x2a2a2a;
const SELECTED_COLOR = 0xffffff;
const SELECTED_ALPHA = 0.85;
const SELECTED_THICK = 2.0;
const SHADOW_ALPHA = 0.22;
const SHADOW_OFFSET_Y = 1.5;

export interface VisionV3RendererInput {
  radius: number;
  kitBaseColor?: string;
  kitPatternColor?: string;
  kitPattern?: string;
  ring?: string;
  numberColor?: string;
  glowOnSelect?: boolean;
  number?: number | string;
  initials?: string;
  labelMode?: "number" | "initials" | "none";
  selected?: boolean;
  tokenConfig?: TokenConfig;
}

export function createVisionV3PlayerToken(
  input: VisionV3RendererInput,
): PIXI.Container {
  const container = new PIXI.Container();

  const cfg: TokenConfig = input.tokenConfig ?? kitFieldsToTokenConfig({
    kitBaseColor: input.kitBaseColor,
    kitPatternColor: input.kitPatternColor,
    kitPattern: input.kitPattern,
    ring: input.ring,
    numberColor: input.numberColor,
    glowOnSelect: input.glowOnSelect,
  });

  const pattern = normalisePattern(cfg.pattern);
  const r = input.radius;
  const cx = 0;
  const cy = 0;

  const lod = resolvePatternLOD(r);

  const shadow = new PIXI.Graphics();
  drawFilledCircle(shadow, 0x000000, SHADOW_ALPHA, cx, cy + SHADOW_OFFSET_Y, r + RING_THICKNESS);
  (shadow as PIXI.Graphics & { filters?: PIXI.Filter[] }).filters = [new PIXI.BlurFilter(2.5)];
  container.addChild(shadow);

  const ringHex = cfg.ring === "#000000" ? CHARCOAL : cfg.ring;
  const ringColor = hexToPixi(ringHex);
  const ring = new PIXI.Graphics();
  drawFilledCircle(ring, ringColor, 1.0, cx, cy, r + RING_THICKNESS);
  container.addChild(ring);

  const base = new PIXI.Graphics();
  if (pattern === "gradient") {
    drawFilledCircle(base, hexToPixi(cfg.fill), 1.0, cx, cy, r);
    drawFilledCircle(base, lightenPixi(cfg.fill, 0.28), 0.55, cx - r * 0.12, cy - r * 0.2, r * 0.6);
    drawFilledCircle(base, darkenPixi(cfg.fill, 0.25), 0.45, cx, cy, r);
  } else {
    drawFilledCircle(base, hexToPixi(cfg.fill), 1.0, cx, cy, r);
  }
  container.addChild(base);

  if (lod > 0 && pattern !== "plain" && pattern !== "gradient") {
    const patternG = new PIXI.Graphics();
    const mask = new PIXI.Graphics();
    drawFilledCircle(mask, 0xffffff, 1.0, cx, cy, r);
    patternG.mask = mask;
    container.addChild(mask);

    const opts: DrawPatternOptions = {
      g: patternG,
      pattern,
      secondary: cfg.secondary,
      cx,
      cy,
      r,
      lod,
    };
    drawTokenPattern(opts);
    container.addChild(patternG);
  }

  if (lod === 2 && (pattern === "gradient" || pattern === "plain")) {
    const shine = new PIXI.Graphics();
    drawFilledEllipse(shine, 0xffffff, 0.15, cx - r * 0.1, cy - r * 0.25, r * 0.42, r * 0.2);
    container.addChild(shine);
  }

  const labelMode = input.labelMode ?? "number";
  const label = resolveLabel(input);
  if (labelMode !== "none" && label !== "") {
    const fontSize = resolveFontSize(r, label);
    const textColor = resolveNumberColor(cfg, pattern);

    const numText = new PIXI.Text({
      text: label,
      style: {
        fontFamily: "Georgia, serif",
        fontSize,
        fontWeight: "900",
        fill: textColor,
        align: "center",
        dropShadow: lod > 0,
      },
    });

    numText.anchor.set(0.5, 0.5);
    numText.position.set(cx, cy + 0.5);
    numText.zIndex = 100;
    container.addChild(numText);
  }

  if (input.selected) {
    const selRing = new PIXI.Graphics();
    const glowCol = cfg.glowOnSelect ? hexToPixi(cfg.fill) : SELECTED_COLOR;
    if (isV7()) {
      const g7 = selRing as PIXI.Graphics & {
        lineStyle: (width: number, color: number, alpha?: number) => PIXI.Graphics;
        drawCircle: (xPos: number, yPos: number, radius: number) => PIXI.Graphics;
      };
      g7.lineStyle(SELECTED_THICK, glowCol, SELECTED_ALPHA);
      g7.drawCircle(cx, cy, r + RING_THICKNESS + 2);
    } else {
      (selRing as PIXI.Graphics & {
        circle: (xPos: number, yPos: number, radius: number) => PIXI.Graphics;
      })
        .circle(cx, cy, r + RING_THICKNESS + 2)
        .stroke({ color: glowCol, alpha: SELECTED_ALPHA, width: SELECTED_THICK });
    }
    container.addChild(selRing);
  }

  container.sortableChildren = true;
  return container;
}

function isV7(): boolean {
  try {
    return (PIXI as typeof PIXI & { VERSION?: string }).VERSION?.startsWith("7") ?? true;
  } catch {
    return true;
  }
}

function drawFilledCircle(
  g: PIXI.Graphics,
  color: number,
  alpha: number,
  x: number,
  y: number,
  r: number,
): void {
  if (isV7()) {
    const v7 = g as PIXI.Graphics & {
      beginFill: (fillColor: number, fillAlpha?: number) => PIXI.Graphics;
      drawCircle: (xPos: number, yPos: number, radius: number) => PIXI.Graphics;
      endFill: () => PIXI.Graphics;
    };
    v7.beginFill(color, alpha);
    v7.drawCircle(x, y, r);
    v7.endFill();
  } else {
    (g as PIXI.Graphics & {
      circle: (xPos: number, yPos: number, radius: number) => PIXI.Graphics;
    })
      .circle(x, y, r)
      .fill({ color, alpha });
  }
}

function drawFilledEllipse(
  g: PIXI.Graphics,
  color: number,
  alpha: number,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  if (isV7()) {
    const v7 = g as PIXI.Graphics & {
      beginFill: (fillColor: number, fillAlpha?: number) => PIXI.Graphics;
      drawEllipse: (xPos: number, yPos: number, radiusX: number, radiusY: number) => PIXI.Graphics;
      endFill: () => PIXI.Graphics;
    };
    v7.beginFill(color, alpha);
    v7.drawEllipse(x, y, rx, ry);
    v7.endFill();
  } else {
    (g as PIXI.Graphics & {
      ellipse: (xPos: number, yPos: number, radiusX: number, radiusY: number) => PIXI.Graphics;
    })
      .ellipse(x, y, rx, ry)
      .fill({ color, alpha });
  }
}

function resolveLabel(input: VisionV3RendererInput): string {
  const mode = input.labelMode ?? "number";
  if (mode === "none") return "";
  if (mode === "initials") return input.initials?.slice(0, 3) ?? "";
  return input.number !== undefined ? String(input.number) : "";
}

function resolveFontSize(r: number, label: string): number {
  const base = r * 0.85;
  if (label.length > 2) return Math.max(base * 0.65, 7);
  if (label.length > 1) return Math.max(base * 0.78, 8);
  return Math.max(base, 9);
}

function resolveNumberColor(cfg: TokenConfig, _pattern: TokenPattern | string): number {
  if (cfg.numberColor && cfg.numberColor !== "") {
    return hexToPixi(cfg.numberColor);
  }
  return luminance(cfg.fill) > 0.4 ? CHARCOAL_NUM : 0xffffff;
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function lightenPixi(hex: string, amt: number): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + Math.round(255 * amt));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amt));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amt));
  return (r << 16) | (g << 8) | b;
}

function darkenPixi(hex: string, amt: number): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - Math.round(255 * amt));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amt));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amt));
  return (r << 16) | (g << 8) | b;
}

export type { TokenConfig };
