export type TokenPatternType =
  | "plain"
  | "hoops"
  | "stripes"
  | "slash"
  | "chestDash"
  | "gradient";

export type TokenRingStyle = "auto" | "none" | "thin" | "strong";

export type TokenNumberColorOverride =
  | "auto"
  | "light"
  | "dark"
  | "white"
  | "black"
  | "team";

export type TokenConfig = {
  pattern: TokenPatternType;
  ring: TokenRingStyle;
  numberColor: TokenNumberColorOverride;
  glowOnSelect: boolean;
};

export type TokenKitFieldsBridge = {
  kitPattern?: TokenPatternType;
  ring?: TokenRingStyle;
  numberColor?: TokenNumberColorOverride;
  glowOnSelect?: boolean;
};

export const DEFAULT_TOKEN_CONFIG: Readonly<TokenConfig> = {
  pattern: "plain",
  ring: "auto",
  numberColor: "auto",
  glowOnSelect: false,
};

export const GAA_TOKEN_PRESETS: Readonly<Record<string, TokenConfig>> = {
  neutral: {
    pattern: "plain",
    ring: "auto",
    numberColor: "auto",
    glowOnSelect: false,
  },
  kerry: {
    pattern: "chestDash",
    ring: "thin",
    numberColor: "light",
    glowOnSelect: false,
  },
  limerick: {
    pattern: "hoops",
    ring: "thin",
    numberColor: "light",
    glowOnSelect: false,
  },
  cork: {
    pattern: "stripes",
    ring: "thin",
    numberColor: "light",
    glowOnSelect: false,
  },
  galway: {
    pattern: "slash",
    ring: "thin",
    numberColor: "light",
    glowOnSelect: false,
  },
};

export function tokenConfigFromKitFields(
  fields: TokenKitFieldsBridge | undefined,
  defaults: Partial<TokenConfig> = DEFAULT_TOKEN_CONFIG,
): TokenConfig {
  return {
    pattern: fields?.kitPattern ?? defaults.pattern ?? DEFAULT_TOKEN_CONFIG.pattern,
    ring: fields?.ring ?? defaults.ring ?? DEFAULT_TOKEN_CONFIG.ring,
    numberColor: fields?.numberColor ?? defaults.numberColor ?? DEFAULT_TOKEN_CONFIG.numberColor,
    glowOnSelect:
      typeof fields?.glowOnSelect === "boolean"
        ? fields.glowOnSelect
        : (defaults.glowOnSelect ?? DEFAULT_TOKEN_CONFIG.glowOnSelect),
  };
}
