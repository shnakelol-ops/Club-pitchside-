import { Graphics } from "pixi.js";
import {
  isWhiteboardLinearGeometry,
  isWhiteboardPenGeometry,
  type WhiteboardDrawingObject,
} from "./whiteboardDrawingTypes";

export type WhiteboardRenderPoint = { x: number; y: number };

export type WhiteboardRenderDrawing = WhiteboardDrawingObject;

function drawSolidSegment(
  graphics: Graphics,
  from: WhiteboardRenderPoint,
  to: WhiteboardRenderPoint,
  color: number,
  strokeWidth: number,
): void {
  graphics.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({
    color,
    width: strokeWidth,
    cap: "round",
    join: "round",
    alignment: 0.5,
  });
}

function drawDashedSegment(
  graphics: Graphics,
  from: WhiteboardRenderPoint,
  to: WhiteboardRenderPoint,
  color: number,
  strokeWidth: number,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-4) return;
  const ux = dx / length;
  const uy = dy / length;
  const dash = 2.2;
  const gap = 1.35;
  let offset = 0;
  while (offset < length) {
    const segStart = offset;
    const segEnd = Math.min(length, segStart + dash);
    drawSolidSegment(
      graphics,
      { x: from.x + ux * segStart, y: from.y + uy * segStart },
      { x: from.x + ux * segEnd, y: from.y + uy * segEnd },
      color,
      strokeWidth,
    );
    offset += dash + gap;
  }
}

function drawArrowHead(
  graphics: Graphics,
  from: WhiteboardRenderPoint,
  to: WhiteboardRenderPoint,
  color: number,
  strokeWidth: number,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-4) return;
  const ux = dx / length;
  const uy = dy / length;
  const headLength = 2.6;
  const sideX = -uy;
  const sideY = ux;
  const left = {
    x: to.x - ux * headLength + sideX * 1.05,
    y: to.y - uy * headLength + sideY * 1.05,
  };
  const right = {
    x: to.x - ux * headLength - sideX * 1.05,
    y: to.y - uy * headLength - sideY * 1.05,
  };
  drawSolidSegment(graphics, to, left, color, strokeWidth);
  drawSolidSegment(graphics, to, right, color, strokeWidth);
}

function drawLineWithTool(
  tool: "line" | "arrow" | "dashedArrow",
  graphics: Graphics,
  from: WhiteboardRenderPoint,
  to: WhiteboardRenderPoint,
  color: number,
  strokeWidth: number,
): void {
  if (tool === "dashedArrow") {
    drawDashedSegment(graphics, from, to, color, strokeWidth);
    drawArrowHead(graphics, from, to, color, strokeWidth);
    return;
  }
  if (tool === "arrow") {
    drawSolidSegment(graphics, from, to, color, strokeWidth);
    drawArrowHead(graphics, from, to, color, strokeWidth);
    return;
  }
  drawSolidSegment(graphics, from, to, color, strokeWidth);
}

function lerpPoint(from: WhiteboardRenderPoint, to: WhiteboardRenderPoint, t: number): WhiteboardRenderPoint {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 1;
  return Math.max(0, Math.min(1, progress));
}

export function renderWhiteboardDrawing(
  graphics: Graphics,
  drawing: WhiteboardRenderDrawing,
  options?: {
    revealProgress?: number;
    strokeWidth?: number;
  },
): void {
  const revealProgress = clampProgress(options?.revealProgress ?? 1);
  if (revealProgress <= 0) return;
  const strokeWidth = options?.strokeWidth ?? 1.1;

  if (drawing.type === "pen") {
    if (!isWhiteboardPenGeometry(drawing.geometry)) return;
    const points = drawing.geometry.points;
    if (points.length < 2) return;
    if (revealProgress >= 1) {
      for (let index = 1; index < points.length; index += 1) {
        const from = points[index - 1];
        const to = points[index];
        if (!from || !to) continue;
        drawSolidSegment(graphics, from, to, drawing.color, strokeWidth);
      }
      return;
    }
    const totalSegments = points.length - 1;
    const revealedSegments = revealProgress * totalSegments;
    const fullSegments = Math.floor(revealedSegments);
    const partialProgress = revealedSegments - fullSegments;
    for (let index = 1; index <= fullSegments; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      if (!from || !to) continue;
      drawSolidSegment(graphics, from, to, drawing.color, strokeWidth);
    }
    const partialStart = points[fullSegments];
    const partialEnd = points[fullSegments + 1];
    if (partialStart && partialEnd && partialProgress > 0) {
      drawSolidSegment(
        graphics,
        partialStart,
        lerpPoint(partialStart, partialEnd, partialProgress),
        drawing.color,
        strokeWidth,
      );
    }
    return;
  }

  if (!isWhiteboardLinearGeometry(drawing.geometry)) return;
  const from = drawing.geometry.start;
  const to = drawing.geometry.end;
  const revealedEnd = revealProgress >= 1 ? to : lerpPoint(from, to, revealProgress);
  drawLineWithTool(drawing.type, graphics, from, revealedEnd, drawing.color, strokeWidth);
}
