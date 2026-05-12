import { Container, FillGradient, Graphics, Text } from "pixi.js";

export type PremiumPlayerTokenColor = "blue" | "red" | "yellow" | "black";
export type PremiumTokenAccentPattern = "plain" | "hoops" | "slash" | "stripes";

export const PREMIUM_TOKEN_IDLE_SCALE = 1;
export const PREMIUM_TOKEN_DRAG_SCALE = 1.08;
export const PREMIUM_TOKEN_IDLE_SHADOW_ALPHA = 0.24;
export const PREMIUM_TOKEN_DRAG_SHADOW_ALPHA = 0.36;

const RIM_COLOR_BY_TEAM: Record<PremiumPlayerTokenColor, number> = {
  blue: 0x5ea8ff,
  red: 0xff6b6b,
  yellow: 0xffd84d,
  black: 0xc4d0e4,
};

function withAlpha(hexColor: number, alpha: number): string {
  const rgb = `#${hexColor.toString(16).padStart(6, "0")}`;
  return `color-mix(in srgb, ${rgb} ${Math.round(alpha * 100)}%, transparent)`;
}

export function createPremiumPlayerToken({
  color,
  number,
  radius,
  label,
  accentPattern = "plain",
  accentColor,
}: {
  color: PremiumPlayerTokenColor;
  number: number;
  radius: number;
  label?: string;
  accentPattern?: PremiumTokenAccentPattern;
  accentColor?: number;
}): { token: Container; shadow: Graphics } {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(PREMIUM_TOKEN_IDLE_SCALE, PREMIUM_TOKEN_IDLE_SCALE);

  const width = radius * 1.55;
  const height = radius * 1.02;
  const corner = height * 0.5;
  const rimColor = RIM_COLOR_BY_TEAM[color];

  const shadow = new Graphics();
  shadow
    .roundRect(-width * 0.52, -height * 0.26 + height * 0.88, width * 1.04, height * 0.5, height * 0.24)
    .fill({ color: 0x020617, alpha: PREMIUM_TOKEN_IDLE_SHADOW_ALPHA * 0.76 });
  token.addChild(shadow);

  const rim = new Graphics();
  rim.roundRect(-width / 2, -height / 2, width, height, corner).fill({ color: rimColor, alpha: 1 });
  token.addChild(rim);

  const coreInset = height * 0.11;
  const coreWidth = width - coreInset * 2;
  const coreHeight = height - coreInset * 2;
  const coreGradient = new FillGradient(0, -coreHeight / 2, 0, coreHeight / 2);
  coreGradient.addColorStop(0, 0x1e293b);
  coreGradient.addColorStop(0.58, 0x0f172a);
  coreGradient.addColorStop(1, 0x020617);

  const core = new Graphics();
  core.roundRect(-coreWidth / 2, -coreHeight / 2, coreWidth, coreHeight, coreHeight * 0.5).fill(coreGradient);
  token.addChild(core);

  const accent = new Graphics();
  const accentTone = accentColor ?? rimColor;
  const accentY = -coreHeight * 0.04;
  if (accentPattern === "stripes") {
    for (let idx = -1; idx <= 1; idx += 1) {
      const stripeWidth = coreWidth * 0.11;
      accent
        .roundRect(idx * coreWidth * 0.24 - stripeWidth * 0.5, -coreHeight * 0.42, stripeWidth, coreHeight * 0.84, stripeWidth * 0.5)
        .fill({ color: accentTone, alpha: 0.33 });
    }
  } else if (accentPattern === "hoops") {
    accent
      .roundRect(-coreWidth * 0.44, accentY - coreHeight * 0.24, coreWidth * 0.88, coreHeight * 0.16, coreHeight * 0.08)
      .fill({ color: accentTone, alpha: 0.34 })
      .roundRect(-coreWidth * 0.44, accentY + coreHeight * 0.08, coreWidth * 0.88, coreHeight * 0.16, coreHeight * 0.08)
      .fill({ color: accentTone, alpha: 0.28 });
  } else if (accentPattern === "slash") {
    accent
      .poly([
        -coreWidth * 0.35,
        -coreHeight * 0.42,
        -coreWidth * 0.16,
        -coreHeight * 0.42,
        coreWidth * 0.28,
        coreHeight * 0.42,
        coreWidth * 0.1,
        coreHeight * 0.42,
      ])
      .fill({ color: accentTone, alpha: 0.36 });
  }
  token.addChild(accent);

  const glossGradient = new FillGradient(0, -coreHeight * 0.46, 0, 0);
  glossGradient.addColorStop(0, withAlpha(0xffffff, 0.25));
  glossGradient.addColorStop(1, withAlpha(0xffffff, 0));
  const gloss = new Graphics();
  gloss.roundRect(-coreWidth * 0.45, -coreHeight * 0.42, coreWidth * 0.9, coreHeight * 0.44, coreHeight * 0.22).fill(glossGradient);
  token.addChild(gloss);

  const tokenLabel = label?.trim() || String(number);
  const textResolution = typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const numberLabel = new Text({
    text: tokenLabel,
    style: {
      fill: 0xffffff,
      fontSize: tokenLabel.length >= 2 ? height * 0.66 : height * 0.72,
      fontWeight: "900",
      align: "center",
      fontFamily: '"Barlow Condensed", "Inter Tight", Inter, system-ui, sans-serif',
      letterSpacing: tokenLabel.length >= 2 ? 0.1 : 0.3,
      stroke: { color: 0x000000, width: 0.65, join: "round" },
    },
  });
  numberLabel.anchor.set(0.5);
  numberLabel.position.set(0, height * 0.01);
  numberLabel.resolution = textResolution;
  numberLabel.roundPixels = true;
  token.addChild(numberLabel);

  return { token, shadow };
}
