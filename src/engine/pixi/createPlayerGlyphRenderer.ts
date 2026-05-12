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
  bodyShadow.ellipse(0, radius * 0.6, radius * 0.46, radius * 0.17).fill({ color: 0x020617, alpha: 0.16 });
  token.addChild(bodyShadow);

  const shadow = new Graphics();
  shadow.ellipse(0, radius * 0.95, radius * 0.94, radius * 0.34).fill({ color: 0x020617, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA * 0.66 });
  token.addChild(shadow);

  const baseY = radius * 0.78;
  const baseFill = 0x131c2d;
  const baseRim = mixColor(teamColor, 0xffffff, goalkeeper ? 0.34 : 0.12);

  const base = new Graphics();
  base.ellipse(0, baseY, radius * 0.84, radius * 0.28).fill({ color: baseFill, alpha: 0.95 });
  base.ellipse(0, baseY + radius * 0.015, radius * 0.66, radius * 0.16).fill({ color: 0x0c1424, alpha: 0.54 });
  base.ellipse(0, baseY, radius * 0.84, radius * 0.28).stroke({ color: baseRim, width: 0.52, alpha: 0.8 });
  base.ellipse(0, baseY + radius * 0.02, radius * 0.9, radius * 0.32).stroke({
    color: mixColor(teamColor, 0x38bdf8, goalkeeper ? 0.24 : 0.14),
    width: goalkeeper ? 0.48 : 0.38,
    alpha: goalkeeper ? 0.24 : 0.17,
  });
  token.addChild(base);

  const athlete = new Graphics();
  const jerseyColor = goalkeeper ? mixColor(teamColor, 0xffffff, 0.22) : teamColor;
  const jerseyShade = mixColor(jerseyColor, 0x0f172a, 0.25);
  const shortsColor = mixColor(jerseyColor, 0x0b1220, 0.44);
  const skinColor = 0xf0c9a8;
  const hairColor = mixColor(skinColor, 0x1f2937, 0.54);

  // small lower body / shorts hint, anchored just above pill
  athlete.roundRect(-radius * 0.18, radius * 0.24, radius * 0.36, radius * 0.2, radius * 0.06).fill({ color: shortsColor, alpha: 0.92 });
  athlete.roundRect(-radius * 0.15, radius * 0.4, radius * 0.11, radius * 0.16, radius * 0.05).fill({ color: mixColor(shortsColor, 0x000000, 0.16), alpha: 0.88 });
  athlete.roundRect(radius * 0.04, radius * 0.4, radius * 0.11, radius * 0.16, radius * 0.05).fill({ color: mixColor(shortsColor, 0x000000, 0.16), alpha: 0.88 });

  // torso + shoulders (human mini-athlete proportions)
  athlete.roundRect(-radius * 0.34, -radius * 0.5, radius * 0.68, radius * 0.78, radius * 0.2).fill({ color: jerseyColor, alpha: 1 });
  athlete.roundRect(-radius * 0.29, -radius * 0.44, radius * 0.58, radius * 0.38, radius * 0.16).fill({ color: mixColor(jerseyColor, 0xffffff, 0.18), alpha: 0.34 });
  athlete.roundRect(-radius * 0.27, -radius * 0.02, radius * 0.54, radius * 0.28, radius * 0.12).fill({ color: jerseyShade, alpha: 0.24 });

  // sleeves + simple arms
  athlete.roundRect(-radius * 0.5, -radius * 0.34, radius * 0.16, radius * 0.34, radius * 0.07).fill({ color: jerseyShade, alpha: 0.95 });
  athlete.roundRect(radius * 0.34, -radius * 0.34, radius * 0.16, radius * 0.34, radius * 0.07).fill({ color: jerseyShade, alpha: 0.95 });
  athlete.roundRect(-radius * 0.49, -radius * 0.04, radius * 0.14, radius * 0.18, radius * 0.07).fill({ color: skinColor, alpha: 0.95 });
  athlete.roundRect(radius * 0.35, -radius * 0.04, radius * 0.14, radius * 0.18, radius * 0.07).fill({ color: skinColor, alpha: 0.95 });

  // neck + head + hair cap
  athlete.roundRect(-radius * 0.065, -radius * 0.68, radius * 0.13, radius * 0.08, radius * 0.03).fill({ color: skinColor, alpha: 0.96 });
  athlete.circle(0, -radius * 0.84, radius * 0.17).fill({ color: skinColor, alpha: 1 });
  athlete.ellipse(0, -radius * 0.92, radius * 0.145, radius * 0.07).fill({ color: hairColor, alpha: 0.92 });
  athlete.ellipse(-radius * 0.04, -radius * 0.83, radius * 0.09, radius * 0.04).fill({ color: 0xffffff, alpha: 0.18 });

  athlete.rotation = -0.02;
  token.addChild(athlete);

  const textResolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;

  const numberInset = new Text({
    text: String(number),
    style: {
      fill: 0x8b9bb6,
      fontSize: number > 9 ? 3.32 : 3.65,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      letterSpacing: number > 9 ? 0.03 : 0.01,
    },
  });
  numberInset.anchor.set(0.5, 0.5);
  numberInset.position.set(0, baseY - radius * 0.014);
  numberInset.alpha = 0.22;
  numberInset.roundPixels = true;
  numberInset.resolution = textResolution;
  token.addChild(numberInset);

  const numberText = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: number > 9 ? 3.32 : 3.65,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      stroke: { color: 0x020617, width: 0.4, join: "round" },
      letterSpacing: number > 9 ? 0.03 : 0.01,
    },
  });
  numberText.anchor.set(0.5, 0.5);
  numberText.position.set(0, baseY - radius * 0.026);
  numberText.alpha = 0.94;
  numberText.roundPixels = true;
  numberText.resolution = textResolution;
  token.addChild(numberText);

  return { token, shadow };
}
