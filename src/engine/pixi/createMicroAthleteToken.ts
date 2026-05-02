import { Container, FillGradient, Graphics, Text } from "pixi.js";

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

  const badgeRadius = 3.66;

  const shadow = new Graphics();
  shadow
    .ellipse(0.58, badgeRadius * 1.24, badgeRadius * 1.22, badgeRadius * 0.52)
    .fill({ color: 0x020617, alpha: 0.12 })
    .ellipse(0.58, badgeRadius * 1.12, badgeRadius * 1.02, badgeRadius * 0.38)
    .fill({ color: 0x020617, alpha: 0.2 });
  token.addChild(shadow);

  const athlete = new Container();
  athlete.rotation = -0.11;
  athlete.position.set(0.14, 0.14);
  token.addChild(athlete);

  const jerseyFill = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : resolved.primaryColor;
  const torsoTop = mixColor(jerseyFill, 0xffffff, 0.2);
  const torsoBottom = mixColor(jerseyFill, 0x000000, 0.2);
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
  // Arms (slim profile)
  body
    .roundRect(-3.14, -4.78, 0.82, 3.28, 0.36)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.06), alpha: 0.98 })
    .roundRect(2.32, -4.78, 0.82, 3.28, 0.36)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.12), alpha: 0.98 });

  // Torso / jersey (lean tapered silhouette)
  body
    .moveTo(-2.18, -6.02)
    .lineTo(2.18, -6.02)
    .lineTo(1.54, 0.16)
    .lineTo(-1.54, 0.16)
    .closePath()
    .fill(torsoGradient);

  // Internal shading + highlight for depth without heavy outline.
  body
    .ellipse(0.72, -2.26, 1.18, 2.48)
    .fill({ color: 0x020617, alpha: 0.14 })
    .ellipse(-0.58, -4.72, 1.02, 0.48)
    .fill({ color: 0xffffff, alpha: 0.18 })
    .roundRect(-1.08, -1.06, 2.16, 1.36, 0.56)
    .fill({ color: 0x020617, alpha: 0.08 });

  // Legs (narrower and slightly taller)
  body
    .roundRect(-1.26, -0.42, 0.92, 2.94, 0.36)
    .fill({ color: 0x334155, alpha: 0.95 })
    .roundRect(0.34, -0.42, 0.92, 2.94, 0.36)
    .fill({ color: 0x334155, alpha: 0.95 });

  // Head (smaller, closer to torso, no facial details)
  body
    .circle(0.02, -6.86, 1.1)
    .fill({ color: 0xf2cfad })
    .ellipse(0.08, -7.18, 0.76, 0.34)
    .fill({ color: 0xffffff, alpha: 0.14 });
  athlete.addChild(body);

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
