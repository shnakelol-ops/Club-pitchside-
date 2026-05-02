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
    .ellipse(0.66, badgeRadius * 0.93, badgeRadius * 1.15, badgeRadius * 0.58)
    .fill({ color: 0x020617, alpha: 0.3 })
    .ellipse(0.66, badgeRadius * 0.94, badgeRadius * 1.28, badgeRadius * 0.68)
    .fill({ color: 0x020617, alpha: 0.12 });
  token.addChild(shadow);

  const body = new Graphics();
  const outlineWidth = 0.56;
  const jerseyFill = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : resolved.primaryColor;
  const torsoWidth = badgeRadius * 1.44;
  const torsoHeight = badgeRadius * 0.9;
  const torsoTop = -4.9;
  const torsoLeft = -torsoWidth / 2;
  const shoulderWidth = torsoWidth * 1.12;
  const shoulderLeft = -shoulderWidth / 2;
  const headRadius = badgeRadius * 0.24;
  const headCenterY = torsoTop - headRadius * 0.82;

  // Legs
  body
    .roundRect(-1.84, -1.42, 1.2, 3.22, 0.46)
    .fill({ color: 0x334155 })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(0.64, -1.42, 1.2, 3.22, 0.46)
    .fill({ color: 0x334155 })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  // Torso / jersey with subtle shoulder width and taper.
  body
    .roundRect(shoulderLeft, torsoTop - 0.36, shoulderWidth, 1.08, 0.62)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(torsoLeft, torsoTop, torsoWidth, torsoHeight, 0.96)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .poly([
      torsoLeft + 0.36,
      torsoTop + torsoHeight - 0.14,
      torsoLeft + torsoWidth - 0.36,
      torsoTop + torsoHeight - 0.14,
      torsoLeft + torsoWidth - 0.84,
      torsoTop + torsoHeight + 0.58,
      torsoLeft + 0.84,
      torsoTop + torsoHeight + 0.58,
    ])
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  body
    .ellipse(0, torsoTop + 0.08, torsoWidth * 0.42, 0.52)
    .fill({ color: 0xffffff, alpha: 0.17 });

  if (resolved.secondaryColor != null) {
    body
      .roundRect(-torsoWidth * 0.38, torsoTop + 0.26, torsoWidth * 0.76, 1.18, 0.58)
      .fill({ color: resolved.secondaryColor, alpha: 0.44 });
  }

  // Arms
  body
    .roundRect(-shoulderWidth * 0.64, torsoTop + 0.44, 0.88, 2.22, 0.42)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .roundRect(shoulderWidth * 0.64 - 0.88, torsoTop + 0.44, 0.88, 2.22, 0.42)
    .fill({ color: jerseyFill })
    .stroke({ color: resolved.outlineColor, width: outlineWidth });

  // Head
  body
    .circle(0, headCenterY, headRadius)
    .fill({ color: 0xf3d4b5 })
    .stroke({ color: resolved.outlineColor, width: outlineWidth })
    .ellipse(0, headCenterY - headRadius * 0.44, headRadius * 0.9, headRadius * 0.46)
    .fill({ color: 0x111827, alpha: 0.96 })
    .ellipse(0, headCenterY + headRadius * 1.02, headRadius * 0.72, 0.24)
    .fill({ color: 0x0f172a, alpha: 0.16 })
    .ellipse(-headRadius * 0.34, headCenterY - headRadius * 0.28, headRadius * 0.3, headRadius * 0.2)
    .fill({ color: 0xffffff, alpha: 0.22 });
  token.addChild(body);

  const badge = new Graphics();
  badge
    .circle(0, 0, badgeRadius)
    .fill({ color: resolved.badgeColor })
    .stroke({ color: 0x111827, width: 0.86 })
    .circle(0, 0, badgeRadius - 0.28)
    .fill({ color: resolved.badgeColor, alpha: 0.26 })
    .ellipse(0, -badgeRadius * 0.35, badgeRadius * 0.84, badgeRadius * 0.46)
    .fill({ color: 0xffffff, alpha: 0.2 })
    .ellipse(0, badgeRadius * 0.42, badgeRadius * 0.84, badgeRadius * 0.42)
    .fill({ color: 0x020617, alpha: 0.24 })
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
