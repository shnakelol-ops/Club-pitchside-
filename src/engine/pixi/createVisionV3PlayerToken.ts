import { Container, Graphics, Text } from "pixi.js";

import { drawTokenPattern } from "./drawTokenPattern";
import {
  tokenConfigFromKitFields,
  type TokenConfig,
  type TokenNumberColorOverride,
  type TokenPatternType,
  type TokenRingStyle,
} from "./tokenConfig";
import {
  minimumPatternContrast,
  mixColor,
  relativeLuminance,
  resolvePatternDetailTier,
  resolvePatternMarkColor,
} from "./tokenPatternContrast";

export type VisionV3PlayerTokenStyle = {
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  goalkeeper?: boolean;
};

export type VisionV3TeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
export type VisionV3KitPattern = TokenPatternType;

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

function resolveNumberFill(
  override: string,
  baseFillColor: number,
  teamColor: number,
): number {
  if (override === "white" || override === "light") return 0xf8fafc;
  if (override === "black" || override === "dark") return 0x0b1220;
  if (override === "team") return mixColor(teamColor, 0xf8fafc, 0.15);
  return relativeLuminance(baseFillColor) < 0.42 ? 0xf8fafc : 0x0f172a;
}

function resolveOuterRingWidth(ring: string, radius: number): number {
  if (ring === "none") return Math.max(0.38, radius * 0.11);
  if (ring === "thin") return Math.max(0.5, radius * 0.145);
  if (ring === "strong") return Math.max(0.64, radius * 0.19);
  return Math.max(0.56, radius * 0.165);
}

function clampPatternForTiny(pattern: TokenPatternType, isTiny: boolean): TokenPatternType {
  if (!isTiny) return pattern;
  return "plain";
}

function colorToHex(color: number): string {
  const safe = Math.max(0, Math.min(0xffffff, Math.floor(color)));
  return `#${safe.toString(16).padStart(6, "0")}`;
}

