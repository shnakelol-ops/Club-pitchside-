import { Container, Graphics, Text } from "pixi.js";
import { resolvePatternMarkColor } from "./tokenPatternContrast";

export type PremiumGlowPlayerTokenStyle = {
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  goalkeeper?: boolean;
};

export type PremiumGlowTeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
export type PremiumGlowKitPattern = "plain" | "hoops" | "slash" | "stripes";

const DEFAULT_STYLE_BY_TEAM: Record<PremiumGlowTeamColor, PremiumGlowPlayerTokenStyle> = {
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
const TOKEN_IDLE_HALO_ALPHA = 0.2;

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

function luminance(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function vividGlowColor(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const chroma = maxChannel - minChannel;
  if (maxChannel <= 0 || chroma < 20) {
    return mixColor(color, 0xffffff, 0.14);
  }
  const boostScale = 255 / maxChannel;
  const boostedColor =
    (clampColorChannel(r * boostScale) << 16) |
    (clampColorChannel(g * boostScale) << 8) |
    clampColorChannel(b * boostScale);
  return mixColor(boostedColor, color, 0.28);
}

function drawIntegratedCrownNotch(
  target: Graphics,
  ringColor: number,
  outlineColor: number,
  tokenRadius: number,
  ringWidth: number,
): void {
  const notchY = -tokenRadius + ringWidth * 0.5;
  const notchWidth = Math.max(0.34, tokenRadius * 0.15);
  const notchHeight = Math.max(0.09, tokenRadius * 0.04);
  target
    .roundRect(-notchWidth * 0.5, notchY, notchWidth, notchHeight, notchHeight * 0.5)
    .fill({ color: mixColor(ringColor, outlineColor, 0.18), alpha: 0.2 })
    .poly([
      -notchWidth * 0.26,
      notchY + notchHeight * 0.92,
      0,
      notchY + notchHeight * 0.24,
      notchWidth * 0.26,
      notchY + notchHeight * 0.92,
    ])
    .fill({ color: mixColor(ringColor, 0xffffff, 0.08), alpha: 0.18 });
}

function drawGlowPatternMarks(
  target: Graphics,
  pattern: PremiumGlowKitPattern,
  markColor: number,
  centerRadius: number,
): void {
  if (pattern === "plain") return;
  const strokeWidth = Math.max(0.28, centerRadius * 0.24);
  const alpha = 0.62;

  if (pattern === "hoops") {
    const yOffset = centerRadius * 0.3;
    target
      .moveTo(-centerRadius * 0.62, -yOffset)
      .lineTo(centerRadius * 0.62, -yOffset)
      .moveTo(-centerRadius * 0.62, yOffset)
      .lineTo(centerRadius * 0.62, yOffset)
      .stroke({ color: markColor, width: strokeWidth, alpha, cap: "round", join: "round" });
    return;
  }

  if (pattern === "stripes") {
    const xOffset = centerRadius * 0.28;
    target
      .moveTo(-xOffset, -centerRadius * 0.64)
      .lineTo(-xOffset, centerRadius * 0.64)
      .moveTo(xOffset, -centerRadius * 0.64)
      .lineTo(xOffset, centerRadius * 0.64)
      .stroke({ color: markColor, width: strokeWidth, alpha, cap: "round", join: "round" });
    return;
  }

  target
    .moveTo(-centerRadius * 0.6, centerRadius * 0.5)
    .lineTo(centerRadius * 0.6, -centerRadius * 0.5)
    .stroke({ color: markColor, width: strokeWidth * 1.04, alpha, cap: "round", join: "round" });
}

export function createPremiumGlowPlayerToken({
  label,
  teamColor,
  style,
  scale,
  radius,
  kitPattern = "plain",
  kitPatternColor,
}: {
  label: string;
  teamColor: PremiumGlowTeamColor;
  style?: Partial<PremiumGlowPlayerTokenStyle>;
  scale?: number;
  radius?: number;
  kitPattern?: PremiumGlowKitPattern;
  kitPatternColor?: number;
}): { token: Container; shadow: Graphics } {
  const defaults = DEFAULT_STYLE_BY_TEAM[teamColor];
  const resolved: PremiumGlowPlayerTokenStyle = {
    ...defaults,
    ...style,
    secondaryColor: style?.secondaryColor ?? defaults.secondaryColor,
    goalkeeper: style?.goalkeeper ?? defaults.goalkeeper,
  };

  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(scale ?? 1);

  const tokenRadius = Number.isFinite(radius) ? Math.max(2.8, Number(radius)) : TOKEN_RADIUS;
  const ringWidth = Math.max(0.44, tokenRadius * 0.16);
  const teamBaseColor = resolved.goalkeeper && resolved.secondaryColor != null
    ? resolved.secondaryColor
    : resolved.primaryColor;
  const glowColor = vividGlowColor(teamBaseColor);
  const ringColor = mixColor(glowColor, 0x0f172a, 0.12);
  const ringInnerShade = mixColor(glowColor, resolved.outlineColor, 0.36);
  const patternTintSource = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : glowColor;
  const innerTintColor = mixColor(glowColor, patternTintSource, 0.08);
  const centreColor = mixColor(TOKEN_BASE_COLOR, glowColor, 0.3);
  const centreHighlightColor = mixColor(centreColor, 0xffffff, 0.32);
  const centreRimColor = mixColor(glowColor, resolved.outlineColor, 0.3);
  const patternMarkColor = resolvePatternMarkColor(centreColor, patternTintSource, 2.35);

  const shadow = new Graphics();
  const outerAuraRadius = tokenRadius * 1.14;
  const innerAuraRadius = tokenRadius * 1.04;
  shadow
    .circle(0, 0, outerAuraRadius)
    .stroke({ color: glowColor, width: Math.max(0.14, tokenRadius * 0.052), alpha: 0.72 })
    .circle(0, 0, innerAuraRadius)
    .stroke({ color: glowColor, width: Math.max(0.1, tokenRadius * 0.034), alpha: 0.56 })
    .circle(0, 0, tokenRadius * 1.02)
    .fill({ color: glowColor, alpha: 0.045 });
  shadow.alpha = TOKEN_IDLE_HALO_ALPHA;
  token.addChild(shadow);

  const baseShadow = new Graphics();
  baseShadow
    .ellipse(0.24, tokenRadius * 1.06, tokenRadius * 0.98, tokenRadius * 0.25)
    .fill({ color: 0x020617, alpha: 0.14 })
    .ellipse(0.24, tokenRadius * 1.01, tokenRadius * 0.88, tokenRadius * 0.19)
    .fill({ color: 0x020617, alpha: 0.09 });
  token.addChild(baseShadow);

  const tokenBase = new Graphics();
  tokenBase
    .circle(0, 0, tokenRadius)
    .fill({ color: TOKEN_BASE_COLOR })
    .circle(0, 0, tokenRadius - 0.08)
    .stroke({ color: mixColor(TOKEN_BASE_COLOR, 0x000000, 0.34), width: Math.max(0.2, tokenRadius * 0.062), alpha: 0.74 })
    .circle(0, 0, tokenRadius - 0.16)
    .stroke({ color: ringColor, width: ringWidth, alpha: 0.92 })
    .circle(0, 0, tokenRadius - ringWidth - 0.06)
    .stroke({ color: ringInnerShade, width: Math.max(0.12, tokenRadius * 0.036), alpha: 0.52 });
  token.addChild(tokenBase);

  const centreRadius = tokenRadius - ringWidth - 0.16;
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

  const patternMarks = new Graphics();
  drawGlowPatternMarks(patternMarks, kitPattern, patternMarkColor, centreRadius * 0.92);
  token.addChild(patternMarks);

  const notch = new Graphics();
  drawIntegratedCrownNotch(notch, ringColor, resolved.outlineColor, tokenRadius, ringWidth);
  token.addChild(notch);

  const orientationTick = new Graphics();
  orientationTick
    .roundRect(
      -tokenRadius * 0.024,
      -tokenRadius + ringWidth * 0.42,
      tokenRadius * 0.048,
      tokenRadius * 0.048,
      tokenRadius * 0.02,
    )
    .fill({ color: mixColor(ringColor, 0xffffff, 0.08), alpha: 0.2 });
  token.addChild(orientationTick);

  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumericLabel = /^\d+$/.test(safeLabel);
  const labelFillColor =
    isNumericLabel && luminance(centreColor) >= 156 ? 0x0f172a : resolved.textColor;
  const labelBaseY = isNumericLabel ? -0.02 : -0.06;
  const labelFontSize = isNumericLabel
    ? safeLabel.length >= 2 ? centreRadius * 1.6 : centreRadius * 1.82
    : centreRadius * 1.28;
  const labelLetterSpacing = isNumericLabel ? (safeLabel.length >= 2 ? 0.02 : 0.04) : 0.1;
  const labelPlate = new Graphics();
  labelPlate
    .roundRect(
      -centreRadius * 0.9,
      -centreRadius * 0.49,
      centreRadius * 1.8,
      centreRadius * 0.98,
      centreRadius * 0.28,
    )
    .fill({ color: 0x020617, alpha: 0.26 });
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
      fill: labelFillColor,
      fontSize: labelFontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: labelLetterSpacing,
      stroke: {
        color: luminance(labelFillColor) > 140 ? 0x0b1220 : 0xf8fafc,
        width: isNumericLabel
          ? safeLabel.length >= 2 ? Math.max(0.52, centreRadius * 0.21) : Math.max(0.46, centreRadius * 0.18)
          : Math.max(0.4, centreRadius * 0.15),
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
