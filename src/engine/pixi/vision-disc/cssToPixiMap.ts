import type { VisionDiscCssTokenSet } from "./contracts";
import { VISION_DISC_CSS_VAR_MAP } from "./constants";

const TOKEN_KEYS = Object.keys(VISION_DISC_CSS_VAR_MAP) as Array<keyof VisionDiscCssTokenSet>;

export function resolveVisionDiscCssTokensFromElement(
  element: HTMLElement | null,
  fallback: VisionDiscCssTokenSet,
): VisionDiscCssTokenSet {
  if (!element) return { ...fallback };
  const computed = window.getComputedStyle(element);
  const resolved: VisionDiscCssTokenSet = { ...fallback };
  for (const key of TOKEN_KEYS) {
    const varName = VISION_DISC_CSS_VAR_MAP[key];
    const nextValue = computed.getPropertyValue(varName).trim();
    if (nextValue.length > 0) {
      resolved[key] = nextValue;
    }
  }
  return resolved;
}

export function applyVisionDiscCssVarsToStyle(tokens: VisionDiscCssTokenSet): Record<string, string> {
  const style: Record<string, string> = {};
  for (const key of TOKEN_KEYS) {
    style[VISION_DISC_CSS_VAR_MAP[key]] = tokens[key];
  }
  return style;
}
