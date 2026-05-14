import { Application, Container, Graphics, Text } from "pixi.js";

import { createVisionDiscToken } from "../createVisionDiscToken";
import type { VisionDiscCssTokenSet, VisionDiscPattern } from "../contracts";

export type VisionDiscDebugSceneOptions = {
  patterns: VisionDiscPattern[];
  sizes: number[];
  styleTokens: VisionDiscCssTokenSet;
};

export type VisionDiscDebugScene = {
  dispose: () => void;
};

const CANVAS_PADDING = 24;
const ROW_HEIGHT = 96;
const HEADER_HEIGHT = 54;
const PATTERN_LABEL_WIDTH = 128;
const TOKEN_GAP = 74;

function createBackground(width: number, height: number): Graphics {
  const background = new Graphics();
  background
    .roundRect(0, 0, width, height, 14)
    .fill({ color: 0x020617, alpha: 0.92 });
  return background;
}

function createGuideText(text: string, x: number, y: number, alpha = 0.82): Text {
  const label = new Text({
    text,
    style: {
      fill: 0xe2e8f0,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
  });
  label.position.set(x, y);
  label.alpha = alpha;
  return label;
}

export async function createVisionDiscDebugScene(
  host: HTMLElement,
  options: VisionDiscDebugSceneOptions,
): Promise<VisionDiscDebugScene> {
  const width = Math.max(760, host.clientWidth || 960);
  const height = HEADER_HEIGHT + options.patterns.length * ROW_HEIGHT + CANVAS_PADDING * 2;

  const app = new Application();
  await app.init({
    width,
    height,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
    backgroundAlpha: 0,
  });

  host.appendChild(app.canvas as HTMLCanvasElement);
  (app.canvas as HTMLCanvasElement).style.width = "100%";
  (app.canvas as HTMLCanvasElement).style.height = "auto";
  (app.canvas as HTMLCanvasElement).style.display = "block";
  (app.canvas as HTMLCanvasElement).style.borderRadius = "12px";

  const root = new Container();
  app.stage.addChild(root);
  root.addChild(createBackground(width, height));

  const title = createGuideText("Pixi VisionDisc output (isolated)", CANVAS_PADDING, 14, 0.94);
  title.style.fontSize = 14;
  root.addChild(title);

  const sizeStartX = CANVAS_PADDING + PATTERN_LABEL_WIDTH;
  const sizeHeaders = [...options.sizes.map((entry) => `${entry}px`), "selected halo"];
  sizeHeaders.forEach((header, index) => {
    const x = sizeStartX + index * TOKEN_GAP;
    root.addChild(createGuideText(header, x - 18, 36, 0.7));
  });

  options.patterns.forEach((pattern, rowIndex) => {
    const y = HEADER_HEIGHT + CANVAS_PADDING + rowIndex * ROW_HEIGHT;
    root.addChild(createGuideText(pattern, CANVAS_PADDING, y + 4));

    options.sizes.forEach((size, sizeIndex) => {
      const x = sizeStartX + sizeIndex * TOKEN_GAP;
      const tokenPack = createVisionDiscToken({
        label: pattern === "chestDash" ? "CD" : String(rowIndex + 1),
        number: rowIndex + 1,
        labelMode: pattern === "chestDash" ? "initials" : "number",
        teamSide: rowIndex % 2 === 0 ? "BLUE" : "RED",
        teamColor: rowIndex % 2 === 0 ? "blue" : "red",
        pattern,
        selected: false,
        radiusPx: size,
        scale: 1,
        styleTokens: options.styleTokens,
      });
      tokenPack.token.position.set(x, y + 44);
      root.addChild(tokenPack.token);
    });

    const selectedToken = createVisionDiscToken({
      label: "10",
      number: 10,
      labelMode: "number",
      teamSide: "BLUE",
      teamColor: "blue",
      pattern,
      selected: true,
      radiusPx: options.sizes[Math.floor(options.sizes.length / 2)] ?? 20,
      scale: 1,
      styleTokens: options.styleTokens,
    });
    selectedToken.token.position.set(sizeStartX + options.sizes.length * TOKEN_GAP, y + 44);
    root.addChild(selectedToken.token);
  });

  return {
    dispose: () => {
      try {
        host.removeChild(app.canvas as HTMLCanvasElement);
      } catch {
        // Canvas may already be detached.
      }
      app.destroy(true, { children: true, texture: true });
    },
  };
}
