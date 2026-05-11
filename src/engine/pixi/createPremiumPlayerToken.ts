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

  const numberLabel = new Text({
    text: String(number),
    style: {
      fill: 0xffffff,
      fontSize: 4.74,
      fontWeight: "900",
      align: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      stroke: {
        color: 0x0b1220,
        width: 0.74,
        join: "round",
      },
    },
  });
  numberLabel.anchor.set(0.5, 0.5);
  numberLabel.position.y = -radius * 0.1;
  token.addChild(numberLabel);

  return { token, shadow };
}
