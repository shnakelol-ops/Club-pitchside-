import type { Graphics } from "pixi.js";

import type { VisionDiscPattern } from "./contracts";
import type { VisionDiscGeometry } from "./geometry";

function halfSpanAtOffset(radius: number, offset: number): number {
  const inside = radius * radius - offset * offset;
  if (inside <= 0) return 0;
  return Math.sqrt(inside);
}

function strokePattern(
  graphics: Graphics,
  color: number,
  alpha: number,
  width: number,
): void {
  graphics.stroke({
    color,
    alpha,
    width,
    cap: "butt",
    join: "miter",
    alignment: 0.5,
  });
}

export function drawVisionDiscPattern(
  graphics: Graphics,
  pattern: VisionDiscPattern,
  color: number,
  alpha: number,
  geometry: VisionDiscGeometry,
): void {
  const radius = geometry.innerRadius * 0.98;
  const width = Math.max(1, geometry.patternStroke * 1.45);
  if (pattern === "solid" || pattern === "gradient") return;

  if (pattern === "hoops") {
    const y1 = -radius * 0.3;
    const y2 = radius * 0.3;
    const h1 = halfSpanAtOffset(radius, y1);
    const h2 = halfSpanAtOffset(radius, y2);
    graphics
      .moveTo(-h1, y1)
      .lineTo(h1, y1)
      .moveTo(-h2, y2)
      .lineTo(h2, y2);
    strokePattern(graphics, color, alpha, width);
    return;
  }

  if (pattern === "stripes") {
    const stripeWidth = Math.max(1, width * 1.2);
    const stripeOffsets = geometry.outerRadius <= 20
      ? [0]
      : [-radius * 0.38, radius * 0.38];
    for (const stripeX of stripeOffsets) {
      const halfSpan = halfSpanAtOffset(radius, stripeX);
      graphics
        .moveTo(stripeX, -halfSpan)
        .lineTo(stripeX, halfSpan);
    }
    strokePattern(graphics, color, alpha, stripeWidth);
    return;
  }

  if (pattern === "slash") {
    graphics
      .moveTo(-radius * 0.62, radius * 0.48)
      .lineTo(radius * 0.62, -radius * 0.48);
    strokePattern(graphics, color, alpha * 0.96, width * 1.05);
    return;
  }

  const y = -radius * 0.18;
  const bibBandHeight = Math.max(1, width * 1.34);
  const bibBandWidth = radius * 1.34;
  graphics
    .rect(-bibBandWidth * 0.5, y - bibBandHeight * 0.5, bibBandWidth, bibBandHeight)
    .fill({ color, alpha: alpha * 0.18 });

  const dashWidth = radius * 0.29;
  const gap = radius * 0.15;
  const segmentCount = 3;
  const totalWidth = segmentCount * dashWidth + (segmentCount - 1) * gap;
  const startX = -totalWidth * 0.5;
  for (let index = 0; index < segmentCount; index += 1) {
    const left = startX + index * (dashWidth + gap);
    graphics
      .moveTo(left, y)
      .lineTo(left + dashWidth, y);
  }
  strokePattern(graphics, color, alpha * 0.96, width * 1.22);
  graphics
    .moveTo(-bibBandWidth * 0.38, y + bibBandHeight * 0.26)
    .lineTo(bibBandWidth * 0.38, y + bibBandHeight * 0.26);
  strokePattern(graphics, color, alpha * 0.28, Math.max(1, width * 0.52));
}
