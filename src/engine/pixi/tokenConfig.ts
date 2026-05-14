/**
 * tokenConfig.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Source-of-truth types and presets for the Pitchside token system.
 *
 * SAFE TO ADD:
 *   - TokenPattern extends the existing TacticalKitPattern union
 *   - TokenConfig is a NEW type — it does NOT replace TacticalPlayerKitFields
 *   - GAA_PRESETS are purely additive lookup data
 *
 * DO NOT IMPORT THIS from any existing file yet — wire it in only after
 * the renderer is verified. Existing behaviour is untouched until then.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Pattern union ────────────────────────────────────────────────────────────
// Extends the existing TacticalKitPattern ("plain" | "hoops" | "slash" | "stripes")
// with two new values. The existing values are kept identical so any stored
// board snapshot with an old pattern still resolves correctly.

export type TokenPattern =
  | "plain" // existing — maps to solid fill, no secondary mark
  | "solid" // alias for plain (designer uses "solid"; normalize on read)
  | "gradient" // NEW — radial depth, no secondary colour required
  | "hoops" // existing — horizontal bands
  | "stripes" // existing — vertical stripes
  | "slash" // existing — diagonal sash
  | "chestDash"; // NEW — horizontal chest band

// Normalise "solid" → "plain" so legacy snapshots and new tokens share one path
export function normalisePattern(p: string | undefined): TokenPattern {
  if (!p) return "plain";
  if (p === "solid") return "plain";
  const valid: TokenPattern[] = ["plain", "gradient", "hoops", "stripes", "slash", "chestDash"];
  return valid.includes(p as TokenPattern) ? (p as TokenPattern) : "plain";
}

// ─── TokenConfig ──────────────────────────────────────────────────────────────
// Self-contained config block. Maps 1-to-1 with TacticalPlayerKitFields but
// uses the new pattern union and adds ring/numberColor/glowOnSelect.
// Per-player override is supported: a goalkeeper can carry a different config.

export interface TokenConfig {
  fill: string; // primary kit colour  (= kitBaseColor)
  secondary: string; // pattern colour      (= kitPatternColor)
  ring: string; // outer ring / border
  numberColor: string; // jersey number text
  pattern: TokenPattern; // kit pattern         (= kitPattern, normalised)
  glowOnSelect?: boolean; // thin selection glow — false by default
}

// ─── Kit identity colours ─────────────────────────────────────────────────────
// Charcoal (#2a2a2a) is used instead of pure black for rings — softer on pitch.
// These are design defaults; coaches can override every field.

const CHARCOAL = "#2a2a2a";
const WHITE = "#ffffff";
const GOLD = "#f5c518";

// ─── GAA county presets ───────────────────────────────────────────────────────
export const GAA_PRESETS: Record<string, TokenConfig> = {
  limerick: {
    fill: "#1a7a2e", // Limerick green
    secondary: GOLD,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "hoops",
    glowOnSelect: false,
  },
  tipperary: {
    fill: "#1a5ca8", // Tipperary blue
    secondary: GOLD,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "hoops",
    glowOnSelect: false,
  },
  cork: {
    fill: "#cc0000", // Cork red
    secondary: WHITE,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "stripes",
    glowOnSelect: false,
  },
  dublin: {
    fill: "#1a3d8f", // Dublin navy
    secondary: "#87ceeb", // sky blue
    ring: "#87ceeb",
    numberColor: WHITE,
    pattern: "plain",
    glowOnSelect: false,
  },
  galway: {
    fill: "#7a1818", // Galway maroon
    secondary: WHITE,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "slash",
    glowOnSelect: false,
  },
  kerry: {
    fill: "#006400", // Kerry green
    secondary: GOLD,
    ring: CHARCOAL,
    numberColor: GOLD,
    pattern: "chestDash",
    glowOnSelect: false,
  },
  ember: {
    fill: "#e05a2b",
    secondary: GOLD,
    ring: WHITE,
    numberColor: WHITE,
    pattern: "gradient",
    glowOnSelect: true,
  },
  pitchBlack: {
    fill: "#111111",
    secondary: GOLD,
    ring: GOLD,
    numberColor: GOLD,
    pattern: "plain",
    glowOnSelect: true,
  },
};

// ─── Fallback config ──────────────────────────────────────────────────────────
// Used when no config is present — matches current default token appearance
// so existing boards look identical until a coach changes their kit.
export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  fill: "#f5c518",
  secondary: CHARCOAL,
  ring: CHARCOAL,
  numberColor: "#1a1a1a",
  pattern: "plain",
  glowOnSelect: false,
};

export const DEFAULT_OPPONENT_CONFIG: TokenConfig = {
  fill: "#cc0000",
  secondary: WHITE,
  ring: CHARCOAL,
  numberColor: WHITE,
  pattern: "plain",
  glowOnSelect: false,
};

// ─── Bridge: TacticalPlayerKitFields → TokenConfig ───────────────────────────
// Converts the existing stored kit fields into a TokenConfig without
// modifying the storage schema. Call this inside the renderer, not in storage.
export function kitFieldsToTokenConfig(fields: {
  kitBaseColor?: string;
  kitPatternColor?: string;
  kitPattern?: string;
  ring?: string;
  numberColor?: string;
  glowOnSelect?: boolean;
}): TokenConfig {
  return {
    fill: fields.kitBaseColor ?? DEFAULT_TOKEN_CONFIG.fill,
    secondary: fields.kitPatternColor ?? DEFAULT_TOKEN_CONFIG.secondary,
    ring: fields.ring ?? DEFAULT_TOKEN_CONFIG.ring,
    numberColor: fields.numberColor ?? DEFAULT_TOKEN_CONFIG.numberColor,
    pattern: normalisePattern(fields.kitPattern),
    glowOnSelect: fields.glowOnSelect ?? false,
  };
}