export function createVisionV3PlayerToken({
  label,
  teamColor,
  style,
  scale,
  radius,
  kitPattern = "plain",
  kitPatternColor,
  ring,
  numberColor,
  glowOnSelect,
  tokenConfig,
}: {
  label: string;
  teamColor: VisionV3TeamColor;
  style?: Partial<VisionV3PlayerTokenStyle>;
  scale?: number;
  radius?: number;
  kitPattern?: VisionV3KitPattern;
  kitPatternColor?: number;
  ring?: TokenRingStyle;
  numberColor?: TokenNumberColorOverride;
  glowOnSelect?: boolean;
  tokenConfig?: Partial<TokenConfig>;
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
  const lodTier = resolvePatternDetailTier(discRadius, tokenScale, 5);
  const mergedConfig = tokenConfigFromKitFields(
    {
      kitPattern,
      ring,
      numberColor,
      glowOnSelect,
    },
    tokenConfig,
  );

  const ringWidth = resolveOuterRingWidth(mergedConfig.ring, discRadius);
  const innerRadius = discRadius - ringWidth;
  const coreColor =
    resolved.goalkeeper && resolved.secondaryColor != null
      ? mixColor(resolved.secondaryColor, 0x020617, 0.22)
      : mixColor(resolved.primaryColor, 0x020617, 0.22);
  const requestedAccentColor = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : (resolved.secondaryColor ?? mixColor(resolved.primaryColor, 0xffffff, 0.28));
  const pattern = clampPatternForTiny(mergedConfig.pattern, lodTier === "tiny");
  const patternInkColor = resolvePatternMarkColor(
    coreColor,
    requestedAccentColor,
    minimumPatternContrast(pattern, lodTier),
  );
  const ringColor = mixColor(resolved.primaryColor, requestedAccentColor, 0.22);
  const ringEdge = mixColor(ringColor, resolved.outlineColor, 0.5);
  const centerHighlight = mixColor(coreColor, 0xffffff, 0.2);

  const shadow = new Graphics();
  shadow
    .circle(0, 0, discRadius * 1.34)
    .fill({ color: ringColor, alpha: lodTier === "tiny" ? 0.06 : 0.09 })
    .ellipse(0.18, discRadius * 1.04, discRadius * 0.96, discRadius * 0.24)
    .fill({ color: 0x020617, alpha: lodTier === "tiny" ? 0.14 : 0.19 });
  shadow.alpha = 0.24;
  token.addChild(shadow);

  const disc = new Graphics();
  disc
    .circle(0, 0, discRadius)
    .fill({ color: 0x0b1220 })
    .circle(0, 0, discRadius - 0.08)
    .fill({ color: mixColor(ringColor, 0xffffff, 0.08) })
    .circle(0, 0, discRadius - ringWidth * 0.45)
    .fill({ color: ringColor, alpha: 0.9 })
    .circle(0, 0, innerRadius)
    .fill({ color: coreColor })
    .ellipse(0, innerRadius * 0.38, innerRadius * 0.92, innerRadius * 0.48)
    .fill({ color: mixColor(coreColor, 0x020617, 0.2), alpha: 0.2 })
    .ellipse(0, -innerRadius * 0.34, innerRadius * 0.72, innerRadius * 0.22)
    .fill({ color: centerHighlight, alpha: lodTier === "tiny" ? 0.18 : 0.26 })
    .circle(0, 0, discRadius)
    .stroke({
      color: mixColor(ringEdge, 0x000000, 0.28),
      width: Math.max(0.18, discRadius * 0.11),
      alpha: 0.66,
      alignment: 0.5,
    });
  token.addChild(disc);

  if (pattern !== "plain") {
    const patternLayer = new Graphics();
    const patternLod = lodTier === "tiny" ? 0 : lodTier === "small" ? 1 : 2;
    drawTokenPattern({
      g: patternLayer,
      pattern,
      secondary: colorToHex(patternInkColor),
      cx: 0,
      cy: 0,
      r: innerRadius * 0.92,
      lod: patternLod,
    });
    token.addChild(patternLayer);
  }

  if (mergedConfig.glowOnSelect) {
    const selectedRing = new Graphics();
    selectedRing
      .circle(0, 0, discRadius + Math.max(0.08, discRadius * 0.04))
      .stroke({
        color: mixColor(patternInkColor, 0xffffff, 0.24),
        width: Math.max(0.14, discRadius * 0.05),
        alpha: 0.78,
        alignment: 0.5,
      });
    token.addChild(selectedRing);
  }

  const orientationTick = new Graphics();
  orientationTick
    .roundRect(
      -innerRadius * 0.15,
      -discRadius + ringWidth * 0.16,
      innerRadius * 0.3,
      Math.max(0.19, discRadius * 0.14),
      innerRadius * 0.08,
    )
    .fill({ color: mixColor(ringColor, 0xffffff, 0.18), alpha: 0.34 });
  token.addChild(orientationTick);

  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumericLabel = /^\d+$/.test(safeLabel);
  const isDoubleDigit = isNumericLabel && safeLabel.length >= 2;
  const labelFill = resolveNumberFill(
    mergedConfig.numberColor,
    coreColor,
    resolved.primaryColor,
  );
  const labelStroke = relativeLuminance(labelFill) > 0.5 ? 0x0b1220 : 0xf8fafc;
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
    .fill({ color: mixColor(coreColor, 0x020617, 0.54), alpha: isDoubleDigit ? 0.38 : 0.32 });
  labelPlate.position.y = isNumericLabel ? (isDoubleDigit ? 0 : innerRadius * 0.02) : 0;
  token.addChild(labelPlate);

  const labelText = new Text({
    text: safeLabel,
    style: {
      fill: labelFill,
      fontSize: isNumericLabel
        ? (isDoubleDigit ? innerRadius * 1.04 : innerRadius * 1.24)
        : innerRadius * 0.84,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: isDoubleDigit ? 0.01 : 0.03,
      stroke: {
        color: labelStroke,
        width: isNumericLabel
          ? (isDoubleDigit ? Math.max(0.56, innerRadius * 0.24) : Math.max(0.48, innerRadius * 0.2))
          : Math.max(0.34, innerRadius * 0.14),
        join: "round",
      },
    },
  });
  labelText.anchor.set(0.5, 0.5);
  labelText.position.y = isNumericLabel ? (isDoubleDigit ? 0 : innerRadius * 0.015) : 0;
  labelText.resolution = textResolution;
  labelText.roundPixels = true;
  token.addChild(labelText);

  return { token, shadow };
}
