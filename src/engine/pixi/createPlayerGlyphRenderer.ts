import { Container, Graphics, Text } from "pixi.js";

export const GLYPH_TOKEN_IDLE_SCALE = 1;
export const GLYPH_TOKEN_DRAG_SCALE = 1.08;
export const GLYPH_TOKEN_IDLE_SHADOW_ALPHA = 0.24;
export const GLYPH_TOKEN_DRAG_SHADOW_ALPHA = 0.36;

type GlyphTokenInput = {
  number: number;
  radius: number;
  teamColor: number;
  goalkeeper?: boolean;
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

export function createPlayerGlyphRenderer({ number, radius, teamColor, goalkeeper = false }: GlyphTokenInput): {
  token: Container;
  shadow: Graphics;
} {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(GLYPH_TOKEN_IDLE_SCALE, GLYPH_TOKEN_IDLE_SCALE);

  const shadow = new Graphics();
  shadow.ellipse(0, radius * 0.9, radius * 1.22, radius * 0.56).fill({ color: 0x020617, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA });
  token.addChild(shadow);

  const baseFill = 0x0f172a;
  const rimColor = mixColor(teamColor, 0xffffff, goalkeeper ? 0.26 : 0.1);
  const glowColor = mixColor(teamColor, 0x38bdf8, 0.2);

  const base = new Graphics();
  base.ellipse(0, radius * 0.78, radius * 0.94, radius * 0.44).fill({ color: baseFill, alpha: 0.95 });
  base.ellipse(0, radius * 0.78, radius * 0.94, radius * 0.44).stroke({ color: rimColor, width: 0.7, alpha: 0.95 });
  base.ellipse(0, radius * 0.76, radius * 0.72, radius * 0.22).stroke({ color: 0xffffff, width: 0.3, alpha: 0.24 });
  base.ellipse(0, radius * 0.8, radius * 1.04, radius * 0.52).stroke({ color: glowColor, width: 0.55, alpha: 0.33 });
  token.addChild(base);

  const lowerAnchor = new Graphics();
  lowerAnchor
    .poly([
      -radius * 0.38, radius * 0.54,
      radius * 0.38, radius * 0.54,
      radius * 0.24, radius * 0.2,
      -radius * 0.24, radius * 0.2,
    ])
    .fill({ color: mixColor(teamColor, 0x0b1220, 0.28), alpha: 1 });
  token.addChild(lowerAnchor);

  const torso = new Graphics();
  torso
    .poly([
      -radius * 0.5, radius * 0.15,
      -radius * 0.34, -radius * 0.52,
      0, -radius * 0.73,
      radius * 0.34, -radius * 0.52,
      radius * 0.5, radius * 0.15,
      radius * 0.28, radius * 0.56,
      -radius * 0.28, radius * 0.56,
    ])
    .fill({ color: teamColor, alpha: 1 });
  torso
    .poly([
      -radius * 0.06, -radius * 0.63,
      radius * 0.2, -radius * 0.38,
      radius * 0.08, radius * 0.2,
      -radius * 0.14, -radius * 0.05,
    ])
    .fill({ color: mixColor(teamColor, 0xffffff, 0.2), alpha: 0.58 });
  token.addChild(torso);

  const sleeves = new Graphics();
  sleeves.poly([
    -radius * 0.5, radius * 0.12,
    -radius * 0.72, -radius * 0.1,
    -radius * 0.53, -radius * 0.42,
    -radius * 0.3, -radius * 0.26,
  ]).fill({ color: mixColor(teamColor, 0x0b1220, 0.18), alpha: 1 });
  sleeves.poly([
    radius * 0.5, radius * 0.12,
    radius * 0.72, -radius * 0.1,
    radius * 0.53, -radius * 0.42,
    radius * 0.3, -radius * 0.26,
  ]).fill({ color: mixColor(teamColor, 0x0b1220, 0.18), alpha: 1 });
  token.addChild(sleeves);

  const shoulders = new Graphics();
  shoulders.poly([
    -radius * 0.32, -radius * 0.5,
    0, -radius * 0.68,
    -radius * 0.02, -radius * 0.43,
  ]).fill({ color: mixColor(teamColor, 0xffffff, 0.28), alpha: 0.5 });
  shoulders.poly([
    radius * 0.32, -radius * 0.5,
    0, -radius * 0.68,
    radius * 0.02, -radius * 0.43,
  ]).fill({ color: mixColor(teamColor, 0xffffff, 0.18), alpha: 0.4 });
  token.addChild(shoulders);

  const head = new Graphics();
  const headColor = goalkeeper ? 0xf8fafc : 0xe2e8f0;
  head.circle(0, -radius * 0.94, radius * 0.21).fill({ color: headColor, alpha: 1 });
  head.ellipse(0, -radius * 1.03, radius * 0.19, radius * 0.08).fill({ color: mixColor(teamColor, 0x0f172a, 0.2), alpha: 0.35 });
  token.addChild(head);

  const highlight = new Graphics();
  highlight.poly([
    -radius * 0.15, -radius * 0.3,
    radius * 0.34, -radius * 0.05,
    radius * 0.24, radius * 0.32,
    -radius * 0.22, 0,
  ]).fill({ color: 0xffffff, alpha: 0.08 });
  token.addChild(highlight);

  const numberText = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: number > 9 ? 4.1 : 4.5,
      fontWeight: "900",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      align: "center",
      stroke: { color: 0x020617, width: 0.8, join: "round" },
      letterSpacing: number > 9 ? 0.06 : 0.02,
    },
  });
  numberText.anchor.set(0.5, 0.5);
  numberText.position.set(0, radius * 0.78);
  numberText.resolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  numberText.roundPixels = true;
  token.addChild(numberText);

  return { token, shadow };
}
