import { Container, FillGradient, Graphics, Text } from "pixi.js";

export type MicroAthleteStyle = {
  baseColor?: number | string;
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  goalkeeper?: boolean;
};

type MicroAthleteTeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";

const DEFAULT_STYLE_BY_TEAM: Record<MicroAthleteTeamColor, MicroAthleteStyle> = {
  blue: {
    primaryColor: 0x2563eb,
    secondaryColor: 0x60a5fa,
    badgeColor: 0x1e40af,
    outlineColor: 0x0b1220,
    textColor: 0xffffff,
  },
  red: {
    primaryColor: 0xdc2626,
    secondaryColor: 0xf87171,
    badgeColor: 0x991b1b,
    outlineColor: 0x0b1220,
    textColor: 0xffffff,
  },
  green: {
    primaryColor: 0x16a34a,
    secondaryColor: 0x4ade80,
    badgeColor: 0x166534,
    outlineColor: 0x0b1220,
    textColor: 0xffffff,
  },
  yellow: {
    primaryColor: 0xfacc15,
    secondaryColor: 0xfde68a,
    badgeColor: 0xca8a04,
    outlineColor: 0x111827,
    textColor: 0x0f172a,
  },
  black: {
    primaryColor: 0x1f2937,
    secondaryColor: 0x4b5563,
    badgeColor: 0x020617,
    outlineColor: 0x000000,
    textColor: 0xffffff,
  },
  white: {
    primaryColor: 0xe5e7eb,
    secondaryColor: 0xffffff,
    badgeColor: 0x94a3b8,
    outlineColor: 0x0f172a,
    textColor: 0x0f172a,
  },
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

function colorToHexString(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseHexColor(input: number | string | undefined, fallback: number): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    return Math.max(0, Math.min(0xffffff, Math.round(input)));
  }
  if (typeof input !== "string") return fallback;

  const normalized = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const expanded = normalized
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return Number.parseInt(expanded, 16);
  }
  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return Number.parseInt(normalized, 16);
  }
  return fallback;
}

function colorToRgb(color: number): { r: number; g: number; b: number } {
  return {
    r: ((color >> 16) & 0xff) / 255,
    g: ((color >> 8) & 0xff) / 255,
    b: (color & 0xff) / 255,
  };
}

function rgbToColor(r: number, g: number, b: number): number {
  return (clampColorChannel(r * 255) << 16) | (clampColorChannel(g * 255) << 8) | clampColorChannel(b * 255);
}

