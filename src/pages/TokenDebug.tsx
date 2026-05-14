import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";

import {
  PhosphorRenderer,
  ProceduralPixiRenderer,
  type PlayerTokenKitPattern,
  type PlayerTokenRenderer,
} from "../engine/pixi/playerTokenRenderer";

const PATTERNS: PlayerTokenKitPattern[] = ["plain", "hoops", "stripes", "slash", "chestDash"];
const COLORS = [
  0x1e3a8a,
  0x2563eb,
  0x0ea5e9,
  0x06b6d4,
  0x16a34a,
  0x84cc16,
  0xfacc15,
  0xf97316,
  0xdc2626,
  0x7f1d1d,
  0x7c3aed,
  0xec4899,
  0xffffff,
  0x6b7280,
  0x111827,
] as const;

function drawRendererRow({
  stage,
  renderer,
  label,
  top,
  startNumber,
}: {
  stage: Container;
  renderer: PlayerTokenRenderer;
  label: string;
  top: number;
  startNumber: number;
}): void {
  const heading = new Text({
    text: label,
    style: {
      fill: 0xe5f9ff,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: 0.4,
    },
  });
  heading.position.set(26, top - 44);
  stage.addChild(heading);

  COLORS.forEach((primaryColor, index) => {
    const pattern = PATTERNS[index % PATTERNS.length]!;
    const patternColor = primaryColor === 0xffffff ? 0x111827 : 0xffffff;
    const number = startNumber + index;
    const x = 48 + (index % 5) * 86;
    const y = top + Math.floor(index / 5) * 76;
    const { token } = renderer({
      label: String(number),
      number,
      teamColor: "blue",
      scale: 1,
      radius: 23,
      style: {
        primaryColor,
        secondaryColor: patternColor,
        badgeColor: primaryColor,
      },
      kitPattern: pattern,
      kitPatternColor: patternColor,
    });
    token.position.set(x, y);
    stage.addChild(token);
  });
}

function drawTokenDebug(stage: Container): void {
  stage.removeChildren();

  const background = new Graphics();
  background
    .rect(0, 0, 960, 620)
    .fill({ color: 0x08111f })
    .rect(18, 18, 924, 584)
    .stroke({ color: 0x1f9d8f, width: 2, alpha: 0.55 })
    .rect(28, 28, 904, 564)
    .stroke({ color: 0x8ee6d8, width: 1, alpha: 0.18 });
  stage.addChild(background);

  drawRendererRow({
    stage,
    renderer: ProceduralPixiRenderer,
    label: "Pixi / ProceduralPixiRenderer",
    top: 94,
    startNumber: 1,
  });
  drawRendererRow({
    stage,
    renderer: PhosphorRenderer,
    label: "Phosphor / PhosphorRenderer",
    top: 374,
    startNumber: 16,
  });
}

export default function TokenDebug() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    const app = new Application();

    void app.init({
      width: 960,
      height: 620,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
    }).then(() => {
      if (disposed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }
      host.appendChild(app.canvas as HTMLCanvasElement);
      app.canvas.style.display = "block";
      app.canvas.style.width = "100%";
      app.canvas.style.height = "auto";
      drawTokenDebug(app.stage);
    });

    return () => {
      disposed = true;
      if (app.canvas.parentElement === host) {
        host.removeChild(app.canvas as HTMLCanvasElement);
      }
      app.destroy(true, { children: true, texture: true });
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 58%, #042f2e 100%)",
        color: "#e5f9ff",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>Token Debug</h1>
        <p style={{ margin: "0 0 18px", color: "#9bd9d2" }}>
          Isolated preview for the two live tactical token renderers, all kit patterns, and the full kit color set.
        </p>
        <div
          ref={hostRef}
          style={{
            overflow: "hidden",
            borderRadius: 20,
            border: "1px solid rgba(148, 237, 224, 0.28)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.42)",
          }}
        />
      </div>
    </main>
  );
}
