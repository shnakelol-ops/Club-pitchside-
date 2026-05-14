import { Application, Container, Graphics } from "pixi.js";

import { createTacticalPitchVisualRoot } from "../../../tactical-lite/pixi/renderTacticalPitch";
import { createViewportMapper } from "./viewport-mapper";

export type V2TacticalSurface = {
  reflow: () => void;
  destroy: () => void;
};

const WORLD_SIZE = { width: 160, height: 100 } as const;

export async function createV2TacticalSurface(host: HTMLElement): Promise<V2TacticalSurface> {
  const app = new Application();
  await app.init({
    width: host.clientWidth || 800,
    height: host.clientHeight || 520,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });

  host.appendChild(app.canvas as HTMLCanvasElement);
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  app.canvas.style.display = "block";

  const world = new Container();
  app.stage.addChild(world);

  const pitchMount = createTacticalPitchVisualRoot("gaelic", { theme: "default" });
  world.addChild(pitchMount.root);

  const pathGraphic = new Graphics();
  world.addChild(pathGraphic);

  const tokenGraphic = new Graphics();
  world.addChild(tokenGraphic);

  const tokenPoint = { x: 35, y: 52 };
  const pathPoints = [
    { x: 18, y: 72 },
    { x: 35, y: 52 },
    { x: 58, y: 34 },
  ] as const;

  function render(mapper = createViewportMapper(WORLD_SIZE, { width: host.clientWidth || 800, height: host.clientHeight || 520 })): void {
    world.scale.set(mapper.transform.scale, mapper.transform.scale);
    world.position.set(mapper.transform.offsetX, mapper.transform.offsetY);

    pathGraphic.clear();
    const p0 = mapper.normalizedToWorld(pathPoints[0]!);
    const p1 = mapper.normalizedToWorld(pathPoints[1]!);
    const p2 = mapper.normalizedToWorld(pathPoints[2]!);
    pathGraphic.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ color: 0xfacc15, width: 0.8, alpha: 0.95, cap: "round", join: "round" });

    tokenGraphic.clear();
    const tokenWorld = mapper.normalizedToWorld(tokenPoint);
    tokenGraphic.circle(tokenWorld.x, tokenWorld.y, 3.8).fill(0x2563eb).stroke({ color: 0xe2e8f0, width: 0.45 });
  }

  function reflow(): void {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width <= 0 || height <= 0) return;
    app.renderer.resolution = Math.min(2, window.devicePixelRatio || 1);
    app.renderer.resize(width, height);
    const mapper = createViewportMapper(WORLD_SIZE, { width, height });
    render(mapper);
  }

  const resizeObserver = new ResizeObserver(() => reflow());
  resizeObserver.observe(host);

  render();

  return {
    reflow,
    destroy: () => {
      resizeObserver.disconnect();
      pitchMount.dispose();
      app.destroy(true, { children: true, texture: true, textureSource: true });
    },
  };
}
