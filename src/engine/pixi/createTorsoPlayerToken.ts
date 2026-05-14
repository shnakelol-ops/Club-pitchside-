import { Container, FillGradient, Graphics, Text } from "pixi.js";
import {
  resolvePatternDetailTier,
  resolvePatternMarkColor,
  type TokenPatternDetailTier,
} from "./tokenPatternContrast";

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

function getReadableTextColors(backgroundColor: number): {
  fill: number;
  stroke: number;
  shadow: number;
  contrastPlate: number;
} {
  const fill = 0xf8fafc;
  const stroke = mixColor(backgroundColor, 0x020617, 0.66);
  return {
    fill,
    stroke,
    shadow: 0x020617,
    contrastPlate: mixColor(backgroundColor, 0x020617, 0.28),
  };
}

const MICRO_ATHLETE_BODY_WIDTH_SCALE = 0.92;
const MICRO_ATHLETE_HEAD_SCALE = 0.9;
const MICRO_ATHLETE_BADGE_SCALE = 0.9;
const TORSO_TOP_Y = -6.26;
const TORSO_BOTTOM_Y = -0.45;
const TORSO_TOP_LEFT_X = -1.58 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
const TORSO_TOP_RIGHT_X = 1.58 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
const TORSO_BOTTOM_LEFT_X = -0.94 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
const TORSO_BOTTOM_RIGHT_X = 0.94 * MICRO_ATHLETE_BODY_WIDTH_SCALE;

function torsoEdgeX(y: number, topX: number, bottomX: number): number {
  const t = (y - TORSO_TOP_Y) / (TORSO_BOTTOM_Y - TORSO_TOP_Y);
  const clampedT = Math.max(0, Math.min(1, t));
  return topX + (bottomX - topX) * clampedT;
}

function torsoLeftX(y: number): number {
  return torsoEdgeX(y, TORSO_TOP_LEFT_X, TORSO_BOTTOM_LEFT_X);
}

function torsoRightX(y: number): number {
  return torsoEdgeX(y, TORSO_TOP_RIGHT_X, TORSO_BOTTOM_RIGHT_X);
}

function drawTorsoPath(target: Graphics): void {
  target
    .moveTo(TORSO_TOP_LEFT_X, TORSO_TOP_Y)
    .lineTo(TORSO_TOP_RIGHT_X, TORSO_TOP_Y)
    .lineTo(TORSO_BOTTOM_RIGHT_X, TORSO_BOTTOM_Y)
    .lineTo(TORSO_BOTTOM_LEFT_X, TORSO_BOTTOM_Y)
    .closePath();
}

function drawJerseyPattern(
  body: Graphics,
  pattern: MicroAthleteKitPattern,
  color: number,
  detailTier: TokenPatternDetailTier,
): void {
  if (pattern === "plain") return;
  const alpha = detailTier === "tiny" ? 0.7 : detailTier === "small" ? 0.64 : 0.56;
  const width = Math.max(
    0.34,
    (TORSO_TOP_RIGHT_X - TORSO_TOP_LEFT_X) * (detailTier === "tiny" ? 0.085 : detailTier === "small" ? 0.073 : 0.062),
  );
  const top = TORSO_TOP_Y + 0.22;
  const bottom = TORSO_BOTTOM_Y - 0.12;

  if (pattern === "hoops") {
    const yPositions = [top + (bottom - top) * 0.28, top + (bottom - top) * 0.64];
    for (const y of yPositions) {
      body
        .moveTo(torsoLeftX(y) + 0.12, y)
        .lineTo(torsoRightX(y) - 0.12, y);
    }
    body.stroke({ color, width, alpha, cap: "round", join: "round" });
    return;
  }
  if (pattern === "stripes") {
    const topWidth = TORSO_TOP_RIGHT_X - TORSO_TOP_LEFT_X;
    const bottomWidth = TORSO_BOTTOM_RIGHT_X - TORSO_BOTTOM_LEFT_X;
    const stripePositions = detailTier === "tiny" ? [0.3, 0.7] : [0.2, 0.5, 0.8];
    for (const t of stripePositions) {
      const xTop = TORSO_TOP_LEFT_X + topWidth * t;
      const xBottom = TORSO_BOTTOM_LEFT_X + bottomWidth * t;
      body.moveTo(xTop, top).lineTo(xBottom, bottom);
    }
    body.stroke({ color, width, alpha, cap: "round", join: "round" });
    return;
  }
  body
    .moveTo(torsoLeftX(bottom) + 0.14, bottom - 0.05)
    .lineTo(torsoRightX(top) - 0.12, top + 0.16)
    .stroke({ color, width: width * 1.1, alpha, cap: "round", join: "round" });
}

