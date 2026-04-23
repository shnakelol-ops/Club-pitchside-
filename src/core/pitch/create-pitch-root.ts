import { Container, FillGradient, Graphics, GraphicsPath, Sprite, Texture, TilingSprite } from "pixi.js";

import { getPitchConfig, type PitchMarking, type PitchSport } from "./pitch-config";
import { BOARD_PITCH_VIEWBOX } from "./pitch-space";

export type PitchRootMount = {
  root: Container;
  dispose: () => void;
};

function createStripeTexture(sport: PitchSport): Texture {
  const canvas = document.createElement("canvas");
  const W = 56;
  const H = 128;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;

  const band = sport === "hurling" ? 9 : 8;
  for (let x = 0; x < W; x += band) {
    const stripe = (x / band) % 2 === 0;
    ctx.fillStyle = stripe
      ? sport === "hurling"
        ? "rgba(255,255,255,0.22)"
        : "rgba(255,255,255,0.26)"
      : "rgba(0,0,0,0.18)";
    ctx.fillRect(x, 0, band * 0.52, H);
  }
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let y = 0; y < H; y += 17) {
    ctx.fillRect(0, y, W, 2);
  }

  const tex = Texture.from(canvas);
  tex.source.style.scaleMode = "linear";
  return tex;
}

type TurfRecipe = {
  wash: { t: number; c: string }[];
  centreWash: string;
  verticalBands: number;
  grain: number;
};

function turfRecipe(sport: PitchSport): TurfRecipe {
  if (sport === "soccer") {
    return {
      wash: [
        { t: 0, c: "#050d0a" },
        { t: 0.35, c: "#10261c" },
        { t: 0.52, c: "#16382a" },
        { t: 0.68, c: "#122c22" },
        { t: 1, c: "#060f0c" },
      ],
      centreWash: "rgba(198, 228, 208, 0.065)",
      verticalBands: 3.85,
      grain: 0.01,
    };
  }
  if (sport === "hurling") {
    return {
      wash: [
        { t: 0, c: "#040e0c" },
        { t: 0.36, c: "#0f322b" },
        { t: 0.53, c: "#164a40" },
        { t: 0.7, c: "#10342e" },
        { t: 1, c: "#051210" },
      ],
      centreWash: "rgba(186, 236, 220, 0.072)",
      verticalBands: 4.05,
      grain: 0.011,
    };
  }
  return {
    wash: [
      { t: 0, c: "#05140f" },
      { t: 0.28, c: "#0f3d2c" },
      { t: 0.48, c: "#1a5c3e" },
      { t: 0.62, c: "#174a34" },
      { t: 0.78, c: "#123828" },
      { t: 1, c: "#061812" },
    ],
    centreWash: "rgba(200, 248, 218, 0.09)",
    verticalBands: 5.35,
    grain: 0.009,
  };
}

function bakeTurfWashTexture(sport: PitchSport): Texture {
  const recipe = turfRecipe(sport);
  const W = 640;
  const H = Math.max(64, Math.round(W * (100 / 160)));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return Texture.WHITE;

  const lg = ctx.createLinearGradient(0, 0, W, H);
  for (const stop of recipe.wash) lg.addColorStop(stop.t, stop.c);
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.48;
  const cy = H * 0.46;
  const rad = Math.hypot(W, H) * 0.55;
  const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
  rg.addColorStop(0, recipe.centreWash);
  rg.addColorStop(0.45, "rgba(255,255,255,0.02)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (((x * 11 + y * 5) & 511) === 0) {
        const j = (Math.sin(x * 0.05) + Math.cos(y * 0.04)) * recipe.grain * 18;
        d[i] = Math.max(0, Math.min(255, Math.round((d[i] ?? 0) + j)));
        d[i + 1] = Math.max(0, Math.min(255, Math.round((d[i + 1] ?? 0) + j * 0.96)));
        d[i + 2] = Math.max(0, Math.min(255, Math.round((d[i + 2] ?? 0) + j * 0.9)));
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = Texture.from(canvas);
  tex.source.style.scaleMode = "linear";
  return tex;
}

function parseDashArray(value?: string): number[] | null {
  if (!value || !value.trim()) return null;
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  return parts.length ? parts : null;
}

function drawDashedLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth: number,
  dash: number[],
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return;
  const ux = dx / len;
  const uy = dy / len;
  const d = dash.length === 1 ? [dash[0]!, dash[0]!] : dash;
  let t = 0;
  let i = 0;
  while (t < len - 1e-9) {
    const seg = d[i % d.length]!;
    const t1 = Math.min(len, t + Math.max(1e-6, seg));
    if (i % 2 === 0) {
      g.moveTo(x1 + ux * t, y1 + uy * t)
        .lineTo(x1 + ux * t1, y1 + uy * t1)
        .stroke({ color: stroke, width: strokeWidth, cap: "round", join: "round", alignment: 0.5 });
    }
    t = t1;
    i++;
  }
}

function lineStroke(stroke: string, strokeWidth: number) {
  return {
    color: stroke,
    width: strokeWidth,
    cap: "round" as const,
    join: "round" as const,
    alignment: 0.5 as const,
  };
}

