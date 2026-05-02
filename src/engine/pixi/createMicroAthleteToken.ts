import { Container, Graphics, Text } from "pixi.js";

export type MicroAthleteStyle = {
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  skinTone: number;
  hairColor: number;
  shortsColor: number;
  sockColor: number;
  bootColor: number;
  goalkeeper?: boolean;
};

export type MicroAthleteTeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";

export const MICRO_ATHLETE_TOKEN_IDLE_SCALE = 1;
export const MICRO_ATHLETE_TOKEN_DRAG_SCALE = 1.14;
export const MICRO_ATHLETE_TOKEN_IDLE_SHADOW_ALPHA = 0.24;
export const MICRO_ATHLETE_TOKEN_DRAG_SHADOW_ALPHA = 0.38;

const DEFAULT_STYLE_BY_TEAM: Record<MicroAthleteTeamColor, MicroAthleteStyle> = {
  blue: {
    primaryColor: 0x2563eb,
    secondaryColor: 0x60a5fa,
    badgeColor: 0x1e40af,
    outlineColor: 0x0b1220,
    textColor: 0xffffff,
    skinTone: 0xf3d4b5,
    hairColor: 0x1f2937,
    shortsColor: 0x1d4ed8,
    sockColor: 0xe2e8f0,
    bootColor: 0x111827,
  },
  red: {
    primaryColor: 0xdc2626,
    secondaryColor: 0xf87171,
    badgeColor: 0x991b1b,
    outlineColor: 0x0b1220,
    textColor: 0xffffff,
    skinTone: 0xf2c9a8,
    hairColor: 0x1f2937,
    shortsColor: 0xb91c1c,
    sockColor: 0xe5e7eb,
    bootColor: 0x020617,
  },
  green: {
    primaryColor: 0x16a34a,
    secondaryColor: 0x4ade80,
    badgeColor: 0x166534,
    outlineColor: 0x0b1220,
    textColor: 0xffffff,
    skinTone: 0xf1cca8,
    hairColor: 0x374151,
    shortsColor: 0x15803d,
    sockColor: 0xe2e8f0,
    bootColor: 0x0f172a,
  },
  yellow: {
    primaryColor: 0xfacc15,
    secondaryColor: 0xfde68a,
    badgeColor: 0xca8a04,
    outlineColor: 0x111827,
    textColor: 0x0f172a,
    skinTone: 0xf3d0b0,
    hairColor: 0x3f3f46,
    shortsColor: 0xca8a04,
    sockColor: 0x111827,
    bootColor: 0x020617,
  },
  black: {
    primaryColor: 0x1f2937,
    secondaryColor: 0x4b5563,
    badgeColor: 0x020617,
    outlineColor: 0x000000,
    textColor: 0xffffff,
    skinTone: 0xe5bb96,
    hairColor: 0x0f172a,
    shortsColor: 0x111827,
    sockColor: 0xe2e8f0,
    bootColor: 0x020617,
  },
  white: {
    primaryColor: 0xe5e7eb,
    secondaryColor: 0xffffff,
    badgeColor: 0x94a3b8,
    outlineColor: 0x0f172a,
    textColor: 0x0f172a,
    skinTone: 0xf2cfb2,
    hairColor: 0x1f2937,
    shortsColor: 0x94a3b8,
    sockColor: 0x334155,
    bootColor: 0x0f172a,
  },
};

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
  token.scale.set((scale ?? 1) * MICRO_ATHLETE_TOKEN_IDLE_SCALE);

  const badgeRadius = 3.66;
  const outlineWidth = 0.56;
  const jerseyFill = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : resolved.primaryColor;
  const jerseyTrimColor = resolved.secondaryColor ?? resolved.primaryColor;
  const shortsFill = resolved.goalkeeper ? resolved.primaryColor : resolved.shortsColor;

  const shadow = new Graphics();
  shadow
    .ellipse(0.66, badgeRadius * 0.92, badgeRadius * 1.18, badgeRadius * 0.62)
    .fill({ color: 0x020617, alpha: MICRO_ATHLETE_TOKEN_IDLE_SHADOW_ALPHA });
  token.addChild(shadow);

  const body = new Graphics();
  // Socks and boots
  body
    .roundRect(-2.05, -0.52, 1.34, 2.2, 0.44)
    .fill({ color: resolved.sockColor })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(0.71, -0.52, 1.34, 2.2, 0.44)
    .fill({ color: resolved.sockColor })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(-2.26, 1.44, 1.74, 0.68, 0.3)
    .fill({ color: resolved.bootColor })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(0.52, 1.44, 1.74, 0.68, 0.3)
    .fill({ color: resolved.bootColor })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  // Shorts and torso / jersey
  body
    .roundRect(-2.42, -1.6, 4.84, 1.58, 0.58)
    .fill({ color: shortsFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(-2.72, -5.36, 5.44, 4.38, 1.24)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  if (resolved.secondaryColor != null) {
    body
      .roundRect(-2.24, -4.82, 4.48, 1.56, 0.68)
      .fill({ color: resolved.secondaryColor, alpha: 0.5 });
  }

  body
    .roundRect(-1.2, -5.24, 2.4, 0.72, 0.32)
    .fill({ color: jerseyTrimColor, alpha: 0.78 });

  // Arms and hands
  body
    .roundRect(-3.78, -4.36, 1.02, 2.94, 0.46)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(2.76, -4.36, 1.02, 2.94, 0.46)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(-3.72, -2.02, 0.88, 0.68, 0.3)
    .fill({ color: jerseyTrimColor, alpha: 0.8 })
    .roundRect(2.84, -2.02, 0.88, 0.68, 0.3)
    .fill({ color: jerseyTrimColor, alpha: 0.8 })
    .circle(-3.22, -1.1, 0.43)
    .fill({ color: resolved.skinTone })
    .stroke({ color: resolved.outlineColor, width: outlineWidth * 0.75 })
    .circle(3.22, -1.1, 0.43)
    .fill({ color: resolved.skinTone })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  // Neck and head
  body
    .roundRect(-0.42, -6.38, 0.84, 0.58, 0.24)
    .fill({ color: resolved.skinTone })
    .stroke({ color: resolved.outlineColor, width: outlineWidth * 0.72 })
    .circle(0, -7.16, 1.3)
    .fill({ color: resolved.skinTone })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .ellipse(0, -7.72, 1.08, 0.54)
    .fill({ color: resolved.hairColor, alpha: 0.95 })
    .ellipse(-0.46, -7.54, 0.44, 0.26)
    .fill({ color: 0xffffff, alpha: 0.22 })
    .circle(-0.38, -7.08, 0.08)
    .fill({ color: 0x111827, alpha: 0.58 })
    .circle(0.38, -7.08, 0.08)
    .fill({ color: 0x111827, alpha: 0.58 });
  token.addChild(body);

  const badge = new Graphics();
  badge
    .circle(0, 0, badgeRadius)
    .fill({ color: resolved.badgeColor })
    .stroke({ color: resolved.outlineColor, width: 0.7 })
    .circle(0, 0, badgeRadius - 0.56)
    .stroke({ color: 0xffffff, alpha: 0.2, width: 0.28 })
    .ellipse(0, badgeRadius * 0.42, badgeRadius * 0.84, badgeRadius * 0.42)
    .fill({ color: 0x020617, alpha: 0.2 })
    .ellipse(-badgeRadius * 0.23, -badgeRadius * 0.44, badgeRadius * 0.52, badgeRadius * 0.3)
    .fill({ color: 0xffffff, alpha: 0.24 });
  token.addChild(badge);

  const labelFontSize = label.length >= 3 ? 3.26 : label.length === 2 ? 3.58 : 3.8;
  const labelText = new Text({
    text: label,
    style: {
      fill: resolved.textColor,
      fontSize: labelFontSize,
      fontWeight: "900",
      fontFamily: "Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: label.length >= 2 ? 0.09 : 0.12,
      stroke: {
        color: resolved.outlineColor,
        width: 0.58,
        join: "round",
      },
      dropShadow: {
        color: 0x020617,
        alpha: 0.55,
        blur: 1.4,
        distance: 0.34,
        angle: Math.PI / 2,
      },
    },
  });
  labelText.anchor.set(0.5, 0.535);
  token.addChild(labelText);

  return { token, shadow };
}
