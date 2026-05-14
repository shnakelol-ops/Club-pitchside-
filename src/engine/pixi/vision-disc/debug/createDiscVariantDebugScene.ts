import { Application, Container, Graphics, Text } from "pixi.js";

import type { VisionDiscCssTokenSet, VisionDiscPattern, VisionDiscRenderOutput, VisionDiscTeamColor, VisionDiscTeamSide } from "../contracts";

type DiscVariantRenderer = (input: {
  label: string;
  number: number;
  pattern: VisionDiscPattern;
  selected: boolean;
  radiusPx: number;
  teamSide: VisionDiscTeamSide;
  teamColor: VisionDiscTeamColor;
  styleTokens: VisionDiscCssTokenSet;
  labelMode: "number" | "initials";
  scale?: number;
}) => VisionDiscRenderOutput;

export type DiscVariantPalette = {
  label: string;
  teamSide: VisionDiscTeamSide;
  teamColor: VisionDiscTeamColor;
  styleTokens: VisionDiscCssTokenSet;
};

export type DiscVariantDebugSceneOptions = {
  title: string;
  renderer: DiscVariantRenderer;
  patterns: VisionDiscPattern[];
  sizes: number[];
  palette: DiscVariantPalette;
};

export type DiscVariantDebugScene = {
  dispose: () => void;
};

const CANVAS_PADDING = 18;
const HEADER_HEIGHT = 48;
const ROW_HEIGHT = 84;
const PATTERN_LABEL_WIDTH = 112;
const TOKEN_GAP = 74;

function createBackground(width: number, height: number): Graphics {
  const background = new Graphics();
  background
    .roundRect(0, 0, width, height, 12)
    .fill({ color: 0x020617, alpha: 0.94 });
  return background;
}

function createGuideText(text: string, x: number, y: number, alpha = 0.82): Text {
  const label = new Text({
    text,
    style: {
      fill: 0xe2e8f0,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
  });
  label.position.set(x, y);
  label.alpha = alpha;
  return label;
}

export async function createDiscVariantDebugScene(
  host: HTMLElement,
  options: DiscVariantDebugSceneOptions,
): Promise<DiscVariantDebugScene> {
  const width = Math.max(680, host.clientWidth || 860);
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

  root.addChild(createGuideText(`${options.title} — ${options.palette.label}`, CANVAS_PADDING, 12, 0.95));

  const sizeStartX = CANVAS_PADDING + PATTERN_LABEL_WIDTH;
  const sizeHeaders = [...options.sizes.map((entry) => `${entry}px`), "selected halo"];
  sizeHeaders.forEach((header, index) => {
    const x = sizeStartX + index * TOKEN_GAP;
    root.addChild(createGuideText(header, x - 18, 30, 0.72));
  });

  options.patterns.forEach((pattern, rowIndex) => {
    const y = HEADER_HEIGHT + CANVAS_PADDING + rowIndex * ROW_HEIGHT;
    root.addChild(createGuideText(pattern, CANVAS_PADDING, y + 4));

    options.sizes.forEach((size, sizeIndex) => {
      const x = sizeStartX + sizeIndex * TOKEN_GAP;
      const tokenPack = options.renderer({
        label: pattern === "chestDash" ? "CD" : String(rowIndex + 1),
        number: rowIndex + 1,
        labelMode: pattern === "chestDash" ? "initials" : "number",
        teamSide: options.palette.teamSide,
        teamColor: options.palette.teamColor,
        pattern,
        selected: false,
        radiusPx: size,
        scale: 1,
        styleTokens: options.palette.styleTokens,
      });
      tokenPack.token.position.set(x, y + 40);
      root.addChild(tokenPack.token);
    });

    const selectedToken = options.renderer({
      label: "10",
      number: 10,
      labelMode: "number",
      teamSide: options.palette.teamSide,
      teamColor: options.palette.teamColor,
      pattern,
      selected: true,
      radiusPx: options.sizes[Math.floor(options.sizes.length / 2)] ?? 20,
      scale: 1,
      styleTokens: options.palette.styleTokens,
    });
    selectedToken.token.position.set(sizeStartX + options.sizes.length * TOKEN_GAP, y + 40);
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
