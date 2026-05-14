import * as PIXI from "pixi.js";
import { drawTokenPattern, resolvePatternLOD, hexToPixi, type DrawPatternOptions } from "./drawTokenPattern";
import { normalisePattern, type TokenConfig } from "./tokenConfig";

const RING_THICKNESS = 2.8;
const CHARCOAL = "#2a2a2a";
const CHARCOAL_NUM = 0x2a2a2a;
const SELECTED_COLOR = 0xffffff;
const SELECTED_ALPHA = 0.85;
const SELECTED_THICK = 2.0;
const SHADOW_ALPHA = 0.22;
const SHADOW_OFFSET_Y = 1.5;

export type VisionV3PlayerTokenStyle = {
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  goalkeeper?: boolean;
};

export type VisionV3TeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
export type VisionV3KitPattern = "plain" | "solid" | "gradient" | "hoops" | "stripes" | "slash" | "chestDash";

export function createVisionV3PlayerToken(input: {
  label: string;
  teamColor: VisionV3TeamColor;
  style?: Partial<VisionV3PlayerTokenStyle>;
  scale?: number;
  radius?: number;
  kitPattern?: VisionV3KitPattern;
  kitPatternColor?: number;
  ring?: number;
  numberColor?: number;
  glowOnSelect?: boolean;
  selected?: boolean;
  tokenConfig?: TokenConfig;
}): { token: PIXI.Container; shadow: PIXI.Graphics } {
  const token = new PIXI.Container();
  token.scale.set(input.scale ?? 1);

  const r = Number.isFinite(input.radius) ? Math.max(2.8, Number(input.radius)) : 3.66;
  const cfg: TokenConfig = input.tokenConfig ?? {
    fill: `#${(input.style?.primaryColor ?? 0xf5c518).toString(16).padStart(6, "0")}`,
    secondary: `#${(Number.isFinite(input.kitPatternColor) ? Number(input.kitPatternColor) : (input.style?.secondaryColor ?? 0xffffff)).toString(16).padStart(6, "0")}`,
    ring: `#${(Number.isFinite(input.ring) ? Number(input.ring) : 0x2a2a2a).toString(16).padStart(6, "0")}`,
    numberColor: `#${(Number.isFinite(input.numberColor) ? Number(input.numberColor) : 0xffffff).toString(16).padStart(6, "0")}`,
    pattern: normalisePattern(input.kitPattern),
    glowOnSelect: input.glowOnSelect ?? false,
  };
  const pattern = normalisePattern(cfg.pattern);
  const lod = resolvePatternLOD(r);

  const shadow = new PIXI.Graphics();
  drawFilledCircle(shadow, 0x000000, SHADOW_ALPHA, 0, SHADOW_OFFSET_Y, r + RING_THICKNESS);
  shadow.alpha = 0.95;
  token.addChild(shadow);

  const ringColor = hexToPixi(cfg.ring === "#000000" ? CHARCOAL : cfg.ring);
  const ring = new PIXI.Graphics();
  drawFilledCircle(ring, ringColor, 1, 0, 0, r + RING_THICKNESS);
  token.addChild(ring);

  const base = new PIXI.Graphics();
  if (pattern === "gradient") {
    drawFilledCircle(base, hexToPixi(cfg.fill), 1, 0, 0, r);
    drawFilledCircle(base, lightenPixi(cfg.fill, 0.28), 0.55, -r * 0.12, -r * 0.2, r * 0.6);
    drawFilledCircle(base, darkenPixi(cfg.fill, 0.25), 0.45, 0, 0, r);
  } else {
    drawFilledCircle(base, hexToPixi(cfg.fill), 1, 0, 0, r);
  }
  token.addChild(base);

  if (lod > 0 && pattern !== "plain" && pattern !== "gradient") {
    const patternG = new PIXI.Graphics();
    const mask = new PIXI.Graphics();
    drawFilledCircle(mask, 0xffffff, 1, 0, 0, r);
    patternG.mask = mask;
    token.addChild(mask);

    const opts: DrawPatternOptions = { g: patternG, pattern, secondary: cfg.secondary, cx: 0, cy: 0, r, lod };
    drawTokenPattern(opts);
    token.addChild(patternG);
  }

  if (lod === 2 && (pattern === "gradient" || pattern === "plain")) {
    const shine = new PIXI.Graphics();
    drawFilledEllipse(shine, 0xffffff, 0.15, -r * 0.1, -r * 0.25, r * 0.42, r * 0.2);
    token.addChild(shine);
  }

  const textColor = resolveNumberColor(cfg);
  const numText = new PIXI.Text(input.label || "", {
    fontFamily: "Georgia, serif",
    fontSize: resolveFontSize(r, input.label || ""),
    fontWeight: "900",
    fill: textColor,
    align: "center",
    dropShadow: lod > 0,
    dropShadowColor: 0x000000,
    dropShadowAlpha: 0.55,
    dropShadowDistance: 1,
    dropShadowBlur: 1.5,
  });
  numText.anchor.set(0.5, 0.5);
  numText.position.set(0, 0.5);
  numText.zIndex = 100;
  token.addChild(numText);

  if (input.selected) {
    const selRing = new PIXI.Graphics();
    const glowCol = cfg.glowOnSelect ? hexToPixi(cfg.fill) : SELECTED_COLOR;
    if (isV7()) {
      (selRing as any).lineStyle(SELECTED_THICK, glowCol, SELECTED_ALPHA);
      (selRing as any).drawCircle(0, 0, r + RING_THICKNESS + 2);
    } else {
      (selRing as any).circle(0, 0, r + RING_THICKNESS + 2).stroke({ color: glowCol, alpha: SELECTED_ALPHA, width: SELECTED_THICK });
    }
    token.addChild(selRing);
  }

  token.sortableChildren = true;
  return { token, shadow };
}

