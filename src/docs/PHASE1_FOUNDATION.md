# PHASE1_FOUNDATION

## Scope

Phase 1 only, with no feature expansion:

- clean Pixi pitch foundation
- shared coordinate core
- stats event model
- simple stats logging flow

No simulator playback systems, no legacy route/layout shell systems, and no SVG board system are included.

## What Was Extracted

### Core pitch system

- `src/core/pitch/pitch-space.ts`
- `src/core/pitch/pitch-config.ts`
- `src/core/pitch/field-spec.ts`
- `src/core/pitch/board-tokens.ts`
- `src/core/pitch/turf-baker.ts`
- `src/core/pitch/unified-pitch-markings-graphics.ts`
- `src/core/pitch/smooth-path-markings-sprite.ts`
- `src/core/pitch/gaelic-pitch-renderer.ts`
- `src/core/pitch/PixiPitchSurface.tsx`

### Coordinates

- `src/core/coordinates/pitch-coordinates.ts`

### Events + logging

- `src/core/events/stats-v1-event-kind.ts`
- `src/core/events/stats-logged-event.ts`
- `src/core/events/stats-pitch-tap.ts`
- `src/core/events/use-stats-event-log.ts`

### Stats plotting (Pixi-only logic)

- `src/core/stats/stats-event-marker-style.ts`
- `src/core/stats/draw-stats-events-pixi.ts`

## What Was Rejected

The following categories were intentionally excluded to keep Phase 1 clean:

- simulator playback and tactical animation systems
- legacy app shells, route wrappers, and layout wrappers
- old SVG board/canvas systems
- duplicate stats stacks and deprecated alternate renderers
- persistence bridges, backend coupling, and extended event pipelines
- voice/session/persistence logic from prior stats flows

## Coordinate System Explanation

The board coordinate contract is a normalized space:

- `nx`, `ny` in `[0..1]` for event storage and logging
- pitch world coordinates in a fixed view box of `160 x 100`
- transforms are handled by:
  - `boardNormToWorld(nx, ny)` for plotting
  - `worldToBoardNorm(x, y)` for inverse mapping
  - `letterboxPitchWorld(width, height)` for viewport fit
  - `viewportCssToBoardNorm(px, py, width, height)` for pointer-to-board conversion

This keeps event typing and pitch positioning stable across viewport sizes and render scale.

## Architecture Layout

```text
src/
  core/
    pitch/
      PixiPitchSurface.tsx
      gaelic-pitch-renderer.ts
      pitch-config.ts
      pitch-space.ts
      field-spec.ts
      board-tokens.ts
      turf-baker.ts
      unified-pitch-markings-graphics.ts
      smooth-path-markings-sprite.ts
    coordinates/
      pitch-coordinates.ts
    events/
      stats-v1-event-kind.ts
      stats-logged-event.ts
      stats-pitch-tap.ts
      use-stats-event-log.ts
    stats/
      stats-event-marker-style.ts
      draw-stats-events-pixi.ts
```

## Risk Controls Applied In Phase 1

- removed core surface from `/components` and centralized in `/core`
- removed legacy-style props from `PixiPitchSurface`
- surface now only mounts Pixi, mounts pitch renderer, handles logging hit capture, and draws stats markers
- stripped logging hook to reducer-only in-memory flow
- no voice/session/persistence logic in logging
- stats plotting modules are pure TypeScript + Pixi (no React imports, no UI dependencies)