function drawBadgePattern(
  target: Graphics,
  pattern: MicroAthleteKitPattern,
  color: number,
  radius: number,
  detailTier: TokenPatternDetailTier,
): void {
  if (pattern === "plain") return;
  const alpha = detailTier === "tiny" ? 0.72 : detailTier === "small" ? 0.66 : 0.6;
  const width = Math.max(
    0.34,
    radius * (detailTier === "tiny" ? 0.31 : detailTier === "small" ? 0.27 : 0.24),
  );

  if (pattern === "hoops") {
    const yOffset = radius * 0.3;
    target
      .moveTo(-radius * 0.66, -yOffset)
      .lineTo(radius * 0.66, -yOffset)
      .moveTo(-radius * 0.66, yOffset)
      .lineTo(radius * 0.66, yOffset)
      .stroke({ color, width, alpha, cap: "round", join: "round" });
    return;
  }

  if (pattern === "stripes") {
    const stripeOffsets =
      detailTier === "tiny"
        ? [-radius * 0.28, radius * 0.28]
        : [-radius * 0.4, 0, radius * 0.4];
    for (const xOffset of stripeOffsets) {
      target
        .moveTo(xOffset, -radius * 0.66)
        .lineTo(xOffset, radius * 0.66);
    }
    target.stroke({ color, width, alpha, cap: "round", join: "round" });
    return;
  }

  target
    .moveTo(-radius * 0.62, radius * 0.54)
    .lineTo(radius * 0.62, -radius * 0.54)
    .stroke({ color, width: width * 1.08, alpha, cap: "round", join: "round" });
}

