import { Application, Container, Graphics, Text } from "pixi.js";

import { mixColor } from "./tokenDebugColor";
import { DEBUG_TOKEN_RENDERERS } from "./tokenDebugRenderers";
import {
  DEBUG_TOKEN_COLORWAYS,
  DEBUG_TOKEN_PATTERNS,
  DEBUG_TOKEN_SIZES,
  type DebugTokenColorway,
  type DebugTokenPattern,
  type DebugTokenRenderer,
  type TokenDebugView,
} from "./tokenDebugTypes";

type TokenDebugSurface = {
  destroy: () => void;
};

type TokenDebugSurfaceOptions = {
  view: TokenDebugView;
};

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const PAGE_BG = 0x06130d;
const PANEL_BG = 0x0c1f17;
const PANEL_STROKE = 0x31533f;
const TEXT_PRIMARY = 0xf4fbf2;
const TEXT_SECONDARY = 0xb9d0c1;
const FIELD_LINE = 0xddfbe2;
const PATTERN_LABELS: Record<DebugTokenPattern, string> = {
  solid: "solid",
  hoops: "hoops",
  stripes: "stripes",
  slash: "slash",
  chestDash: "chest dash",
};

function addText(
  target: Container,
  text: string,
  x: number,
  y: number,
  size: number,
  color = TEXT_PRIMARY,
  weight = "800",
): Text {
  const label = new Text({
    text,
    style: {
      fill: color,
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      fontSize: size,
      fontWeight: weight,
      letterSpacing: size > 20 ? -0.4 : 0,
    },
  });
  label.position.set(x, y);
  label.resolution = typeof window === "undefined" ? 2 : Math.max(2, Math.min(3, window.devicePixelRatio || 1));
  target.addChild(label);
  return label;
}

function drawPanel(target: Container, bounds: Bounds, radius = 18): void {
  const panel = new Graphics();
  panel
    .roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius)
    .fill({ color: PANEL_BG, alpha: 0.96 })
    .roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius)
    .stroke({ color: PANEL_STROKE, width: 1, alpha: 0.72 });
  target.addChild(panel);
}

function drawPageBackground(target: Container, width: number, height: number): void {
  const bg = new Graphics();
  bg.rect(0, 0, width, height).fill({ color: PAGE_BG });
  for (let y = 0; y < height; y += 44) {
    bg.rect(0, y, width, 1).fill({ color: 0xffffff, alpha: 0.018 });
  }
  target.addChild(bg);
}

function drawHeader(target: Container, width: number, view: TokenDebugView): number {
  const compact = width < 760;
  addText(target, "VisionDisc token renderer public-asset retest", 24, 22, compact ? 22 : 30);
  addText(
    target,
    "Debug-only /token-debug comparison. Pure Pixi geometry: no SVG assets, no production wiring.",
    24,
    compact ? 58 : 62,
    compact ? 12 : 15,
    TEXT_SECONDARY,
    "650",
  );
  addText(
    target,
    `View: ${view} | priorities: number readability, pattern clarity, pitch-native tactical broadcast markers`,
    24,
    compact ? 80 : 88,
    compact ? 11 : 13,
    0xd7eadb,
    "700",
  );
  return compact ? 116 : 132;
}

function addToken(
  target: Container,
  renderer: DebugTokenRenderer,
  colorway: DebugTokenColorway,
  pattern: DebugTokenPattern,
  size: number,
  label: string,
  x: number,
  y: number,
  selected = false,
): void {
  const token = renderer.render({
    label,
    radius: size / 2,
    baseColor: colorway.baseColor,
    accentColor: colorway.accentColor,
    pattern,
    selected,
  });
  token.position.set(x, y);
  target.addChild(token);
}

