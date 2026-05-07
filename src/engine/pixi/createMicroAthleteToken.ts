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
export type MicroAthleteKitPattern = "plain" | "hoops" | "slash" | "stripes";

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

function relativeLuminance(color: number): number {
  const srgb = [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff].map((channel) => {
    const normalized = channel / 255;
    if (normalized <= 0.03928) return normalized / 12.92;
    return ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = srgb;
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function getReadableTextColors(backgroundColor: number): { fill: number; stroke: number } {
  if (relativeLuminance(backgroundColor) >= 0.6) {
    return { fill: 0x0f172a, stroke: 0xffffff };
  }
  return { fill: 0xffffff, stroke: 0x0b1220 };
}

function drawJerseyPattern(body: Graphics, pattern: MicroAthleteKitPattern, color: number): void {
  if (pattern === "plain") return;
  const left = -1.28;
  const right = 1.28;
  const top = -6.02;
  const bottom = -0.66;
  const width = right - left;
  const height = bottom - top;
  const alpha = 0.34;

  if (pattern === "hoops") {
    const bandHeight = 0.78;
    for (let y = top + 0.34; y < bottom; y += 1.3) {
      body.roundRect(left, y, width, bandHeight, 0.18).fill({ color, alpha });
    }
    return;
  }
  if (pattern === "stripes") {
    const stripeWidth = 0.56;
    for (let x = left + 0.15; x < right; x += 0.92) {
      body.roundRect(x, top, stripeWidth, height, 0.16).fill({ color, alpha });
    }
    return;
  }
  body
    .poly([
      left - 0.1,
      top + 0.95,
      left + 0.55,
      top + 0.35,
      right + 0.12,
      bottom - 1.48,
      right - 0.54,
      bottom - 0.86,
    ])
    .fill({ color, alpha: alpha + 0.02 });
}

export function createMicroAthleteToken({
  label,
  teamColor,
  style,
  scale,
  kitPattern = "plain",
  kitPatternColor,
}: {
  label: string;
  teamColor: MicroAthleteTeamColor;
  style?: Partial<MicroAthleteStyle>;
  scale?: number;
  kitPattern?: MicroAthleteKitPattern;
  kitPatternColor?: number;
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
    : resolved.primaryColor;
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
  drawJerseyPattern(
    body,
    kitPattern,
    Number.isFinite(kitPatternColor)
      ? Number(kitPatternColor)
      : mixColor(jerseyFill, jerseyFill === 0xffffff ? 0x111827 : 0xffffff, 0.56),
  );

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

  const badgeBaseColor = resolved.badgeColor;
  const badgeTopColor = mixColor(badgeBaseColor, 0xffffff, 0.38);
  const badgeMidColor = mixColor(badgeBaseColor, resolved.primaryColor, 0.24);
  const badgeBottomColor = mixColor(badgeBaseColor, 0x000000, 0.38);
  const labelColors = getReadableTextColors(badgeBaseColor);
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
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(-badgeRadius * 0.42, -badgeRadius * 0.58, badgeRadius * 0.24, badgeRadius * 0.15)
    .fill({ color: 0xffffff, alpha: 0.32 })
    .ellipse(-badgeRadius * 0.04, -badgeRadius * 0.72, badgeRadius * 0.68, badgeRadius * 0.1)
    .fill({ color: 0xffffff, alpha: 0.2 })
    .ellipse(0, badgeRadius * 0.56, badgeRadius * 0.84, badgeRadius * 0.3)
    .fill({ color: 0x020617, alpha: 0.09 });
  token.addChild(badge);

  const labelText = new Text({
    text: label,
    style: {
      fill: labelColors.fill,
      fontSize: 3.78,
      fontWeight: "900",
      fontFamily: "Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: 0.12,
      stroke: {
        color: labelColors.stroke,
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
