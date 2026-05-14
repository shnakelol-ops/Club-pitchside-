import { Container, Graphics, Text } from "pixi.js";

import type { CleanTokenRendererInput } from "./createCleanTokenRenderers";
import type { CleanTokenRendererOutput } from "./createCleanTokenRenderers";

function resolveFontSize(innerRadius: number, digitCount: number): number {
  if (digitCount <= 1) return innerRadius * 1.1;
  if (digitCount === 2) return innerRadius * 0.88;
  return innerRadius * 0.68;
}

export function createJerseyToken(input: CleanTokenRendererInput): CleanTokenRendererOutput {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(input.scale ?? 1);

  const outerRadius = Math.max(0.1, input.radius);
  const innerRadius = outerRadius * 0.82;

  // LAYER 1 — SHADOW
  const shadow = new Graphics();
  shadow
    .ellipse(0, outerRadius * 0.75, outerRadius * 0.8, outerRadius * 0.18)
    .fill({ color: 0x000000, alpha: 0.12 });
  token.addChild(shadow);

  // LAYER 2 — OUTER RING
  const outerRing = new Graphics();
  outerRing
    .circle(0, 0, outerRadius)
    .fill({ color: input.outlineColor ?? 0x1a1a1a, alpha: 1 });
  token.addChild(outerRing);

  // LAYER 3 — DISC BASE
  const discBase = new Graphics();
  discBase
    .circle(0, 0, innerRadius)
    .fill({ color: input.baseColor, alpha: 1 });
  token.addChild(discBase);

  // LAYER 4 — JERSEY GLYPH
  const s = innerRadius * 0.72;
  const points = [
    -s * 0.55,
    -s * 0.5,
    -s * 0.22,
    -s * 0.5,
    -s * 0.12,
    -s * 0.3,
    s * 0.12,
    -s * 0.3,
    s * 0.22,
    -s * 0.5,
    s * 0.55,
    -s * 0.5,
    s * 0.45,
    s * 0.52,
    -s * 0.45,
    s * 0.52,
  ];
  const glyph = new Graphics();
  glyph
    .poly(points)
    .fill({ color: 0x000000, alpha: 0.18 })
    .poly(points)
    .stroke({ color: 0x000000, alpha: 0.35, width: 1.2 });
  glyph.position.set(0, 0);
  token.addChild(glyph);

  // LAYER 5 — NUMBER TEXT
  const numberText = String(Math.trunc(input.number));
  const fontSize = resolveFontSize(innerRadius, Math.min(numberText.length, 3));
  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const labelText = new Text({
    text: numberText,
    style: {
      fill: 0xffffff,
      fontFamily: "\"Barlow Condensed\", Inter, system-ui",
      fontSize,
      fontWeight: "900",
      align: "center",
      stroke: {
        color: 0x000000,
        width: outerRadius * 0.1,
        join: "round",
      },
    },
  });
  labelText.anchor.set(0.5, 0.5);
  labelText.position.set(0, 0);
  labelText.resolution = textResolution;
  labelText.roundPixels = true;
  token.addChild(labelText);

  return { token, shadow };
}
