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
  bodyShadow.ellipse(0, radius * 0.6, radius * 0.44, radius * 0.15).fill({ color: 0x020617, alpha: 0.16 });
  token.addChild(bodyShadow);

  const shadow = new Graphics();
  shadow.ellipse(0, radius * 0.94, radius * 0.9, radius * 0.3).fill({ color: 0x020617, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA * 0.62 });
  token.addChild(shadow);

  const baseY = radius * 0.78;
  const base = new Graphics();
  base.ellipse(0, baseY, radius * 0.82, radius * 0.27).fill({ color: 0x151e2e, alpha: 0.95 });
  base.ellipse(0, baseY + radius * 0.012, radius * 0.62, radius * 0.145).fill({ color: 0x0b1424, alpha: 0.56 });
  base.ellipse(0, baseY, radius * 0.82, radius * 0.27).stroke({ color: mixColor(teamColor, 0xffffff, goalkeeper ? 0.34 : 0.11), width: 0.5, alpha: 0.8 });
  base.ellipse(0, baseY + radius * 0.015, radius * 0.88, radius * 0.3).stroke({
    color: mixColor(teamColor, 0x38bdf8, goalkeeper ? 0.22 : 0.13),
    width: goalkeeper ? 0.44 : 0.35,
    alpha: goalkeeper ? 0.22 : 0.16,
  });
  token.addChild(base);

  const athlete = new Graphics();
  const jersey = goalkeeper ? mixColor(teamColor, 0xffffff, 0.22) : teamColor;
  const jerseyTop = mixColor(jersey, 0xffffff, 0.16);
  const jerseySide = mixColor(jersey, 0x0f172a, 0.22);
  const shorts = mixColor(jersey, 0x0b1220, 0.45);
  const skin = 0xefc7a4;
  const hair = mixColor(skin, 0x111827, 0.58);

  // shorts / small lower-body hint above pill
  athlete.roundRect(-radius * 0.18, radius * 0.24, radius * 0.36, radius * 0.19, radius * 0.05).fill({ color: shorts, alpha: 0.94 });
  athlete.roundRect(-radius * 0.15, radius * 0.39, radius * 0.1, radius * 0.15, radius * 0.04).fill({ color: mixColor(shorts, 0x000000, 0.16), alpha: 0.9 });
  athlete.roundRect(radius * 0.05, radius * 0.39, radius * 0.1, radius * 0.15, radius * 0.04).fill({ color: mixColor(shorts, 0x000000, 0.16), alpha: 0.9 });

  // shirt torso with broader shoulders + narrower waist
  const shoulderHalf = goalkeeper ? radius * 0.38 : radius * 0.36;
  const waistHalf = goalkeeper ? radius * 0.24 : radius * 0.2;
  athlete
    .moveTo(-shoulderHalf, -radius * 0.47)
    .lineTo(shoulderHalf, -radius * 0.47)
    .lineTo(waistHalf, radius * 0.24)
    .lineTo(-waistHalf, radius * 0.24)
    .closePath()
    .fill({ color: jersey, alpha: 1 });
  athlete
    .poly([
      -shoulderHalf + radius * 0.03, -radius * 0.43,
      shoulderHalf - radius * 0.03, -radius * 0.43,
      waistHalf - radius * 0.03, -radius * 0.02,
      -waistHalf + radius * 0.03, -radius * 0.02,
    ])
    .fill({ color: jerseyTop, alpha: 0.34 });
  athlete
    .poly([
      -shoulderHalf, -radius * 0.47,
      -waistHalf + radius * 0.02, radius * 0.24,
      -waistHalf, radius * 0.24,
      -shoulderHalf + radius * 0.02, -radius * 0.47,
    ])
    .fill({ color: jerseySide, alpha: 0.28 });
  athlete
    .poly([
      shoulderHalf, -radius * 0.47,
      waistHalf - radius * 0.02, radius * 0.24,
      waistHalf, radius * 0.24,
      shoulderHalf - radius * 0.02, -radius * 0.47,
    ])
    .fill({ color: jerseySide, alpha: 0.22 });

  // sleeves + natural side arms
  athlete.roundRect(-radius * 0.5, -radius * 0.33, radius * 0.15, radius * 0.33, radius * 0.07).fill({ color: jerseySide, alpha: 0.95 });
  athlete.roundRect(radius * 0.35, -radius * 0.33, radius * 0.15, radius * 0.33, radius * 0.07).fill({ color: jerseySide, alpha: 0.95 });
  athlete.roundRect(-radius * 0.48, -radius * 0.02, radius * 0.12, radius * 0.17, radius * 0.06).fill({ color: skin, alpha: 0.96 });
  athlete.roundRect(radius * 0.36, -radius * 0.02, radius * 0.12, radius * 0.17, radius * 0.06).fill({ color: skin, alpha: 0.96 });

  // neck + head + hair cap
  athlete.roundRect(-radius * 0.06, -radius * 0.65, radius * 0.12, radius * 0.08, radius * 0.03).fill({ color: skin, alpha: 0.98 });
  athlete.circle(0, -radius * 0.82, radius * 0.165).fill({ color: skin, alpha: 1 });
  athlete.ellipse(0, -radius * 0.9, radius * 0.14, radius * 0.065).fill({ color: hair, alpha: 0.94 });
  athlete.ellipse(-radius * 0.04, -radius * 0.81, radius * 0.085, radius * 0.036).fill({ color: 0xffffff, alpha: 0.18 });

  token.addChild(athlete);

  const textResolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const numberInset = new Text({
    text: String(number),
    style: {
      fill: 0x8999b6,
      fontSize: number > 9 ? 3.3 : 3.62,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      letterSpacing: number > 9 ? 0.03 : 0.01,
    },
  });
  numberInset.anchor.set(0.5, 0.5);
  numberInset.position.set(0, baseY - radius * 0.013);
  numberInset.alpha = 0.22;
  numberInset.roundPixels = true;
  numberInset.resolution = textResolution;
  token.addChild(numberInset);

  const numberText = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: number > 9 ? 3.3 : 3.62,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      stroke: { color: 0x020617, width: 0.38, join: "round" },
      letterSpacing: number > 9 ? 0.03 : 0.01,
    },
  });
  numberText.anchor.set(0.5, 0.5);
  numberText.position.set(0, baseY - radius * 0.025);
  numberText.alpha = 0.95;
  numberText.roundPixels = true;
  numberText.resolution = textResolution;
  token.addChild(numberText);

  return { token, shadow };
}
