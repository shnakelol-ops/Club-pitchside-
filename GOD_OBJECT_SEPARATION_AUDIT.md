# GOD OBJECT SEPARATION AUDIT

## 1) Executive summary

`src/engine/pixi/createTacticalPadLiteSurface.ts` is currently a **God Object** because it centralizes almost every runtime concern for the tactical board into a single factory/module:
- Pixi bootstrapping and stage/layer wiring.
- Pitch visual mount lifecycle.
- Player/token creation and interaction wiring.
- Item (cones/balls/etc.) rendering and drag logic.
- Drawing tool orchestration (through delegated controller, but surface-level orchestration remains local).
- Playback/timeline state and interpolation.
- Input mode arbitration and pointer routing.
- Snapshot/state import/export and board-level persistence shape.
- Reflow/resize and viewport mapping.
- Teardown/destruction.

This concentration is visible in the public API breadth alone (`setStart`, `addPhase`, `play`, draw tool controls, item controls, player patching, import/export, reset/reflow/destroy, etc.).

### Is it safe to separate?
**Yes, but only with phased extraction and strict behavioral parity checks.**
The file contains many seams already (controller delegation, helper-style pure functions, coordinate mappers), so separation is viable. But there is also high mutation coupling via shared closure state (`players`, `phases`, `activeDrag`, `itemMode`, `isPlaying`, `mapper`, etc.), which raises regression risk if extraction is attempted as a “big bang.”

### Main risks
- Hidden coupling between input locks and playback flags (`isPlaying`/`isPaused`) and tool modes.
- Entity identity/index coupling in phase snapshots (player array index ordering assumptions).
- Performance regressions if ticker/update sequencing changes.
- Subtle pointer regressions (drag thresholds, pointerId matching, touch hit-area scaling).
- Serialization compatibility breaks if board state shape changes prematurely.

---

## 2) Responsibility map

Below is where `createTacticalPadLiteSurface.ts` currently owns responsibilities.

### Pixi app/stage setup
- Pixi `Application`/stage ownership and ticker callbacks are managed inside the surface factory.
- Canvas touch behavior and lifecycle hooks are configured here.

### Pitch rendering
- Imports and mounts pitch visual root (`createTacticalPitchVisualRoot`), and manages rendering layers around it.

### Player rendering
- Creates player entities from seeds.
- Positions players based on mapper transforms.
- Re-renders/patches player visuals when style/kit changes.

### Token rendering
- Chooses token renderer via `resolvePlayerTokenRenderer` and token style sanitization.
- Manages token shadow/scale animation targets during drag.

### Movement/playback
- Stores `startPositions`, `phases`, `playbackPath`, segment index, elapsed time.
- Executes per-frame interpolation in ticker-driven playback step.
- Handles pause/resume/cancel and play mode selection.

### Drawing tools
- Delegates shape drafting/commit to `createTacticalDrawingController`.
- Still owns high-level tool gating (when drawing is allowed vs move mode).
- Owns draw tool/color state and exposes draw API.

### Pointer/touch input
- Central pointer routing for players, items, and drawing layer.
- Pointer identity tracking (`pointerId`) and drag threshold handling.
- Input lock arbitration during playback and tool changes.

### Coordinate transforms
- Uses normalized 0–100 domain with clamp helpers.
- Converts stage/viewport/world/normalized coordinates for interaction and rendering.

### Viewport scaling
- Reflow/resize path creates mapper with letterbox transform and reapplies positions + hit areas.

### Save/load/export
- Exposes `exportBoardState` / `importBoardState`.
- Normalizes/sanitizes imported snapshots, phases, drawings, team config, etc.
- Supports image export through renderer extraction.

### Undo/redo
- Partial undo exists:
  - phase undo (`undoPhase`)
  - drawing undo (`undoWhiteboardStroke`) via drawing controller
- No generalized global undo/redo timeline across all action types.

### State management
- Massive closure-based mutable state: players, items, drag state, tool state, playback state, phase state, mapper, selected IDs.
- No explicit domain store boundaries.

### Cleanup/destroy lifecycle
- Removes listeners, stops ticker, destroys graphics/app resources through `destroy` path.

---

## 3) Dependency map

### What files import this file
Primary consumer:
- `src/pages/TacticalPadLiteClean.tsx`
  - imports factory + many surface types/helpers (`createTacticalPadLiteSurface`, `ItemMode`, kit types, token style types, etc.)

Secondary usage paths:
- `src/features/quickboard/storage/quickboard-snapshot.ts`
  - imports `TacticalBoardState` and `TacticalPadLiteSurface` types for snapshot bridge.

### What this file imports
- Pixi primitives (`Application`, `Container`, `Graphics`, `Text`).
- Viewport/coordinate utilities (`createWorldViewport`, normalization constants).
- Token rendering modules (`createPremiumPlayerToken`, `playerTokenRenderer`, micro-athlete types).
- Pitch renderer (`renderTacticalPitch`).
- Drawing subsystem (`createTacticalDrawingController`, drawing types/sanitizers).

### Functions/types safe to extract first
- Pure clamps/sanitizers/constants:
  - `clampWorld`, `clampTeamCount`, playback speed sanitizer, kit color sanitizers.
- Snapshot pure helpers:
  - clone/normalize helper functions not touching Pixi internals.
- Serialization shape utilities (if kept backward-compatible).
- Pointer utility helpers that are stateless.

### Functions/types risky to extract early
- Anything mutating or depending on shared closure state and sequencing:
  - drag lifecycle (`activeDrag`, thresholds, pointer matching).
  - playback stepping (`stepPlayback`) and start/cancel flow.
  - reflow + mapper + hit-area sync.
  - token rerender/patch routines that interact with Pixi scene graph ordering.
