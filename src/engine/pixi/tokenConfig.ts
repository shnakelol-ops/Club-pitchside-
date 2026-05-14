/**
 * tokenConfig.ts
 * ---------------------------------------------------------------------------
 * Source-of-truth types and presets for the Pitchside token system.
 *
 * SAFE TO ADD:
 *   - TokenPattern extends the existing TacticalKitPattern union
 *   - TokenConfig is a NEW type — it does NOT replace TacticalPlayerKitFields
 *   - GAA_PRESETS are purely additive lookup data
 *
 * DO NOT IMPORT THIS from any existing file yet — wire it in only after
 * the renderer is verified. Existing behaviour is untouched until then.
 * ---------------------------------------------------------------------------
 */

// Pattern union
export type TokenPattern =
  | "plain"
  | "solid"
  | "gradient"
  | "hoops"
  | "stripes"
  | "slash"
  | "chestDash";

export function normalisePattern(p: string | undefined): TokenPattern {
  if (!p) return "plain";
  if (p === "solid") return "plain";
  const valid: TokenPattern[] = ["plain", "gradient", "hoops", "stripes", "slash", "chestDash"];
  return valid.includes(p as TokenPattern) ? (p as TokenPattern) : "plain";
}

// TokenConfig
export interface TokenConfig {
  fill: string;
  secondary: string;
  ring: string;
  numberColor: string;
  pattern: TokenPattern;
  glowOnSelect?: boolean;
}

const CHARCOAL = "#2a2a2a";
const WHITE = "#ffffff";
const GOLD = "#f5c518";

// GAA county presets
export const GAA_PRESETS: Record<string, TokenConfig> = {
  limerick: {
    fill: "#1a7a2e",
    secondary: GOLD,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "hoops",
    glowOnSelect: false,
  },
  tipperary: {
    fill: "#1a5ca8",
    secondary: GOLD,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "hoops",
    glowOnSelect: false,
  },
  cork: {
    fill: "#cc0000",
    secondary: WHITE,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "stripes",
    glowOnSelect: false,
  },
  dublin: {
    fill: "#1a3d8f",
    secondary: "#87ceeb",
    ring: "#87ceeb",
    numberColor: WHITE,
    pattern: "plain",
    glowOnSelect: false,
  },
  galway: {
    fill: "#7a1818",
    secondary: WHITE,
    ring: CHARCOAL,
    numberColor: WHITE,
    pattern: "slash",
    glowOnSelect: false,
  },
  kerry: {
    fill: "#006400",
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

// ---------------------------------------------------------------------------
// Backward-compatible bridge exports used by the current renderer integration.
// ---------------------------------------------------------------------------

export type TokenPatternType = TokenPattern;
export type TokenRingStyle = "auto" | "none" | "thin" | "strong";
export type TokenNumberColorOverride =
  | "auto"
  | "light"
  | "dark"
  | "white"
  | "black"
  | "team";

export type TokenKitFieldsBridge = {
  kitBaseColor?: string;
  kitPatternColor?: string;
  kitPattern?: TokenPatternType;
  ring?: TokenRingStyle;
  numberColor?: TokenNumberColorOverride;
  glowOnSelect?: boolean;
};

export const GAA_TOKEN_PRESETS = GAA_PRESETS;

function sanitizeRingStyle(value: string | undefined): TokenRingStyle {
  if (value === "none" || value === "thin" || value === "strong") return value;
  return "auto";
}

function sanitizeNumberColor(value: string | undefined): TokenNumberColorOverride {
  if (
    value === "light" ||
    value === "dark" ||
    value === "white" ||
    value === "black" ||
    value === "team"
  ) {
    return value;
  }
  return "auto";
}

export function tokenConfigFromKitFields(
  fields: TokenKitFieldsBridge | undefined,
  defaults: Partial<TokenConfig> = DEFAULT_TOKEN_CONFIG,
): TokenConfig {
  const baseDefaults: TokenConfig = {
    fill: defaults.fill ?? DEFAULT_TOKEN_CONFIG.fill,
    secondary: defaults.secondary ?? DEFAULT_TOKEN_CONFIG.secondary,
    ring: defaults.ring ?? DEFAULT_TOKEN_CONFIG.ring,
    numberColor: defaults.numberColor ?? DEFAULT_TOKEN_CONFIG.numberColor,
    pattern: normalisePattern(defaults.pattern),
    glowOnSelect: defaults.glowOnSelect ?? DEFAULT_TOKEN_CONFIG.glowOnSelect,
  };
  if (!fields) {
    return {
      ...baseDefaults,
      ring: sanitizeRingStyle(baseDefaults.ring),
      numberColor: sanitizeNumberColor(baseDefaults.numberColor),
    };
  }
  return {
    fill: fields.kitBaseColor ?? baseDefaults.fill,
    secondary: fields.kitPatternColor ?? baseDefaults.secondary,
    ring: sanitizeRingStyle(fields.ring ?? baseDefaults.ring),
    numberColor: sanitizeNumberColor(fields.numberColor ?? baseDefaults.numberColor),
    pattern: normalisePattern(fields.kitPattern ?? baseDefaults.pattern),
    glowOnSelect:
      typeof fields.glowOnSelect === "boolean"
        ? fields.glowOnSelect
        : (baseDefaults.glowOnSelect ?? false),
  };
}
