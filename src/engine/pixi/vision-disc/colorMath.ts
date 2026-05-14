import type { VisionDiscCssTokenSet, VisionDiscResolvedStyle } from "./contracts";

type ParsedColor = { color: number; alpha: number };

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampAlpha(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function parseHexColor(value: string): ParsedColor | null {
  const normalized = value.trim();
  if (!normalized.startsWith("#")) return null;
  const hex = normalized.slice(1);
  if (hex.length === 3) {
    const r = Number.parseInt(hex[0]! + hex[0]!, 16);
    const g = Number.parseInt(hex[1]! + hex[1]!, 16);
    const b = Number.parseInt(hex[2]! + hex[2]!, 16);
    if ([r, g, b].some((entry) => Number.isNaN(entry))) return null;
    return { color: (r << 16) | (g << 8) | b, alpha: 1 };
  }
  if (hex.length === 6 || hex.length === 8) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((entry) => Number.isNaN(entry))) return null;
    const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { color: (r << 16) | (g << 8) | b, alpha: clampAlpha(a) };
  }
  return null;
}

function parseRgbColor(value: string): ParsedColor | null {
  const match = value
    .trim()
    .match(/^rgba?\(\s*([^\s,]+)\s*,\s*([^\s,]+)\s*,\s*([^\s,)]+)(?:\s*,\s*([^\s,)]+))?\s*\)$/i);
  if (!match) return null;
  const r = clampByte(Number.parseFloat(match[1]!));
  const g = clampByte(Number.parseFloat(match[2]!));
  const b = clampByte(Number.parseFloat(match[3]!));
  const a = match[4] == null ? 1 : clampAlpha(Number.parseFloat(match[4]));
  return { color: (r << 16) | (g << 8) | b, alpha: a };
}

export function parseCssColorToPixi(value: string): ParsedColor {
  return parseHexColor(value) ?? parseRgbColor(value) ?? { color: 0xffffff, alpha: 1 };
}

export function resolveVisionDiscStyle(tokens: VisionDiscCssTokenSet): VisionDiscResolvedStyle {
  const ringColor = parseCssColorToPixi(tokens.ringColor);
  const ringStrokeColor = parseCssColorToPixi(tokens.ringStrokeColor);
  const discBaseColor = parseCssColorToPixi(tokens.discBaseColor);
  const discHighlightColor = parseCssColorToPixi(tokens.discHighlightColor);
  const discEdgeColor = parseCssColorToPixi(tokens.discEdgeColor);
  const patternColor = parseCssColorToPixi(tokens.patternColor);
  const glyphColor = parseCssColorToPixi(tokens.glyphColor);
  const labelColor = parseCssColorToPixi(tokens.labelColor);
  const labelStrokeColor = parseCssColorToPixi(tokens.labelStrokeColor);
  const labelPlateColor = parseCssColorToPixi(tokens.labelPlateColor);
  const shadowColor = parseCssColorToPixi(tokens.shadowColor);
  const haloColor = parseCssColorToPixi(tokens.haloColor);

  return {
    colors: {
      ringColor: ringColor.color,
      ringStrokeColor: ringStrokeColor.color,
      discBaseColor: discBaseColor.color,
      discHighlightColor: discHighlightColor.color,
      discEdgeColor: discEdgeColor.color,
      patternColor: patternColor.color,
      glyphColor: glyphColor.color,
      labelColor: labelColor.color,
      labelStrokeColor: labelStrokeColor.color,
      labelPlateColor: labelPlateColor.color,
      shadowColor: shadowColor.color,
      haloColor: haloColor.color,
    },
    alpha: {
      ringColor: ringColor.alpha,
      ringStrokeColor: ringStrokeColor.alpha,
      discBaseColor: discBaseColor.alpha,
      discHighlightColor: discHighlightColor.alpha,
      discEdgeColor: discEdgeColor.alpha,
      patternColor: patternColor.alpha,
      glyphColor: glyphColor.alpha,
      labelColor: labelColor.alpha,
      labelStrokeColor: labelStrokeColor.alpha,
      labelPlateColor: labelPlateColor.alpha,
      shadowColor: shadowColor.alpha,
      haloColor: haloColor.alpha,
    },
  };
}
