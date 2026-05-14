import { Application, Container, Graphics, Text, type TextStyleFontWeight } from "pixi.js";

import { createPhosphorToken, createProceduralPixiToken } from "../createCleanTokenRenderers";
import type { VisionDiscKitPattern, VisionDiscTokenInput, VisionDiscTokenOutput } from "../tokenRendererTypes";

type TokenDebugView = "full" | "stress" | "close" | "zoom";

type TokenDebugSurface = {
  destroy: () => void;
};

type RendererChoice = {
  label: string;
  description: string;
  render: (input: VisionDiscTokenInput) => VisionDiscTokenOutput;
};

type Colorway = {
  label: string;
  baseColor: number;
  patternColor: number;
};

const RENDERERS: readonly RendererChoice[] = [
  {
    label: "ProceduralPixiRenderer",
    description: "Flat Pixi tactical broadcast marker with thick kit marks and grounded field shadow.",
    render: createProceduralPixiToken,
  },
  {
    label: "PhosphorRenderer",
    description: "Geometric high-contrast marker with number-circle priority and tactical minimalism.",
    render: createPhosphorToken,
  },
];
const PATTERNS: readonly VisionDiscKitPattern[] = ["plain", "hoops", "stripes", "slash", "chestDash"];
const COLORWAYS: readonly Colorway[] = [
  { label: "yellow / green", baseColor: 0xfacc15, patternColor: 0x15803d },
  { label: "blue / white", baseColor: 0x2563eb, patternColor: 0xf8fafc },
  { label: "red / white", baseColor: 0xdc2626, patternColor: 0xf8fafc },
];
const SIZES = [14, 20, 28] as const;
const TEXT = 0xf4fbf2;
const MUTED = 0xb9d0c1;

function addText(
  target: Container,
  text: string,
  x: number,
  y: number,
  size: number,
  color = TEXT,
  weight: TextStyleFontWeight = "800",
): void {
  const label = new Text({
    text,
    style: {
      fill: color,
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      fontSize: size,
      fontWeight: weight,
    },
  });
  label.position.set(x, y);
  label.resolution = typeof window === "undefined" ? 2 : Math.max(2, Math.min(3, window.devicePixelRatio || 1));
  target.addChild(label);
}

function addPanel(target: Container, x: number, y: number, width: number, height: number): void {
  target.addChild(
    new Graphics()
      .roundRect(x, y, width, height, 18)
      .fill({ color: 0x0c1f17, alpha: 0.96 })
      .roundRect(x, y, width, height, 18)
      .stroke({ color: 0x31533f, width: 1, alpha: 0.72 }),
  );
}

function addToken(
  target: Container,
  renderer: RendererChoice,
  colorway: Colorway,
  pattern: VisionDiscKitPattern,
  size: number,
  label: string,
  x: number,
  y: number,
  selected = false,
): void {
  const { token } = renderer.render({
    label,
    radius: size / 2,
    baseColor: colorway.baseColor,
    patternColor: colorway.patternColor,
    pattern,
    selected,
  });
  token.position.set(x, y);
  target.addChild(token);
}

function drawHeader(target: Container, width: number, view: TokenDebugView): number {
  const compact = width < 760;
  addText(target, "Token variants: Pixi + Phosphor", 24, 22, compact ? 22 : 30);
  addText(target, "Clean VisionDisc architecture retest. Debug-only route; live menu uses same renderers.", 24, compact ? 58 : 64, compact ? 12 : 15, MUTED, "600");
  addText(target, `View: ${view}`, 24, compact ? 80 : 92, compact ? 11 : 13, 0xd7eadb, "700");
  return compact ? 116 : 132;
}

function drawPatternMatrix(target: Container, renderer: RendererChoice, y: number, width: number): number {
  const compact = width < 760;
  const margin = compact ? 14 : 24;
  const panelWidth = width - margin * 2;
  const panelHeight = compact ? 1050 : 470;
  addPanel(target, margin, y, panelWidth, panelHeight);
  addText(target, renderer.label, margin + 18, y + 16, compact ? 18 : 22);
  addText(target, renderer.description, margin + 18, y + 44, compact ? 11 : 13, MUTED, "600");

  COLORWAYS.forEach((colorway, colorIndex) => {
    const blockX = compact ? margin + 18 : margin + 18 + colorIndex * ((panelWidth - 56) / 3 + 10);
    const blockY = compact ? y + 84 + colorIndex * 306 : y + 88;
    const blockW = compact ? panelWidth - 36 : (panelWidth - 56) / 3;
    addText(target, colorway.label, blockX, blockY, 13);
    addText(target, "14px", blockX + blockW - 156, blockY + 24, 10, MUTED, "700");
    addText(target, "20px", blockX + blockW - 100, blockY + 24, 10, MUTED, "700");
    addText(target, "28px", blockX + blockW - 42, blockY + 24, 10, MUTED, "700");
    PATTERNS.forEach((pattern, patternIndex) => {
      const rowY = blockY + 56 + patternIndex * 46;
      addText(target, pattern, blockX, rowY - 8, 10, MUTED, "700");
      SIZES.forEach((size, sizeIndex) => {
        addToken(
          target,
          renderer,
          colorway,
          pattern,
          size,
          String(10 + patternIndex + sizeIndex),
          blockX + blockW - 140 + sizeIndex * 56,
          rowY,
        );
      });
    });
  });

  addText(target, "selected halo", margin + 18, y + panelHeight - 72, 12);
  COLORWAYS.forEach((colorway, index) => {
    addToken(target, renderer, colorway, "slash", 28, String(13 + index), margin + 126 + index * 86, y + panelHeight - 42, true);
  });
  return panelHeight + 24;
}

