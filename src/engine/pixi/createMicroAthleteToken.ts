import { Container, Graphics, Text } from "pixi.js";

export type MicroAthleteStyle = {
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

  const badgeRadius = 3.85;

  const shadow = new Graphics();
  shadow
    .ellipse(0.66, badgeRadius * 0.92, badgeRadius * 1.18, badgeRadius * 0.62)
    .fill({ color: 0x020617, alpha: 0.24 });
  token.addChild(shadow);

  const body = new Graphics();
  const outlineWidth = 0.52;
  const jerseyFill = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : resolved.primaryColor;

  // Legs
  body
    .roundRect(-1.6, -1.05, 1.08, 2.1, 0.42)
    .fill({ color: 0x334155 })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(0.52, -1.05, 1.08, 2.1, 0.42)
    .fill({ color: 0x334155 })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  // Torso / jersey
  body
    .roundRect(-2.18, -5.68, 4.36, 4.76, 1.12)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  if (resolved.secondaryColor != null) {
    body
      .roundRect(-1.84, -5.28, 3.68, 1.42, 0.64)
      .fill({ color: resolved.secondaryColor, alpha: 0.44 });
  }

  // Arms
  body
    .roundRect(-3.08, -4.88, 0.82, 2.36, 0.41)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(2.26, -4.88, 0.82, 2.36, 0.41)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  // Head
  body
    .circle(0, -7.08, 1.5)
    .fill({ color: 0xf3d4b5 })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .ellipse(-0.54, -7.52, 0.52, 0.3)
    .fill({ color: 0xffffff, alpha: 0.22 });
  token.addChild(body);

  const badge = new Graphics();
  badge
    .circle(0, 0, badgeRadius)
    .fill({ color: resolved.badgeColor })
    .stroke({ color: resolved.outlineColor, width: 0.7 })
    .ellipse(0, badgeRadius * 0.42, badgeRadius * 0.84, badgeRadius * 0.42)
    .fill({ color: 0x020617, alpha: 0.2 })
    .ellipse(-badgeRadius * 0.23, -badgeRadius * 0.44, badgeRadius * 0.52, badgeRadius * 0.3)
    .fill({ color: 0xffffff, alpha: 0.24 });
  token.addChild(badge);

  const labelText = new Text({
    text: label,
    style: {
      fill: resolved.textColor,
      fontSize: 3.78,
      fontWeight: "900",
      fontFamily: "Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: 0.12,
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
