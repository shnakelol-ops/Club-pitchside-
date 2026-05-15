type BrandVariant = {
  id: "clean" | "painted" | "broadcast";
  label: "Clean" | "Painted" | "Broadcast";
  title: string;
  description: string;
  src: string;
};

const VARIANTS: readonly BrandVariant[] = [
  {
    id: "clean",
    label: "Clean",
    title: "Variant A — Clean Pitch Line",
    description: "Bold minimal geometry with thick white pitch-line treatment and rounded painted ends.",
    src: "/brand-preview/wordmark-paircvision-clean.svg",
  },
  {
    id: "painted",
    label: "Painted",
    title: "Variant B — Painted Field",
    description: "Soft feathering and subtle field-paint texture while keeping premium readability.",
    src: "/brand-preview/wordmark-paircvision-painted.svg",
  },
  {
    id: "broadcast",
    label: "Broadcast",
    title: "Variant C — Broadcast Hybrid",
    description: "A modern sports-broadcast profile with tactical accenting and controlled glow.",
    src: "/brand-preview/wordmark-paircvision-broadcast.svg",
  },
];

function getVisibleVariants(): readonly BrandVariant[] {
  if (typeof window === "undefined") return VARIANTS;
  const focus = new URLSearchParams(window.location.search).get("focus");
  const focusedVariant = VARIANTS.find((item) => item.id === focus);
  return focusedVariant ? [focusedVariant] : VARIANTS;
}

function BrandIconExploration({ variantId, size }: { variantId: BrandVariant["id"]; size: number }) {
  const isBroadcast = variantId === "broadcast";
  const isPainted = variantId === "painted";
  const textStroke = isBroadcast ? 10 : isPainted ? 9 : 8;
  const accentStroke = isBroadcast ? 13 : isPainted ? 12 : 11;

  return (
    <svg width={size} height={size} viewBox="0 0 256 256" role="img" aria-label={`PáircVision ${variantId} icon exploration`}>
      <defs>
        <linearGradient id={`icon-bg-${variantId}`} x1="24" y1="18" x2="232" y2="236" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0E7A4E" />
          <stop offset="1" stopColor="#0A4A34" />
        </linearGradient>
        <filter id={`icon-glow-${variantId}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation={isBroadcast ? 4 : 3} floodColor="#6EFFA7" floodOpacity={isBroadcast ? 0.42 : 0.24} />
        </filter>
      </defs>
      <rect x="8" y="8" width="240" height="240" rx="56" fill={`url(#icon-bg-${variantId})`} />
      <g filter={`url(#icon-glow-${variantId})`}>
        <text
          x="58"
          y="162"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth={textStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          paintOrder="stroke fill"
          fontSize="118"
          fontWeight={isBroadcast ? 840 : 810}
          letterSpacing="-2"
          fontFamily="Inter, Avenir Next, Segoe UI, Arial, sans-serif"
        >
          Pa
        </text>
        <path
          d="M118 77L148 56"
          stroke="#FFFFFF"
          strokeWidth={accentStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isPainted ? 0.9 : 1}
        />
      </g>
    </svg>
  );
}

const BRAND_PREVIEW_CSS = `
.brand-preview {
  --bp-bg: #04120D;
  --bp-bg-deep: #020E09;
  --bp-border: rgba(51, 113, 78, 0.64);
  --bp-surface: rgba(11, 36, 24, 0.88);
  --bp-text: #F1F7F0;
  --bp-muted: #92A89D;
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

.brand-preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(93, 171, 123, 0.5);
  background: rgba(20, 61, 39, 0.9);
  color: #E8FFF2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
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
  padding: 16px 12px;
  overflow: hidden;
}

.brand-preview-wordmark {
  display: block;
  width: min(860px, 100%);
  height: auto;
  margin: 0 auto;
  filter: drop-shadow(0 10px 22px rgba(0,0,0,0.36));
}

.brand-preview-label {
  margin-top: 8px;
  text-align: center;
  color: #F1F7F0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand-preview-meta-grid {
  margin-top: 10px;
  display: grid;
  gap: 9px;
}

.brand-preview-meta-item {
  border-radius: 12px;
  border: 1px solid rgba(57, 118, 84, 0.56);
  background: rgba(8, 28, 18, 0.88);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.brand-preview-meta-title {
  margin: 0;
  font-size: 11px;
  color: #D3FDE2;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 700;
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
  justify-items: center;
}

.brand-preview-icon-item {
  display: grid;
  gap: 7px;
  justify-items: center;
  width: 100%;
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

@media (min-width: 860px) {
  .brand-preview-meta-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch;
  }
}
`;

export default function BrandPreview() {
  const visibleVariants = getVisibleVariants();

  return (
    <main className="brand-preview">
      <style>{BRAND_PREVIEW_CSS}</style>
      <div className="brand-preview-content">
        <section className="brand-preview-card" style={{ display: "grid", gap: "8px" }}>
          <h1>PáircVision wordmark preview</h1>
          <p>
            Isolated visual exploration only. This page tests pitch-line inspired premium wordmarks without changing production naming or
            app branding flows.
          </p>
        </section>

        {visibleVariants.map((variant) => (
          <section key={variant.id} className="brand-preview-card" style={{ display: "grid", gap: "10px" }}>
            <span className="brand-preview-badge">{variant.label}</span>
            <h2>{variant.title}</h2>
            <p>{variant.description}</p>

            <div className="brand-preview-hero-stage">
              <img className="brand-preview-wordmark" src={variant.src} alt={`${variant.title} wordmark`} />
              <p className="brand-preview-label">{variant.label}</p>
            </div>

            <div className="brand-preview-meta-grid">
              <article className="brand-preview-meta-item">
                <h3 className="brand-preview-meta-title">App-header preview sizing</h3>
                <div className="brand-preview-header-sim">
                  <span className="brand-preview-header-dot" aria-hidden="true" />
                  <img className="brand-preview-header-logo" src={variant.src} alt={`${variant.label} app-header preview`} />
                </div>
              </article>

              <article className="brand-preview-meta-item">
                <h3 className="brand-preview-meta-title">Mobile preview sizing</h3>
                <div className="brand-preview-mobile-frame">
                  <div className="brand-preview-mobile-notch" aria-hidden="true" />
                  <img className="brand-preview-mobile-wordmark" src={variant.src} alt={`${variant.label} mobile preview`} />
                </div>
              </article>

              <article className="brand-preview-meta-item">
                <h3 className="brand-preview-meta-title">Favicon / app icon exploration</h3>
                <div className="brand-preview-icon-grid">
                  <div className="brand-preview-icon-item">
                    <BrandIconExploration variantId={variant.id} size={32} />
                    <span>Favicon</span>
                  </div>
                  <div className="brand-preview-icon-item">
                    <BrandIconExploration variantId={variant.id} size={160} />
                    <span>App icon</span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
