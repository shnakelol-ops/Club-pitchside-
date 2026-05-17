const OVERVIEW_CSS = `
.overview-root {
  --ov-bg: #050c10;
  --ov-bg-soft: #0a151c;
  --ov-surface: rgba(13, 28, 36, 0.82);
  --ov-surface-strong: rgba(13, 32, 41, 0.9);
  --ov-border: rgba(158, 189, 201, 0.2);
  --ov-text: #edf5f7;
  --ov-text-muted: #9fb5bc;
  --ov-primary: #49d18f;
  --ov-primary-soft: rgba(73, 209, 143, 0.17);
  min-height: 100dvh;
  color: var(--ov-text);
  background:
    linear-gradient(150deg, rgba(4, 18, 24, 0.94) 0%, rgba(2, 11, 16, 0.97) 48%, rgba(4, 24, 15, 0.95) 100%),
    radial-gradient(circle at 22% 12%, rgba(41, 106, 72, 0.18), transparent 40%),
    radial-gradient(circle at 80% 6%, rgba(53, 107, 135, 0.16), transparent 42%);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  padding: calc(18px + env(safe-area-inset-top, 0px)) 16px calc(30px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.overview-root * {
  box-sizing: border-box;
}

.overview-shell {
  width: min(100%, 980px);
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.overview-section {
  border: 1px solid var(--ov-border);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--ov-surface) 0%, var(--ov-surface-strong) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 34px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 16px;
}

.overview-hero {
  position: relative;
  overflow: hidden;
  padding: 18px;
}

.overview-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      to right,
      rgba(123, 209, 153, 0.07) 0,
      rgba(123, 209, 153, 0.07) 1px,
      transparent 1px,
      transparent 22px
    ),
    repeating-linear-gradient(
      to bottom,
      rgba(123, 209, 153, 0.07) 0,
      rgba(123, 209, 153, 0.07) 1px,
      transparent 1px,
      transparent 22px
    ),
    radial-gradient(circle at 28% -20%, rgba(73, 209, 143, 0.17), transparent 45%);
  pointer-events: none;
  opacity: 0.55;
}

.overview-hero > * {
  position: relative;
  z-index: 1;
}

.overview-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(115, 220, 163, 0.42);
  border-radius: 999px;
  background: rgba(10, 24, 18, 0.66);
  color: #caf0dd;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
}

.overview-title {
  margin: 10px 0 4px;
  font-size: clamp(28px, 7.3vw, 48px);
  line-height: 1.02;
  letter-spacing: -0.02em;
}

.overview-subtitle {
  margin: 0;
  font-size: clamp(14px, 3.9vw, 20px);
  color: #d2e3e8;
  font-weight: 550;
}

.overview-lead {
  margin: 14px 0 0;
  color: var(--ov-text-muted);
  line-height: 1.58;
  font-size: 14px;
  max-width: 70ch;
}

.overview-actions {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.overview-btn,
.overview-btn-outline,
.overview-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: 11px;
  text-decoration: none;
  font-weight: 650;
  font-size: 13px;
  letter-spacing: 0.01em;
  min-height: 40px;
  padding: 0 14px;
  transition: transform 120ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
}

.overview-btn {
  color: #072015;
  background: linear-gradient(180deg, #6ef2b6 0%, var(--ov-primary) 100%);
  border: 1px solid rgba(98, 227, 164, 0.75);
  box-shadow: 0 8px 18px rgba(12, 56, 38, 0.42);
}

.overview-btn-outline {
  color: #d8ecf2;
  border: 1px solid rgba(153, 189, 209, 0.4);
  background: rgba(9, 28, 39, 0.76);
}

.overview-link {
  margin-top: 10px;
  color: #d8ecf2;
  border: 1px solid rgba(153, 189, 209, 0.36);
  background: rgba(10, 25, 34, 0.74);
}

.overview-btn:hover,
.overview-btn-outline:hover,
.overview-link:hover {
  transform: translateY(-1px);
}

.overview-heading {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.01em;
}

.overview-copy {
  margin: 10px 0 0;
  color: var(--ov-text-muted);
  line-height: 1.6;
  font-size: 14px;
}

.overview-quote {
  margin: 12px 0 0;
  border-left: 3px solid rgba(88, 224, 157, 0.7);
  background: rgba(11, 27, 20, 0.62);
  border-radius: 10px;
  padding: 10px 12px;
  color: #d4f4e6;
  font-size: 14px;
  font-style: italic;
}

.overview-modules {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.overview-module {
  border-radius: 14px;
  border: 1px solid rgba(141, 178, 195, 0.25);
  background: rgba(9, 25, 34, 0.78);
  padding: 13px;
}

.overview-module h3 {
  margin: 0;
  font-size: 16px;
}

.overview-module p {
  margin: 8px 0 0;
  color: var(--ov-text-muted);
  font-size: 13.5px;
  line-height: 1.55;
}

.overview-module-limit {
  margin-top: 8px;
  color: #dcebf1;
}

.overview-beta {
  border-color: rgba(255, 191, 99, 0.46);
  background: linear-gradient(180deg, rgba(34, 26, 16, 0.77) 0%, rgba(30, 24, 15, 0.88) 100%);
}

.overview-list-grid {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.overview-list-item {
  border-radius: 12px;
  border: 1px solid rgba(126, 165, 182, 0.24);
  background: rgba(8, 22, 31, 0.76);
  padding: 10px 12px;
  color: #d8e8ee;
  font-size: 13px;
}

.overview-footer {
  border-top: 1px solid rgba(142, 172, 184, 0.22);
  margin-top: 4px;
  padding-top: 12px;
  display: grid;
  gap: 10px;
}

.overview-footer-brand {
  display: grid;
  gap: 4px;
}

.overview-footer-title {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
}

.overview-footer-tag {
  margin: 0;
  color: var(--ov-text-muted);
  font-size: 12px;
}

.overview-footer-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.overview-footer-links a {
  color: #c8dde5;
  font-size: 12px;
  text-decoration: none;
}

.overview-footer-links a:hover {
  text-decoration: underline;
}

@media (min-width: 720px) {
  .overview-root {
    padding: calc(24px + env(safe-area-inset-top, 0px)) 24px calc(36px + env(safe-area-inset-bottom, 0px));
  }

  .overview-section {
    padding: 20px;
    border-radius: 20px;
  }

  .overview-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-modules {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-list-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
`;

