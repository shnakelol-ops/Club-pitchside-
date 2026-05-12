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
    textColor: 0xffffff,
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
    textColor: 0xffffff,
  },
};

const TOKEN_BASE_COLOR = 0x191919;
const TOKEN_RADIUS = 3.66;
const TOKEN_RING_WIDTH = 0.72;
const TOKEN_IDLE_HALO_ALPHA = 0.26;

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

function colorHueDegrees(color: number): number {
  const r = ((color >> 16) & 0xff) / 255;
  const g = ((color >> 8) & 0xff) / 255;
  const b = (color & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta <= 0.0001) return 0;
  if (max === r) {
    return (60 * ((g - b) / delta) + 360) % 360;
  }
  if (max === g) {
    return 60 * ((b - r) / delta) + 120;
  }
  return 60 * ((r - g) / delta) + 240;
}

function colorSaturation(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  if (maxChannel <= 0) return 0;
  return (maxChannel - minChannel) / maxChannel;
}

function resolveBroadcastGlowColor(color: number): number {
  const saturation = colorSaturation(color);
  const hue = colorHueDegrees(color);
  const familyTargetColor =
    saturation < 0.12
      ? 0xdbe7f5 // white/silver family
      : hue >= 45 && hue <= 75
        ? 0xffc34a // warm gold family
        : hue > 75 && hue < 170
          ? 0x2bd886 // emerald family
          : hue >= 245 && hue <= 315
            ? 0x9c6bff // purple family
            : hue >= 170 && hue < 245
              ? 0x31bbff // blue/cyan family
              : 0xff4f4a; // warm red family
  const colourLocked = mixColor(familyTargetColor, color, 0.34);
  const cooledIfNeeded =
    saturation < 0.12
      ? mixColor(colourLocked, 0xffffff, 0.12)
      : mixColor(colourLocked, 0x0b1220, 0.06);
  return cooledIfNeeded;
}

function drawPatternAccent(
  target: Graphics,
  pattern: MicroAthleteKitPattern,
  colour: number,
  radius: number,
): void {
  if (pattern === "plain") return;
  const alpha = 0.09;
  if (pattern === "hoops") {
    target
      .roundRect(-radius * 0.78, -radius * 0.4, radius * 1.56, radius * 0.16, radius * 0.07)
      .fill({ color: colour, alpha })
      .roundRect(-radius * 0.72, -radius * 0.02, radius * 1.44, radius * 0.16, radius * 0.07)
      .fill({ color: colour, alpha: alpha - 0.01 });
    return;
  }
  if (pattern === "stripes") {
    target
      .roundRect(-radius * 0.46, -radius * 0.58, radius * 0.16, radius * 1.18, radius * 0.07)
      .fill({ color: colour, alpha })
      .roundRect(-radius * 0.06, -radius * 0.58, radius * 0.16, radius * 1.18, radius * 0.07)
      .fill({ color: colour, alpha: alpha - 0.01 })
      .roundRect(radius * 0.34, -radius * 0.58, radius * 0.16, radius * 1.18, radius * 0.07)
      .fill({ color: colour, alpha: alpha - 0.02 });
    return;
  }
  target
    .poly([
      -radius * 0.8,
      -radius * 0.2,
      -radius * 0.46,
      -radius * 0.62,
      radius * 0.74,
      radius * 0.36,
      radius * 0.4,
      radius * 0.74,
    ])
    .fill({ color: colour, alpha: alpha + 0.01 });
}

