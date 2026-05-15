type BrandVariant = {
  id: "a" | "b" | "c";
  label: "Direction A" | "Direction B" | "Direction C";
  chip: "Clean Tactical" | "Pitch Movement" | "Broadcast Minimal";
  title: string;
  description: string;
  src: string;
};
type PreviewMode = "all" | "dark" | "header" | "icons" | "export";

const VARIANTS: readonly BrandVariant[] = [
  {
    id: "a",
    label: "Direction A",
    chip: "Clean Tactical",
    title: "Bold PV with tactical X/O + dashed support line",
    description:
      "Readability-first PV monogram. A small tactical x and o bracket a subtle dashed tactical baseline under the letters.",
    src: "/brand-preview/wordmark-paircvision-clean.svg",
  },
  {
    id: "b",
    label: "Direction B",
    chip: "Pitch Movement",
    title: "Bold PV with pitch-line underline + movement accents",
    description:
      "PV stays dominant while a pitch-marking underline and tiny directional arrow cues add tactical-board energy.",
    src: "/brand-preview/wordmark-paircvision-painted.svg",
  },
  {
    id: "c",
    label: "Direction C",
    chip: "Broadcast Minimal",
    title: "Ultra-clean broadcast PV",
    description:
      "Most app-icon-friendly. Geometric PV with minimal support line and restrained glow for premium sports-tech presentation.",
    src: "/brand-preview/wordmark-paircvision-broadcast.svg",
  },
];

function getVisibleVariants(): readonly BrandVariant[] {
  if (typeof window === "undefined") return VARIANTS;
  const focus = new URLSearchParams(window.location.search).get("focus");
  const normalizedFocus =
    focus === "clean" ? "a" : focus === "painted" ? "b" : focus === "broadcast" ? "c" : focus;
  const focusedVariant = VARIANTS.find((item) => item.id === normalizedFocus);
  return focusedVariant ? [focusedVariant] : VARIANTS;
}

function getPreviewMode(): PreviewMode {
  if (typeof window === "undefined") return "all";
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "dark" || mode === "header" || mode === "icons" || mode === "export") {
    return mode;
  }
  return "all";
}