export default function OverviewPage() {
  return (
    <main className="overview-root">
      <style>{OVERVIEW_CSS}</style>
      <div className="overview-shell">
        <section className="overview-section overview-hero" aria-labelledby="overview-title">
          <span className="overview-badge">Platform Overview</span>
          <h1 className="overview-title" id="overview-title">
            PáircVision
          </h1>
          <p className="overview-subtitle">Visual Coaching Platform for GAA Coaches</p>
          <p className="overview-lead">
            PáircVision helps coaches plan movement, track matches, review performance, and organize coaching
            workflows - all through fast visual tools designed for real GAA environments.
          </p>
          <div className="overview-actions">
            <a className="overview-btn" href="/vision-board">
              Open Vision Board
            </a>
            <a className="overview-btn-outline" href="/flowstats">
              Open VisionStats
            </a>
          </div>
        </section>

        <section className="overview-section" aria-labelledby="philosophy-heading">
          <h2 className="overview-heading" id="philosophy-heading">
            Built for Real Coaching Environments
          </h2>
          <p className="overview-copy">
            Every workflow in PáircVision is designed to be fast, visual, and practical under sideline pressure.
            Coaches can communicate shape, intent, and decision-making without spreadsheet overload. Mobile-first
            controls keep setup simple, so the focus stays on coaching rather than admin.
          </p>
          <blockquote className="overview-quote">
            Coaching should happen visually, quickly, and clearly.
          </blockquote>
        </section>

        <section className="overview-section" aria-labelledby="modules-heading">
          <h2 className="overview-heading" id="modules-heading">
            Core Modules
          </h2>
          <div className="overview-modules">
            <article className="overview-module">
              <h3>Vision Board</h3>
              <p>
                Tactical coaching board for movement visualization, route drawing, kickout planning, and animated
                playback that helps squads see timing and spacing clearly.
              </p>
              <p className="overview-module-limit">
                Route Drawing currently supports up to 6 routed players simultaneously to keep playback smooth and
                mobile performance reliable.
              </p>
              <a className="overview-link" href="/vision-board">
                Open Vision Board
              </a>
            </article>

            <article className="overview-module">
              <h3>VisionStats</h3>
              <p>
                Live match tracking with visual event logging for halftime review and fulltime analysis, including shot
                maps, turnovers, and restart tracking.
              </p>
              <a className="overview-link" href="/flowstats">
                Open VisionStats
              </a>
            </article>

            <article className="overview-module">
              <h3>Vision Training</h3>
              <p>
                Track training performance, monitor work rate, review repeated mistakes, and capture quick session
                evaluations to support player development.
              </p>
              <a className="overview-link" href="/player-performance-tracker">
                Open Vision Training
              </a>
            </article>

            <article className="overview-module">
              <h3>Notes</h3>
              <p>
                Keep coaching notes, reminders, and session plans in one place so matchday observations and weekly
                planning stay connected.
              </p>
              <a className="overview-link" href="/notes">
                Open Notes
              </a>
            </article>
          </div>
        </section>

        <section className="overview-section overview-beta" aria-labelledby="beta-heading">
          <h2 className="overview-heading" id="beta-heading">
            Active Beta Development
          </h2>
          <p className="overview-copy">
            PáircVision is currently in active beta development. Features and workflows may continue evolving as we
            improve usability, performance, and coaching experience.
          </p>
        </section>

        <section className="overview-section" aria-labelledby="best-for-heading">
          <h2 className="overview-heading" id="best-for-heading">
            Best For
          </h2>
          <div className="overview-list-grid" role="list">
            <div className="overview-list-item" role="listitem">
              Grassroots Clubs
            </div>
            <div className="overview-list-item" role="listitem">
              Schools
            </div>
            <div className="overview-list-item" role="listitem">
              Underage Teams
            </div>
            <div className="overview-list-item" role="listitem">
              Sideline Coaches
            </div>
            <div className="overview-list-item" role="listitem">
              Player Development
            </div>
            <div className="overview-list-item" role="listitem">
              Tactical Sessions
            </div>
          </div>
        </section>

        <footer className="overview-footer">
          <div className="overview-footer-brand">
            <p className="overview-footer-title">PáircVision</p>
            <p className="overview-footer-tag">Visual Coaching Platform for GAA</p>
          </div>
          <nav className="overview-footer-links" aria-label="Footer links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
