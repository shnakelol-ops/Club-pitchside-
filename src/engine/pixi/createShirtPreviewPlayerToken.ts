import { Container, Graphics, Text } from "pixi.js";

export type ShirtPreviewPlayerTokenStyle = {
  primaryColor: number;
  secondaryColor?: number;
  badgeColor: number;
  outlineColor: number;
  textColor: number;
  goalkeeper?: boolean;
};

export type ShirtPreviewTeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
export type ShirtPreviewKitPattern = "plain" | "hoops" | "slash" | "stripes";

type ShirtPreviewLodTier = "tiny" | "small" | "regular";

const DEFAULT_STYLE_BY_TEAM: Record<ShirtPreviewTeamColor, ShirtPreviewPlayerTokenStyle> = {
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

function resolveLodTier(discRadius: number, scale: number, lodScale: number): ShirtPreviewLodTier {
  const pixelRadius = discRadius * Math.max(0.6, scale) * Math.max(1, lodScale);
  if (pixelRadius < 11.2) return "tiny";
  if (pixelRadius < 14.2) return "small";
  return "regular";
}

function drawShirtShape(target: Graphics, shirtColor: number, sleeveColor: number, innerRadius: number): void {
  target
    .poly([
      -innerRadius * 0.7,
      -innerRadius * 0.22,
      -innerRadius * 0.42,
      -innerRadius * 0.44,
      -innerRadius * 0.16,
      -innerRadius * 0.3,
      innerRadius * 0.16,
      -innerRadius * 0.3,
      innerRadius * 0.42,
      -innerRadius * 0.44,
      innerRadius * 0.7,
      -innerRadius * 0.22,
      innerRadius * 0.46,
      innerRadius * 0.18,
      innerRadius * 0.4,
      innerRadius * 0.66,
      -innerRadius * 0.4,
      innerRadius * 0.66,
      -innerRadius * 0.46,
      innerRadius * 0.18,
    ])
    .fill({ color: shirtColor, alpha: 0.88 });

  target
    .poly([
      -innerRadius * 0.7,
      -innerRadius * 0.22,
      -innerRadius * 0.47,
      -innerRadius * 0.06,
      -innerRadius * 0.54,
      innerRadius * 0.2,
      -innerRadius * 0.7,
      innerRadius * 0.06,
    ])
    .fill({ color: sleeveColor, alpha: 0.86 })
    .poly([
      innerRadius * 0.7,
      -innerRadius * 0.22,
      innerRadius * 0.47,
      -innerRadius * 0.06,
      innerRadius * 0.54,
      innerRadius * 0.2,
      innerRadius * 0.7,
      innerRadius * 0.06,
    ])
    .fill({ color: sleeveColor, alpha: 0.86 });

  target
    .roundRect(-innerRadius * 0.18, -innerRadius * 0.42, innerRadius * 0.36, innerRadius * 0.16, innerRadius * 0.07)
    .fill({ color: 0xffffff, alpha: 0.18 });
}

function drawShirtPattern(
  target: Graphics,
  pattern: ShirtPreviewKitPattern,
  patternColor: number,
  innerRadius: number,
  lodTier: ShirtPreviewLodTier,
): void {
  if (pattern === "plain") return;
  const alpha = lodTier === "tiny" ? 0.28 : 0.24;
  const width = Math.max(0.22, innerRadius * (lodTier === "tiny" ? 0.18 : 0.15));

  if (pattern === "hoops") {
    const y = innerRadius * 0.34;
    target
      .moveTo(-innerRadius * 0.38, y)
      .lineTo(innerRadius * 0.38, y)
      .stroke({ color: patternColor, width, alpha, cap: "round", join: "round" });
    if (lodTier !== "tiny") {
      target
        .moveTo(-innerRadius * 0.36, -innerRadius * 0.04)
        .lineTo(innerRadius * 0.36, -innerRadius * 0.04)
        .stroke({ color: patternColor, width: width * 0.88, alpha: 0.2, cap: "round", join: "round" });
    }
    return;
  }

  if (pattern === "stripes") {
    const x = innerRadius * 0.22;
    target
      .moveTo(-x, -innerRadius * 0.24)
      .lineTo(-x, innerRadius * 0.6)
      .moveTo(x, -innerRadius * 0.24)
      .lineTo(x, innerRadius * 0.6)
      .stroke({ color: patternColor, width, alpha, cap: "round", join: "round" });
    return;
  }

  target
    .moveTo(-innerRadius * 0.36, innerRadius * 0.56)
    .lineTo(-innerRadius * 0.06, innerRadius * 0.2)
    .moveTo(innerRadius * 0.06, innerRadius * 0)
    .lineTo(innerRadius * 0.36, -innerRadius * 0.28)
    .stroke({ color: patternColor, width: width * 1.06, alpha, cap: "round", join: "round" });
}

export function createShirtPreviewPlayerToken({
  label,
  teamColor,
  style,
  scale,
  radius,
  lodScale = 5,
  kitPattern = "plain",
  kitPatternColor,
}: {
  label: string;
  teamColor: ShirtPreviewTeamColor;
  style?: Partial<ShirtPreviewPlayerTokenStyle>;
  scale?: number;
  radius?: number;
  lodScale?: number;
  kitPattern?: ShirtPreviewKitPattern;
  kitPatternColor?: number;
}): { token: Container; shadow: Graphics } {
  const defaults = DEFAULT_STYLE_BY_TEAM[teamColor];
  const resolved: ShirtPreviewPlayerTokenStyle = {
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
  const ringWidth = Math.max(0.56, discRadius * 0.19);
  const innerRadius = discRadius - ringWidth;
  const shirtColor = resolved.primaryColor;
  const accentColor = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : (resolved.secondaryColor ?? mixColor(shirtColor, 0xffffff, 0.28));
  const ringColor = mixColor(shirtColor, 0x0f172a, 0.18);
  const centerColor = mixColor(shirtColor, 0x020617, 0.24);
  const inkColor = mixColor(accentColor, luminance(centerColor) < 132 ? 0xffffff : 0x0f172a, 0.28);

  const shadow = new Graphics();
  shadow
    .circle(0, 0, discRadius * 1.34)
    .fill({ color: ringColor, alpha: lodTier === "tiny" ? 0.07 : 0.1 })
    .ellipse(0.18, discRadius * 1.06, discRadius * 0.96, discRadius * 0.24)
    .fill({ color: 0x020617, alpha: lodTier === "tiny" ? 0.16 : 0.2 });
  shadow.alpha = lodTier === "tiny" ? 0.2 : 0.24;
  token.addChild(shadow);

  const disc = new Graphics();
  disc
    .circle(0, 0, discRadius)
    .fill({ color: 0x0b1120 })
    .circle(0, 0, discRadius - 0.08)
    .fill({ color: mixColor(ringColor, 0xffffff, 0.08) })
    .circle(0, 0, discRadius - ringWidth * 0.45)
    .fill({ color: ringColor, alpha: 0.95 })
    .circle(0, 0, innerRadius)
    .fill({ color: centerColor })
    .ellipse(0, innerRadius * 0.42, innerRadius * 0.9, innerRadius * 0.46)
    .fill({ color: mixColor(centerColor, 0x020617, 0.2), alpha: 0.2 })
    .ellipse(-innerRadius * 0.16, -innerRadius * 0.48, innerRadius * 0.52, innerRadius * 0.16)
    .fill({ color: 0xffffff, alpha: 0.1 })
    .circle(0, 0, discRadius)
    .stroke({ color: mixColor(resolved.outlineColor, 0x000000, 0.2), width: Math.max(0.22, discRadius * 0.12), alpha: 0.68, alignment: 0.5 });
  token.addChild(disc);

  const shirtLayer = new Graphics();
  drawShirtShape(shirtLayer, mixColor(shirtColor, 0xffffff, 0.04), mixColor(accentColor, 0xffffff, 0.08), innerRadius);
  drawShirtPattern(shirtLayer, kitPattern, inkColor, innerRadius, lodTier);
  token.addChild(shirtLayer);

  const orientationTick = new Graphics();
  orientationTick
    .roundRect(-innerRadius * 0.15, -discRadius + ringWidth * 0.16, innerRadius * 0.3, Math.max(0.19, discRadius * 0.14), innerRadius * 0.08)
    .fill({ color: mixColor(ringColor, 0xffffff, 0.18), alpha: 0.38 });
  token.addChild(orientationTick);

  const safeLabel = label.trim().slice(0, 3) || "?";
  const isNumericLabel = /^\d+$/.test(safeLabel);
  const isDoubleDigit = isNumericLabel && safeLabel.length >= 2;
  const labelColor = isNumericLabel
    ? (luminance(centerColor) < 168 ? 0xffffff : 0x0f172a)
    : resolved.textColor;
  const labelStroke = luminance(labelColor) > 140 ? 0x0b1220 : 0xffffff;
  const textResolution =
    typeof window !== "undefined" ? Math.max(2.4, Math.min(3.2, window.devicePixelRatio || 1.5)) : 2.6;

  const labelPlate = new Graphics();
  labelPlate
    .roundRect(-innerRadius * 0.92, -innerRadius * 0.52, innerRadius * 1.84, innerRadius * 1.08, innerRadius * 0.34)
    .fill({ color: mixColor(centerColor, 0x020617, 0.52), alpha: isDoubleDigit ? 0.36 : 0.3 });
  labelPlate.position.y = isNumericLabel ? (isDoubleDigit ? 0 : innerRadius * 0.02) : 0;
  token.addChild(labelPlate);

  const labelText = new Text({
    text: safeLabel,
    style: {
      fill: labelColor,
      fontSize: isNumericLabel
        ? (isDoubleDigit ? innerRadius * (lodTier === "tiny" ? 1.06 : 1) : innerRadius * (lodTier === "tiny" ? 1.28 : 1.22))
        : innerRadius * 0.84,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: isDoubleDigit ? 0.01 : 0.03,
      stroke: {
        color: labelStroke,
        width: isNumericLabel
          ? (isDoubleDigit ? Math.max(0.56, innerRadius * 0.25) : Math.max(0.5, innerRadius * 0.21))
          : Math.max(0.35, innerRadius * 0.15),
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