function PvIcon({ variantId, size }: { variantId: BrandVariant["id"]; size: number }) {
  const textStroke = variantId === "c" ? 9.3 : 8.7;
  const glowOpacity = variantId === "c" ? 0.34 : 0.22;
  const idPrefix = `${variantId}-${size}`;

  return (
    <svg width={size} height={size} viewBox="0 0 256 256" role="img" aria-label={`PV ${variantId} icon exploration`}>
      <defs>
        <linearGradient id={`pv-bg-${idPrefix}`} x1="24" y1="18" x2="232" y2="236" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0E7A4E" />
          <stop offset="1" stopColor="#0A4A34" />
        </linearGradient>
        <filter id={`pv-glow-${idPrefix}`} x="-20%" y="-20%" width="140%" height="155%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.2" floodColor="#71FFAB" floodOpacity={glowOpacity} />
        </filter>
      </defs>
      <rect x="8" y="8" width="240" height="240" rx="56" fill={`url(#pv-bg-${idPrefix})`} />
      <g filter={`url(#pv-glow-${idPrefix})`}>
        <text
          x="54"
          y="158"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth={textStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          paintOrder="stroke fill"
          fontSize="118"
          fontWeight={840}
          letterSpacing="-6"
          fontFamily="Inter, Avenir Next, Segoe UI, Arial, sans-serif"
        >
          PV
        </text>
        {variantId === "a" ? (
          <>
            <path d="M52 174L64 186" stroke="#FFFFFF" strokeWidth="6.4" strokeLinecap="round" opacity="0.86" />
            <path d="M64 174L52 186" stroke="#FFFFFF" strokeWidth="6.4" strokeLinecap="round" opacity="0.86" />
            <circle cx="198" cy="180" r="6.1" fill="none" stroke="#FFFFFF" strokeWidth="4.8" opacity="0.88" />
            <path d="M78 180H178" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" strokeDasharray="8 8" opacity="0.82" />
          </>
        ) : null}
        {variantId === "b" ? (
          <>
            <path d="M44 194H182L198 182" stroke="#FFFFFF" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M198 182L191 175" stroke="#FFFFFF" strokeWidth="4.8" strokeLinecap="round" />
            <path d="M198 182L189 183" stroke="#FFFFFF" strokeWidth="4.8" strokeLinecap="round" />
          </>
        ) : null}
        {variantId === "c" ? (
          <path d="M46 194H210" stroke="#FFFFFF" strokeWidth="4.8" strokeLinecap="round" opacity="0.88" />
        ) : null}
      </g>
    </svg>
  );
}

const BRAND_PREVIEW_CSS = `
.brand-preview {
  --bp-bg: #04120D;
  --bp-bg-deep: #020E09;
  --bp-border: rgba(51, 113, 78, 0.66);
  --bp-surface: rgba(11, 36, 24, 0.88);
  --bp-text: #F1F7F0;
  --bp-muted: #91A69B;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 15% -4%, rgba(124,255,114,0.12), transparent 36%),
    radial-gradient(circle at 88% 0%, rgba(41, 203, 124, 0.1), transparent 32%),
    linear-gradient(180deg, var(--bp-bg-deep) 0%, var(--bp-bg) 46%, #061B12 100%);
  color: var(--bp-text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  padding: 16px 14px 30px;
}

.brand-preview * {
  box-sizing: border-box;
}

.brand-preview-content {
  width: min(1080px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.brand-preview-card {
  border-radius: 18px;
  border: 1px solid var(--bp-border);
  background: linear-gradient(180deg, rgba(18,50,33,0.9) 0%, var(--bp-surface) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 34px rgba(0,0,0,0.28);
  padding: 14px;
  display: grid;
  gap: 10px;
}

.brand-preview-card h1,
.brand-preview-card h2 {
  margin: 0;
  letter-spacing: 0.01em;
}

.brand-preview-card h1 {
  font-size: clamp(24px, 7.2vw, 34px);
  line-height: 1.05;
}

.brand-preview-card h2 {
  font-size: clamp(17px, 4.9vw, 23px);
  line-height: 1.2;
}

.brand-preview-card p {
  margin: 0;
  color: var(--bp-muted);
  font-size: 13px;
  line-height: 1.4;
}

.brand-preview-chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.brand-preview-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(93, 171, 123, 0.5);
  background: rgba(20, 61, 39, 0.9);
  color: #E8FFF2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  width: fit-content;
  padding: 6px 10px;
}

.brand-preview-hero-stage {
  border-radius: 14px;
  border: 1px solid rgba(57, 118, 84, 0.6);
  background:
    radial-gradient(circle at 18% 4%, rgba(124,255,114,0.1), transparent 42%),
    radial-gradient(circle at 86% 100%, rgba(78, 201, 134, 0.1), transparent 46%),
    rgba(6, 25, 16, 0.9);
  padding: 18px 12px;
  overflow: hidden;
}

.brand-preview-wordmark {
  display: block;
  width: min(760px, 100%);
  height: auto;
  margin: 0 auto;
  filter: drop-shadow(0 10px 22px rgba(0,0,0,0.36));
}

.brand-preview-label {
  margin-top: 6px;
  text-align: center;
  color: #F1F7F0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand-preview-compare-grid,
.brand-preview-meta-grid {
  display: grid;
  gap: 9px;
}

.brand-preview-panel {
  border-radius: 12px;
  border: 1px solid rgba(57, 118, 84, 0.56);
  background: rgba(8, 28, 18, 0.88);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.brand-preview-panel.light {
  border-color: rgba(187, 214, 198, 0.85);
  background: linear-gradient(180deg, rgba(244,248,246,0.98) 0%, rgba(227,236,232,0.98) 100%);
}

.brand-preview-panel-title {
  margin: 0;
  font-size: 11px;
  color: #D3FDE2;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 700;
}

.brand-preview-panel.light .brand-preview-panel-title {
  color: #0E3828;
}

.brand-preview-header-sim {
  border-radius: 12px;
  border: 1px solid rgba(65, 132, 95, 0.56);
  background: rgba(4, 18, 12, 0.96);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.brand-preview-header-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #73FF9E;
  flex: 0 0 auto;
}

.brand-preview-header-logo {
  width: min(360px, 82%);
  height: auto;
}

.brand-preview-mobile-frame {
  width: min(320px, 100%);
  border-radius: 18px;
  border: 1px solid rgba(70, 140, 102, 0.55);
  background:
    radial-gradient(circle at 20% 0%, rgba(124,255,114,0.09), transparent 42%),
    rgba(5, 21, 14, 0.96);
  padding: 12px;
  margin: 0 auto;
}

.brand-preview-mobile-notch {
  width: 96px;
  height: 6px;
  border-radius: 999px;
  background: rgba(199, 255, 224, 0.3);
  margin: 0 auto 12px;
}

.brand-preview-mobile-wordmark {
  width: 100%;
  height: auto;
}

.brand-preview-icon-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.brand-preview-icon-item {
  display: grid;
  gap: 7px;
  justify-items: center;
  border-radius: 12px;
  border: 1px solid rgba(57, 118, 84, 0.56);
  background: rgba(5, 21, 14, 0.92);
  padding: 10px 8px;
}

.brand-preview-icon-item span {
  font-size: 10px;
  color: #CFF8DD;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 700;
}

.brand-preview-watermark-stage {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(57, 118, 84, 0.56);
  min-height: 130px;
  background:
    linear-gradient(145deg, rgba(11,42,28,0.95), rgba(5,24,15,0.98)),
    repeating-linear-gradient(90deg, transparent 0 58px, rgba(240, 255, 246, 0.05) 58px 62px);
  overflow: hidden;
}

.brand-preview-watermark-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 34%, rgba(121, 255, 164, 0.09), transparent 42%),
    linear-gradient(120deg, transparent 46%, rgba(223, 255, 236, 0.08) 50%, transparent 54%);
}

.brand-preview-watermark-logo {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: min(54%, 290px);
  height: auto;
  opacity: 0.24;
}

.brand-preview-export-large {
  border-radius: 12px;
  border: 1px solid rgba(57, 118, 84, 0.56);
  background: rgba(4, 18, 12, 0.96);
  padding: 14px 10px;
}

.brand-preview-export-large img {
  width: min(100%, 720px);
  height: auto;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 10px 22px rgba(0,0,0,0.36));
}

@media (min-width: 860px) {
  .brand-preview-compare-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .brand-preview-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;

export default function BrandPreview() {
  const visibleVariants = getVisibleVariants();
  const previewMode = getPreviewMode();

  return (
    <main className="brand-preview">
      <style>{BRAND_PREVIEW_CSS}</style>
      <div className="brand-preview-content">
        <section className="brand-preview-card">
          <h1>PV tactical monogram preview</h1>
          <p>
            Isolated branding preview only. This explores three readable PV monogram directions for dark-green tactical contexts without
            changing production naming, systems, or UI flows.
          </p>
        </section>

        {visibleVariants.map((variant) => (
          <section key={variant.id} className="brand-preview-card">
            <div className="brand-preview-chip-row">
              <span className="brand-preview-chip">{variant.label}</span>
              <span className="brand-preview-chip">{variant.chip}</span>
            </div>
            <h2>{variant.title}</h2>
            <p>{variant.description}</p>

            {previewMode === "all" || previewMode === "dark" ? (
              <div className="brand-preview-hero-stage">
                <img className="brand-preview-wordmark" src={variant.src} alt={`${variant.title} hero`} />
                <p className="brand-preview-label">{variant.label}</p>
              </div>
            ) : null}

            {previewMode === "all" || previewMode === "dark" ? (
              <div className="brand-preview-compare-grid">
                <article className="brand-preview-panel">
                  <h3 className="brand-preview-panel-title">Dark comparison</h3>
                  <div className="brand-preview-hero-stage" style={{ margin: 0, padding: "14px 10px" }}>
                    <img className="brand-preview-wordmark" src={variant.src} alt={`${variant.label} dark comparison`} />
                  </div>
                </article>
                <article className="brand-preview-panel light">
                  <h3 className="brand-preview-panel-title">Light comparison</h3>
                  <div
                    style={{
                      borderRadius: "12px",
                      border: "1px solid rgba(180, 202, 189, 0.86)",
                      background: "linear-gradient(180deg, rgba(251, 254, 253, 1) 0%, rgba(235, 241, 238, 1) 100%)",
                      padding: "14px 10px",
                    }}
                  >
                    <img className="brand-preview-wordmark" src={variant.src} alt={`${variant.label} light comparison`} />
                  </div>
                </article>
              </div>
            ) : null}

            {previewMode === "all" || previewMode === "header" || previewMode === "icons" || previewMode === "export" ? (
              <div className="brand-preview-meta-grid">
                {previewMode === "all" || previewMode === "header" ? (
                  <article className="brand-preview-panel">
                    <h3 className="brand-preview-panel-title">Mobile header previews</h3>
                    <div className="brand-preview-header-sim">
                      <span className="brand-preview-header-dot" aria-hidden="true" />
                      <img className="brand-preview-header-logo" src={variant.src} alt={`${variant.label} app header preview`} />
                    </div>
                    <div className="brand-preview-mobile-frame">
                      <div className="brand-preview-mobile-notch" aria-hidden="true" />
                      <img className="brand-preview-mobile-wordmark" src={variant.src} alt={`${variant.label} mobile preview`} />
                    </div>
                  </article>
                ) : null}

                {previewMode === "all" || previewMode === "icons" ? (
                  <article className="brand-preview-panel">
                    <h3 className="brand-preview-panel-title">Favicon + app icon previews</h3>
                    <div className="brand-preview-icon-grid">
                      <div className="brand-preview-icon-item">
                        <PvIcon variantId={variant.id} size={32} />
                        <span>Favicon</span>
                      </div>
                      <div className="brand-preview-icon-item">
                        <PvIcon variantId={variant.id} size={160} />
                        <span>App icon</span>
                      </div>
                    </div>
                  </article>
                ) : null}

                {previewMode === "all" || previewMode === "export" ? (
                  <article className="brand-preview-panel">
                    <h3 className="brand-preview-panel-title">Export watermark preview</h3>
                    <div className="brand-preview-watermark-stage">
                      <img className="brand-preview-watermark-logo" src={variant.src} alt={`${variant.label} export watermark preview`} />
                    </div>
                    {variant.id === "a" ? (
                      <>
                        <h3 className="brand-preview-panel-title">Enlarged clean export</h3>
                        <div className="brand-preview-export-large">
                          <img src={variant.src} alt="Direction A enlarged clean export" />
                        </div>
                      </>
                    ) : null}
                  </article>
                ) : null}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