function isV7(): boolean {
  try { return (PIXI as any).VERSION?.startsWith("7"); } catch { return true; }
}
function drawFilledCircle(g: PIXI.Graphics, color: number, alpha: number, x: number, y: number, r: number): void {
  if (isV7()) { (g as any).beginFill(color, alpha); (g as any).drawCircle(x, y, r); (g as any).endFill(); }
  else { (g as any).circle(x, y, r).fill({ color, alpha }); }
}
function drawFilledEllipse(g: PIXI.Graphics, color: number, alpha: number, x: number, y: number, rx: number, ry: number): void {
  if (isV7()) { (g as any).beginFill(color, alpha); (g as any).drawEllipse(x, y, rx, ry); (g as any).endFill(); }
  else { (g as any).ellipse(x, y, rx, ry).fill({ color, alpha }); }
}
function resolveFontSize(r: number, label: string): number {
  const base = r * 0.85;
  if (label.length > 2) return Math.max(base * 0.65, 7);
  if (label.length > 1) return Math.max(base * 0.78, 8);
  return Math.max(base, 9);
}
function resolveNumberColor(cfg: TokenConfig): number { return cfg.numberColor ? hexToPixi(cfg.numberColor) : (luminance(cfg.fill) > 0.4 ? CHARCOAL_NUM : 0xffffff); }
function luminance(hex: string): number { const n = parseInt(hex.replace("#", ""), 16); return 0.2126 * ((n >> 16) / 255) + 0.7152 * (((n >> 8) & 0xff) / 255) + 0.0722 * ((n & 0xff) / 255); }
function lightenPixi(hex: string, amt: number): number { const n = parseInt(hex.replace("#", ""), 16); const r = Math.min(255, (n >> 16) + Math.round(255 * amt)); const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amt)); const b = Math.min(255, (n & 0xff) + Math.round(255 * amt)); return (r << 16) | (g << 8) | b; }
function darkenPixi(hex: string, amt: number): number { const n = parseInt(hex.replace("#", ""), 16); const r = Math.max(0, (n >> 16) - Math.round(255 * amt)); const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amt)); const b = Math.max(0, (n & 0xff) - Math.round(255 * amt)); return (r << 16) | (g << 8) | b; }