export function createTorsoPlayerToken({
  label,
  teamColor,
  style,
  scale,
  lodScale = 5,
  kitPattern = "plain",
  kitPatternColor,
}: {
  label: string;
  teamColor: MicroAthleteTeamColor;
  style?: Partial<MicroAthleteStyle>;
  scale?: number;
  lodScale?: number;
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
  const tokenScale = scale ?? 1;
  token.scale.set(tokenScale);

  const badgeRadius = 3.66 * MICRO_ATHLETE_BADGE_SCALE;
  const detailTier = resolvePatternDetailTier(badgeRadius, tokenScale, lodScale);

  const shadow = new Graphics();
  shadow
    .ellipse(0.54, badgeRadius * 1.28, badgeRadius * 1.72, badgeRadius * 0.72)
    .fill({ color: 0x020617, alpha: 0.05 })
    .ellipse(0.54, badgeRadius * 1.19, badgeRadius * 1.44, badgeRadius * 0.5)
    .fill({ color: 0x020617, alpha: 0.085 })
    .ellipse(0.54, badgeRadius * 1.1, badgeRadius * 1.16, badgeRadius * 0.36)
    .fill({ color: 0x020617, alpha: 0.13 });
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
  const requestedKitPatternColor = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : mixColor(jerseyFill, jerseyFill === 0xffffff ? 0x111827 : 0xffffff, 0.72);
  const resolvedKitPatternColor = resolvePatternMarkColor(jerseyFill, requestedKitPatternColor, 2.35);
  // Subtle arms (kept slim for small-scale readability)
  const armWidth = 0.54 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
  const leftArmX = -2.26 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
  const rightArmX = 1.72 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
  body
    .roundRect(leftArmX, -5.2, armWidth, 3.34, 0.26)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.08), alpha: 0.94 })
    .roundRect(rightArmX, -5.2, armWidth, 3.34, 0.26)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.15), alpha: 0.94 });

  // Torso / jersey (lean upright silhouette with gentle taper)
  drawTorsoPath(body);
  body.fill(torsoGradient);
  drawJerseyPattern(
    body,
    kitPattern,
    resolvedKitPatternColor,
    detailTier,
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
  const headRadius = 0.9 * MICRO_ATHLETE_HEAD_SCALE;
  body
    // Tiny soft back-hair cue for quick female-identifying read.
    .ellipse(-0.7, -6.9, 0.26 * MICRO_ATHLETE_HEAD_SCALE, 0.19 * MICRO_ATHLETE_HEAD_SCALE)
    .fill({ color: hairTone, alpha: 0.29 })
    .ellipse(-0.88, -6.74, 0.14 * MICRO_ATHLETE_HEAD_SCALE, 0.1 * MICRO_ATHLETE_HEAD_SCALE)
    .fill({ color: hairTone, alpha: 0.24 })
    .circle(0.03, -7.16, headRadius)
    .fill({ color: headColor })
    .ellipse(0.03, -7.5, 0.56 * MICRO_ATHLETE_HEAD_SCALE, 0.22 * MICRO_ATHLETE_HEAD_SCALE)
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(-0.1, -7.3, 0.5 * MICRO_ATHLETE_HEAD_SCALE, 0.21 * MICRO_ATHLETE_HEAD_SCALE)
    .fill({ color: 0xffffff, alpha: 0.12 });
  athlete.addChild(body);

  const badgeBaseColor = jerseyFill;
  const labelColors = getReadableTextColors(badgeBaseColor);
  const isNumericLabel = /^\d+$/.test(label.trim());
  const labelFontFamily = isNumericLabel
    ? "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif"
    : "Inter, system-ui, sans-serif";
  const labelBaseY = isNumericLabel ? -0.2 : -0.06;
  const labelFontSize = isNumericLabel ? 4.3 : 3.6;
  const labelFontWeight = isNumericLabel ? "900" : "800";
  const labelLetterSpacing = isNumericLabel ? 0.03 : 0.12;
  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const tokenOuterGlow = new Graphics();
  tokenOuterGlow
    .circle(0, 0, badgeRadius * 1.2)
    .fill({ color: mixColor(badgeBaseColor, 0xffffff, 0.12), alpha: 0.03 })
    .circle(0, 0, badgeRadius * 1.06)
    .fill({ color: mixColor(badgeBaseColor, 0xffffff, 0.08), alpha: 0.04 });
  token.addChild(tokenOuterGlow);

  const badge = new Graphics();
  const badgeFillColor = mixColor(badgeBaseColor, 0xffffff, 0.06);
  const badgeRimColor = mixColor(badgeBaseColor, 0x000000, 0.32);
  const badgePatternColor = resolvePatternMarkColor(badgeFillColor, resolvedKitPatternColor, 2.35);
  badge
    .circle(0, 0, badgeRadius)
    .fill({ color: badgeFillColor })
    .circle(0, 0, badgeRadius)
    .stroke({ color: badgeRimColor, width: 0.18, alpha: 0.36 });
  drawBadgePattern(badge, kitPattern, badgePatternColor, badgeRadius * 0.96, detailTier);
  badge
    .ellipse(0.06, badgeRadius * 0.56, badgeRadius * 0.9, badgeRadius * 0.4)
    .fill({ color: 0x020617, alpha: 0.14 })
    .ellipse(-badgeRadius * 0.18, -badgeRadius * 0.56, badgeRadius * 0.52, badgeRadius * 0.15)
    .fill({ color: 0xffffff, alpha: 0.09 });
  token.addChild(badge);

  if (isNumericLabel) {
    const labelContrastPlate = new Graphics();
    labelContrastPlate
      .roundRect(-1.42 * MICRO_ATHLETE_BADGE_SCALE, -1.44 * MICRO_ATHLETE_BADGE_SCALE, 2.84 * MICRO_ATHLETE_BADGE_SCALE, 1.94 * MICRO_ATHLETE_BADGE_SCALE, 0.58 * MICRO_ATHLETE_BADGE_SCALE)
      .fill({ color: labelColors.contrastPlate, alpha: 0.12 });
    labelContrastPlate.position.y = labelBaseY;
    token.addChild(labelContrastPlate);

    const labelEmbossShadow = new Text({
      text: label,
      style: {
        fill: labelColors.shadow,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily,
        align: "center",
        letterSpacing: labelLetterSpacing,
      },
    });
    labelEmbossShadow.anchor.set(0.5, 0.5);
    labelEmbossShadow.position.y = labelBaseY + 0.08;
    labelEmbossShadow.alpha = 0.2;
    labelEmbossShadow.resolution = textResolution;
    labelEmbossShadow.roundPixels = true;
    token.addChild(labelEmbossShadow);
  }

  const labelText = new Text({
    text: label,
    style: {
      fill: labelColors.fill,
      fontSize: labelFontSize,
      fontWeight: labelFontWeight,
      fontFamily: labelFontFamily,
      align: "center",
      letterSpacing: labelLetterSpacing,
      stroke: {
        color: labelColors.stroke,
        width: isNumericLabel ? 0.62 : 0.5,
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
