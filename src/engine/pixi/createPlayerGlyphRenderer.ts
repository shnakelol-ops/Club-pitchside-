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

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(base: number, target: number, amount: number): number {
  const br = (base >> 16) & 0xff;
  const bg = (base >> 8) & 0xff;
  const bb = base & 0xff;
  const tr = (target >> 16) & 0xff;
  const tg = (target >> 8) & 0xff;
  const tb = target & 0xff;
  const r = clampChannel(br + (tr - br) * amount);
  const g = clampChannel(bg + (tg - bg) * amount);
  const b = clampChannel(bb + (tb - bb) * amount);
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
  shadow.ellipse(0, radius * 0.94, radius * 1.1, radius * 0.5).fill({ color: 0x020617, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA });
  token.addChild(shadow);

  const baseY = radius * 0.76;
  const baseFill = 0x121a2d;
  const baseRim = mixColor(teamColor, goalkeeper ? 0xf8fafc : 0xffffff, goalkeeper ? 0.34 : 0.12);

  const base = new Graphics();
  base.ellipse(0, baseY, radius * 0.86, radius * 0.38).fill({ color: baseFill, alpha: 0.96 });
  base.ellipse(0, baseY, radius * 0.86, radius * 0.38).stroke({ color: baseRim, width: 0.72, alpha: 0.95 });
  base.ellipse(0, baseY - radius * 0.02, radius * 0.67, radius * 0.2).stroke({ color: 0xffffff, width: 0.3, alpha: 0.2 });
  base.ellipse(0, baseY + radius * 0.03, radius * 0.95, radius * 0.46).stroke({ color: mixColor(teamColor, 0x38bdf8, 0.22), width: 0.56, alpha: 0.34 });
  token.addChild(base);

  const footing = new Graphics();
  footing
    .poly([
      -radius * 0.26, radius * 0.57,
      radius * 0.26, radius * 0.57,
      radius * 0.22, radius * 0.35,
      -radius * 0.22, radius * 0.35,
    ])
    .fill({ color: mixColor(teamColor, 0x0b1220, 0.32), alpha: 1 });
  token.addChild(footing);

  const torso = new Graphics();
  torso
    .poly([
      -radius * 0.28, radius * 0.34,
      -radius * 0.44, -radius * 0.18,
      -radius * 0.32, -radius * 0.52,
      0, -radius * 0.72,
      radius * 0.32, -radius * 0.52,
      radius * 0.44, -radius * 0.18,
      radius * 0.28, radius * 0.34,
    ])
    .fill({ color: teamColor, alpha: 1 });
  torso
    .poly([
      -radius * 0.04, -radius * 0.6,
      radius * 0.2, -radius * 0.35,
      radius * 0.1, radius * 0.1,
      -radius * 0.11, -radius * 0.03,
    ])
    .fill({ color: mixColor(teamColor, 0xffffff, 0.18), alpha: 0.52 });
  token.addChild(torso);

  const shoulders = new Graphics();
  shoulders
    .poly([
      -radius * 0.44, -radius * 0.18,
      -radius * 0.6, -radius * 0.09,
      -radius * 0.5, -radius * 0.44,
      -radius * 0.33, -radius * 0.5,
    ])
    .fill({ color: mixColor(teamColor, 0x0f172a, 0.16), alpha: 1 });
  shoulders
    .poly([
      radius * 0.44, -radius * 0.18,
      radius * 0.6, -radius * 0.09,
      radius * 0.5, -radius * 0.44,
      radius * 0.33, -radius * 0.5,
    ])
    .fill({ color: mixColor(teamColor, 0x0f172a, 0.16), alpha: 1 });
  shoulders
    .poly([
      -radius * 0.23, -radius * 0.52,
      0, -radius * 0.68,
      -radius * 0.01, -radius * 0.45,
    ])
    .fill({ color: mixColor(teamColor, 0xffffff, 0.24), alpha: 0.46 });
  shoulders
    .poly([
      radius * 0.23, -radius * 0.52,
      0, -radius * 0.68,
      radius * 0.01, -radius * 0.45,
    ])
    .fill({ color: mixColor(teamColor, 0xffffff, 0.18), alpha: 0.38 });
  token.addChild(shoulders);

  const head = new Graphics();
  head.circle(0, -radius * 0.9, radius * 0.2).fill({ color: goalkeeper ? 0xf8fafc : 0xe2e8f0, alpha: 1 });
  head.ellipse(0, -radius * 1.0, radius * 0.16, radius * 0.07).fill({ color: mixColor(teamColor, 0x0f172a, 0.2), alpha: 0.3 });
  token.addChild(head);

  const numberText = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: number > 9 ? 4.0 : 4.45,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      stroke: { color: 0x020617, width: 0.82, join: "round" },
      letterSpacing: number > 9 ? 0.04 : 0.01,
    },
  });
  numberText.anchor.set(0.5, 0.5);
  numberText.position.y = baseY;
  numberText.roundPixels = true;
  numberText.resolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  token.addChild(numberText);

  return { token, shadow };
}
