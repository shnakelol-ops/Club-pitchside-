import { Container, Graphics, Text } from "pixi.js";
import { drawTokenPattern, resolvePatternLOD } from "./drawTokenPattern";
import { normalisePattern } from "./tokenConfig";

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

const DEFAULT_STYLE_BY_TEAM: Record<VisionV3TeamColor, VisionV3PlayerTokenStyle> = {
  blue: { primaryColor: 0x2563eb, secondaryColor: 0x60a5fa, badgeColor: 0x1d4ed8, outlineColor: 0x0f172a, textColor: 0xffffff },
  red: { primaryColor: 0xdc2626, secondaryColor: 0xf87171, badgeColor: 0xb91c1c, outlineColor: 0x0f172a, textColor: 0xffffff },
  green: { primaryColor: 0x16a34a, secondaryColor: 0x4ade80, badgeColor: 0x166534, outlineColor: 0x0b1220, textColor: 0xffffff },
  yellow: { primaryColor: 0xfacc15, secondaryColor: 0xfde68a, badgeColor: 0xca8a04, outlineColor: 0x111827, textColor: 0x0f172a },
  black: { primaryColor: 0x1f2937, secondaryColor: 0x4b5563, badgeColor: 0x020617, outlineColor: 0x000000, textColor: 0xffffff },
  white: { primaryColor: 0xe5e7eb, secondaryColor: 0xffffff, badgeColor: 0x94a3b8, outlineColor: 0x0f172a, textColor: 0x0f172a },
};

function luminance(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function createVisionV3PlayerToken({ label, teamColor, style, scale, radius, kitPattern = "plain", kitPatternColor, ring, numberColor, glowOnSelect }: {
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
}): { token: Container; shadow: Graphics } {
  const defaults = DEFAULT_STYLE_BY_TEAM[teamColor];
  const resolved = { ...defaults, ...style };
  const token = new Container();
  token.scale.set(scale ?? 1);

  const discRadius = Number.isFinite(radius) ? Math.max(2.8, Number(radius)) : 3.66;
  const ringWidth = Math.max(0.48, discRadius * 0.13);
  const innerRadius = discRadius - ringWidth;

  const base = resolved.goalkeeper && resolved.secondaryColor != null ? resolved.secondaryColor : resolved.primaryColor;
  const secondary = Number.isFinite(kitPatternColor) ? Number(kitPatternColor) : (resolved.secondaryColor ?? 0xffffff);
  const ringColor = Number.isFinite(ring) ? Number(ring) : 0x111111;
  const hexSecondary = `#${secondary.toString(16).padStart(6, "0")}`;

  const shadow = new Graphics();
  shadow.ellipse(0, discRadius * 1.02, discRadius * 0.9, discRadius * 0.24).fill({ color: 0x000000, alpha: 0.24 });
  shadow.alpha = glowOnSelect ? 0.3 : 0.2;
  token.addChild(shadow);

  const disc = new Graphics();
  disc.circle(0, 0, discRadius).fill({ color: ringColor });
  disc.circle(0, 0, innerRadius).fill({ color: base });
  disc.save();
  disc.circle(0, 0, innerRadius).clip();
  drawTokenPattern({
    g: disc,
    pattern: normalisePattern(kitPattern),
    secondary: hexSecondary,
    cx: 0,
    cy: 0,
    r: innerRadius,
    lod: resolvePatternLOD(innerRadius),
  });
  disc.restore();
  disc.circle(0, 0, discRadius).stroke({ color: 0x111111, width: Math.max(0.2, discRadius * 0.1), alpha: 0.8, alignment: 0.5 });
  token.addChild(disc);

  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumeric = /^\d+$/.test(safeLabel);
  const fill = Number.isFinite(numberColor) ? Number(numberColor) : (luminance(base) < 140 ? 0xffffff : 0x111111);
  const text = new Text({
    text: safeLabel,
    style: {
      fill,
      fontFamily: '"Inter", "SF Pro Display", sans-serif',
      fontWeight: "800",
      fontSize: isNumeric ? innerRadius * (safeLabel.length > 1 ? 1.2 : 1.35) : innerRadius,
      stroke: fill === 0xffffff ? 0x000000 : 0xffffff,
      strokeThickness: Math.max(0.18, discRadius * 0.09),
      align: "center",
    },
    anchor: 0.5,
  });
  text.y = innerRadius * 0.02;
  token.addChild(text);

  return { token, shadow };
}
