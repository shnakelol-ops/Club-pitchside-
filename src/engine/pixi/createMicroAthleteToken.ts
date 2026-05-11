import { Container, FillGradient, Graphics, Text } from "pixi.js";

export type MicroAthleteStyle = {
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  goalkeeper?: boolean;
};

export type MicroAthleteTokenRenderVariant = "classic-badge" | "jersey-number-no-disc";

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

function contrastRatio(foreground: number, background: number): number {
  const foregroundLum = relativeLuminance(foreground);
  const backgroundLum = relativeLuminance(background);
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function getReadableTextColors(backgroundColor: number): {
  fill: number;
  stroke: number;
  embossShadow: number;
  embossHighlight: number;
  contrastPlate: number;
} {
  const lightFill = 0xf3f5f8;
  const darkFill = 0x152033;
  const fill =
    contrastRatio(lightFill, backgroundColor) >= contrastRatio(darkFill, backgroundColor)
      ? lightFill
      : darkFill;
  const stroke = mixColor(backgroundColor, 0x020617, fill === lightFill ? 0.66 : 0.54);
  return {
    fill,
    stroke,
    embossShadow: mixColor(stroke, 0x020617, 0.24),
    embossHighlight: mixColor(fill, 0xffffff, 0.28),
    contrastPlate: mixColor(backgroundColor, fill === lightFill ? 0xffffff : 0x020617, 0.24),
  };
}

function isWarmJerseyTone(color: number): boolean {
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;
  const isStrongRed = red >= 150 && green <= 120 && blue <= 120;
  const isStrongYellow = red >= 180 && green >= 140 && blue <= 90;
  return isStrongRed || isStrongYellow;
}

const MICRO_ATHLETE_BODY_WIDTH_SCALE = 0.92;
const MICRO_ATHLETE_HEAD_SCALE = 0.9;
const MICRO_ATHLETE_BADGE_SCALE = 0.9;
const TORSO_TOP_Y = -6.12;
const TORSO_BOTTOM_Y = -2.14;
const TORSO_TOP_LEFT_X = -1.64 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
const TORSO_TOP_RIGHT_X = 1.64 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
const TORSO_BOTTOM_LEFT_X = -0.74 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
const TORSO_BOTTOM_RIGHT_X = 0.74 * MICRO_ATHLETE_BODY_WIDTH_SCALE;

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

function drawJerseyPattern(body: Graphics, pattern: MicroAthleteKitPattern, color: number): void {
  if (pattern === "plain") return;
  const alpha = 0.54;
  const top = TORSO_TOP_Y + 0.22;
  const bottom = TORSO_BOTTOM_Y - 0.12;

  if (pattern === "hoops") {
    const bandHeight = 0.82;
    for (let y = top; y < bottom; y += 1.14) {
      const nextY = Math.min(y + bandHeight, bottom);
      const lt = torsoLeftX(y) + 0.06;
      const rt = torsoRightX(y) - 0.06;
      const lb = torsoLeftX(nextY) + 0.06;
      const rb = torsoRightX(nextY) - 0.06;
      body
        .poly([lt, y, rt, y, rb, nextY, lb, nextY])
        .fill({ color, alpha });
    }
    return;
  }
  if (pattern === "stripes") {
    const stripeCount = 3;
    const topWidth = TORSO_TOP_RIGHT_X - TORSO_TOP_LEFT_X;
    const bottomWidth = TORSO_BOTTOM_RIGHT_X - TORSO_BOTTOM_LEFT_X;
    for (let idx = 0; idx < stripeCount; idx += 1) {
      const t0 = 0.08 + idx * 0.29;
      const t1 = Math.min(0.96, t0 + 0.2);
      const xt0 = TORSO_TOP_LEFT_X + topWidth * t0;
      const xt1 = TORSO_TOP_LEFT_X + topWidth * t1;
      const xb0 = TORSO_BOTTOM_LEFT_X + bottomWidth * t0;
      const xb1 = TORSO_BOTTOM_LEFT_X + bottomWidth * t1;
      body
        .poly([
          xt0,
          top,
          xt1,
          top,
          xb1,
          bottom,
          xb0,
          bottom,
        ])
        .fill({ color, alpha });
    }
    return;
  }
  body
    .poly([
      TORSO_TOP_LEFT_X + 0.26,
      TORSO_TOP_Y + 0.72,
      TORSO_TOP_LEFT_X + 1.06,
      TORSO_TOP_Y + 0.3,
      TORSO_BOTTOM_RIGHT_X - 0.06,
      TORSO_BOTTOM_Y - 1.24,
      TORSO_BOTTOM_RIGHT_X - 0.68,
      TORSO_BOTTOM_Y - 0.8,
    ])
    .fill({ color, alpha: alpha + 0.06 })
    .poly([
      TORSO_TOP_LEFT_X + 0.46,
      TORSO_TOP_Y + 0.84,
      TORSO_TOP_LEFT_X + 0.82,
      TORSO_TOP_Y + 0.65,
      TORSO_BOTTOM_RIGHT_X - 0.32,
      TORSO_BOTTOM_Y - 1.1,
      TORSO_BOTTOM_RIGHT_X - 0.6,
      TORSO_BOTTOM_Y - 0.88,
    ])
    .fill({ color: mixColor(color, 0xffffff, 0.3), alpha: 0.16 });
}

function drawBadgePattern(
  target: Graphics,
  pattern: MicroAthleteKitPattern,
  color: number,
  radius: number,
): void {
  if (pattern === "plain") return;
  const alpha = 0.62;

  if (pattern === "hoops") {
    const bandHeight = 0.84;
    for (let y = -radius + 0.34; y < radius - 0.2; y += 1.12) {
      const nextY = Math.min(y + bandHeight, radius - 0.08);
      const topHalfWidth = Math.sqrt(Math.max(0, radius * radius - y * y));
      const bottomHalfWidth = Math.sqrt(Math.max(0, radius * radius - nextY * nextY));
      target
        .poly([
          -topHalfWidth,
          y,
          topHalfWidth,
          y,
          bottomHalfWidth,
          nextY,
          -bottomHalfWidth,
          nextY,
        ])
        .fill({ color, alpha });
    }
    return;
  }

  if (pattern === "stripes") {
    const stripeWidth = 0.88;
    for (let x = -radius + 0.22; x < radius - 0.12; x += 1.18) {
      const nextX = Math.min(x + stripeWidth, radius - 0.06);
      const leftHalfHeight = Math.sqrt(Math.max(0, radius * radius - x * x));
      const rightHalfHeight = Math.sqrt(Math.max(0, radius * radius - nextX * nextX));
      target
        .poly([
          x,
          -leftHalfHeight,
          nextX,
          -rightHalfHeight,
          nextX,
          rightHalfHeight,
          x,
          leftHalfHeight,
        ])
        .fill({ color, alpha });
    }
    return;
  }

  target
    .poly([
      -radius * 0.78,
      -radius * 0.3,
      -radius * 0.42,
      -radius * 0.78,
      radius * 0.74,
      radius * 0.38,
      radius * 0.38,
      radius * 0.82,
    ])
    .fill({ color, alpha: alpha + 0.08 })
    .poly([
      -radius * 0.56,
      -radius * 0.24,
      -radius * 0.36,
      -radius * 0.46,
      radius * 0.52,
      radius * 0.5,
      radius * 0.3,
      radius * 0.7,
    ])
    .fill({ color: mixColor(color, 0xffffff, 0.22), alpha: 0.1 });
}

export function createMicroAthleteToken({
  label,
  teamColor,
  style,
  scale,
  kitPattern = "plain",
  kitPatternColor,
  nameplateLabel,
  showNameplate = false,
  renderVariant = "classic-badge",
}: {
  label: string;
  teamColor: MicroAthleteTeamColor;
  style?: Partial<MicroAthleteStyle>;
  scale?: number;
  kitPattern?: MicroAthleteKitPattern;
  kitPatternColor?: number;
  nameplateLabel?: string;
  showNameplate?: boolean;
  renderVariant?: MicroAthleteTokenRenderVariant;
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

  const badgeRadius = 3.66 * MICRO_ATHLETE_BADGE_SCALE;
  const useClassicBadge = renderVariant === "classic-badge";

  const shadow = new Graphics();
  const shadowScale = useClassicBadge ? 1 : 0.78;
  shadow
    .ellipse(0.48, badgeRadius * 1.26, badgeRadius * 1.72 * shadowScale, badgeRadius * 0.72 * shadowScale)
    .fill({ color: 0x020617, alpha: 0.05 })
    .ellipse(0.48, badgeRadius * 1.17, badgeRadius * 1.44 * shadowScale, badgeRadius * 0.5 * shadowScale)
    .fill({ color: 0x020617, alpha: 0.085 })
    .ellipse(0.48, badgeRadius * 1.08, badgeRadius * 1.16 * shadowScale, badgeRadius * 0.36 * shadowScale)
    .fill({ color: 0x020617, alpha: 0.13 });
  token.addChild(shadow);

  const athlete = new Container();
  athlete.rotation = -0.038;
  athlete.position.set(0.14, -0.1);
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
  const resolvedKitPatternColor = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : mixColor(jerseyFill, jerseyFill === 0xffffff ? 0x111827 : 0xffffff, 0.72);
  // Subtle arms (kept slim for small-scale readability)
  const armWidth = 0.38 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
  const leftArmX = -2.02 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
  const rightArmX = 1.64 * MICRO_ATHLETE_BODY_WIDTH_SCALE;
  body
    .roundRect(leftArmX, -5.2, armWidth, 2.3, 0.29)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.1), alpha: 0.95 })
    .roundRect(rightArmX, -5.2, armWidth, 2.3, 0.29)
    .fill({ color: mixColor(jerseyFill, 0x000000, 0.16), alpha: 0.95 })
    .circle(leftArmX + armWidth * 0.5, -2.8, 0.16)
    .fill({ color: 0xf1ccb2, alpha: 0.92 })
    .circle(rightArmX + armWidth * 0.5, -2.8, 0.16)
    .fill({ color: 0xf1ccb2, alpha: 0.92 });

  // Torso / jersey (lean upright silhouette with gentle taper)
  drawTorsoPath(body);
  body.fill(torsoGradient);
  drawTorsoPath(body);
  body.stroke({ color: mixColor(jerseyFill, 0x020617, 0.58), width: 0.11, alpha: 0.34, join: "round" });
  drawJerseyPattern(
    body,
    kitPattern,
    resolvedKitPatternColor,
  );

  // Internal polish without thick cartoon outlines.
  body
    .roundRect(-0.31, -6.48, 0.62, 0.44, 0.14)
    .fill({ color: mixColor(jerseyFill, 0xffffff, 0.18), alpha: 0.9 })
    .ellipse(0.3, -3.98, 0.54, 1.34)
    .fill({ color: 0x020617, alpha: 0.13 })
    .ellipse(-0.22, -5.02, 0.48, 0.24)
    .fill({ color: 0xffffff, alpha: 0.13 })
    .roundRect(-1.32, -5.96, 2.64, 0.2, 0.08)
    .fill({ color: mixColor(jerseyFill, 0xffffff, 0.3), alpha: 0.26 });
  body
    .moveTo(-1.08, -2.16)
    .lineTo(1.08, -2.16)
    .stroke({ color: mixColor(jerseyFill, 0x020617, 0.72), width: 0.17, alpha: 0.58 });

  // Shorts + subtle legs
  body
    .roundRect(-0.94, -2.02, 1.88, 1.26, 0.3)
    .fill({ color: mixColor(jerseyFill, 0x020617, 0.58), alpha: 0.97 })
    .roundRect(-0.9, -1.96, 1.8, 0.14, 0.06)
    .fill({ color: 0xffffff, alpha: 0.08 })
    .roundRect(-0.76, -0.78, 0.52, 1.72, 0.24)
    .fill({ color: 0x334155, alpha: 0.95 })
    .roundRect(0.24, -0.74, 0.52, 1.66, 0.24)
    .fill({ color: 0x334155, alpha: 0.95 })
    .roundRect(-0.76, 0.36, 0.52, 0.48, 0.14)
    .fill({ color: 0xe2e8f0, alpha: 0.95 })
    .roundRect(0.24, 0.32, 0.52, 0.48, 0.14)
    .fill({ color: 0xe2e8f0, alpha: 0.95 })
    .roundRect(-0.82, 0.84, 0.66, 0.18, 0.1)
    .fill({ color: 0x0f172a, alpha: 0.9 })
    .roundRect(0.18, 0.82, 0.66, 0.18, 0.1)
    .fill({ color: 0x0f172a, alpha: 0.9 });
  body
    .roundRect(-0.94, -2.02, 1.88, 1.26, 0.3)
    .stroke({ color: 0x020617, width: 0.1, alpha: 0.32, join: "round" });

  // Simplified head shape for tactical readability (no facial details).
  const headColor = 0xddb392;
  const headRadius = 0.82 * MICRO_ATHLETE_HEAD_SCALE;
  body
    .circle(0.03, -6.94, headRadius)
    .fill({ color: headColor })
    .stroke({ color: 0x111827, width: 0.08, alpha: 0.3 })
    .roundRect(-0.52, -7.48, 1.1, 0.26, 0.13)
    .fill({ color: 0x1f2937, alpha: 0.78 })
    .ellipse(0.03, -7.02, 0.44, 0.14)
    .fill({ color: 0xffffff, alpha: 0.08 });
  athlete.addChild(body);

  const badgeBaseColor = jerseyFill;
  const labelSurfaceColor = useClassicBadge ? badgeBaseColor : jerseyFill;
  const labelColors = getReadableTextColors(labelSurfaceColor);
  const noDiscWarmJersey = !useClassicBadge && isWarmJerseyTone(labelSurfaceColor);
  const noDiscFill = contrastRatio(0xf8fafc, labelSurfaceColor) >= contrastRatio(0x0b1220, labelSurfaceColor)
    ? 0xf8fafc
    : 0x0b1220;
  const noDiscStroke = mixColor(
    labelSurfaceColor,
    noDiscFill === 0xf8fafc ? 0x020617 : 0xffffff,
    noDiscWarmJersey ? 0.78 : 0.7,
  );
  const labelColorPalette = useClassicBadge
    ? labelColors
    : {
        fill: noDiscFill,
        stroke: noDiscStroke,
        embossShadow: mixColor(noDiscStroke, 0x020617, 0.42),
        embossHighlight: mixColor(noDiscFill, 0xffffff, 0.2),
        contrastPlate: mixColor(
          labelSurfaceColor,
          noDiscFill === 0xf8fafc ? 0x020617 : 0xffffff,
          noDiscWarmJersey ? 0.66 : 0.58,
        ),
      };
  const isNumericLabel = /^\d+$/.test(label.trim());
  const isDoubleDigitLabel = /^\d{2,}$/.test(label.trim());
  const labelFontFamily = isNumericLabel
    ? "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif"
    : "Inter, system-ui, sans-serif";
  const labelBaseY = useClassicBadge ? (isNumericLabel ? -0.2 : -0.06) : (isNumericLabel ? -3.34 : -3.18);
  const labelFontSize = useClassicBadge ? (isNumericLabel ? 4.3 : 3.6) : (isNumericLabel ? 2.14 : 2.66);
  const labelFontWeight = isNumericLabel ? "900" : "800";
  const labelLetterSpacing = useClassicBadge ? (isNumericLabel ? 0.03 : 0.12) : (isNumericLabel ? 0.02 : 0.08);
  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const labelContainer = useClassicBadge ? token : athlete;
  if (useClassicBadge) {
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
    badge
      .circle(0, 0, badgeRadius)
      .fill({ color: badgeFillColor })
      .circle(0, 0, badgeRadius)
      .stroke({ color: badgeRimColor, width: 0.18, alpha: 0.36 });
    drawBadgePattern(badge, kitPattern, resolvedKitPatternColor, badgeRadius * 0.96);
    badge
      .ellipse(0.06, badgeRadius * 0.56, badgeRadius * 0.9, badgeRadius * 0.4)
      .fill({ color: 0x020617, alpha: 0.14 })
      .ellipse(-badgeRadius * 0.18, -badgeRadius * 0.56, badgeRadius * 0.52, badgeRadius * 0.15)
      .fill({ color: 0xffffff, alpha: 0.09 });
    token.addChild(badge);
  }

  if (isNumericLabel) {
    const labelContrastPlate = new Graphics();
    if (useClassicBadge) {
      labelContrastPlate
        .roundRect(
          -1.42 * MICRO_ATHLETE_BADGE_SCALE,
          -1.44 * MICRO_ATHLETE_BADGE_SCALE,
          2.84 * MICRO_ATHLETE_BADGE_SCALE,
          1.94 * MICRO_ATHLETE_BADGE_SCALE,
          0.58 * MICRO_ATHLETE_BADGE_SCALE,
        )
        .fill({ color: labelColorPalette.contrastPlate, alpha: 0.12 });
    } else {
      labelContrastPlate
        .roundRect(-0.86, -0.56, 1.72, 1.12, 0.3)
        .fill({ color: labelColorPalette.contrastPlate, alpha: noDiscWarmJersey ? 0.42 : 0.34 })
        .stroke({
          color: mixColor(labelSurfaceColor, labelColorPalette.fill === 0xf8fafc ? 0x020617 : 0xffffff, 0.68),
          alpha: noDiscWarmJersey ? 0.24 : 0.2,
          width: 0.09,
          join: "round",
        });
    }
    labelContrastPlate.position.y = labelBaseY;
    labelContainer.addChild(labelContrastPlate);

    const labelEmbossShadow = new Text({
      text: label,
      style: {
        fill: labelColorPalette.embossShadow,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily,
        align: "center",
        letterSpacing: labelLetterSpacing,
      },
    });
    labelEmbossShadow.anchor.set(0.5, 0.5);
    labelEmbossShadow.position.y = labelBaseY + 0.08;
    labelEmbossShadow.alpha = useClassicBadge ? 0.2 : 0.24;
    labelEmbossShadow.resolution = textResolution;
    labelEmbossShadow.roundPixels = true;
    labelContainer.addChild(labelEmbossShadow);
  }

  const labelText = new Text({
    text: label,
    style: {
      fill: labelColorPalette.fill,
      fontSize: labelFontSize,
      fontWeight: labelFontWeight,
      fontFamily: labelFontFamily,
      align: "center",
      letterSpacing: labelLetterSpacing,
      stroke: {
        color: labelColorPalette.stroke,
        width: isNumericLabel ? (useClassicBadge ? 0.56 : 0.5) : (useClassicBadge ? 0.47 : 0.58),
        join: "round",
      },
    },
  });
  labelText.anchor.set(0.5, 0.5);
  labelText.position.y = labelBaseY;
  labelText.resolution = textResolution;
  labelText.roundPixels = true;
  labelContainer.addChild(labelText);

  if (isNumericLabel) {
    const labelEmbossHighlight = new Text({
      text: label,
      style: {
        fill: labelColorPalette.embossHighlight,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily,
        align: "center",
        letterSpacing: labelLetterSpacing,
      },
    });
    labelEmbossHighlight.anchor.set(0.5, 0.5);
    labelEmbossHighlight.position.y = labelBaseY - 0.06;
    labelEmbossHighlight.alpha = useClassicBadge ? 0.14 : 0.11;
    labelEmbossHighlight.resolution = textResolution;
    labelEmbossHighlight.roundPixels = true;
    labelContainer.addChild(labelEmbossHighlight);
  }

  if (!useClassicBadge && isNumericLabel) {
    const markerWidth = isDoubleDigitLabel ? 2.46 : 2.16;
    const markerY = 1.46;
    const footContactShadow = new Graphics();
    footContactShadow
      .ellipse(-0.32, markerY - 0.42, 0.26, 0.08)
      .fill({ color: 0x020617, alpha: 0.17 })
      .ellipse(0.32, markerY - 0.42, 0.26, 0.08)
      .fill({ color: 0x020617, alpha: 0.17 })
      .ellipse(0, markerY - 0.32, 0.4, 0.06)
      .fill({ color: 0x020617, alpha: 0.08 });
    token.addChild(footContactShadow);

    const groundedMarkerShadow = new Graphics();
    groundedMarkerShadow
      .ellipse(0, markerY + 0.28, markerWidth * 0.56, 0.26)
      .fill({ color: 0x020617, alpha: 0.22 });
    token.addChild(groundedMarkerShadow);

    const groundedMarker = new Graphics();
    groundedMarker
      .ellipse(0, markerY, markerWidth * 0.5, 0.44)
      .fill({ color: 0x0f172a, alpha: 0.58 })
      .ellipse(0, markerY - 0.05, markerWidth * 0.42, 0.32)
      .fill({ color: 0x1e293b, alpha: 0.34 })
      .stroke({
        color: 0xf8fafc,
        alpha: 0.12,
        width: 0.08,
      })
      .ellipse(0, markerY - 0.18, markerWidth * 0.22, 0.09)
      .fill({ color: 0xffffff, alpha: 0.1 });
    token.addChild(groundedMarker);

    const groundedNumberShadow = new Text({
      text: label,
      style: {
        fill: 0x020617,
        fontSize: isDoubleDigitLabel ? 1.58 : 1.72,
        fontWeight: "900",
        fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
        align: "center",
        letterSpacing: isDoubleDigitLabel ? 0.015 : 0.025,
      },
    });
    groundedNumberShadow.anchor.set(0.5, 0.5);
    groundedNumberShadow.position.set(0, markerY + 0.05);
    groundedNumberShadow.alpha = 0.34;
    groundedNumberShadow.resolution = textResolution;
    groundedNumberShadow.roundPixels = true;
    token.addChild(groundedNumberShadow);

    const groundedNumberText = new Text({
      text: label,
      style: {
        fill: 0xf8fafc,
        fontSize: isDoubleDigitLabel ? 1.58 : 1.72,
        fontWeight: "900",
        fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
        align: "center",
        letterSpacing: isDoubleDigitLabel ? 0.015 : 0.025,
        stroke: {
          color: 0x020617,
          width: 0.2,
          join: "round",
        },
      },
    });
    groundedNumberText.anchor.set(0.5, 0.5);
    groundedNumberText.position.set(0, markerY);
    groundedNumberText.resolution = textResolution;
    groundedNumberText.roundPixels = true;
    token.addChild(groundedNumberText);
  }

  const sanitizedNameplate = typeof nameplateLabel === "string"
    ? nameplateLabel.trim().toUpperCase().replace(/\s+/g, " ").slice(0, 10)
    : "";
  if (!useClassicBadge && showNameplate && sanitizedNameplate.length > 0) {
    const nameplateWidth = Math.min(4.8, Math.max(2.2, 1.36 + sanitizedNameplate.length * 0.32));
    const nameplate = new Graphics();
    nameplate
      .roundRect(-nameplateWidth * 0.5, 0, nameplateWidth, 0.74, 0.2)
      .fill({ color: 0x030712, alpha: 0.58 })
      .stroke({ color: 0xe2e8f0, alpha: 0.1, width: 0.06, join: "round" });
    nameplate.position.y = 3.06;
    token.addChild(nameplate);

    const nameplateText = new Text({
      text: sanitizedNameplate,
      style: {
        fill: 0xf8fafc,
        fontSize: 0.62,
        fontWeight: "700",
        fontFamily: "Inter, system-ui, sans-serif",
        align: "center",
        letterSpacing: 0.06,
      },
    });
    nameplateText.anchor.set(0.5, 0.5);
    nameplateText.position.set(0, 3.42);
    nameplateText.alpha = 0.9;
    nameplateText.resolution = textResolution;
    nameplateText.roundPixels = true;
    token.addChild(nameplateText);
  }

  return { token, shadow };
}