function drawPitch(target: Container, x: number, y: number, width: number, height: number): void {
  const pitch = new Graphics();
  pitch
    .roundRect(x, y, width, height, 14)
    .fill({ color: 0x154a31 })
    .roundRect(x, y, width, height, 14)
    .stroke({ color: 0xddfbe2, width: 1.4, alpha: 0.7 });
  for (let i = 0; i < 8; i += 1) {
    pitch.rect(x + (width / 8) * i, y, width / 16, height).fill({ color: 0xffffff, alpha: 0.03 });
  }
  const cx = x + width / 2;
  const cy = y + height / 2;
  pitch
    .moveTo(cx, y + 8)
    .lineTo(cx, y + height - 8)
    .stroke({ color: 0xddfbe2, width: 1, alpha: 0.44 })
    .circle(cx, cy, Math.min(width, height) * 0.12)
    .stroke({ color: 0xddfbe2, width: 1, alpha: 0.5 });
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
  return left.map(([x, y]) => ({ x: side === "left" ? x : 1 - x, y }));
}

function drawStress(target: Container, renderer: RendererChoice, y: number, width: number, zoomedOut = false): number {
  const compact = width < 760;
  const margin = compact ? 14 : 24;
  const panelWidth = width - margin * 2;
  const pitchHeight = compact ? 330 : 430;
  addPanel(target, margin, y, panelWidth, pitchHeight + 76);
  addText(target, renderer.label, margin + 18, y + 16, compact ? 18 : 22);
  const pitchX = margin + 18;
  const pitchY = y + 58;
  const pitchW = panelWidth - 36;
  drawPitch(target, pitchX, pitchY, pitchW, pitchHeight);
  addText(target, "15v15 live-board simulation", pitchX + 12, pitchY + 10, 12);
  const blue = COLORWAYS[1]!;
  const red = COLORWAYS[2]!;
  const tokenSize = zoomedOut ? Math.max(9, Math.min(14, pitchW / 42)) : Math.max(12, Math.min(20, pitchW / 42));
  const padX = pitchW * 0.055;
  const padY = pitchHeight * 0.13;
  const usableW = pitchW - padX * 2;
  const usableH = pitchHeight - padY * 1.65;
  boardPositions("left").forEach((point, index) => {
    addToken(target, renderer, blue, PATTERNS[index % PATTERNS.length]!, tokenSize, String(index + 1), pitchX + padX + point.x * usableW, pitchY + padY + point.y * usableH, index === 5);
  });
  boardPositions("right").forEach((point, index) => {
    addToken(target, renderer, red, PATTERNS[(index + 2) % PATTERNS.length]!, tokenSize, String(index + 1), pitchX + padX + point.x * usableW, pitchY + padY + point.y * usableH, index === 10);
  });
  return pitchHeight + 98;
}

function sceneHeight(view: TokenDebugView, width: number): number {
  const compact = width < 760;
  if (view === "full") return compact ? 2460 : 1220;
  if (view === "close") return compact ? 2460 : 1220;
  return compact ? 980 : 1160;
}

function drawScene(app: Application, host: HTMLElement, view: TokenDebugView): void {
  const width = Math.max(320, Math.floor(host.clientWidth || 1024));
  const height = sceneHeight(view, width);
  host.style.height = `${height}px`;
  app.renderer.resize(width, height);
  app.stage.removeChildren();
  app.stage.addChild(new Graphics().rect(0, 0, width, height).fill({ color: 0x06130d }));
  let y = drawHeader(app.stage, width, view);
  if (view === "stress" || view === "zoom") {
    RENDERERS.forEach((renderer) => {
      y += drawStress(app.stage, renderer, y, width, view === "zoom");
    });
    return;
  }
  RENDERERS.forEach((renderer) => {
    y += drawPatternMatrix(app.stage, renderer, y, width);
  });
}

export async function createTokenDebugSurface(host: HTMLElement, view: TokenDebugView): Promise<TokenDebugSurface> {
  const app = new Application();
  const initialWidth = Math.max(320, Math.floor(host.clientWidth || 1024));
  host.style.height = `${sceneHeight(view, initialWidth)}px`;
  await app.init({
    width: initialWidth,
    height: sceneHeight(view, initialWidth),
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });
  host.appendChild(app.canvas as HTMLCanvasElement);
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  app.canvas.style.display = "block";
  drawScene(app, host, view);
  const resizeObserver = new ResizeObserver(() => drawScene(app, host, view));
  resizeObserver.observe(host);
  return {
    destroy: () => {
      resizeObserver.disconnect();
      app.destroy(true, { children: true, texture: true });
    },
  };
}

export function sanitizeTokenDebugView(value: string | null): TokenDebugView {
  if (value === "stress" || value === "close" || value === "zoom") return value;
  return "full";
}
