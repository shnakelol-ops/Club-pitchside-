export type PitchFlowTab = "home" | "library" | "sessions" | "plans";

type PitchFlowCoachShellProps = {
  initialTab: PitchFlowTab;
};

type BottomNavItem = {
  id: "home" | "flowlab" | "flowstats" | "whiteboard" | "library";
  label: string;
  short: string;
  path: string;
};

const BOTTOM_NAV_ITEMS: ReadonlyArray<BottomNavItem> = [
  { id: "home", label: "Home", short: "H", path: "/board" },
  { id: "flowlab", label: "FlowLab", short: "F", path: "/tacticalpad-lite-clean" },
  { id: "flowstats", label: "FlowStats", short: "S", path: "/flowstats" },
  { id: "whiteboard", label: "Whiteboard", short: "W", path: "/whiteboard" },
  { id: "library", label: "Library", short: "L", path: "/library" },
];

const BOARD_RECENT = ["Weekend Press Trigger", "Kickout Pressure 6v6", "Wide Attack Flow"];
const LIBRARY_PROBLEMS = [
  "Struggling to score",
  "Losing kickouts",
  "Too slow in attack",
  "Conceding too easy",
];
const LIBRARY_BROWSE = [
  "Attacking Systems",
  "Pressing Sessions",
  "Kickout Problems",
  "Score More",
  "Defensive Shape",
  "Week Plans",
];
const SESSION_CATEGORIES = ["Warm-Ups", "Skill Development", "Attack", "Defence"];
const PLAN_TYPES = [
  "Pre-Season",
  "Early Season",
  "Championship Prep",
  "Skill Blocks",
  "Underage Development",
  "Team Identity Plans",
];

