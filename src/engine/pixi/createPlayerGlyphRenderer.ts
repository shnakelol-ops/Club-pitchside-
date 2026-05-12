import { Container, Graphics, Text } from "pixi.js";

export const GLYPH_TOKEN_IDLE_SCALE = 1;
export const GLYPH_TOKEN_DRAG_SCALE = 1.08;
export const GLYPH_TOKEN_IDLE_SHADOW_ALPHA = 0.24;
export const GLYPH_TOKEN_DRAG_SHADOW_ALPHA = 0.36;

type GlyphTokenInput = { number: number; radius: number; teamColor: number; goalkeeper?: boolean };

function clampColorChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(base: number, target: number, amount: number): number {
  const br = (base >> 16) & 0xff;
  const bg = (base >> 8) & 0xff;
  const bb = base & 0xff;
  const tr = (target >> 16) & 0xff;
  const tg = (target >> 8) & 0xff;
  const tb = target & 0xff;
  const r = clampColorChannel(br + (tr - br) * amount);
  const g = clampColorChannel(bg + (tg - bg) * amount);
  const b = clampColorChannel(bb + (tb - bb) * amount);
  return (r << 16) | (g << 8) | b;
}

export function createPlayerGlyphRenderer({ number, radius, teamColor, goalkeeper = false }: GlyphTokenInput): {
  token: Container;
  shadow: Graphics;
} {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(GLYPH_TOKEN_IDLE_SCALE);

  const shadow = new Graphics();
  shadow.ellipse(0, radius * 0.94, radius * 0.9, radius * 0.28).fill({ color: 0x000000, alpha: GLYPH_TOKEN_IDLE_SHADOW_ALPHA * 0.62 });
  token.addChild(shadow);

  const baseY = radius * 0.78;
  const base = new Graphics();
  base.ellipse(0, baseY, radius * 0.82, radius * 0.26).fill({ color: 0x131c2c, alpha: 0.95 });
  base.ellipse(0, baseY + radius * 0.012, radius * 0.62, radius * 0.14).fill({ color: 0x0b1422, alpha: 0.56 });
  base.ellipse(0, baseY, radius * 0.82, radius * 0.26).stroke({ color: mixColor(teamColor, 0xffffff, goalkeeper ? 0.34 : 0.11), width: 0.48, alpha: 0.8 });
  token.addChild(base);

  const jersey = goalkeeper ? mixColor(teamColor, 0xffffff, 0.22) : teamColor;
  const sleeve = mixColor(jersey, 0x0f172a, 0.2);
  const shorts = mixColor(jersey, 0x0b1220, 0.44);
  const skin = 0xefc7a4;
  const hair = mixColor(skin, 0x1f2937, 0.6);

  const athlete = new Graphics();
  athlete.roundRect(-radius * 0.16, radius * 0.24, radius * 0.32, radius * 0.18, radius * 0.04).fill({ color: shorts, alpha: 0.95 });
  athlete.roundRect(-radius * 0.13, radius * 0.39, radius * 0.09, radius * 0.14, radius * 0.03).fill({ color: mixColor(shorts, 0x000000, 0.16), alpha: 0.9 });
  athlete.roundRect(radius * 0.04, radius * 0.39, radius * 0.09, radius * 0.14, radius * 0.03).fill({ color: mixColor(shorts, 0x000000, 0.16), alpha: 0.9 });

  athlete.roundRect(-radius * 0.35, -radius * 0.48, radius * 0.7, radius * 0.24, radius * 0.08).fill({ color: sleeve, alpha: 1 });
  athlete.roundRect(-radius * 0.24, -radius * 0.48, radius * 0.48, radius * 0.7, radius * 0.11).fill({ color: jersey, alpha: 1 });
  athlete.roundRect(-radius * 0.2, -radius * 0.42, radius * 0.4, radius * 0.3, radius * 0.09).fill({ color: mixColor(jersey, 0xffffff, 0.16), alpha: 0.32 });

  athlete.roundRect(-radius * 0.47, -radius * 0.31, radius * 0.12, radius * 0.31, radius * 0.05).fill({ color: sleeve, alpha: 0.95 });
  athlete.roundRect(radius * 0.35, -radius * 0.31, radius * 0.12, radius * 0.31, radius * 0.05).fill({ color: sleeve, alpha: 0.95 });
  athlete.roundRect(-radius * 0.46, -radius * 0.02, radius * 0.1, radius * 0.16, radius * 0.05).fill({ color: skin, alpha: 0.96 });
  athlete.roundRect(radius * 0.36, -radius * 0.02, radius * 0.1, radius * 0.16, radius * 0.05).fill({ color: skin, alpha: 0.96 });

  athlete.roundRect(-radius * 0.05, -radius * 0.64, radius * 0.1, radius * 0.08, radius * 0.03).fill({ color: skin, alpha: 1 });
  athlete.circle(0, -radius * 0.81, radius * 0.16).fill({ color: skin, alpha: 1 });
  athlete.ellipse(0, -radius * 0.89, radius * 0.136, radius * 0.06).fill({ color: hair, alpha: 0.95 });
  athlete.ellipse(-radius * 0.035, -radius * 0.8, radius * 0.08, radius * 0.034).fill({ color: 0xffffff, alpha: 0.18 });
  token.addChild(athlete);

  const textResolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const inset = new Text({ text: String(number), style: { fill: 0x8798b5, fontSize: number > 9 ? 3.25 : 3.58, fontWeight: "900", fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif', letterSpacing: number > 9 ? 0.03 : 0.01 } });
  inset.anchor.set(0.5);
  inset.position.set(0, baseY - radius * 0.012);
  inset.alpha = 0.22;
  inset.resolution = textResolution;
  inset.roundPixels = true;
  token.addChild(inset);

  const label = new Text({ text: String(number), style: { fill: 0xffffff, fontSize: number > 9 ? 3.25 : 3.58, fontWeight: "900", fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif', stroke: { color: 0x020617, width: 0.38, join: "round" }, letterSpacing: number > 9 ? 0.03 : 0.01 } });
  label.anchor.set(0.5);
  label.position.set(0, baseY - radius * 0.024);
  label.alpha = 0.95;
  label.resolution = textResolution;
  label.roundPixels = true;
  token.addChild(label);

  return { token, shadow };
}