function drawComparisonBlock(
  target: Container,
  renderer: DebugTokenRenderer,
  colorway: DebugTokenColorway,
  bounds: Bounds,
): void {
  addText(target, colorway.label, bounds.x, bounds.y, 14, 0xf2f9ef, "800");
  addText(target, "14px", bounds.x + bounds.width - 160, bounds.y + 24, 10, TEXT_SECONDARY, "700");
  addText(target, "20px", bounds.x + bounds.width - 102, bounds.y + 24, 10, TEXT_SECONDARY, "700");
  addText(target, "28px", bounds.x + bounds.width - 42, bounds.y + 24, 10, TEXT_SECONDARY, "700");
  DEBUG_TOKEN_PATTERNS.forEach((pattern, index) => {
    const rowY = bounds.y + 54 + index * 46;
    addText(target, PATTERN_LABELS[pattern], bounds.x, rowY - 8, 11, TEXT_SECONDARY, "700");
    DEBUG_TOKEN_SIZES.forEach((size, sizeIndex) => {
      addToken(
        target,
        renderer,
        colorway,
        pattern,
        size,
        String(index * 3 + sizeIndex + 1),
        bounds.x + bounds.width - 144 + sizeIndex * 58,
        rowY,
      );
    });
  });
}

function drawRendererMatrix(
  target: Container,
  renderer: DebugTokenRenderer,
  y: number,
  width: number,
): number {
  const compact = width < 760;
  const margin = compact ? 14 : 24;
  const panelX = margin;
  const panelW = width - margin * 2;
  const matrixH = compact ? 916 : 330;
  const stressH = compact ? 252 : 294;
  const panelH = matrixH + stressH + 154;
  drawPanel(target, { x: panelX, y, width: panelW, height: panelH });

  addText(target, renderer.label, panelX + 18, y + 16, compact ? 19 : 22);
  addText(target, renderer.description, panelX + 18, y + (compact ? 43 : 48), compact ? 11 : 13, TEXT_SECONDARY, "650");

  if (compact) {
    let blockY = y + 88;
    DEBUG_TOKEN_COLORWAYS.forEach((colorway) => {
      drawComparisonBlock(target, renderer, colorway, {
        x: panelX + 18,
        y: blockY,
        width: panelW - 36,
        height: 276,
      });
      blockY += 284;
    });
  } else {
    const blockGap = 18;
    const blockW = (panelW - 36 - blockGap * 2) / 3;
    DEBUG_TOKEN_COLORWAYS.forEach((colorway, index) => {
      drawComparisonBlock(target, renderer, colorway, {
        x: panelX + 18 + index * (blockW + blockGap),
        y: y + 86,
        width: blockW,
        height: 268,
      });
    });
  }

  const selectedY = y + matrixH + 78;
  addText(target, "selected halo check", panelX + 18, selectedY - 10, 13, 0xf2f9ef, "800");
  DEBUG_TOKEN_COLORWAYS.forEach((colorway, colorIndex) => {
    DEBUG_TOKEN_SIZES.forEach((size, sizeIndex) => {
      const x = compact
        ? panelX + 74 + sizeIndex * 66
        : panelX + 222 + colorIndex * 190 + sizeIndex * 54;
      const yOffset = compact ? colorIndex * 50 : 0;
      addToken(target, renderer, colorway, "slash", size, String(9 + sizeIndex), x, selectedY + 30 + yOffset, true);
    });
    if (compact) {
      addText(target, colorway.label, panelX + 18, selectedY + 20 + colorIndex * 50, 10, TEXT_SECONDARY, "700");
    } else {
      addText(target, colorway.label, panelX + 148 + colorIndex * 190, selectedY + 62, 10, TEXT_SECONDARY, "700");
    }
  });

  const pitchY = y + matrixH + (compact ? 250 : 156);
  drawStressPitch(target, renderer, {
    x: panelX + 18,
    y: pitchY,
    width: panelW - 36,
    height: stressH,
  });
  return panelH + 24;
}