function rgbToHsl(color: number): { h: number; s: number; l: number } {
  const { r, g, b } = colorToRgb(color);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h: number;
  if (max === r) {
    h = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  h /= 6;
  return { h, s, l };
}

function hueToRgb(p: number, q: number, t: number): number {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

function hslToColor(h: number, s: number, l: number): number {
  const hue = clampUnit(h);
  const sat = clampUnit(s);
  const light = clampUnit(l);
  if (sat === 0) return rgbToColor(light, light, light);
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const r = hueToRgb(p, q, hue + 1 / 3);
  const g = hueToRgb(p, q, hue);
  const b = hueToRgb(p, q, hue - 1 / 3);
  return rgbToColor(r, g, b);
}

function toLinear(channel: number): number {
  if (channel <= 0.03928) return channel / 12.92;
  return ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color: number): number {
  const { r, g, b } = colorToRgb(color);
  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

type DerivedTokenPalette = {
  base: number;
  highlight: number;
  shadow: number;
  glow: number;
  rimLight: number;
  innerShadow: number;
  numberColor: number;
};

function deriveTokenPalette(baseColor: number): DerivedTokenPalette {
  const hsl = rgbToHsl(baseColor);

  // Keep very light and very dark colors usable on grass.
  let saturation = clampUnit(hsl.s);
  let lightness = clampUnit(hsl.l);
  if (lightness > 0.78) lightness = 0.66;
  if (lightness > 0.68) lightness = 0.62;
  if (lightness < 0.14) lightness = 0.22;
  if (lightness < 0.2) lightness = 0.25;
  if (saturation < 0.18) saturation = 0.22;

  const normalizedBase = hslToColor(hsl.h, saturation, lightness);
  const darkBoost = lightness < 0.34 ? 0.07 : 0;
  const lightBoost = lightness > 0.62 ? 0.06 : 0;
  const highlight = hslToColor(hsl.h, clampUnit(saturation * 0.9), clampUnit(lightness + 0.22 + darkBoost));
  const shadow = hslToColor(hsl.h, clampUnit(saturation + 0.08), clampUnit(lightness - 0.2 - lightBoost));
  const glow = hslToColor(hsl.h, clampUnit(saturation * 0.45), clampUnit(lightness + 0.17));
  const rimLight = hslToColor(hsl.h, clampUnit(saturation * 0.5), clampUnit(lightness + 0.3));
  const innerShadow = hslToColor(hsl.h, clampUnit(saturation + 0.06), clampUnit(lightness - 0.28));
  const numberColor = relativeLuminance(normalizedBase) < 0.5 ? 0xffffff : 0x0f172a;

  return {
    base: normalizedBase,
    highlight,
    shadow,
    glow,
    rimLight,
    innerShadow,
    numberColor,
  };
}

export function createMicroAthleteToken({
  label,
  teamColor,
  style,
  scale,
}: {
  label: string;
  teamColor: MicroAthleteTeamColor;
  style?: Partial<MicroAthleteStyle>;
  scale?: number;
}): { token: Container; shadow: Graphics } {
  const defaults = DEFAULT_STYLE_BY_TEAM[teamColor];
  const resolved: MicroAthleteStyle = {
    ...defaults,
    ...style,
    secondaryColor: style?.secondaryColor ?? defaults.secondaryColor,
    goalkeeper: style?.goalkeeper ?? defaults.goalkeeper,
  };

  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(scale ?? 1);

  const baseColor = parseHexColor(style?.baseColor, resolved.primaryColor);
  const tokenPalette = deriveTokenPalette(baseColor);
  const badgeRadius = 3.66;

  const shadow = new Graphics();
  shadow
    .ellipse(0.54, badgeRadius * 1.28, badgeRadius * 1.72, badgeRadius * 0.72)
    .fill({ color: 0x020617, alpha: 0.06 })
    .ellipse(0.54, badgeRadius * 1.19, badgeRadius * 1.44, badgeRadius * 0.5)
    .fill({ color: 0x020617, alpha: 0.1 })
    .ellipse(0.54, badgeRadius * 1.1, badgeRadius * 1.16, badgeRadius * 0.36)
    .fill({ color: 0x020617, alpha: 0.16 });
  token.addChild(shadow);

  const athlete = new Container();
  athlete.rotation = -0.092;
  athlete.position.set(0.16, -0.06);
  token.addChild(athlete);

  const jerseyFill = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : tokenPalette.base;
  const torsoTop = mixColor(jerseyFill, 0xffffff, 0.24);
  const torsoBottom = mixColor(jerseyFill, 0x000000, 0.26);
  const torsoGradient = new FillGradient({
    type: "linear",
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    textureSpace: "local",
    colorStops: [
      { offset: 0, color: colorToHexString(torsoTop) },
      { offset: 1, color: colorToHexString(torsoBottom) },
    ],
  });

  const body = new Graphics();
  // Subtle arms (kept slim for small-scale readability)
  body
    .roundRect(-2.26, -5.2, 0.54, 3.34, 0.26)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.08), alpha: 0.94 })
    .roundRect(1.72, -5.2, 0.54, 3.34, 0.26)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.15), alpha: 0.94 });

  // Torso / jersey (lean upright silhouette with gentle taper)
  body
    .moveTo(-1.58, -6.26)
    .lineTo(1.58, -6.26)
    .lineTo(0.94, -0.45)
    .lineTo(-0.94, -0.45)
    .closePath()
    .fill(torsoGradient);

  // Internal polish without thick cartoon outlines.
  body
    .ellipse(0.46, -2.64, 0.82, 2.42)
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(-0.38, -5.08, 0.74, 0.38)
    .fill({ color: 0xffffff, alpha: 0.17 })
    .roundRect(-0.72, -1.1, 1.44, 0.74, 0.34)
    .fill({ color: 0x020617, alpha: 0.11 });

  // Shorts + subtle legs
  body
    .roundRect(-0.92, -0.8, 1.84, 0.7, 0.22)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.34), alpha: 0.88 })
    .roundRect(-0.8, -0.1, 0.58, 2.28, 0.26)
    .fill({ color: 0x334155, alpha: 0.92 })
    .roundRect(0.22, -0.1, 0.58, 2.28, 0.26)
    .fill({ color: 0x334155, alpha: 0.92 });

  // Head (small and clean: no facial details).
  const headColor = 0xf2cfad;
  const hairTone = mixColor(headColor, 0x020617, 0.36);
  body
    // Tiny soft back-hair cue for quick female-identifying read.
    .ellipse(-0.7, -6.9, 0.26, 0.19)
    .fill({ color: hairTone, alpha: 0.29 })
    .ellipse(-0.88, -6.74, 0.14, 0.1)
    .fill({ color: hairTone, alpha: 0.24 })
    .circle(0.03, -7.16, 0.9)
    .fill({ color: headColor })
    .ellipse(0.03, -7.5, 0.56, 0.22)
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(-0.1, -7.3, 0.5, 0.21)
    .fill({ color: 0xffffff, alpha: 0.12 });
  athlete.addChild(body);

  const badgeTopColor = tokenPalette.highlight;
  const badgeMidColor = tokenPalette.base;
  const badgeBottomColor = tokenPalette.shadow;
  const tokenOuterGlow = new Graphics();
  tokenOuterGlow
    .circle(0, 0, badgeRadius * 1.2)
    .fill({ color: tokenPalette.glow, alpha: 0.05 })
    .circle(0, 0, badgeRadius * 1.06)
    .fill({ color: tokenPalette.glow, alpha: 0.07 });
  token.addChild(tokenOuterGlow);

  const badgeGradient = new FillGradient({
    type: "radial",
    center: { x: 0.28, y: 0.2 },
    innerRadius: 0,
    outerRadius: 1,
    outerCenter: { x: 0.62, y: 0.7 },
    textureSpace: "local",
    colorStops: [
      { offset: 0, color: colorToHexString(badgeTopColor) },
      { offset: 0.5, color: colorToHexString(badgeMidColor) },
      { offset: 1, color: colorToHexString(badgeBottomColor) },
    ],
  });

  const badge = new Graphics();
  badge
    .circle(0, 0, badgeRadius)
    .fill(badgeGradient)
    .ellipse(0.08, badgeRadius * 0.5, badgeRadius * 0.92, badgeRadius * 0.42)
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(-badgeRadius * 0.42, -badgeRadius * 0.58, badgeRadius * 0.24, badgeRadius * 0.15)
    .fill({ color: 0xffffff, alpha: 0.32 })
    .ellipse(-badgeRadius * 0.04, -badgeRadius * 0.72, badgeRadius * 0.68, badgeRadius * 0.1)
    .fill({ color: 0xffffff, alpha: 0.2 })
    .ellipse(0, -badgeRadius * 0.68, badgeRadius * 0.74, badgeRadius * 0.12)
    .fill({ color: tokenPalette.rimLight, alpha: 0.18 })
    .ellipse(0, badgeRadius * 0.56, badgeRadius * 0.84, badgeRadius * 0.3)
    .fill({ color: tokenPalette.innerShadow, alpha: 0.1 });
  token.addChild(badge);

  const numberFill = style?.textColor ?? tokenPalette.numberColor;
  const numberUsesLightFill = relativeLuminance(numberFill) > 0.56;
  const numberStroke = numberUsesLightFill ? mixColor(tokenPalette.shadow, 0x000000, 0.48) : 0xf8fafc;
  const numberDropShadowColor = numberUsesLightFill ? 0x020617 : 0xffffff;

  const labelText = new Text({
    text: label,
    style: {
      fill: numberFill,
      fontSize: 3.78,
      fontWeight: "900",
      fontFamily: "Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: 0.12,
      stroke: {
        color: numberStroke,
        width: 0.28,
        join: "round",
      },
      dropShadow: {
        color: numberDropShadowColor,
        alpha: numberUsesLightFill ? 0.28 : 0.12,
        blur: 1,
        distance: 0.14,
        angle: Math.PI / 2,
      },
    },
  });
  labelText.anchor.set(0.5, 0.53);
  labelText.position.y = 0.06;
  token.addChild(labelText);

  return { token, shadow };
}