function drawMarkings(g: Graphics, markings: readonly PitchMarking[]): void {
  for (const m of markings) {
    switch (m.kind) {
      case "line": {
        const dash = parseDashArray(m.strokeDasharray);
        if (dash) {
          drawDashedLine(g, m.x1, m.y1, m.x2, m.y2, m.stroke, m.strokeWidth, dash);
        } else {
          g.moveTo(m.x1, m.y1)
            .lineTo(m.x2, m.y2)
            .stroke(lineStroke(m.stroke, m.strokeWidth));
        }
        break;
      }
      case "rect": {
        const fill = m.fill && m.fill !== "none" ? { color: m.fill } : undefined;
        const stroke = m.stroke !== "none" && m.strokeWidth > 0
          ? lineStroke(m.stroke, m.strokeWidth)
          : undefined;
        if (fill && stroke) g.rect(m.x, m.y, m.w, m.h).fill(fill).stroke(stroke);
        else if (fill) g.rect(m.x, m.y, m.w, m.h).fill(fill);
        else if (stroke) g.rect(m.x, m.y, m.w, m.h).stroke(stroke);
        break;
      }
      case "circle": {
        const fill = m.fill && m.fill !== "none" ? { color: m.fill } : undefined;
        const stroke = m.stroke && m.stroke !== "none" && (m.strokeWidth ?? 0) > 0
          ? lineStroke(m.stroke, m.strokeWidth ?? 0)
          : undefined;
        if (fill && stroke) g.circle(m.cx, m.cy, m.r).fill(fill).stroke(stroke);
        else if (fill) g.circle(m.cx, m.cy, m.r).fill(fill);
        else if (stroke) g.circle(m.cx, m.cy, m.r).stroke(stroke);
        break;
      }
      case "ellipse": {
        const fill = m.fill && m.fill !== "none" ? { color: m.fill } : undefined;
        const stroke = m.stroke !== "none" && m.strokeWidth > 0
          ? lineStroke(m.stroke, m.strokeWidth)
          : undefined;
        if (fill && stroke) g.ellipse(m.cx, m.cy, m.rx, m.ry).fill(fill).stroke(stroke);
        else if (fill) g.ellipse(m.cx, m.cy, m.rx, m.ry).fill(fill);
        else if (stroke) g.ellipse(m.cx, m.cy, m.rx, m.ry).stroke(stroke);
        break;
      }
      case "path": {
        if (m.stroke === "none" || m.strokeWidth <= 0) break;
        const fill = m.fill && m.fill !== "none" ? { color: m.fill, alpha: m.opacity ?? 1 } : undefined;
        const stroke = lineStroke(m.stroke, m.strokeWidth);
        const path = new GraphicsPath(m.d);
        if (fill) {
          g.path(path).fill(fill).stroke({ ...stroke, cap: m.strokeLinecap ?? "round" });
        } else {
          g.path(path).stroke({ ...stroke, cap: m.strokeLinecap ?? "round" });
        }
        break;
      }
      default:
        break;
    }
  }
}

export function createPitchRoot(sport: PitchSport): PitchRootMount {
  const root = new Container();
  const disposers: Array<() => void> = [];
  const { w: vbW, h: vbH } = BOARD_PITCH_VIEWBOX;

  const panel = new Container();
  root.addChild(panel);

  const chassis = new Graphics();
  const pad = 2.95;
  const cornerR = 2.35;
  chassis.roundRect(-pad, -pad, vbW + pad * 2, vbH + pad * 2, cornerR).fill({
    color: 0x020706,
    alpha: 1,
  });
  panel.addChild(chassis);

  const face = new Container();
  face.sortableChildren = true;
  panel.addChild(face);

  const washTex = bakeTurfWashTexture(sport);
  disposers.push(() => washTex.destroy());
  const wash = new Sprite(washTex);
  wash.width = vbW;
  wash.height = vbH;
  wash.zIndex = 0;
  face.addChild(wash);

  const stripeTex = createStripeTexture(sport);
  disposers.push(() => stripeTex.destroy());
  const stripes = new TilingSprite({
    texture: stripeTex,
    width: vbW,
    height: vbH,
  });
  const verticalBands = turfRecipe(sport).verticalBands;
  const density = 2.15 / Math.max(2.8, verticalBands);
  stripes.tileScale.set(density, 2.05);
  stripes.alpha = sport === "hurling" ? 0.33 : 0.36;
  stripes.blendMode = "multiply";
  stripes.zIndex = 1;
  face.addChild(stripes);

  const vignette = new FillGradient({
    type: "radial",
    center: { x: 0.5, y: 0.48 },
    innerRadius: 0,
    outerRadius: 1,
    outerCenter: { x: 0.5, y: 0.48 },
    textureSpace: "local",
    colorStops: [
      { offset: 0.32, color: "#00000000" },
      { offset: 0.78, color: "rgba(0, 14, 10, 0.1)" },
      { offset: 1, color: "rgba(0, 18, 12, 0.2)" },
    ],
  });
  disposers.push(() => vignette.destroy());
  const depth = new Graphics();
  depth.zIndex = 2;
  depth.rect(0, 0, vbW, vbH).fill(vignette);
  depth.blendMode = "multiply";
  depth.alpha = 0.38;
  face.addChild(depth);

  const markingsGraphics = new Graphics({ roundPixels: true });
  markingsGraphics.zIndex = 4;
  const { markings } = getPitchConfig(sport);
  drawMarkings(markingsGraphics, markings);
  face.addChild(markingsGraphics);

  const sheen = new FillGradient({
    type: "linear",
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    textureSpace: "local",
    colorStops: [
      { offset: 0, color: "rgba(255, 255, 255, 0.055)" },
      { offset: 0.12, color: "rgba(255, 255, 255, 0.018)" },
      { offset: 0.55, color: "#00000000" },
      { offset: 1, color: "rgba(2, 8, 6, 0.07)" },
    ],
  });
  disposers.push(() => sheen.destroy());
  const glass = new Graphics();
  glass.zIndex = 7;
  glass.rect(0, 0, vbW, vbH).fill(sheen);
  glass.blendMode = "screen";
  glass.alpha = 0.16;
  face.addChild(glass);

  face.sortChildren();

  return {
    root,
    dispose: () => {
      for (const d of disposers) d();
      root.destroy({ children: true });
    },
  };
}
