export const TOKEN_PATTERN_LIGHT_FALLBACK = 0xf8fafc;
export const TOKEN_PATTERN_DARK_FALLBACK = 0x0b1220;
export type TokenPatternDetailTier = "tiny" | "small" | "regular";

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

function linearizedChannel(channel: number): number {
  const normalized = channel / 255;
  if (normalized <= 0.03928) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: number): number {
  const r = linearizedChannel((color >> 16) & 0xff);
  const g = linearizedChannel((color >> 8) & 0xff);
  const b = linearizedChannel(color & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: number, background: number): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

export function resolvePatternMarkColor(
  baseFillColor: number,
  requestedAccentColor: number,
  minimumContrast = 2.35,
): number {
  const preferredFallback =
    relativeLuminance(baseFillColor) < 0.34 ? TOKEN_PATTERN_LIGHT_FALLBACK : TOKEN_PATTERN_DARK_FALLBACK;
  const secondaryFallback = relativeLuminance(baseFillColor) < 0.34 ? 0xe2e8f0 : 0x111827;
  const candidates = [
    requestedAccentColor,
    mixColor(requestedAccentColor, preferredFallback, 0.28),
    preferredFallback,
    secondaryFallback,
  ];

  let bestColor = candidates[0] ?? preferredFallback;
  let bestContrast = contrastRatio(bestColor, baseFillColor);
  for (const candidate of candidates) {
    const candidateContrast = contrastRatio(candidate, baseFillColor);
    if (candidateContrast > bestContrast) {
      bestColor = candidate;
      bestContrast = candidateContrast;
    }
  }

  if (bestContrast >= minimumContrast) return bestColor;
  return preferredFallback;
}

export function resolvePatternDetailTier(
  radius: number,
  scale = 1,
  lodScale = 5,
): TokenPatternDetailTier {
  const pixelRadius = radius * Math.max(0.6, scale) * Math.max(1, lodScale);
  if (pixelRadius < 11.5) return "tiny";
  if (pixelRadius < 14.5) return "small";
  return "regular";
}
