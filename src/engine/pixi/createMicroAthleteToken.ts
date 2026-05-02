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
    .ellipse(0.48, badgeRadius * 1.26, badgeRadius * 1.58, badgeRadius * 0.82)
    .fill({ color: 0x020617, alpha: 0.08 })
    .ellipse(0.48, badgeRadius * 1.18, badgeRadius * 1.3, badgeRadius * 0.62)
    .fill({ color: 0x020617, alpha: 0.14 })
    .ellipse(0.48, badgeRadius * 1.1, badgeRadius * 1.04, badgeRadius * 0.46)
    .fill({ color: 0x020617, alpha: 0.2 });
  token.addChild(shadow);

  const athlete = new Container();
  athlete.rotation = -0.092;
  athlete.position.set(0.16, -0.52);
  token.addChild(athlete);

  const jerseyFill = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : resolved.primaryColor;
  const torsoTop = mixColor(jerseyFill, 0xffffff, 0.22);
  const torsoBottom = mixColor(jerseyFill, 0x000000, 0.24);
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
    .roundRect(-2.54, -4.92, 0.62, 3.02, 0.28)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.08), alpha: 0.94 })
    .roundRect(1.92, -4.92, 0.62, 3.02, 0.28)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.15), alpha: 0.94 });

  // Torso / jersey (lean upright silhouette with gentle taper)
  body
    .moveTo(-1.8, -5.96)
    .lineTo(1.8, -5.96)
    .lineTo(1.12, -0.62)
    .lineTo(-1.12, -0.62)
    .closePath()
    .fill(torsoGradient);

  // Internal polish without thick cartoon outlines.
  body
    .ellipse(0.54, -2.46, 0.96, 2.24)
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(-0.46, -4.82, 0.84, 0.42)
    .fill({ color: 0xffffff, alpha: 0.17 })
    .roundRect(-0.86, -1.26, 1.72, 0.82, 0.38)
    .fill({ color: 0x020617, alpha: 0.11 });

  // Shorts + subtle legs
  body
    .roundRect(-1.04, -0.94, 2.08, 0.72, 0.24)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.3), alpha: 0.9 })
    .roundRect(-0.9, -0.2, 0.66, 2.12, 0.28)
    .fill({ color: 0x334155, alpha: 0.92 })
    .roundRect(0.24, -0.2, 0.66, 2.12, 0.28)
    .fill({ color: 0x334155, alpha: 0.92 });

  // Head (small and clean: no facial details).
  body
    .circle(0.03, -7.04, 0.98)
    .fill({ color: 0xf2cfad })
    .ellipse(0.03, -7.4, 0.62, 0.24)
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(-0.1, -7.24, 0.56, 0.24)
    .fill({ color: 0xffffff, alpha: 0.12 });
  athlete.addChild(body);

  const badgeBaseColor = resolved.badgeColor;
  const badgeTopColor = mixColor(badgeBaseColor, 0xffffff, 0.34);
  const badgeMidColor = mixColor(badgeBaseColor, resolved.primaryColor, 0.24);
  const badgeBottomColor = mixColor(badgeBaseColor, 0x000000, 0.34);
  const tokenOuterGlow = new Graphics();
  tokenOuterGlow
    .circle(0, 0, badgeRadius * 1.2)
    .fill({ color: mixColor(resolved.primaryColor, 0xffffff, 0.14), alpha: 0.05 })
    .circle(0, 0, badgeRadius * 1.06)
    .fill({ color: mixColor(resolved.primaryColor, 0xffffff, 0.1), alpha: 0.06 });
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
    .fill({ color: 0x020617, alpha: 0.15 })
    .ellipse(-badgeRadius * 0.42, -badgeRadius * 0.58, badgeRadius * 0.28, badgeRadius * 0.18)
    .fill({ color: 0xffffff, alpha: 0.3 })
    .ellipse(-badgeRadius * 0.04, -badgeRadius * 0.72, badgeRadius * 0.68, badgeRadius * 0.1)
    .fill({ color: 0xffffff, alpha: 0.2 })
    .ellipse(0, badgeRadius * 0.56, badgeRadius * 0.84, badgeRadius * 0.3)
    .fill({ color: 0x020617, alpha: 0.09 });
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
        width: 0.34,
        join: "round",
      },
      dropShadow: {
        color: 0x020617,
        alpha: 0.34,
        blur: 1,
        distance: 0.18,
        angle: Math.PI / 2,
      },
    },
  });
  labelText.anchor.set(0.5, 0.53);
  labelText.position.y = 0.06;
  token.addChild(labelText);

  return { token, shadow };
}