- Import/export routines that currently implicitly coordinate with players/items/drawings arrays and order.

---

## 4) Separation plan (phased)

## Phase A — pure helpers/constants
Goal: remove obvious static/pure logic without touching runtime behavior.
- Extract constants and pure sanitizer/clamp functions.
- Extract snapshot cloning/normalization helpers.
- Keep API and call sites unchanged.

## Phase B — coordinates/viewport
Goal: isolate mapper integration and coordinate conversion edge handling.
- Wrap coordinate conversion flows into a small boundary module.
- Centralize hit-area scaling helpers per entity type.
- Keep `createWorldViewport` contract unchanged.

## Phase C — rendering setup
Goal: split scene graph composition from gameplay state.
- Extract layer creation/mounting (pitch layer, players layer, items, drawing layers).
- Extract token pack creation + token rerender helpers.
- Maintain current z-order and child index behavior exactly.

## Phase D — input controller
Goal: isolate pointer routing and drag state machine.
- Move pointer identity + threshold + drag state transitions into dedicated controller.
- Preserve current rules:
  - playback lock precedence
  - tool mode precedence
  - item mode gating
- Keep existing callbacks from surface until later phases.

## Phase E — drawing controller boundary hardening
Goal: reduce surface ownership of drawing orchestration.
- Surface should stop owning drawing pointer flow details.
- Promote drawing controller to own its active tool gating contract.
- Surface remains only integration host for layer and persistence handoff.

## Phase F — playback/timeline controller
Goal: make phase/timeline a standalone domain module.
- Extract `startPositions`, `phases`, `playbackPath`, pause/play state into timeline controller.
- Expose deterministic methods: setStart/addPhase/undoPhase/play/pause/resume/step.
- Keep linear interpolation first; do not introduce new path model during extraction.

## Phase G — persistence/export
Goal: isolate board schema and IO-facing shape.
- Extract board state serializer/deserializer with explicit version handling.
- Keep backward compatibility for current `movementPaths` aliasing until migration completes.
- Separate image export concerns from board JSON export.

---

## 5) Files to create later (proposed)

Suggested architecture (future, not now):

- `src/engine/tactical-surface/createTacticalSurface.ts`
- `src/engine/tactical-surface/types.ts`
- `src/engine/tactical-surface/constants.ts`
- `src/engine/tactical-surface/state/surface-session-state.ts`
- `src/engine/tactical-surface/viewport/viewport-controller.ts`
- `src/engine/tactical-surface/render/scene-layers.ts`
- `src/engine/tactical-surface/render/player-renderer.ts`
- `src/engine/tactical-surface/render/item-renderer.ts`
- `src/engine/tactical-surface/input/pointer-router.ts`
- `src/engine/tactical-surface/input/player-drag-controller.ts`
- `src/engine/tactical-surface/input/item-drag-controller.ts`
- `src/engine/tactical-surface/playback/timeline-controller.ts`
- `src/engine/tactical-surface/playback/interpolator.ts`
- `src/engine/tactical-surface/persistence/board-state-serializer.ts`
- `src/engine/tactical-surface/persistence/board-state-deserializer.ts`
- `src/engine/tactical-surface/export/image-exporter.ts`

(Existing drawing modules can remain under `src/features/quickboard/drawing/*` initially, then move later.)

---

## 6) Do-not-touch list (first extraction pass)

1. **Public API contract** of `TacticalPadLiteSurface` (method names/signatures/semantics).
2. **Board state shape** consumed by quickboard storage (including `movementPaths` compatibility field).
3. **Pointer behavior semantics**:
   - drag threshold values
   - pointerId matching behavior
   - playback input lock behavior
4. **Coordinate domain** (normalized 0–100) and mapper transform math.
5. **Layer z-order and token child index ordering**.
6. **Playback timing constants/behavior** unless specifically audited and migrated later.

---

## 7) Acceptance tests (manual) after each extraction phase

Run these after every phase to ensure parity.

1. **Boot/render parity**
- Board initializes with pitch and tokens visible.
- No console/runtime errors.

2. **Player drag parity**
- Drag player on desktop and touch device.
- Drag threshold feels unchanged.
- Player origin line appears during drag where expected.

3. **Item drag parity**
- Item edit mode still required for item dragging.
- Item selection ring and movement callbacks still function.

4. **Drawing parity**
- Each tool (line/arrow/curved/dashed/wavy/free/zone/eraser) still works.
- Undo and clear behavior unchanged.

5. **Playback parity**
- Set start, add phases, play sequence, pause/resume, speed multipliers.
- End-state positions match pre-extraction behavior.

6. **Resize/reflow parity**
- Rotate device or resize browser.
- Tokens/items/drawings maintain expected positions and hit areas.

7. **Persistence parity**
- Save board, reload app, restore board.
- Duplicate/rename/delete saved boards still work.

8. **Import/export parity**
- Export board state and re-import same payload.
- Exported image still generates.

9. **Lifecycle parity**
- Navigating away/destroying surface does not leak listeners/tickers.

10. **Regression spot-check for mixed workflows**
- Draw + move + playback + save + restore + replay in one session without deadlocks.

---

## Brutal honesty conclusion

This module is extractable but currently overloaded enough that careless splitting will break behavior in subtle ways. The safe path is to preserve contracts and sequencing while carving out pure logic first, then controllers, then timeline and persistence boundaries. Treat this as a **stability refactor program**, not a cleanup sprint.