const SHELL_CSS = `
.pf-shell {
  --pf-bg: #06150F;
  --pf-bg-deep: #03100B;
  --pf-header: #123821;
  --pf-surface: #10291B;
  --pf-card: #173D28;
  --pf-card-soft: #143421;
  --pf-card-hover: #1B4A30;
  --pf-border: #275C3B;
  --pf-primary: #7CFF72;
  --pf-primary-strong: #22C55E;
  --pf-primary-soft: rgba(124,255,114,0.14);
  --pf-primary-glow: rgba(124,255,114,0.32);
  --pf-text: #F1F7F0;
  --pf-text-muted: #8FA099;
  --pf-text-dim: #65736C;
  --pf-warning: #F5A623;
  --pf-danger: #EF4444;
  --pf-bottom-nav: rgba(6,21,15,0.92);
  min-height: 100dvh;
  background:
    radial-gradient(circle at 14% 0%, rgba(124,255,114,0.08), transparent 34%),
    radial-gradient(circle at 86% 4%, rgba(34,197,94,0.07), transparent 30%),
    linear-gradient(180deg, var(--pf-bg-deep) 0%, var(--pf-bg) 42%, #072016 100%);
  color: var(--pf-text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 14px calc(94px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.pf-shell * {
  box-sizing: border-box;
}

.pf-content {
  max-width: 520px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.pf-header-card,
.pf-card {
  border-radius: 18px;
  border: 1px solid var(--pf-border);
  background: linear-gradient(180deg, rgba(23,61,40,0.86) 0%, rgba(16,41,27,0.95) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 28px rgba(0,0,0,0.28);
  backdrop-filter: blur(8px);
}

.pf-header-card {
  padding: 16px;
  background: linear-gradient(180deg, rgba(18,56,33,0.96) 0%, rgba(16,41,27,0.95) 100%);
  position: relative;
}

.pf-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.pf-home-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--pf-border);
  background: rgba(16,41,27,0.84);
  color: var(--pf-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.pf-home-icon-btn:active {
  transform: scale(0.97);
}

.pf-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.pf-subtitle {
  margin: 6px 0 0;
  color: var(--pf-text-muted);
  font-size: 14px;
  line-height: 1.35;
}

.pf-actions {
  margin-top: 14px;
  display: flex;
  gap: 8px;
}

.pf-pill,
.pf-btn,
.pf-search,
.pf-tab {
  border-radius: 999px;
  border: 1px solid var(--pf-border);
  color: var(--pf-text);
  font-size: 13px;
  font-weight: 600;
}

.pf-pill {
  padding: 8px 12px;
  background: rgba(18,56,33,0.92);
}

.pf-btn {
  background: linear-gradient(180deg, rgba(34,197,94,0.36) 0%, rgba(27,74,48,0.95) 100%);
  box-shadow: 0 0 0 1px var(--pf-primary-soft), 0 0 12px var(--pf-primary-glow);
  padding: 8px 12px;
}

.pf-section-title {
  margin: 2px 4px 0;
  font-size: 14px;
  color: var(--pf-text-muted);
  font-weight: 650;
}

.pf-card {
  padding: 14px;
}

.pf-card + .pf-card {
  margin-top: 10px;
}

.pf-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.pf-card-text {
  margin: 6px 0 0;
  color: var(--pf-text-muted);
  font-size: 13px;
  line-height: 1.35;
}

.pf-list {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.pf-list-item {
  border-radius: 14px;
  border: 1px solid var(--pf-border);
  background: linear-gradient(180deg, rgba(20,52,33,0.95) 0%, rgba(16,41,27,0.9) 100%);
  padding: 11px 12px;
  color: var(--pf-text);
  font-size: 13px;
  font-weight: 600;
}

.pf-search {
  width: 100%;
  background: rgba(16,41,27,0.85);
  padding: 11px 14px;
  color: var(--pf-text);
  outline: none;
}

.pf-search::placeholder {
  color: var(--pf-text-dim);
}

.pf-tabs {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.pf-tab {
  background: rgba(16,41,27,0.85);
  padding: 8px 12px;
  white-space: nowrap;
}

.pf-tab.is-active {
  border-color: var(--pf-primary-strong);
  color: var(--pf-primary);
  background: var(--pf-primary-soft);
  box-shadow: 0 0 0 1px var(--pf-primary-soft), 0 0 10px var(--pf-primary-glow);
}

.pf-chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.pf-chip {
  border-radius: 12px;
  border: 1px solid var(--pf-border);
  background: rgba(20,52,33,0.92);
  padding: 10px 9px;
  color: var(--pf-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.pf-bottom-nav {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  width: min(520px, calc(100vw - 18px));
  border: 1px solid var(--pf-border);
  border-radius: 18px;
  background: var(--pf-bottom-nav);
  backdrop-filter: blur(12px);
  box-shadow: 0 14px 28px rgba(0,0,0,0.36);
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  padding: 5px;
  z-index: 50;
}

.pf-nav-item {
  position: relative;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: var(--pf-text-muted);
  display: grid;
  gap: 3px;
  justify-items: center;
  padding: 8px 2px 7px;
  font-size: 11px;
  font-weight: 600;
}

.pf-nav-icon {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid currentColor;
  display: grid;
  place-items: center;
  font-size: 10px;
  line-height: 1;
}

.pf-nav-item.is-active {
  color: var(--pf-primary);
  background: var(--pf-primary-soft);
  box-shadow: 0 0 0 1px var(--pf-primary-soft), 0 0 12px var(--pf-primary-glow);
}

.pf-nav-item.is-active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 18%;
  right: 18%;
  height: 2px;
  border-radius: 999px;
  background: var(--pf-primary);
}
`;

function navigateTo(path: string) {
  if (window.location.pathname === path) return;
  window.location.assign(path);
}

