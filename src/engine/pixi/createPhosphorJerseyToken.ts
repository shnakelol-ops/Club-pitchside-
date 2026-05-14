import { Container, Graphics, Text } from "pixi.js";

import type {
  CleanTokenRendererInput,
  CleanTokenRendererOutput,
} from "./createCleanTokenRenderers";

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(base: number, target: number, amount: number): number {
  const br = (base >> 16) & 0xff;
  const bg = (base >> 8) & 0xff;
  const bb = base & 0xff;
  const tr = (target >> 16) & 0xff;
  const tg = (target >> 8) & 0xff;
  const tb = target & 0xff;
  const r = clampByte(br + (tr - br) * amount);
  const g = clampByte(bg + (tg - bg) * amount);
  const b = clampByte(bb + (tb - bb) * amount);
  return (r << 16) | (g << 8) | b;
}

function resolveLabel(label: string): string {
  const clean = label.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  return clean.length > 0 ? clean : "?";
}

function resolveLabelFont(label: string, radius: number): number {
  const isNumeric = /^\d+$/.test(label);
  if (!isNumeric) return radius * 0.52;
  if (radius <= 14) return label.length <= 1 ? radius * 0.86 : radius * 0.74;
  if (radius <= 20) return label.length <= 1 ? radius * 0.82 : radius * 0.7;
  return label.length <= 1 ? radius * 0.78 : radius * 0.66;
}

function drawPattern(
  target: Graphics,
  pattern: CleanTokenRendererInput["pattern"],
  color: number,
  alpha: number,
  innerRadius: number,
): void {
  if (pattern === "plain") return;

  if (pattern === "gradient") {
    target
      .ellipse(0, -innerRadius * 0.28, innerRadius * 0.84, innerRadius * 0.26)
      .fill({ color: mixColor(color, 0xffffff, 0.24), alpha })
      .ellipse(0, innerRadius * 0.3, innerRadius * 0.84, innerRadius * 0.28)
      .fill({ color: mixColor(color, 0x0f172a, 0.22), alpha });
    return;
  }

  if (pattern === "hoops") {
    const bandH = innerRadius * 0.28;
    for (const y of [-innerRadius * 0.56, -innerRadius * 0.02, innerRadius * 0.52]) {
      target.rect(-innerRadius, y, innerRadius * 2, bandH).fill({ color, alpha });
    }
    return;
  }

  if (pattern === "stripes") {
    const stripeW = innerRadius * 0.28;
    for (const x of [-innerRadius * 0.56, -innerRadius * 0.14, innerRadius * 0.3]) {
      target.rect(x, -innerRadius, stripeW, innerRadius * 2).fill({ color, alpha });
    }
    return;
  }

  if (pattern === "slash") {
    const sashW = innerRadius * 0.84;
    const len = innerRadius * 2.24;
    const angle = -38 * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const half = sashW / 2;
    const corners: [number, number][] = [
      [-len / 2, -half],
      [len / 2, -half],
      [len / 2, half],
      [-len / 2, half],
    ];
    const rotated = corners.flatMap(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
    target.poly(rotated).fill({ color, alpha });
    return;
  }

  target
    .rect(-innerRadius, -innerRadius * 0.31, innerRadius * 2, innerRadius * 0.62)
    .fill({ color, alpha });
}

export function createPhosphorJerseyToken(input: CleanTokenRendererInput): CleanTokenRendererOutput {
  const outerRadius = Math.max(2.8, input.radius);
  const ringThickness = Math.max(0.5, outerRadius * 0.18);
  const innerRadius = outerRadius - ringThickness * 0.54;
  const label = resolveLabel(input.label);
  const labelFont = resolveLabelFont(label, outerRadius);
  const ringColor = input.outlineColor ?? 0x1a1a2e;
  const discBase = input.baseColor;
  const labelStrokeColor = input.outlineColor ?? 0x0f172a;

  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(input.scale ?? 1);

  const shadow = new Graphics();
  shadow
    .ellipse(0, outerRadius * 0.78, outerRadius * 0.82, outerRadius * 0.2)
    .fill({ color: 0x020617, alpha: 0.1 });
  token.addChild(shadow);

  const ring = new Graphics();
  ring
    .circle(0, 0, outerRadius)
    .stroke({ color: ringColor, width: ringThickness, alpha: 0.9, alignment: 0.5 });
  token.addChild(ring);

  const disc = new Graphics();
  disc
    .circle(0, 0, innerRadius)
    .fill({ color: discBase, alpha: 0.98 });
  token.addChild(disc);

  const pattern = new Graphics();
  drawPattern(pattern, input.pattern, input.patternColor, 0.65, innerRadius * 0.9);
  token.addChild(pattern);

  const labelText = new Text({
    text: label,
    style: {
      fill: 0xffffff,
      fontSize: labelFont,
      fontWeight: "900",
      align: "center",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      letterSpacing: /^\d+$/.test(label) ? 0 : 0.06,
      stroke: {
        color: labelStrokeColor,
        width: Math.max(0.36, outerRadius * 0.11),
        join: "miter",
      },
    },
  });
  labelText.anchor.set(0.5);
  labelText.position.y = innerRadius * 0.28;
  labelText.roundPixels = true;
  labelText.resolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  token.addChild(labelText);

  return { token, shadow };
}
