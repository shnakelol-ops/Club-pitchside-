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

  const bodyShadow = new Graphics();
  bodyShadow
    .ellipse(radius * 0.05, radius * 0.6, radius * 0.52, radius * 0.2)
    .fill({ color: 0x020617, alpha: 0.2 });
  token.addChild(bodyShadow);

  const shadow = new Graphics();
  shadow
    .ellipse(0.4, radius * 0.95, radius * 0.98, radius * 0.36)
    .fill({ color: 0x020617, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA * 0.7 });
  token.addChild(shadow);

  const baseY = radius * 0.78;
  const baseFill = 0x101a2a;
  const baseRim = mixColor(teamColor, goalkeeper ? 0xf8fafc : 0xffffff, goalkeeper ? 0.38 : 0.1);

  const base = new Graphics();
  base.ellipse(0, baseY, radius * 0.86, radius * 0.3).fill({ color: baseFill, alpha: 0.94 });
  base.ellipse(0, baseY + radius * 0.02, radius * 0.72, radius * 0.2).fill({ color: 0x0a1220, alpha: 0.5 });
  base.ellipse(0, baseY, radius * 0.86, radius * 0.3).stroke({ color: baseRim, width: 0.56, alpha: 0.8 });
  base.ellipse(0, baseY - radius * 0.015, radius * 0.62, radius * 0.12).stroke({ color: 0xffffff, width: 0.24, alpha: 0.14 });
  base.ellipse(0, baseY + radius * 0.02, radius * 0.92, radius * 0.35).stroke({
    color: mixColor(teamColor, 0x38bdf8, goalkeeper ? 0.26 : 0.14),
    width: goalkeeper ? 0.52 : 0.42,
    alpha: goalkeeper ? 0.28 : 0.2,
  });
  token.addChild(base);

  const athlete = new Graphics();
  const jerseyBase = goalkeeper ? mixColor(teamColor, 0xffffff, 0.22) : teamColor;
  const jerseyTop = mixColor(jerseyBase, 0xffffff, 0.2);
  const jerseyBottom = mixColor(jerseyBase, 0x0b1220, 0.3);
  const torsoHalfWidth = goalkeeper ? radius * 0.41 : radius * 0.38;
  const waistHalfWidth = goalkeeper ? radius * 0.24 : radius * 0.21;

  athlete.roundRect(-radius * 0.2, radius * 0.43, radius * 0.4, radius * 0.14, radius * 0.05).fill({
    color: mixColor(jerseyBase, 0x0b1220, 0.34),
    alpha: 1,
  });

  athlete.roundRect(-radius * 0.54, -radius * 0.26, radius * 0.13, radius * 0.48, radius * 0.06).fill({
    color: mixColor(jerseyBase, 0x0b1220, 0.16),
    alpha: 0.92,
  });
  athlete.roundRect(radius * 0.41, -radius * 0.26, radius * 0.13, radius * 0.48, radius * 0.06).fill({
    color: mixColor(jerseyBase, 0x0b1220, 0.18),
    alpha: 0.92,
  });

  athlete
    .moveTo(-torsoHalfWidth, -radius * 0.5)
    .bezierCurveTo(-radius * 0.24, -radius * 0.72, radius * 0.24, -radius * 0.72, torsoHalfWidth, -radius * 0.5)
    .lineTo(waistHalfWidth, radius * 0.38)
    .bezierCurveTo(radius * 0.09, radius * 0.48, -radius * 0.1, radius * 0.48, -waistHalfWidth, radius * 0.38)
    .closePath()
    .fill({ color: jerseyBase, alpha: 1 });

  athlete
    .poly([
      -torsoHalfWidth + radius * 0.04, -radius * 0.46,
      torsoHalfWidth - radius * 0.04, -radius * 0.46,
      waistHalfWidth, -radius * 0.02,
      -waistHalfWidth * 0.86, -radius * 0.02,
    ])
    .fill({ color: jerseyTop, alpha: 0.38 });

  athlete
    .poly([
      -waistHalfWidth, radius * 0.04,
      waistHalfWidth * 0.96, radius * 0.04,
      waistHalfWidth - radius * 0.04, radius * 0.36,
      -waistHalfWidth + radius * 0.03, radius * 0.36,
    ])
    .fill({ color: jerseyBottom, alpha: 0.34 });

  athlete.ellipse(radius * 0.06, -radius * 0.18, radius * 0.14, radius * 0.3).fill({ color: 0xffffff, alpha: 0.08 });

  athlete.roundRect(-radius * 0.17, radius * 0.2, radius * 0.13, radius * 0.24, radius * 0.05).fill({
    color: mixColor(jerseyBase, 0x0f172a, 0.42),
    alpha: 0.88,
  });
  athlete.roundRect(radius * 0.04, radius * 0.2, radius * 0.13, radius * 0.24, radius * 0.05).fill({
    color: mixColor(jerseyBase, 0x0f172a, 0.42),
    alpha: 0.88,
  });

  athlete.circle(0.02, -radius * 0.84, radius * 0.17).fill({ color: goalkeeper ? 0xf8fafc : 0xe2e8f0, alpha: 1 });
  athlete.ellipse(0.02, -radius * 0.92, radius * 0.14, radius * 0.06).fill({ color: mixColor(jerseyBase, 0x0f172a, 0.2), alpha: 0.28 });
  athlete.ellipse(-radius * 0.02, -radius * 0.81, radius * 0.1, radius * 0.04).fill({ color: 0xffffff, alpha: 0.2 });

  athlete.rotation = -0.03;
  athlete.position.x = radius * 0.03;
  token.addChild(athlete);

  const textResolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;

  const numberInset = new Text({
    text: String(number),
    style: {
      fill: 0x8da1bf,
      fontSize: number > 9 ? 3.35 : 3.68,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      letterSpacing: number > 9 ? 0.03 : 0.01,
    },
  });
  numberInset.anchor.set(0.5, 0.5);
  numberInset.position.set(0, baseY - radius * 0.015);
  numberInset.alpha = 0.22;
  numberInset.roundPixels = true;
  numberInset.resolution = textResolution;
  token.addChild(numberInset);

  const numberText = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: number > 9 ? 3.35 : 3.68,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      stroke: { color: 0x020617, width: 0.42, join: "round" },
      letterSpacing: number > 9 ? 0.03 : 0.01,
    },
  });
  numberText.anchor.set(0.5, 0.5);
  numberText.position.set(0, baseY - radius * 0.028);
  numberText.alpha = 0.93;
  numberText.roundPixels = true;
  numberText.resolution = textResolution;
  token.addChild(numberText);

  return { token, shadow };
}
