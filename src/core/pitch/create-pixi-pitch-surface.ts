import { Application, Container } from "pixi.js";

import { BOARD_PITCH_VIEWBOX } from "./pitch-space";
import { createPitchRoot } from "./create-pitch-root";

export type CreatePixiPitchSurfaceOptions = {
  sport: "soccer" | "gaelic" | "hurling";
};

export type PixiPitchSurfaceHandle = {
  destroy: () => void;
};

function fitWorld(host: HTMLElement, app: Application, world: Container): void {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (width <= 0 || height <= 0) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  app.renderer.resolution = dpr;
  app.renderer.resize(width, height);

  const scale = Math.min(
    width / BOARD_PITCH_VIEWBOX.w,
    height / BOARD_PITCH_VIEWBOX.h,
  );
  const offsetX = (width - BOARD_PITCH_VIEWBOX.w * scale) / 2;
  const offsetY = (height - BOARD_PITCH_VIEWBOX.h * scale) / 2;
  world.scale.set(scale, scale);
  world.position.set(offsetX, offsetY);
}

export async function createPixiPitchSurface(
  host: HTMLElement,
  options: CreatePixiPitchSurfaceOptions,
): Promise<PixiPitchSurfaceHandle> {
  const app = new Application();
  await app.init({
    width: host.clientWidth || 640,
    height: host.clientHeight || 400,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });

  host.appendChild(app.canvas as HTMLCanvasElement);
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  app.canvas.style.display = "block";
  app.canvas.style.touchAction = "none";
  app.canvas.style.userSelect = "none";

  const world = new Container();
  app.stage.addChild(world);

  const pitchRoot = createPitchRoot(options.sport);
  world.addChild(pitchRoot.root);

  const resizeObserver = new ResizeObserver(() => fitWorld(host, app, world));
  resizeObserver.observe(host);
  fitWorld(host, app, world);

  return {
    destroy: () => {
      resizeObserver.disconnect();
      pitchRoot.dispose();
      try {
        host.removeChild(app.canvas as HTMLCanvasElement);
      } catch {
        // canvas may already be detached
      }
      app.destroy(true, { children: true, texture: true });
    },
  };
}