function drawIntegratedCrownNotch(target: Graphics, ringColor: number, outlineColor: number): void {
  const notchY = -TOKEN_RADIUS + TOKEN_RING_WIDTH * 0.56;
  target
    .roundRect(-0.26, notchY, 0.52, 0.12, 0.06)
    .fill({ color: mixColor(ringColor, outlineColor, 0.18), alpha: 0.2 })
    .poly([-0.14, notchY + 0.11, 0, notchY + 0.03, 0.14, notchY + 0.11])
    .fill({ color: mixColor(ringColor, 0xffffff, 0.08), alpha: 0.18 });
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

  const teamBaseColor = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : resolved.primaryColor;
  const glowColor = resolveBroadcastGlowColor(teamBaseColor);
  const ringColor = mixColor(glowColor, 0x0f172a, 0.15);
  const ringInnerShade = mixColor(glowColor, resolved.outlineColor, 0.36);
  const patternTintSource = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : glowColor;
  const patternAccentColor = mixColor(patternTintSource, glowColor, 0.44);
  const innerTintColor = mixColor(TOKEN_BASE_COLOR, glowColor, 0.3);
  const centreColor = mixColor(innerTintColor, glowColor, 0.18);
  const centreHighlightColor = mixColor(centreColor, 0xffffff, 0.31);
  const centreRimColor = mixColor(glowColor, resolved.outlineColor, 0.3);

  const shadow = new Graphics();
  shadow
    .circle(0, 0, TOKEN_RADIUS * 1.56)
    .stroke({ color: glowColor, width: 0.66, alpha: 0.94 })
    .circle(0, 0, TOKEN_RADIUS * 1.34)
    .stroke({ color: glowColor, width: 0.34, alpha: 0.88 })
    .circle(0, 0, TOKEN_RADIUS * 1.16)
    .fill({ color: glowColor, alpha: 0.19 });
  shadow.alpha = TOKEN_IDLE_HALO_ALPHA;
  token.addChild(shadow);

  const baseShadow = new Graphics();
  baseShadow
    .ellipse(0.34, TOKEN_RADIUS * 1.08, TOKEN_RADIUS * 1.2, TOKEN_RADIUS * 0.33)
    .fill({ color: 0x020617, alpha: 0.17 })
    .ellipse(0.34, TOKEN_RADIUS * 1.02, TOKEN_RADIUS * 1.04, TOKEN_RADIUS * 0.24)
    .fill({ color: 0x020617, alpha: 0.12 });
  token.addChild(baseShadow);

  const tokenBase = new Graphics();
  tokenBase
    .circle(0, 0, TOKEN_RADIUS)
    .fill({ color: TOKEN_BASE_COLOR })
    .circle(0, 0, TOKEN_RADIUS - 0.08)
    .stroke({ color: mixColor(TOKEN_BASE_COLOR, 0x000000, 0.3), width: 0.42, alpha: 0.7 })
    .circle(0, 0, TOKEN_RADIUS - 0.2)
    .stroke({ color: ringColor, width: TOKEN_RING_WIDTH, alpha: 0.95 })
    .circle(0, 0, TOKEN_RADIUS - TOKEN_RING_WIDTH - 0.06)
    .stroke({ color: ringInnerShade, width: 0.2, alpha: 0.54 });
  token.addChild(tokenBase);

  const centreRadius = TOKEN_RADIUS - TOKEN_RING_WIDTH - 0.18;
  const centre = new Graphics();
  centre
    .circle(0, 0, centreRadius)
    .fill({ color: centreColor })
    .circle(0, 0, centreRadius * 0.96)
    .fill({ color: innerTintColor, alpha: 0.2 })
    .circle(0, -centreRadius * 0.16, centreRadius * 0.84)
    .fill({ color: centreHighlightColor, alpha: 0.52 })
    .circle(0, 0, centreRadius)
    .stroke({ color: centreRimColor, width: 0.22, alpha: 0.46 })
    .ellipse(-centreRadius * 0.22, -centreRadius * 0.46, centreRadius * 0.54, centreRadius * 0.2)
    .fill({ color: 0xffffff, alpha: 0.16 });
  drawPatternAccent(centre, kitPattern, patternAccentColor, centreRadius);
  token.addChild(centre);

  const notch = new Graphics();
  drawIntegratedCrownNotch(notch, ringColor, resolved.outlineColor);
  token.addChild(notch);

  const orientationTick = new Graphics();
  orientationTick
    .roundRect(-0.09, -TOKEN_RADIUS + TOKEN_RING_WIDTH * 0.44, 0.18, 0.18, 0.08)
    .fill({ color: mixColor(ringColor, 0xffffff, 0.08), alpha: 0.2 });
  token.addChild(orientationTick);

  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumericLabel = /^\d+$/.test(safeLabel);
  const labelBaseY = isNumericLabel ? -0.02 : -0.06;
  const labelFontSize = isNumericLabel
    ? safeLabel.length >= 2 ? 4.3 : 4.9
    : 3.4;
  const labelLetterSpacing = isNumericLabel ? 0.04 : 0.1;
  const labelPlate = new Graphics();
  labelPlate
    .roundRect(-centreRadius * 0.9, -1.02, centreRadius * 1.8, 2.04, 0.58)
    .fill({ color: 0x020617, alpha: 0.24 });
  labelPlate.position.y = labelBaseY;
  token.addChild(labelPlate);

  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const labelShadow = new Text({
    text: safeLabel,
    style: {
      fill: 0x020617,
      fontSize: labelFontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: labelLetterSpacing,
    },
  });
  labelShadow.anchor.set(0.5, 0.5);
  labelShadow.position.y = labelBaseY + 0.1;
  labelShadow.alpha = 0.34;
  labelShadow.resolution = textResolution;
  labelShadow.roundPixels = true;
  token.addChild(labelShadow);

  const labelText = new Text({
    text: safeLabel,
    style: {
      fill: resolved.textColor,
      fontSize: labelFontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: labelLetterSpacing,
      stroke: {
        color: mixColor(resolved.outlineColor, 0x000000, 0.22),
        width: isNumericLabel ? 0.8 : 0.62,
        join: "round",
      },
    },
  });
  labelText.anchor.set(0.5, 0.5);
  labelText.position.y = labelBaseY;
  labelText.resolution = textResolution;
  labelText.roundPixels = true;
  token.addChild(labelText);

  return { token, shadow };
}
