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
  shadow.ellipse(0.44, radius * 0.97, radius * 1.06, radius * 0.48).fill({ color: 0x020617, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA });
  token.addChild(shadow);

  const baseY = radius * 0.78;
  const baseFill = 0x101827;
  const baseRim = mixColor(teamColor, goalkeeper ? 0xf8fafc : 0xffffff, goalkeeper ? 0.3 : 0.12);

  const base = new Graphics();
  base.ellipse(0, baseY, radius * 0.88, radius * 0.38).fill({ color: baseFill, alpha: 0.97 });
  base.ellipse(0, baseY, radius * 0.88, radius * 0.38).stroke({ color: baseRim, width: 0.72, alpha: 0.95 });
  base.ellipse(0, baseY - radius * 0.02, radius * 0.68, radius * 0.19).stroke({ color: 0xffffff, width: 0.3, alpha: 0.18 });
  base.ellipse(0, baseY + radius * 0.03, radius * 0.98, radius * 0.46).stroke({ color: mixColor(teamColor, 0x38bdf8, 0.2), width: 0.54, alpha: 0.32 });
  token.addChild(base);

  const athlete = new Graphics();
  const jerseyBase = goalkeeper ? mixColor(teamColor, 0xffffff, 0.26) : teamColor;

  // integrated footing above base so player sits ON the base
  athlete
    .roundRect(-radius * 0.21, radius * 0.43, radius * 0.42, radius * 0.16, radius * 0.06)
    .fill({ color: mixColor(jerseyBase, 0x0b1220, 0.34), alpha: 1 });

  // mini-athlete shoulders + arms from Cursor-like silhouette proportions
  athlete
    .roundRect(-radius * 0.56, -radius * 0.26, radius * 0.14, radius * 0.5, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x000000, 0.12), alpha: 0.95 })
    .roundRect(radius * 0.42, -radius * 0.26, radius * 0.14, radius * 0.5, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x000000, 0.18), alpha: 0.95 });

  // tapered clean torso
  athlete
    .moveTo(-radius * 0.39, -radius * 0.5)
    .lineTo(radius * 0.39, -radius * 0.5)
    .lineTo(radius * 0.26, radius * 0.4)
    .lineTo(-radius * 0.26, radius * 0.4)
    .closePath()
    .fill({ color: jerseyBase, alpha: 1 });

  athlete
    .poly([
      -radius * 0.06, -radius * 0.44,
      radius * 0.2, -radius * 0.2,
      radius * 0.12, radius * 0.2,
      -radius * 0.12, 0,
    ])
    .fill({ color: mixColor(jerseyBase, 0xffffff, 0.2), alpha: 0.5 });

  // minimal lower body anchor (no full realistic legs)
  athlete
    .roundRect(-radius * 0.18, radius * 0.18, radius * 0.14, radius * 0.28, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x0f172a, 0.42), alpha: 0.9 })
    .roundRect(radius * 0.04, radius * 0.18, radius * 0.14, radius * 0.28, radius * 0.05)
    .fill({ color: mixColor(jerseyBase, 0x0f172a, 0.42), alpha: 0.9 });

  // head cap
  athlete
    .circle(0.02, -radius * 0.84, radius * 0.2)
    .fill({ color: goalkeeper ? 0xf8fafc : 0xe2e8f0, alpha: 1 })
    .ellipse(0.02, -radius * 0.93, radius * 0.16, radius * 0.07)
    .fill({ color: mixColor(jerseyBase, 0x0f172a, 0.2), alpha: 0.28 });

  token.addChild(athlete);

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
  numberText.position.set(0, baseY);
  numberText.roundPixels = true;
  numberText.resolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  token.addChild(numberText);

  return { token, shadow };
}
