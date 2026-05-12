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
  shadow.ellipse(0.4, radius * 0.95, radius * 1.0, radius * 0.4).fill({ color: 0x020617, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA * 0.78 });
  token.addChild(shadow);

  const baseY = radius * 0.78;
  const baseFill = 0x1a2436;
  const baseRim = mixColor(teamColor, goalkeeper ? 0xf8fafc : 0xffffff, goalkeeper ? 0.42 : 0.12);

  const base = new Graphics();
  base.ellipse(0, baseY, radius * 0.88, radius * 0.33).fill({ color: baseFill, alpha: 0.92 });
  base.ellipse(0, baseY, radius * 0.88, radius * 0.33).stroke({ color: baseRim, width: 0.64, alpha: 0.86 });
  base.ellipse(0, baseY - radius * 0.015, radius * 0.64, radius * 0.15).stroke({ color: 0xffffff, width: 0.26, alpha: 0.14 });
  base.ellipse(0, baseY + radius * 0.02, radius * 0.95, radius * 0.4).stroke({ color: mixColor(teamColor, 0x38bdf8, goalkeeper ? 0.28 : 0.18), width: goalkeeper ? 0.56 : 0.48, alpha: goalkeeper ? 0.3 : 0.24 });
  token.addChild(base);

  const athlete = new Graphics();
  const jerseyBase = goalkeeper ? mixColor(teamColor, 0xffffff, 0.26) : teamColor;
  const jerseyTop = mixColor(jerseyBase, 0xffffff, 0.22);
  const jerseyBottom = mixColor(jerseyBase, 0x0b1220, 0.28);
  const torsoHalfWidth = goalkeeper ? radius * 0.42 : radius * 0.39;
  const waistHalfWidth = goalkeeper ? radius * 0.24 : radius * 0.2;

  // integrated footing above base so player sits ON the base
  athlete
    .roundRect(-radius * 0.21, radius * 0.43, radius * 0.42, radius * 0.16, radius * 0.06)
    .fill({ color: mixColor(jerseyBase, 0x0b1220, 0.34), alpha: 1 });

  // mini-athlete shoulders + arms from Cursor-like silhouette proportions
  athlete
    .roundRect(-radius * 0.56, -radius * 0.26, radius * 0.14, radius * 0.5, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x0b1220, 0.18), alpha: 0.95 })
    .roundRect(radius * 0.42, -radius * 0.26, radius * 0.14, radius * 0.5, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x000000, 0.18), alpha: 0.95 });

  // tapered clean torso
  athlete
        .moveTo(-torsoHalfWidth, -radius * 0.5)
    .lineTo(torsoHalfWidth, -radius * 0.5)
    .lineTo(waistHalfWidth, radius * 0.4)
    .lineTo(-waistHalfWidth * 1.08, radius * 0.4)
    .closePath()
    .fill({ color: jerseyBase, alpha: 1 });

  athlete
    .poly([
      -torsoHalfWidth + radius * 0.04, -radius * 0.46,
      torsoHalfWidth - radius * 0.04, -radius * 0.46,
      waistHalfWidth + radius * 0.02, -radius * 0.02,
      -waistHalfWidth * 0.9, -radius * 0.02,
    ])
    .fill({ color: jerseyTop, alpha: 0.42 });

  athlete
    .poly([
      -waistHalfWidth * 1.05, radius * 0.05,
      waistHalfWidth, radius * 0.05,
      waistHalfWidth - radius * 0.04, radius * 0.38,
      -waistHalfWidth, radius * 0.38,
    ])
    .fill({ color: jerseyBottom, alpha: 0.36 });

  athlete
    .poly([
      -radius * 0.04, -radius * 0.44,
      radius * 0.18, -radius * 0.24,
      radius * 0.1, radius * 0.18,
      -radius * 0.09, -radius * 0.02,
    ])
    .fill({ color: mixColor(jerseyTop, 0xffffff, 0.18), alpha: 0.32 });

  
  athlete
    .poly([
      -radius * 0.49, -radius * 0.28,
      -radius * 0.42, -radius * 0.12,
      -radius * 0.43, radius * 0.16,
      -radius * 0.5, radius * 0.04,
    ])
    .fill({ color: mixColor(jerseyTop, 0xffffff, 0.12), alpha: 0.24 })
    .poly([
      radius * 0.49, -radius * 0.28,
      radius * 0.42, -radius * 0.12,
      radius * 0.43, radius * 0.16,
      radius * 0.5, radius * 0.04,
    ])
    .fill({ color: mixColor(jerseyTop, 0xffffff, 0.1), alpha: 0.2 });

  // minimal lower body anchor (no full realistic legs)
  athlete
    .roundRect(-radius * 0.18, radius * 0.18, radius * 0.14, radius * 0.28, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x0f172a, 0.42), alpha: 0.9 })
    .roundRect(radius * 0.04, radius * 0.18, radius * 0.14, radius * 0.28, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x0f172a, 0.42), alpha: 0.9 });

  // head cap
  athlete
    .circle(0.02, -radius * 0.84, radius * 0.18)
    .fill({ color: goalkeeper ? 0xf8fafc : 0xe2e8f0, alpha: 1 })
    .ellipse(0.02, -radius * 0.92, radius * 0.145, radius * 0.06)
    .fill({ color: mixColor(jerseyBase, 0x0f172a, 0.2), alpha: 0.28 });

  athlete.rotation = -0.035;
athlete.position.x = radius * 0.03;
  token.addChild(athlete);


  const textResolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;

  const numberInset = new Text({
    text: String(number),
    style: {
      fill: 0x93a4bf,
      fontSize: number > 9 ? 3.35 : 3.7,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      letterSpacing: number > 9 ? 0.04 : 0.01,
    },
  });
  numberInset.anchor.set(0.5, 0.5);
  numberInset.position.set(0, baseY - radius * 0.02);
  numberInset.alpha = 0.24;
  numberInset.roundPixels = true;
  numberInset.resolution = textResolution;
  token.addChild(numberInset);

  const numberText = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: number > 9 ? 3.35 : 3.7,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      stroke: { color: 0x020617, width: 0.48, join: "round" },
      letterSpacing: number > 9 ? 0.04 : 0.01,
    },
  });
  numberText.anchor.set(0.5, 0.5);
  numberText.position.set(0, baseY - radius * 0.03);
  numberText.alpha = 0.92;
  numberText.roundPixels = true;
  numberText.resolution = textResolution;
  token.addChild(numberText);

  return { token, shadow };
}
