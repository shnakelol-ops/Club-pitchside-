import { useEffect, useRef, type CSSProperties, type ReactElement } from "react";

import {
  applyVisionDiscCssVarsToStyle,
  createDiscVariantDebugScene,
  createJerseyDiscToken,
  createPixiFoundDiscToken,
  createVisionDiscToken,
  type DiscVariantDebugSceneOptions,
  type VisionDiscCssTokenSet,
  type VisionDiscPattern,
} from "../engine/pixi/vision-disc";

const PATTERNS: VisionDiscPattern[] = ["solid", "hoops", "stripes", "slash", "chestDash"];
const SIZES = [14, 20, 28];

const BLUE_WHITE_TOKENS: VisionDiscCssTokenSet = {
  ringColor: "#1f2a37",
  ringStrokeColor: "#314154",
  discBaseColor: "#2563eb",
  discHighlightColor: "#60a5fa",
  discEdgeColor: "#1e3a8a",
  patternColor: "#ffffff",
  glyphColor: "#ffffff",
  labelColor: "#ffffff",
  labelStrokeColor: "#0f172a",
  labelPlateColor: "rgba(15, 23, 42, 0.26)",
  shadowColor: "rgba(2, 6, 23, 0.9)",
  haloColor: "#93c5fd",
};

const YELLOW_GREEN_TOKENS: VisionDiscCssTokenSet = {
  ringColor: "#1f2a37",
  ringStrokeColor: "#314154",
  discBaseColor: "#16a34a",
  discHighlightColor: "#4ade80",
  discEdgeColor: "#14532d",
  patternColor: "#facc15",
  glyphColor: "#ffffff",
  labelColor: "#ffffff",
  labelStrokeColor: "#0f172a",
  labelPlateColor: "rgba(15, 23, 42, 0.26)",
  shadowColor: "rgba(2, 6, 23, 0.9)",
  haloColor: "#fde047",
};