function BoardPage() {
  return (
    <>
      <div className="pf-header-card">
        <div className="pf-header-top">
          <h1 className="pf-title">PitchFlow</h1>
          <button type="button" className="pf-home-icon-btn" aria-label="Go to Home" onClick={() => navigateTo("/board")}>
            ⌂
          </button>
        </div>
        <p className="pf-subtitle">
          Built for coaches.
          <br />
          From the heart of the Galtees.
        </p>
        <div className="pf-actions">
          <span className="pf-pill">Coach</span>
          <button type="button" className="pf-btn" onClick={() => navigateTo("/tacticalpad-lite-clean")}>
            New Board
          </button>
        </div>
      </div>
      <p className="pf-section-title">Launch</p>
      <div className="pf-card">
        <p className="pf-card-title">Open</p>
        <div className="pf-chip-grid">
          <button type="button" className="pf-chip" onClick={() => navigateTo("/tacticalpad-lite-clean")}>
            FlowLab
          </button>
          <button type="button" className="pf-chip" onClick={() => navigateTo("/flowstats")}>
            FlowStats
          </button>
          <button type="button" className="pf-chip" onClick={() => navigateTo("/whiteboard")}>
            Whiteboard
          </button>
          <button type="button" className="pf-chip" onClick={() => navigateTo("/library")}>
            Library
          </button>
          <button type="button" className="pf-chip" onClick={() => navigateTo("/sessions")}>
            Sessions
          </button>
          <button type="button" className="pf-chip" onClick={() => navigateTo("/plans")}>
            Plans
          </button>
        </div>
      </div>
      <p className="pf-section-title">Recent Boards</p>
      <div className="pf-card">
        <p className="pf-card-title">Recent Boards</p>
        <div className="pf-list">
          {BOARD_RECENT.map((item) => (
            <button
              key={item}
              type="button"
              className="pf-list-item"
              onClick={() => navigateTo("/tacticalpad-lite-clean")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="pf-card">
        <p className="pf-card-title">Coach Tip</p>
        <p className="pf-card-text">
          If your attack is slow, shape your first two support runs before the pass. Build speed with structure.
        </p>
      </div>
    </>
  );
}

function LibraryPage() {
  return (
    <>
      <div className="pf-header-card">
        <h1 className="pf-title">Library</h1>
        <p className="pf-subtitle">Systems · Sessions · Plans</p>
      </div>
      <input className="pf-search" placeholder="Search systems, sessions, plans..." readOnly />
      <div className="pf-tabs" role="tablist" aria-label="Library filters">
        <button type="button" className="pf-tab is-active" onClick={() => navigateTo("/library")}>
          All
        </button>
        <button type="button" className="pf-tab" onClick={() => navigateTo("/library")}>
          Systems
        </button>
        <button type="button" className="pf-tab" onClick={() => navigateTo("/sessions")}>
          Sessions
        </button>
        <button type="button" className="pf-tab" onClick={() => navigateTo("/plans")}>
          Plans
        </button>
      </div>
      <div className="pf-card">
        <p className="pf-card-title">What&apos;s going wrong?</p>
        <div className="pf-chip-grid">
          {LIBRARY_PROBLEMS.map((problem) => (
            <div key={problem} className="pf-chip">
              {problem}
            </div>
          ))}
        </div>
      </div>
      <div className="pf-card">
        <p className="pf-card-title">Quick Browse</p>
        <div className="pf-chip-grid">
          {LIBRARY_BROWSE.map((item) => (
            <div key={item} className="pf-chip">
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SessionsPage() {
  return (
    <>
      <div className="pf-header-card">
        <h1 className="pf-title">Sessions</h1>
        <p className="pf-subtitle">Ready-to-run training sessions</p>
      </div>
      <button
        type="button"
        className="pf-btn"
        style={{ justifySelf: "start" }}
        onClick={() => navigateTo("/tacticalpad-lite-clean")}
      >
        + Create Session
      </button>
      <div className="pf-card">
        <p className="pf-card-title">Share your session</p>
        <p className="pf-card-text">Help another coach solve a problem today</p>
        <button type="button" className="pf-btn" style={{ marginTop: "10px" }} onClick={() => navigateTo("/library")}>
          Share Session
        </button>
      </div>
      <div className="pf-card">
        <p className="pf-card-title">Categories</p>
        <div className="pf-list">
          {SESSION_CATEGORIES.map((item) => (
            <div key={item} className="pf-list-item">
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PlansPage() {
  return (
    <>
      <div className="pf-header-card">
        <h1 className="pf-title">Plans</h1>
        <p className="pf-subtitle">Pre-season to championship</p>
      </div>
      <div className="pf-card">
        <p className="pf-card-title">Plan Types</p>
        <div className="pf-list">
          {PLAN_TYPES.map((item) => (
            <div key={item} className="pf-list-item">
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function renderPage(activeTab: PitchFlowTab) {
  if (activeTab === "library") return <LibraryPage />;
  if (activeTab === "sessions") return <SessionsPage />;
  if (activeTab === "plans") return <PlansPage />;
  return <BoardPage />;
}

export default function PitchFlowCoachShell({ initialTab }: PitchFlowCoachShellProps) {
  const activeNav: BottomNavItem["id"] =
    initialTab === "library" || initialTab === "sessions" || initialTab === "plans" ? "library" : "home";

  return (
    <main className="pf-shell">
      <style>{SHELL_CSS}</style>
      <div className="pf-content">{renderPage(initialTab)}</div>
      <nav className="pf-bottom-nav" aria-label="Bottom navigation">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? "pf-nav-item is-active" : "pf-nav-item"}
              onClick={() => navigateTo(item.path)}
            >
              <span className="pf-nav-icon" aria-hidden="true">
                {item.short}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
