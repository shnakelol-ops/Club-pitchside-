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
const TOKEN_RADIUS = 3.52;
const TOKEN_RING_WIDTH = 0.66;
const TOKEN_IDLE_HALO_ALPHA = 0.24;

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

function resolvePatternColor(baseColor: number, patternColor?: number): number {
  if (Number.isFinite(patternColor)) return Number(patternColor);
  const fallbackTarget = baseColor === 0xffffff ? 0x111827 : 0xffffff;
  return mixColor(baseColor, fallbackTarget, 0.72);
}

function drawPatternCuts(
  target: Graphics,
  pattern: MicroAthleteKitPattern | "split",
  cutColour: number,
  ringRadius: number,
  ringWidth: number,
): void {
  if (pattern === "plain") return;
  const cutStrokeWidth = Math.max(0.14, ringWidth * 0.5);
  if (pattern === "hoops") {
    const yTop = -ringRadius * 0.48;
    const yBottom = ringRadius * 0.48;
    const topHalf = Math.sqrt(Math.max(0, ringRadius * ringRadius - yTop * yTop));
    const bottomHalf = Math.sqrt(Math.max(0, ringRadius * ringRadius - yBottom * yBottom));
    target
      .moveTo(-topHalf, yTop)
      .lineTo(topHalf, yTop)
      .stroke({ color: cutColour, width: cutStrokeWidth, cap: "round", join: "round", alignment: 0.5 })
      .moveTo(-bottomHalf, yBottom)
      .lineTo(bottomHalf, yBottom)
      .stroke({ color: cutColour, width: cutStrokeWidth, cap: "round", join: "round", alignment: 0.5 });
    return;
  }
  if (pattern === "stripes") {
    const xLeft = -ringRadius * 0.48;
    const xRight = ringRadius * 0.48;
    const leftHalf = Math.sqrt(Math.max(0, ringRadius * ringRadius - xLeft * xLeft));
    const rightHalf = Math.sqrt(Math.max(0, ringRadius * ringRadius - xRight * xRight));
    target
      .moveTo(xLeft, -leftHalf)
      .lineTo(xLeft, leftHalf)
      .stroke({ color: cutColour, width: cutStrokeWidth, cap: "round", join: "round", alignment: 0.5 })
      .moveTo(xRight, -rightHalf)
      .lineTo(xRight, rightHalf)
      .stroke({ color: cutColour, width: cutStrokeWidth, cap: "round", join: "round", alignment: 0.5 });
    return;
  }
  if (pattern === "slash") {
    const x0 = -ringRadius * 0.84;
    const y0 = -ringRadius * 0.62;
    const x1 = ringRadius * 0.84;
    const y1 = ringRadius * 0.62;
    target
      .moveTo(x0, y0)
      .lineTo(x1, y1)
      .stroke({ color: cutColour, width: cutStrokeWidth, cap: "round", join: "round", alignment: 0.5 });
    return;
  }
  // Optional future "split" variant support (not currently exposed in UI).
  target
    .moveTo(-ringRadius * 0.9, -ringRadius * 0.2)
    .lineTo(-ringRadius * 0.08, -ringRadius * 0.66)
    .lineTo(-ringRadius * 0.08, ringRadius * 0.66)
    .lineTo(-ringRadius * 0.9, ringRadius * 0.2)
    .closePath()
    .fill({ color: cutColour, alpha: 1 });
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
  const patternColor = resolvePatternColor(teamBaseColor, kitPatternColor);
  const usesPatternIdentity = kitPattern !== "plain";
  const ringColor = patternColor;
  const ringInnerShade = mixColor(teamBaseColor, resolved.outlineColor, 0.34);
  const innerTintColor = mixColor(TOKEN_BASE_COLOR, teamBaseColor, 0.34);
  const centreColor = mixColor(innerTintColor, teamBaseColor, 0.2);
  const centreHighlightColor = mixColor(centreColor, 0xffffff, 0.31);
  const centreRimColor = mixColor(teamBaseColor, resolved.outlineColor, 0.29);
  const glowColor = mixColor(patternColor, 0xffffff, 0.08);

  const shadow = new Graphics();
  shadow
    .circle(0, 0, TOKEN_RADIUS * 1.08)
    .fill({ color: 0x020617, alpha: 0.15 })
    .circle(0, 0, TOKEN_RADIUS * 1.04)
    .stroke({ color: glowColor, width: 0.22, alpha: usesPatternIdentity ? 0.38 : 0.28 })
    .circle(0, 0, TOKEN_RADIUS * 0.94)
    .fill({ color: glowColor, alpha: usesPatternIdentity ? 0.06 : 0.04 });
  shadow.alpha = TOKEN_IDLE_HALO_ALPHA;
  token.addChild(shadow);

  const baseShadow = new Graphics();
  baseShadow
    .ellipse(0.3, TOKEN_RADIUS * 1.03, TOKEN_RADIUS * 1.08, TOKEN_RADIUS * 0.29)
    .fill({ color: 0x020617, alpha: 0.17 })
    .ellipse(0.3, TOKEN_RADIUS * 0.98, TOKEN_RADIUS * 0.95, TOKEN_RADIUS * 0.21)
    .fill({ color: 0x020617, alpha: 0.12 });
  token.addChild(baseShadow);

  const tokenBase = new Graphics();
  tokenBase
    .circle(0, 0, TOKEN_RADIUS)
    .fill({ color: TOKEN_BASE_COLOR })
    .circle(0, 0, TOKEN_RADIUS - 0.08)
    .stroke({ color: mixColor(TOKEN_BASE_COLOR, 0x000000, 0.3), width: 0.42, alpha: 0.7 })
    .circle(0, 0, TOKEN_RADIUS - 0.2)
    .stroke({ color: ringColor, width: TOKEN_RING_WIDTH, alpha: 0.96 })
    .circle(0, 0, TOKEN_RADIUS - TOKEN_RING_WIDTH - 0.06)
    .stroke({ color: ringInnerShade, width: 0.2, alpha: 0.54 });
  token.addChild(tokenBase);

  const centreRadius = TOKEN_RADIUS - TOKEN_RING_WIDTH - 0.18;
  const ringRadius = TOKEN_RADIUS - TOKEN_RING_WIDTH * 0.52;
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
  token.addChild(centre);

  const accentLayer = new Graphics();
  drawPatternCuts(
    accentLayer,
    kitPattern,
    centreColor,
    ringRadius,
    TOKEN_RING_WIDTH,
  );
  token.addChild(accentLayer);

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
