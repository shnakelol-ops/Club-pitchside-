type PvVariation = {
  id: string;
  title: string;
  subtitle: string;
  src: string;
};

const PV_VARIATIONS: readonly PvVariation[] = [
  {
    id: "pv-shared-geometric",
    title: "1) Shared-stem geometric PV",
    subtitle: "Balanced base model: inverted-V skeleton with the left leg reused as the P stem.",
    src: "/icon-pv-1.svg",
  },
  {
    id: "pv-angular-tactical",
    title: "2) More angular tactical PV",
    subtitle: "Sharper planes and tighter angles while preserving the same shared-stem V-to-P logic.",
    src: "/icon-pv-2.svg",
  },
  {
    id: "pv-soft-premium",
    title: "3) Softer rounded premium PV",
    subtitle: "Smoother curves and softened transitions for a more elegant premium app-icon feel.",
    src: "/icon-pv-3.svg",
  },
];

const BRANDING_PREVIEW_CSS = `
.branding-preview {
  min-height: 100dvh;
  background:
    radial-gradient(circle at 14% 0%, rgba(124,255,114,0.08), transparent 34%),
    radial-gradient(circle at 86% 4%, rgba(34,197,94,0.07), transparent 30%),
    linear-gradient(180deg, #03100B 0%, #06150F 42%, #072016 100%);
  color: #f1f7f0;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  padding: 24px 16px 32px;
}

.branding-preview * {
  box-sizing: border-box;
}

.branding-preview-content {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.branding-preview-card {
  border-radius: 18px;
  border: 1px solid rgba(39, 92, 59, 0.9);
  background: linear-gradient(180deg, rgba(23,61,40,0.86) 0%, rgba(16,41,27,0.95) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 28px rgba(0,0,0,0.28);
  padding: 14px;
}

.branding-preview h1,
.branding-preview h2 {
  margin: 0;
  letter-spacing: 0.01em;
}

.branding-preview h1 {
  font-size: clamp(24px, 4vw, 30px);
}

.branding-preview h2 {
  font-size: clamp(16px, 2vw, 20px);
}

.branding-preview p {
  margin: 0;
  color: #8FA099;
  font-size: 14px;
  line-height: 1.4;
}

.branding-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.branding-preview-sample {
  border-radius: 14px;
  border: 1px solid rgba(39, 92, 59, 0.85);
  background: rgba(11, 29, 19, 0.64);
  padding: 12px;
  display: grid;
  gap: 8px;
  align-content: start;
}

.branding-preview-sample-label {
  color: #f1f7f0;
  font-size: 12px;
  font-weight: 650;
}

.branding-preview-logo {
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(2, 8, 15, 0.28));
}

.branding-preview-navbar {
  border-radius: 14px;
  border: 1px solid rgba(39, 92, 59, 0.9);
  background: rgba(6,21,15,0.92);
  box-shadow: 0 12px 24px rgba(0,0,0,0.32);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
}

.branding-preview-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.branding-preview-brand span {
  font-size: 13px;
  color: #f1f7f0;
  font-weight: 640;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.branding-preview-nav-pill {
  border-radius: 999px;
  border: 1px solid rgba(39, 92, 59, 0.95);
  color: #8FA099;
  font-size: 11px;
  padding: 6px 9px;
  background: rgba(16,41,27,0.84);
}
`;

export default function BrandingPreview() {
  return (
    <main className="branding-preview">
      <style>{BRANDING_PREVIEW_CSS}</style>
      <div className="branding-preview-content">
        <section className="branding-preview-card" style={{ display: "grid", gap: "8px" }}>
          <h1>PaircView PV mark recalibration</h1>
          <p>
            Three explorations that all start from an upside-down V, reusing the left leg as the P stem and building the bowl from that
            shared structure.
          </p>
          <p>Proportion target in this pass: dominant P read first, with a lighter supporting V base underneath.</p>
        </section>

        {PV_VARIATIONS.map((variation) => (
          <section key={variation.id} className="branding-preview-card" style={{ display: "grid", gap: "10px" }}>
            <h2>{variation.title}</h2>
            <p>{variation.subtitle}</p>
            <div className="branding-preview-grid">
              <div className="branding-preview-sample">
                <span className="branding-preview-sample-label">App icon size</span>
                <img
                  className="branding-preview-logo"
                  src={variation.src}
                  alt={`${variation.title} at app icon size`}
                  width={180}
                  height={180}
                />
              </div>
              <div className="branding-preview-sample">
                <span className="branding-preview-sample-label">Navbar/logo size</span>
                <div className="branding-preview-navbar">
                  <div className="branding-preview-brand">
                    <img className="branding-preview-logo" src={variation.src} alt={`${variation.title} in navbar`} width={28} height={28} />
                    <span>PaircView</span>
                  </div>
                  <span className="branding-preview-nav-pill">Vision Board</span>
                </div>
              </div>
              <div className="branding-preview-sample">
                <span className="branding-preview-sample-label">Favicon size (32px)</span>
                <img
                  className="branding-preview-logo"
                  src={variation.src}
                  alt={`${variation.title} at 32 pixels`}
                  width={32}
                  height={32}
                />
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
