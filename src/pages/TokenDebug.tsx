import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";

import {
  applyVisionDiscCssVarsToStyle,
  createVisionDiscDebugScene,
  resolveVisionDiscCssTokensFromElement,
  type VisionDiscCssTokenSet,
  type VisionDiscDebugPreset,
  type VisionDiscPattern,
} from "../engine/pixi/vision-disc";

const PATTERNS: VisionDiscPattern[] = ["solid", "gradient", "hoops", "stripes", "slash", "chestDash"];
const SIZES = [14, 20, 28];

const PRESETS: VisionDiscDebugPreset[] = [
  {
    id: "club-blue",
    label: "Club Blue",
    description: "Balanced blue with cool halo and high-contrast label",
    tokens: {
      ringColor: "#2563eb",
      ringStrokeColor: "#93c5fd",
      discBaseColor: "#1d4ed8",
      discHighlightColor: "#60a5fa",
      discEdgeColor: "#1e3a8a",
      patternColor: "#e0f2fe",
      glyphColor: "#ffffff",
      labelColor: "#ffffff",
      labelStrokeColor: "#0f172a",
      labelPlateColor: "rgba(2, 6, 23, 0.34)",
      shadowColor: "rgba(2, 6, 23, 0.94)",
      haloColor: "#22d3ee",
    },
  },
  {
    id: "sunset-gradient",
    label: "Sunset",
    description: "Warm gradient palette for contrast stress testing",
    tokens: {
      ringColor: "#f97316",
      ringStrokeColor: "#fdba74",
      discBaseColor: "#dc2626",
      discHighlightColor: "#fb7185",
      discEdgeColor: "#7f1d1d",
      patternColor: "#ffedd5",
      glyphColor: "#fff7ed",
      labelColor: "#fff7ed",
      labelStrokeColor: "#7c2d12",
      labelPlateColor: "rgba(124, 45, 18, 0.36)",
      shadowColor: "rgba(15, 23, 42, 0.95)",
      haloColor: "#facc15",
    },
  },
  {
    id: "mono-charcoal",
    label: "Mono Charcoal",
    description: "Monochrome token to validate contour/readability",
    tokens: {
      ringColor: "#334155",
      ringStrokeColor: "#cbd5e1",
      discBaseColor: "#1f2937",
      discHighlightColor: "#64748b",
      discEdgeColor: "#0f172a",
      patternColor: "#e2e8f0",
      glyphColor: "#ffffff",
      labelColor: "#f8fafc",
      labelStrokeColor: "#020617",
      labelPlateColor: "rgba(15, 23, 42, 0.42)",
      shadowColor: "rgba(2, 6, 23, 0.96)",
      haloColor: "#38bdf8",
    },
  },
];

function patternOverlay(pattern: VisionDiscPattern, size: number): ReactElement | null {
  if (pattern === "solid") return null;
  if (pattern === "gradient") {
    return (
      <div
        style={{
          position: "absolute",
          inset: `${Math.round(size * 0.16)}px`,
          borderRadius: "999px",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--vd-disc-highlight-color) 88%, white 12%), var(--vd-disc-base-color))",
          pointerEvents: "none",
        }}
      />
    );
  }
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
    return (
      <>
        {[-0.3, 0.3].map((offset) => (
          <div
            key={`stripe-${offset}`}
            style={{
              position: "absolute",
              top: `${size * 0.21}px`,
              bottom: `${size * 0.21}px`,
              left: `${size + size * offset - size * 0.06}px`,
              width: `${size * 0.12}px`,
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
            left: "15%",
            top: "12%",
            width: "70%",
            height: "26%",
            borderRadius: "999px",
            background: "var(--vd-disc-highlight-color)",
            opacity: 0.64,
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
          minWidth: `${size * 1.14}px`,
          padding: `0 ${Math.max(2, size * 0.08)}px`,
          height: `${size * 0.52}px`,
          borderRadius: `${size * 0.18}px`,
          display: "grid",
          placeItems: "center",
          background: "var(--vd-label-plate-color)",
          color: "var(--vd-label-color)",
          fontWeight: 900,
          fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
          fontSize: `${Math.max(9, size * (label.length <= 1 ? 0.56 : 0.48))}px`,
          lineHeight: 1,
          letterSpacing: "0.2px",
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

export default function TokenDebug(): ReactElement {
  const [presetId, setPresetId] = useState(PRESETS[0]?.id ?? "");
  const pixiHostRef = useRef<HTMLDivElement | null>(null);
  const playgroundRef = useRef<HTMLDivElement | null>(null);
  const selectedPreset = useMemo(
    () => PRESETS.find((entry) => entry.id === presetId) ?? PRESETS[0]!,
    [presetId],
  );

  useEffect(() => {
    const host = pixiHostRef.current;
    const playground = playgroundRef.current;
    if (!host || !playground) return;
    let disposed = false;
    let dispose: (() => void) | null = null;

    const styleTokens: VisionDiscCssTokenSet = resolveVisionDiscCssTokensFromElement(
      playground,
      selectedPreset.tokens,
    );
    void createVisionDiscDebugScene(host, {
      patterns: PATTERNS,
      sizes: SIZES,
      styleTokens,
    }).then((scene) => {
      if (disposed) {
        scene.dispose();
        return;
      }
      dispose = scene.dispose;
    });

    return () => {
      disposed = true;
      dispose?.();
      host.innerHTML = "";
    };
  }, [selectedPreset]);

  const cssVarStyle = {
    ...applyVisionDiscCssVarsToStyle(selectedPreset.tokens),
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
          Phase 2 validation harness. HTML playground values drive Pixi rendering via CSS token mapping.
        </p>
      </header>

      <section style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        {PRESETS.map((preset) => {
          const active = preset.id === selectedPreset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setPresetId(preset.id)}
              style={{
                border: active ? "1px solid #38bdf8" : "1px solid rgba(148,163,184,0.32)",
                background: active ? "rgba(56,189,248,0.16)" : "rgba(15,23,42,0.7)",
                color: "#e2e8f0",
                borderRadius: "10px",
                padding: "8px 10px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "12px" }}>{preset.label}</div>
              <div style={{ fontSize: "11px", opacity: 0.76 }}>{preset.description}</div>
            </button>
          );
        })}
      </section>

      <section
        ref={playgroundRef}
        style={{
          ...cssVarStyle,
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "minmax(320px, 1fr) minmax(420px, 1.25fr)",
          alignItems: "start",
        }}
      >
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
            Source-of-truth token layout with CSS variables and locked geometry ratios.
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            {PATTERNS.map((pattern, rowIndex) => (
              <div
                key={`html-row-${pattern}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "92px 1fr",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.9 }}>{pattern}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {SIZES.map((size) => (
                    <HtmlVisionDiscToken
                      key={`html-token-${pattern}-${size}`}
                      pattern={pattern}
                      size={size}
                      label={pattern === "chestDash" ? "CD" : String(rowIndex + 1)}
                    />
                  ))}
                  <HtmlVisionDiscToken
                    pattern={pattern}
                    size={SIZES[1] ?? 20}
                    label="10"
                    selected
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(148,163,184,0.22)",
            borderRadius: "12px",
            padding: "12px",
            background: "rgba(15,23,42,0.62)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Pixi output</h2>
          <p style={{ margin: "6px 0 12px", fontSize: "12px", opacity: 0.78 }}>
            Isolated VisionDiscRenderer output for solid, gradient, hoops, stripes, slash, chestDash.
          </p>
          <div ref={pixiHostRef} />
        </div>
      </section>
    </main>
  );
}