function drawPitch(target: Container, bounds: Bounds): void {
  const pitch = new Graphics();
  pitch
    .roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 14)
    .fill({ color: 0x154a31 })
    .roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 14)
    .stroke({ color: FIELD_LINE, width: 1.4, alpha: 0.7 });
  for (let i = 0; i < 8; i += 1) {
    const stripeX = bounds.x + (bounds.width / 8) * i;
    pitch.rect(stripeX, bounds.y, bounds.width / 16, bounds.height).fill({ color: 0xffffff, alpha: 0.028 });
  }
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  pitch
    .moveTo(cx, bounds.y + 8)
    .lineTo(cx, bounds.y + bounds.height - 8)
    .stroke({ color: FIELD_LINE, width: 1, alpha: 0.44 })
    .circle(cx, cy, Math.min(bounds.width, bounds.height) * 0.12)
    .stroke({ color: FIELD_LINE, width: 1, alpha: 0.5 })
    .roundRect(bounds.x + 12, cy - bounds.height * 0.18, bounds.width * 0.15, bounds.height * 0.36, 8)
    .stroke({ color: FIELD_LINE, width: 1, alpha: 0.42 })
    .roundRect(bounds.x + bounds.width - 12 - bounds.width * 0.15, cy - bounds.height * 0.18, bounds.width * 0.15, bounds.height * 0.36, 8)
    .stroke({ color: FIELD_LINE, width: 1, alpha: 0.42 });
  target.addChild(pitch);
}

function boardPositions(side: "left" | "right"): { x: number; y: number }[] {
  const left = [
    [0.13, 0.5],
    [0.22, 0.22],
    [0.22, 0.5],
    [0.22, 0.78],
    [0.31, 0.16],
    [0.31, 0.38],
    [0.31, 0.62],
    [0.31, 0.84],
    [0.41, 0.24],
    [0.41, 0.5],
    [0.41, 0.76],
    [0.49, 0.18],
    [0.49, 0.4],
    [0.49, 0.6],
    [0.49, 0.82],
  ];
  return left.map(([x, y]) => ({
    x: side === "left" ? x : 1 - x,
    y,
  }));
}

function drawStressPitch(target: Container, renderer: DebugTokenRenderer, bounds: Bounds, zoomedOut = false): void {
  drawPitch(target, bounds);
  addText(target, "15v15 live-board simulation", bounds.x + 12, bounds.y + 10, 12, 0xf2f9ef, "800");
  addText(target, "blue/white v red/white | selected: 6 + 11", bounds.x + 12, bounds.y + 28, 10, 0xcfe1d4, "650");
  const blue = DEBUG_TOKEN_COLORWAYS[1]!;
  const red = DEBUG_TOKEN_COLORWAYS[2]!;
  const tokenSize = zoomedOut ? Math.max(9, Math.min(14, bounds.width / 42)) : Math.max(12, Math.min(20, bounds.width / 42));
  const padX = bounds.width * 0.055;
  const padY = bounds.height * 0.13;
  const usableW = bounds.width - padX * 2;
  const usableH = bounds.height - padY * 1.65;
  boardPositions("left").forEach((point, index) => {
    addToken(
      target,
      renderer,
      blue,
      DEBUG_TOKEN_PATTERNS[index % DEBUG_TOKEN_PATTERNS.length]!,
      tokenSize,
      String(index + 1),
      bounds.x + padX + point.x * usableW,
      bounds.y + padY + point.y * usableH,
      index === 5,
    );
  });
  boardPositions("right").forEach((point, index) => {
    addToken(
      target,
      renderer,
      red,
      DEBUG_TOKEN_PATTERNS[(index + 2) % DEBUG_TOKEN_PATTERNS.length]!,
      tokenSize,
      String(index + 1),
      bounds.x + padX + point.x * usableW,
      bounds.y + padY + point.y * usableH,
      index === 10,
    );
  });
}

function drawFullView(target: Container, width: number): void {
  let y = drawHeader(target, width, "full");
  DEBUG_TOKEN_RENDERERS.forEach((renderer) => {
    y += drawRendererMatrix(target, renderer, y, width);
  });
}

function drawStressView(target: Container, width: number): void {
  const compact = width < 760;
  let y = drawHeader(target, width, "stress");
  const margin = compact ? 14 : 28;
  const pitchH = compact ? 330 : 430;
  DEBUG_TOKEN_RENDERERS.forEach((renderer) => {
    drawPanel(target, { x: margin, y, width: width - margin * 2, height: pitchH + 76 });
    addText(target, renderer.label, margin + 18, y + 16, compact ? 18 : 22);
    drawStressPitch(target, renderer, {
      x: margin + 18,
      y: y + 58,
      width: width - margin * 2 - 36,
      height: pitchH,
    });
    y += pitchH + 98;
  });
}

