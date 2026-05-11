import { Container, Graphics, Text } from "pixi.js";

export type PremiumPlayerTokenColor = "blue" | "red" | "yellow" | "black";

export const PREMIUM_TOKEN_IDLE_SCALE = 1;
export const PREMIUM_TOKEN_DRAG_SCALE = 1.08;
export const PREMIUM_TOKEN_IDLE_SHADOW_ALPHA = 0.24;
export const PREMIUM_TOKEN_DRAG_SHADOW_ALPHA = 0.36;

const PALETTE_BY_COLOR: Record<
  PremiumPlayerTokenColor,
  { base: number; highlight: number; rim: number }
> = {
  blue: {
    base: 0x2563eb,
    highlight: 0x60a5fa,
    rim: 0x1e3a8a,
  },
  red: {
    base: 0xdc2626,
    highlight: 0xf87171,
    rim: 0x7f1d1d,
  },
  yellow: {
    base: 0xf2c94c,
    highlight: 0xfde68a,
    rim: 0xb45309,
  },
  black: {
    base: 0x111827,
    highlight: 0x4b5563,
    rim: 0x020617,
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

function relativeLuminance(color: number): number {
  const srgb = [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff].map((channel) => {
    const normalized = channel / 255;
    if (normalized <= 0.03928) return normalized / 12.92;
    return ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = srgb;
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function contrastRatio(foreground: number, background: number): number {
  const foregroundLum = relativeLuminance(foreground);
  const backgroundLum = relativeLuminance(background);
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);
  return (lighter + 0.05) / (darker + 0.05);
}

export function createPremiumPlayerToken({
  color,
  number,
  radius,
}: {
  color: PremiumPlayerTokenColor;
  number: number;
  radius: number;
}): { token: Container; shadow: Graphics } {
  const palette = PALETTE_BY_COLOR[color];
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(PREMIUM_TOKEN_IDLE_SCALE, PREMIUM_TOKEN_IDLE_SCALE);

  // Keep shadow as first child to preserve expected layering above pitch.
  const shadow = new Graphics();
  shadow
    .ellipse(0.66, radius * 0.84, radius * 1.06, radius * 0.62)
    .fill({ color: 0x020617, alpha: PREMIUM_TOKEN_IDLE_SHADOW_ALPHA });
  token.addChild(shadow);

  const disc = new Graphics();
  disc.circle(0, 0, radius).fill({ color: palette.base, alpha: 1 });
  disc.circle(0, -radius * 0.2, radius * 0.88).fill({ color: palette.highlight, alpha: 0.28 });
  disc.circle(0, radius * 0.28, radius * 0.9).fill({ color: 0x01050d, alpha: 0.09 });
  disc.circle(0, 0, radius).stroke({
    color: palette.rim,
    alpha: 0.96,
    width: 0.68,
    alignment: 0.5,
  });
  disc.circle(0, 0, radius - 0.72).stroke({
    color: 0xffffff,
    alpha: 0.19,
    width: 0.33,
    alignment: 0.5,
  });
  disc.ellipse(-radius * 0.23, -radius * 0.42, radius * 0.54, radius * 0.34).fill({
    color: 0xffffff,
    alpha: 0.29,
  });
  token.addChild(disc);

  const lightFill = 0xf3f5f8;
  const darkFill = 0x152033;
  const numberFill =
    contrastRatio(lightFill, palette.base) >= contrastRatio(darkFill, palette.base) ? lightFill : darkFill;
  const numberStroke = mixColor(palette.base, 0x020617, numberFill === lightFill ? 0.64 : 0.52);
  const numberEmbossShadow = mixColor(numberStroke, 0x020617, 0.26);
  const numberEmbossHighlight = mixColor(numberFill, 0xffffff, 0.24);
  const numberBaseY = -radius * 0.1;
  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const numberFontFamily = "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif";

  const numberContrastPlate = new Graphics();
  numberContrastPlate
    .roundRect(-radius * 0.42, -radius * 0.34, radius * 0.84, radius * 0.57, radius * 0.14)
    .fill({
      color: mixColor(palette.base, numberFill === lightFill ? 0xffffff : 0x020617, 0.2),
      alpha: 0.1,
    });
  numberContrastPlate.position.y = numberBaseY;
  token.addChild(numberContrastPlate);

  const numberShadowLabel = new Text({
    text: String(number),
    style: {
      fill: numberEmbossShadow,
      fontSize: 4.74,
      fontWeight: "900",
      align: "center",
      fontFamily: numberFontFamily,
      letterSpacing: 0.02,
    },
  });
  numberShadowLabel.anchor.set(0.5, 0.5);
  numberShadowLabel.position.y = numberBaseY + 0.08;
  numberShadowLabel.alpha = 0.2;
  numberShadowLabel.resolution = textResolution;
  numberShadowLabel.roundPixels = true;
  token.addChild(numberShadowLabel);

  const numberLabel = new Text({
    text: String(number),
    style: {
      fill: numberFill,
      fontSize: 4.74,
      fontWeight: "900",
      align: "center",
      fontFamily: numberFontFamily,
      letterSpacing: 0.02,
      stroke: {
        color: numberStroke,
        width: 0.58,
        join: "round",
      },
    },
  });
  numberLabel.anchor.set(0.5, 0.5);
  numberLabel.position.y = numberBaseY;
  numberLabel.resolution = textResolution;
  numberLabel.roundPixels = true;
  token.addChild(numberLabel);

  const numberHighlightLabel = new Text({
    text: String(number),
    style: {
      fill: numberEmbossHighlight,
      fontSize: 4.74,
      fontWeight: "900",
      align: "center",
      fontFamily: numberFontFamily,
      letterSpacing: 0.02,
    },
  });
  numberHighlightLabel.anchor.set(0.5, 0.5);
  numberHighlightLabel.position.y = numberBaseY - 0.06;
  numberHighlightLabel.alpha = 0.14;
  numberHighlightLabel.resolution = textResolution;
  numberHighlightLabel.roundPixels = true;
  token.addChild(numberHighlightLabel);

  return { token, shadow };
}
