import { Container, FillGradient, Graphics, Text } from "pixi.js";

import { drawTokenPattern, resolvePatternLOD, type PatternLOD } from "./drawTokenPattern";
import {
  DEFAULT_TOKEN_CONFIG,
  tokenConfigFromKitFields,
  type TokenConfig,
  type TokenNumberColorOverride,
  type TokenPatternType,
  type TokenRingStyle,
} from "./tokenConfig";
import { mixColor } from "./tokenPatternContrast";

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

const FALLBACK_RING_COLOR = 0x2a2a2a;

function colorToHex(color: number): string {
  const safe = Math.max(0, Math.min(0xffffff, Math.round(color)));
  return `#${safe.toString(16).padStart(6, "0")}`;
}

function parseHexColor(hex: string | undefined, fallback: number): number {
  if (!hex) return fallback;
  const normalized = hex.trim();
  const matcher = normalized.startsWith("#") ? normalized.slice(1) : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(matcher)) return fallback;
  return Number.parseInt(matcher, 16);
}

function resolveOuterRingWidth(ring: TokenRingStyle, radius: number): number {
  if (ring === "none") return Math.max(0.38, radius * 0.11);
  if (ring === "thin") return Math.max(0.46, radius * 0.135);
  if (ring === "strong") return Math.max(0.62, radius * 0.18);
  return Math.max(0.54, radius * 0.16);
}

function resolveNumberFill(override: TokenNumberColorOverride, teamColor: number): number {
  if (override === "black" || override === "dark") return 0x0f172a;
  if (override === "team") return mixColor(teamColor, 0xffffff, 0.2);
  return 0xffffff;
}

function resolvePatternLod(radius: number, scale: number): PatternLOD {
  const estimatedPixelRadius = radius * Math.max(1, scale * 8);
  const rawLod = resolvePatternLOD(estimatedPixelRadius);
  if (rawLod === 0) return 1;
  return rawLod;
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
  const baseFillColor =
    resolved.goalkeeper && resolved.secondaryColor != null
      ? resolved.secondaryColor
      : resolved.primaryColor;
  const secondaryColor = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : (resolved.secondaryColor ?? mixColor(baseFillColor, 0xffffff, 0.6));

  const mergedConfig = tokenConfigFromKitFields(
    {
      kitBaseColor: colorToHex(baseFillColor),
      kitPatternColor: colorToHex(secondaryColor),
      kitPattern,
      ring,
      numberColor,
      glowOnSelect,
    },
    tokenConfig,
  );

  const ringWidth = resolveOuterRingWidth(mergedConfig.ring as TokenRingStyle, discRadius);
  const innerRadius = discRadius - ringWidth;
  const ringColor = parseHexColor(DEFAULT_TOKEN_CONFIG.ring, FALLBACK_RING_COLOR);
  const patternColor = parseHexColor(mergedConfig.secondary, secondaryColor);

  const shadow = new Graphics();
  shadow
    .circle(0, 0, discRadius * 1.18)
    .fill({ color: 0x000000, alpha: 0.08 })
    .ellipse(0.14, discRadius * 1.02, discRadius * 0.94, discRadius * 0.25)
    .fill({ color: 0x020617, alpha: 0.24 });
  shadow.alpha = 0.24;
  token.addChild(shadow);

  const disc = new Graphics();
  disc.circle(0, 0, discRadius).fill({ color: ringColor });

  if (mergedConfig.pattern === "gradient") {
    const gradient = new FillGradient({
      type: "linear",
      start: { x: -innerRadius, y: -innerRadius },
      end: { x: innerRadius, y: innerRadius },
      textureSpace: "local",
      colorStops: [
        { offset: 0, color: colorToHex(baseFillColor) },
        { offset: 1, color: colorToHex(patternColor) },
      ],
    });
    disc.circle(0, 0, innerRadius).fill(gradient);
  } else {
    const fillColor = mergedConfig.pattern === "solid" ? patternColor : baseFillColor;
    disc.circle(0, 0, innerRadius).fill({ color: fillColor });
  }

  disc
    .circle(0, 0, innerRadius)
    .stroke({
      color: mixColor(ringColor, 0xffffff, 0.07),
      width: Math.max(0.1, discRadius * 0.035),
      alpha: 0.28,
      alignment: 0.5,
    })
    .ellipse(-innerRadius * 0.18, -innerRadius * 0.42, innerRadius * 0.6, innerRadius * 0.2)
    .fill({ color: 0xffffff, alpha: 0.09 });
  token.addChild(disc);

  if (
    mergedConfig.pattern === "hoops" ||
    mergedConfig.pattern === "stripes" ||
    mergedConfig.pattern === "slash" ||
    mergedConfig.pattern === "chestDash"
  ) {
    const patternLayer = new Graphics();
    const patternMask = new Graphics();
    patternMask.circle(0, 0, innerRadius).fill({ color: 0xffffff });
    patternMask.visible = false;
    patternLayer.mask = patternMask;
    drawTokenPattern({
      g: patternLayer,
      pattern: mergedConfig.pattern,
      secondary: colorToHex(patternColor),
      cx: 0,
      cy: 0,
      r: innerRadius,
      lod: resolvePatternLod(innerRadius, tokenScale),
    });
    token.addChild(patternLayer);
    token.addChild(patternMask);
  }

  if (mergedConfig.glowOnSelect) {
    const selectedHalo = new Graphics();
    selectedHalo
      .circle(0, 0, discRadius + Math.max(0.08, discRadius * 0.045))
      .stroke({
        color: 0xffffff,
        width: Math.max(0.14, discRadius * 0.05),
        alpha: 0.8,
        alignment: 0.5,
      });
    token.addChild(selectedHalo);
  }

  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumericLabel = /^\d+$/.test(safeLabel);
  const isDoubleDigit = isNumericLabel && safeLabel.length >= 2;
  const textResolution =
    typeof window !== "undefined" ? Math.max(2.4, Math.min(3.2, window.devicePixelRatio || 1.5)) : 2.6;
  const labelFill = resolveNumberFill(
    mergedConfig.numberColor as TokenNumberColorOverride,
    baseFillColor,
  );

  const labelShadow = new Text({
    text: safeLabel,
    style: {
      fill: 0x000000,
      fontSize: isNumericLabel
        ? (isDoubleDigit ? innerRadius * 1.06 : innerRadius * 1.26)
        : innerRadius * 0.86,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: isDoubleDigit ? 0.01 : 0.04,
    },
  });
  labelShadow.anchor.set(0.5, 0.5);
  labelShadow.position.y = 0.07;
  labelShadow.alpha = 0.28;
  labelShadow.resolution = textResolution;
  labelShadow.roundPixels = true;
  token.addChild(labelShadow);

  const labelText = new Text({
    text: safeLabel,
    style: {
      fill: labelFill,
      fontSize: isNumericLabel
        ? (isDoubleDigit ? innerRadius * 1.06 : innerRadius * 1.26)
        : innerRadius * 0.86,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: isDoubleDigit ? 0.01 : 0.04,
      stroke: {
        color: 0x111827,
        width: isNumericLabel
          ? Math.max(0.5, innerRadius * (isDoubleDigit ? 0.22 : 0.2))
          : Math.max(0.3, innerRadius * 0.14),
        join: "round",
      },
    },
  });
  labelText.anchor.set(0.5, 0.5);
  labelText.position.y = 0;
  labelText.resolution = textResolution;
  labelText.roundPixels = true;
  token.addChild(labelText);

  return { token, shadow };
}