function drawCloseView(target: Container, width: number): void {
  const compact = width < 760;
  let y = drawHeader(target, width, "close");
  const margin = compact ? 14 : 28;
  DEBUG_TOKEN_RENDERERS.forEach((renderer) => {
    const panelH = compact ? 454 : 306;
    drawPanel(target, { x: margin, y, width: width - margin * 2, height: panelH });
    addText(target, renderer.label, margin + 18, y + 16, compact ? 18 : 22);
    const startY = y + 74;
    DEBUG_TOKEN_COLORWAYS.forEach((colorway, colorIndex) => {
      const rowY = startY + colorIndex * (compact ? 118 : 66);
      addText(target, colorway.label, margin + 18, rowY - 10, 12, TEXT_SECONDARY, "800");
      DEBUG_TOKEN_PATTERNS.forEach((pattern, patternIndex) => {
        const x = compact
          ? margin + 86 + (patternIndex % 3) * 76
          : margin + 180 + patternIndex * 92;
        const yOffset = compact ? Math.floor(patternIndex / 3) * 48 : 0;
        addToken(target, renderer, colorway, pattern, 28, String(10 + patternIndex), x, rowY + 14 + yOffset, pattern === "slash");
        addText(target, PATTERN_LABELS[pattern], x - 26, rowY + 36 + yOffset, 9, TEXT_SECONDARY, "650");
      });
    });
    y += panelH + 24;
  });
}

function drawZoomView(target: Container, width: number): void {
  const compact = width < 760;
  let y = drawHeader(target, width, "zoom");
  const margin = compact ? 14 : 28;
  DEBUG_TOKEN_RENDERERS.forEach((renderer) => {
    const panelH = compact ? 308 : 360;
    drawPanel(target, { x: margin, y, width: width - margin * 2, height: panelH });
    addText(target, renderer.label, margin + 18, y + 16, compact ? 18 : 22);
    addText(target, "zoomed-out 14px-density tactical read", margin + 18, y + 42, 11, TEXT_SECONDARY, "650");
    drawStressPitch(
      target,
      renderer,
      {
        x: margin + 18,
        y: y + 70,
        width: width - margin * 2 - 36,
        height: panelH - 92,
      },
      true,
    );
    y += panelH + 24;
  });
}

function heightForView(view: TokenDebugView, width: number): number {
  const compact = width < 760;
  if (view === "stress") return compact ? 1320 : 1660;
  if (view === "close") return compact ? 1580 : 1120;
  if (view === "zoom") return compact ? 1120 : 1320;
  return compact ? 4230 : 2510;
}

function drawScene(app: Application, host: HTMLElement, view: TokenDebugView): void {
  const width = Math.max(320, Math.floor(host.clientWidth || 1024));
  const height = heightForView(view, width);
  host.style.height = `${height}px`;
  app.renderer.resize(width, height);
  app.stage.removeChildren();
  drawPageBackground(app.stage, width, height);
  if (view === "stress") {
    drawStressView(app.stage, width);
  } else if (view === "close") {
    drawCloseView(app.stage, width);
  } else if (view === "zoom") {
    drawZoomView(app.stage, width);
  } else {
    drawFullView(app.stage, width);
  }
}

export async function createTokenDebugSurface(
  host: HTMLElement,
  options: TokenDebugSurfaceOptions,
): Promise<TokenDebugSurface> {
  const app = new Application();
  const initialWidth = Math.max(320, Math.floor(host.clientWidth || 1024));
  const initialHeight = heightForView(options.view, initialWidth);
  host.style.height = `${initialHeight}px`;
  await app.init({
    width: initialWidth,
    height: initialHeight,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });

  host.appendChild(app.canvas as HTMLCanvasElement);
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  app.canvas.style.display = "block";

  drawScene(app, host, options.view);

  const resizeObserver = new ResizeObserver(() => {
    drawScene(app, host, options.view);
  });
  resizeObserver.observe(host);

  return {
    destroy: () => {
      resizeObserver.disconnect();
      app.destroy(true, { children: true, texture: true });
    },
  };
}