function patternOverlay(pattern: VisionDiscPattern, size: number): ReactElement | null {
  if (pattern === "solid") return null;
  if (pattern === "hoops") {
    return (
      <>
        {[-0.3, 0.3].map((offset) => (
          <div
            key={`hoop-${offset}`}
            style={{
              position: "absolute",
              left: `${size * 0.21}px`,
              right: `${size * 0.21}px`,
              top: `${size + size * offset - size * 0.06}px`,
              height: `${size * 0.12}px`,
              borderRadius: "999px",
              background: "var(--vd-pattern-color)",
              opacity: 0.9,
              pointerEvents: "none",
            }}
          />
        ))}
      </>
    );
  }
  if (pattern === "stripes") {
    const stripeOffsets = size <= 20 ? [0] : [-0.38, 0.38];
    return (
      <>
        {stripeOffsets.map((offset) => (
          <div
            key={`stripe-${offset}`}
            style={{
              position: "absolute",
              top: `${size * 0.21}px`,
              bottom: `${size * 0.21}px`,
              left: `${size + size * offset - size * 0.072}px`,
              width: `${size * 0.144}px`,
              borderRadius: "999px",
              background: "var(--vd-pattern-color)",
              opacity: 0.9,
              pointerEvents: "none",
            }}
          />
        ))}
      </>
    );
  }
  if (pattern === "slash") {
    return (
      <div
        style={{
          position: "absolute",
          width: `${size * 1.5}px`,
          height: `${size * 0.12}px`,
          left: `${size * 0.25}px`,
          top: `${size * 0.95}px`,
          transform: "rotate(-38deg)",
          transformOrigin: "center",
          borderRadius: "999px",
          background: "var(--vd-pattern-color)",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: `${size * 0.48}px`,
        top: `${size * 0.76}px`,
        width: `${size * 1.04}px`,
        height: `${size * 0.1}px`,
        borderRadius: "999px",
        opacity: 0.92,
        pointerEvents: "none",
        background:
          "repeating-linear-gradient(90deg, var(--vd-pattern-color) 0px, var(--vd-pattern-color) 7px, transparent 7px, transparent 10px)",
      }}
    />
  );
}

function HtmlVisionDiscToken(props: {
  pattern: VisionDiscPattern;
  size: number;
  selected?: boolean;
  label: string;
}): ReactElement {
  const { pattern, size, selected, label } = props;
  const diameter = size * 2;
  const innerDiameter = diameter * 0.84;
  const ringThickness = diameter * 0.08;
  const isNumeric = /^\d+$/.test(label);
  const numericScale = size <= 14 ? 1.32 : size <= 20 ? 1.28 : size <= 28 ? 1.22 : 1.14;
  const labelSize = isNumeric
    ? Math.max(9, size * (label.length <= 1 ? 0.56 : 0.48) * numericScale)
    : Math.max(9, size * 0.36 * 1.04);
  return (
    <div
      style={{
        position: "relative",
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderRadius: "999px",
        background: "var(--vd-ring-color)",
        border: `${Math.max(1, ringThickness * 0.2)}px solid var(--vd-ring-stroke-color)`,
        boxSizing: "border-box",
      }}
    >
      {selected ? (
        <div
          style={{
            position: "absolute",
            inset: `${-size * 0.12}px`,
            borderRadius: "999px",
            border: `${Math.max(1, size * 0.08)}px solid var(--vd-halo-color)`,
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          width: `${innerDiameter}px`,
          height: `${innerDiameter}px`,
          borderRadius: "999px",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--vd-disc-base-color)",
          border: `${Math.max(1, ringThickness * 0.18)}px solid var(--vd-disc-edge-color)`,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "19%",
            top: "5%",
            width: "62%",
            height: "10%",
            borderRadius: "999px",
            background: "var(--vd-disc-highlight-color)",
            opacity: 0.06,
          }}
        />
      </div>
      {patternOverlay(pattern, size)}
      <div
        style={{
          position: "absolute",
          width: `${size * 0.8}px`,
          height: `${size * 0.8}px`,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -62%)",
          borderRadius: `${size * 0.2}px`,
          background: "color-mix(in srgb, var(--vd-glyph-color) 22%, transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: `${size * 0.48}px`,
          height: `${size * 0.48}px`,
          left: "50%",
          top: `${size * 0.34}px`,
          transform: "translateX(-50%)",
          borderRadius: "999px",
          background: "color-mix(in srgb, var(--vd-glyph-color) 30%, transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${size * 1.2}px`,
          transform: "translateX(-50%)",
          minWidth: `${size * 0.98}px`,
          padding: `0 ${Math.max(2, size * 0.04)}px`,
          height: `${size * 0.44}px`,
          borderRadius: `${size * 0.14}px`,
          display: "grid",
          placeItems: "center",
          background: "var(--vd-label-plate-color)",
          color: "#ffffff",
          fontWeight: 900,
          fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
          fontSize: `${labelSize}px`,
          lineHeight: 1,
          letterSpacing: isNumeric ? "0px" : "0.08px",
          textShadow:
            "-1px 0 var(--vd-label-stroke-color), 1px 0 var(--vd-label-stroke-color), 0 -1px var(--vd-label-stroke-color), 0 1px var(--vd-label-stroke-color)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${size * 0.14}px`,
          transform: "translateX(-50%)",
          width: `${size * 0.32}px`,
          height: `${Math.max(2, size * 0.14)}px`,
          borderRadius: "999px",
          background: "var(--vd-ring-stroke-color)",
          opacity: 0.8,
        }}
      />
    </div>
  );
}

function VariantSceneCard(props: {
  title: string;
  renderer: DiscVariantDebugSceneOptions["renderer"];
}): ReactElement {
  const { title, renderer } = props;
  const blueHostRef = useRef<HTMLDivElement | null>(null);
  const yellowHostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const blueHost = blueHostRef.current;
    const yellowHost = yellowHostRef.current;
    if (!blueHost || !yellowHost) return;
    let disposed = false;
    const disposers: Array<() => void> = [];

    const mount = async (
      host: HTMLDivElement,
      palette: { label: string; teamColor: "blue" | "green"; styleTokens: VisionDiscCssTokenSet },
    ) => {
      const scene = await createDiscVariantDebugScene(host, {
        title,
        renderer,
        patterns: PATTERNS,
        sizes: SIZES,
        palette: {
          label: palette.label,
          teamSide: "BLUE",
          teamColor: palette.teamColor,
          styleTokens: palette.styleTokens,
        },
      });
      if (disposed) {
        scene.dispose();
        return;
      }
      disposers.push(scene.dispose);
    };

    void mount(blueHost, {
      label: "Blue / White",
      teamColor: "blue",
      styleTokens: BLUE_WHITE_TOKENS,
    });
    void mount(yellowHost, {
      label: "Yellow / Green",
      teamColor: "green",
      styleTokens: YELLOW_GREEN_TOKENS,
    });

    return () => {
      disposed = true;
      for (const dispose of disposers) dispose();
      blueHost.innerHTML = "";
      yellowHost.innerHTML = "";
    };
  }, [renderer, title]);

  return (
    <section
      style={{
        border: "1px solid rgba(148,163,184,0.22)",
        borderRadius: "12px",
        padding: "12px",
        background: "rgba(15,23,42,0.62)",
        display: "grid",
        gap: "10px",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>{title}</h2>
      <div ref={blueHostRef} />
      <div ref={yellowHostRef} />
    </section>
  );
}

export default function TokenDebug(): ReactElement {
  const blueCssVars = {
    ...applyVisionDiscCssVarsToStyle(BLUE_WHITE_TOKENS),
  } as CSSProperties & Record<string, string>;
  const yellowCssVars = {
    ...applyVisionDiscCssVarsToStyle(YELLOW_GREEN_TOKENS),
  } as CSSProperties & Record<string, string>;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
        color: "#e2e8f0",
        padding: "18px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: "14px" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>VisionDisc /token-debug</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.86, fontSize: "13px" }}>
          Variant comparison harness (debug-only): current VisionDisc vs JerseyDiscRenderer vs PixiFoundDiscRenderer.
        </p>
      </header>

      <section style={{ display: "grid", gap: "12px", marginBottom: "14px" }}>
        <div
          style={{
            border: "1px solid rgba(148,163,184,0.22)",
            borderRadius: "12px",
            padding: "12px",
            background: "rgba(15,23,42,0.62)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>HTML playground reference</h2>
          <p style={{ margin: "6px 0 12px", fontSize: "12px", opacity: 0.78 }}>
            Source-of-truth feel samples shown for Blue/White and Yellow/Green.
          </p>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ ...blueCssVars, display: "grid", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, opacity: 0.9 }}>Blue / White</p>
              {PATTERNS.map((pattern, rowIndex) => (
                <div
                  key={`html-blue-${pattern}`}
                  style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: "8px", alignItems: "center" }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.9 }}>{pattern}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {SIZES.map((size) => (
                      <HtmlVisionDiscToken
                        key={`html-blue-token-${pattern}-${size}`}
                        pattern={pattern}
                        size={size}
                        label={pattern === "chestDash" ? "CD" : String(rowIndex + 1)}
                      />
                    ))}
                    <HtmlVisionDiscToken pattern={pattern} size={SIZES[1] ?? 20} label="10" selected />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...yellowCssVars, display: "grid", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, opacity: 0.9 }}>Yellow / Green</p>
              {PATTERNS.map((pattern, rowIndex) => (
                <div
                  key={`html-yellow-${pattern}`}
                  style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: "8px", alignItems: "center" }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.9 }}>{pattern}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {SIZES.map((size) => (
                      <HtmlVisionDiscToken
                        key={`html-yellow-token-${pattern}-${size}`}
                        pattern={pattern}
                        size={size}
                        label={pattern === "chestDash" ? "CD" : String(rowIndex + 1)}
                      />
                    ))}
                    <HtmlVisionDiscToken pattern={pattern} size={SIZES[1] ?? 20} label="10" selected />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: "12px" }}>
        <VariantSceneCard title="Current VisionDiscRenderer" renderer={createVisionDiscToken} />
        <VariantSceneCard title="JerseyDiscRenderer (debug-only)" renderer={createJerseyDiscToken} />
        <VariantSceneCard title="PixiFoundDiscRenderer (debug-only)" renderer={createPixiFoundDiscToken} />
      </section>
    </main>
  );
}
