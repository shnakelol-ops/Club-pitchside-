import { Container, Graphics, Text } from "pixi.js";
import { resolvePatternMarkColor } from "./tokenPatternContrast";

export type VisionV3PlayerTokenStyle = {
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  goalkeeper?: boolean;
};

type VisionV3LodTier = "tiny" | "small" | "regular";

export type VisionV3TeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
export type VisionV3KitPattern = "plain" | "hoops" | "slash" | "stripes";

const DEFAULT_STYLE_BY_TEAM: Record<VisionV3TeamColor, VisionV3PlayerTokenStyle> = {
  blue: {
    primaryColor: 0x2563eb,
    secondaryColor: 0x60a5fa,
    badgeColor: 0x1d4ed8,
    outlineColor: 0x0f172a,
    textColor: 0xffffff,
  },
  red: {
    primaryColor: 0xdc2626,
    secondaryColor: 0xf87171,
    badgeColor: 0xb91c1c,
    outlineColor: 0x0f172a,
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

function luminance(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function drawPatternAccent(
  target: Graphics,
  pattern: VisionV3KitPattern,
  accentColor: number,
  innerRadius: number,
  lodTier: VisionV3LodTier,
): void {
  if (pattern === "plain") return;
  const alpha = lodTier === "tiny" ? 0.62 : lodTier === "small" ? 0.56 : 0.5;
  const lineWidth = Math.max(
    0.34,
    innerRadius * (lodTier === "tiny" ? 0.28 : lodTier === "small" ? 0.24 : 0.21),
  );
  if (pattern === "hoops") {
    const yOffset = lodTier === "tiny" ? innerRadius * 0.34 : innerRadius * 0.3;
    target
      .moveTo(-innerRadius * 0.68, -yOffset)
      .lineTo(innerRadius * 0.68, -yOffset)
      .moveTo(-innerRadius * 0.68, yOffset)
      .lineTo(innerRadius * 0.68, yOffset);
    target.stroke({ color: accentColor, width: lineWidth, alpha, cap: "round", join: "round" });
    return;
  }
  if (pattern === "stripes") {
    const stripeOffsets =
      lodTier === "tiny"
        ? [-innerRadius * 0.3, innerRadius * 0.3]
        : lodTier === "small"
          ? [-innerRadius * 0.38, 0, innerRadius * 0.38]
          : [-innerRadius * 0.4, 0, innerRadius * 0.4];
    for (const xOffset of stripeOffsets) {
      target.moveTo(xOffset, -innerRadius * 0.68).lineTo(xOffset, innerRadius * 0.68);
    }
    target.stroke({ color: accentColor, width: lineWidth, alpha, cap: "round", join: "round" });
    return;
  }
  if (lodTier === "regular") {
    target
      .moveTo(-innerRadius * 0.56, innerRadius * 0.62)
      .lineTo(innerRadius * 0.56, -innerRadius * 0.42)
      .stroke({ color: accentColor, width: Math.max(0.34, lineWidth * 0.94), alpha, cap: "round", join: "round" });
    return;
  }
  target
    .moveTo(-innerRadius * 0.6, innerRadius * 0.5)
    .lineTo(innerRadius * 0.6, -innerRadius * 0.5)
    .stroke({ color: accentColor, width: Math.max(0.34, lineWidth * 1.06), alpha, cap: "round", join: "round" });
}

function drawShirtGlyph(target: Graphics, centerY: number, size: number, color: number): void {
  const top = centerY - size * 0.5;
  const bottom = centerY + size * 0.5;
  target
    .poly([
      -size * 0.64,
      top + size * 0.16,
      -size * 0.3,
      top,
      -size * 0.12,
      top + size * 0.14,
      size * 0.12,
      top + size * 0.14,
      size * 0.3,
      top,
      size * 0.64,
      top + size * 0.16,
      size * 0.42,
      top + size * 0.5,
      size * 0.38,
      bottom,
      -size * 0.38,
      bottom,
      -size * 0.42,
      top + size * 0.5,
    ])
    .fill({ color, alpha: 0.18 });
}

function drawPersonCircleGlyph(target: Graphics, radius: number, color: number): void {
  target
    .circle(0, 0, radius)
    .stroke({ color, width: Math.max(0.14, radius * 0.12), alpha: 0.2, alignment: 0.5 })
    .circle(0, -radius * 0.18, radius * 0.26)
    .fill({ color, alpha: 0.16 })
    .roundRect(-radius * 0.44, radius * 0.06, radius * 0.88, radius * 0.46, radius * 0.22)
    .fill({ color, alpha: 0.12 });
}

function resolveLodTier(discRadius: number, scale: number, lodScale: number): VisionV3LodTier {
  const pixelRadius = discRadius * Math.max(0.6, scale) * Math.max(1, lodScale);
  if (pixelRadius < 11.5) return "tiny";
  if (pixelRadius < 14.5) return "small";
  return "regular";
}

export function createVisionV3PlayerToken({
  label,
  teamColor,
  style,
  scale,
  radius,
  captain = false,
  lodScale = 5,
  kitPattern = "plain",
  kitPatternColor,
}: {
  label: string;
  teamColor: VisionV3TeamColor;
  style?: Partial<VisionV3PlayerTokenStyle>;
  scale?: number;
  radius?: number;
  captain?: boolean;
  lodScale?: number;
  kitPattern?: VisionV3KitPattern;
  kitPatternColor?: number;
}): { token: Container; shadow: Graphics } {
  const defaults = DEFAULT_STYLE_BY_TEAM[teamColor];
  const resolved: VisionV3PlayerTokenStyle = {
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

  const discRadius = Number.isFinite(radius) ? Math.max(2.8, Number(radius)) : 3.66;
  const lodTier = resolveLodTier(discRadius, tokenScale, lodScale);
  const ringWidth = Math.max(0.56, discRadius * (lodTier === "tiny" ? 0.18 : 0.2));
  const innerRadius = discRadius - ringWidth;
  const baseColor =
    resolved.goalkeeper && resolved.secondaryColor != null
      ? resolved.secondaryColor
      : resolved.primaryColor;
  const accentColor = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : (resolved.secondaryColor ?? mixColor(baseColor, 0xffffff, 0.3));
  const ringColor = mixColor(baseColor, accentColor, 0.3);
  const coreColor = mixColor(baseColor, 0x020617, 0.2);
  const coreShadeColor = mixColor(coreColor, 0x020617, 0.2);
  const highlightColor = mixColor(coreColor, 0xffffff, 0.22);
  const edgeColor = mixColor(resolved.outlineColor, 0x000000, 0.24);
  const patternInkColor = resolvePatternMarkColor(coreColor, accentColor, 2.35);

  const shadow = new Graphics();
  const shadowHaloAlpha = lodTier === "tiny" ? 0.06 : lodTier === "small" ? 0.085 : 0.11;
  const shadowBaseAlpha = lodTier === "tiny" ? 0.16 : lodTier === "small" ? 0.19 : 0.22;
  shadow
    .circle(0, 0, discRadius * 1.4)
    .fill({ color: ringColor, alpha: shadowHaloAlpha })
    .ellipse(0.2, discRadius * 1.04, discRadius * 0.98, discRadius * 0.26)
    .fill({ color: 0x020617, alpha: shadowBaseAlpha });
  shadow.alpha = lodTier === "tiny" ? 0.2 : 0.24;
  token.addChild(shadow);

  const disc = new Graphics();
  disc
    .circle(0, 0, discRadius)
    .fill({ color: 0x0b1120 })
    .circle(0, 0, discRadius - 0.08)
    .fill({ color: mixColor(ringColor, 0xffffff, 0.08) })
    .circle(0, 0, discRadius - ringWidth * 0.45)
    .fill({ color: ringColor, alpha: 0.94 })
    .circle(0, 0, innerRadius)
    .fill({ color: coreColor })
    .ellipse(0, innerRadius * 0.38, innerRadius * 0.94, innerRadius * 0.5)
    .fill({ color: coreShadeColor, alpha: 0.22 })
    .ellipse(0, -innerRadius * 0.34, innerRadius * 0.72, innerRadius * 0.22)
    .fill({ color: highlightColor, alpha: lodTier === "tiny" ? 0.2 : 0.29 })
    .ellipse(-innerRadius * 0.18, -innerRadius * 0.48, innerRadius * 0.54, innerRadius * 0.14)
    .fill({ color: 0xffffff, alpha: lodTier === "tiny" ? 0.06 : 0.1 });
  drawPatternAccent(
    disc,
    kitPattern,
    patternInkColor,
    innerRadius * 0.9,
    lodTier,
  );
  disc
    .circle(0, 0, discRadius)
    .stroke({ color: edgeColor, width: Math.max(0.22, discRadius * 0.12), alpha: 0.68, alignment: 0.5 })
    .circle(0, 0, innerRadius)
    .stroke({
      color: mixColor(edgeColor, 0xffffff, 0.08),
      width: Math.max(0.12, discRadius * 0.055),
      alpha: 0.4,
      alignment: 0.5,
    });
  token.addChild(disc);

  if (resolved.goalkeeper) {
    const keeperMarker = new Graphics();
    keeperMarker
      .arc(0, -discRadius * 0.02, innerRadius * 0.88, Math.PI * 1.03, Math.PI * 1.97)
      .stroke({
        color: mixColor(accentColor, 0xffffff, 0.28),
        width: Math.max(0.2, innerRadius * 0.14),
        alpha: lodTier === "tiny" ? 0.36 : 0.48,
        cap: "round",
        join: "round",
      })
      .roundRect(
        -innerRadius * 0.18,
        -discRadius + ringWidth * 0.06,
        innerRadius * 0.36,
        Math.max(0.19, innerRadius * 0.18),
        innerRadius * 0.1,
      )
      .fill({ color: mixColor(accentColor, 0xffffff, 0.32), alpha: 0.6 });
    token.addChild(keeperMarker);
  }

  const iconLayer = new Graphics();
  drawShirtGlyph(iconLayer, -innerRadius * 0.02, innerRadius * 0.98, 0xffffff);
  iconLayer.position.y = -innerRadius * 0.06;
  iconLayer.alpha = lodTier === "tiny" ? 0.8 : 1;
  token.addChild(iconLayer);

  const personLayer = new Graphics();
  drawPersonCircleGlyph(personLayer, innerRadius * 0.42, 0xffffff);
  personLayer.position.y = -innerRadius * 0.62;
  personLayer.alpha = lodTier === "tiny" ? 0.75 : 1;
  token.addChild(personLayer);

  const orientationTick = new Graphics();
  orientationTick
    .roundRect(-innerRadius * 0.16, -discRadius + ringWidth * 0.16, innerRadius * 0.32, Math.max(0.2, discRadius * 0.14), innerRadius * 0.08)
    .fill({ color: mixColor(ringColor, 0xffffff, 0.16), alpha: 0.36 });
  token.addChild(orientationTick);

  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumericLabel = /^\d+$/.test(safeLabel);
  const isDoubleDigitNumeric = isNumericLabel && safeLabel.length >= 2;
  const numericTextColor = luminance(coreColor) < 170 ? 0xffffff : 0x0f172a;
  const labelColor = isNumericLabel ? numericTextColor : resolved.textColor;
  const labelStroke = luminance(labelColor) > 140 ? 0x0b1220 : 0xffffff;
  const labelFontSize = isNumericLabel
    ? isDoubleDigitNumeric
      ? innerRadius * (lodTier === "tiny" ? 1.08 : 1.02)
      : innerRadius * (lodTier === "tiny" ? 1.3 : 1.24)
    : innerRadius * 0.84;
  const labelBaseY = isNumericLabel ? (isDoubleDigitNumeric ? 0 : innerRadius * 0.015) : 0;
  const labelLetterSpacing = isDoubleDigitNumeric ? 0.01 : 0.03;
  const textResolution =
    typeof window !== "undefined" ? Math.max(2.4, Math.min(3.2, window.devicePixelRatio || 1.5)) : 2.6;

  const labelPlate = new Graphics();
  labelPlate
    .roundRect(
      -innerRadius * 0.92,
      -innerRadius * 0.5,
      innerRadius * 1.84,
      innerRadius * 1.08,
      innerRadius * 0.32,
    )
    .fill({
      color: mixColor(coreColor, 0x020617, 0.5),
      alpha: isDoubleDigitNumeric ? (lodTier === "tiny" ? 0.38 : 0.34) : lodTier === "tiny" ? 0.31 : 0.26,
    });
  labelPlate.position.y = labelBaseY;
  token.addChild(labelPlate);

  const labelShadow = new Text({
    text: safeLabel,
    style: {
      fill: mixColor(labelStroke, 0x020617, 0.35),
      fontSize: labelFontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: labelLetterSpacing,
    },
  });
  labelShadow.anchor.set(0.5, 0.52);
  labelShadow.position.y = labelBaseY + 0.07;
  labelShadow.alpha = isDoubleDigitNumeric ? (lodTier === "tiny" ? 0.42 : 0.36) : lodTier === "tiny" ? 0.34 : 0.3;
  labelShadow.resolution = textResolution;
  labelShadow.roundPixels = true;
  token.addChild(labelShadow);

  const labelText = new Text({
    text: safeLabel,
    style: {
      fill: labelColor,
      fontSize: labelFontSize,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: labelLetterSpacing,
      stroke: {
        color: labelStroke,
        width: isNumericLabel
          ? isDoubleDigitNumeric
            ? Math.max(0.56, innerRadius * (lodTier === "tiny" ? 0.28 : 0.24))
            : Math.max(0.5, innerRadius * (lodTier === "tiny" ? 0.24 : 0.21))
          : Math.max(0.35, innerRadius * 0.15),
        join: "round",
      },
    },
  });
  labelText.anchor.set(0.5, 0.5);
  labelText.position.y = labelBaseY;
  labelText.resolution = textResolution;
  labelText.roundPixels = true;
  token.addChild(labelText);

  if (captain) {
    const captainAccent = new Graphics();
    const accentRadius = discRadius + Math.max(0.12, ringWidth * 0.16);
    captainAccent
      .arc(0, 0, accentRadius, -Math.PI * 0.28, Math.PI * 0.04)
      .stroke({
        color: mixColor(labelColor, 0xffffff, 0.12),
        width: Math.max(0.16, innerRadius * 0.12),
        alpha: lodTier === "tiny" ? 0.56 : 0.62,
        cap: "round",
        join: "round",
      });
    token.addChild(captainAccent);
    if (lodTier !== "tiny") {
      const captainText = new Text({
        text: "C",
        style: {
          fill: labelColor,
          fontSize: innerRadius * 0.56,
          fontWeight: "900",
          fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
          stroke: {
            color: labelStroke,
            width: Math.max(0.16, innerRadius * 0.08),
            join: "round",
          },
        },
      });
      captainText.anchor.set(0.5, 0.54);
      captainText.position.set(innerRadius * 0.7, -innerRadius * 0.66);
      captainText.resolution = textResolution;
      captainText.roundPixels = true;
      token.addChild(captainText);
    }
  }

  return { token, shadow };
}
