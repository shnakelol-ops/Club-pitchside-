# AGENTS.md

## Cursor Cloud specific instructions

### Overview

TacaVision (`club-pitchside`) is a frontend-only React + TypeScript PWA for Gaelic Games coaches. There is **no backend, no database, and no external API**. All data persists in browser `localStorage` and `IndexedDB`.

### Tech Stack

- **React 19** + **TypeScript 5.9** + **Vite 7** + **Pixi.js 8** (WebGL canvas rendering)
- **Package manager:** npm (lockfile: `package-lock.json`)

### Available Scripts

See `package.json` for the canonical list:

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server (default port 5173) |
| `npm run build` | Typecheck (`tsc -b`) then production build (`vite build`) |
| `npm run preview` | Serve production build locally |
| `npm run typecheck` | TypeScript type-checking only (`tsc --noEmit`) |

### Lint / Test

- **No linter or formatter** is currently configured (no ESLint, Prettier, or similar).
- **No test framework** is currently configured (no Jest, Vitest, etc.).
- Use `npm run typecheck` as the primary code-correctness check.

### Dev Server Notes

- `npm run dev -- --host 0.0.0.0` to expose on all interfaces (useful in cloud VMs).
- The Pixi.js pitch renderer requires a browser with WebGL support; headless-only environments won't render the canvas.
- The app is a single-page app with client-side routing. All routes (e.g. `/vision-board`, `/flowstats`) are handled in-browser.
