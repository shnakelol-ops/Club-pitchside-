# MOVEMENT SYSTEM BRANCH AUDIT

## A. Branch summary

### Branches found
- Repository has a large remote branch set (200+), including `checkpoint/*`, `backup/*`, `cursor/*`, `feature/*`, and `codex/*`.
- For this audit, I deep-audited movement-relevant branches (those that touched tactical movement/playback files):
  - `origin/cursor/engine-pixi-path-drawing-only-0484`
  - `origin/cursor/engine-pixi-start-end-playback-8470`
  - `origin/cursor/engine-pixi-add-phase-only-8470`
  - `origin/cursor/engine-pixi-fix-multi-phase-playback-8470`
  - `origin/cursor/fix-tacticalpad-phase-playback-6cbc` (merged ancestor)
  - `origin/feature/quickboard-flowlabs-movement-sync`
  - `origin/cursor/playback-speed-control-3999` (merged ancestor)
  - `origin/main`
- Also checked codex extraction branches for shadow-run artifacts:
  - `origin/codex/conduct-audit-of-pitchflow-replit-core-repository*`

### What each branch contains (movement-specific)
- **`engine-pixi-path-drawing-only-0484`**  
  Draws a path polyline (`activePathPoints`) and supports dragging 3 fixed players.  
  No playback. No phase system. No pause/resume/speed.

- **`engine-pixi-start-end-playback-8470`**  
  Adds start->target interpolation playback for 3 fixed players (`setStart`, `play`, `reset`).  
  Still no path cleanup/simplification and no pause/resume/speed.

- **`engine-pixi-add-phase-only-8470`**  
  Adds phase snapshot concepts, still fixed to `P1/P2/P3` maps.

- **`engine-pixi-fix-multi-phase-playback-8470`**  
  Adds multi-segment playback (`playPhaseSequence`) and segment stepping, but still fixed 3-player assumptions.

- **`feature/quickboard-flowlabs-movement-sync`**  
  Most prototype-like movement branch:
  - movement preview modes (`free`/`straight`/`curve`)
  - movement preview speed and curve controls
  - pause/resume/reset in playback layer
  - tactical board + whiteboard integration
  Still not true "follow the drawn pen path exactly."

- **`playback-speed-control-3999` and `main`**  
  Current stabilized system:
  - full phase playback
  - pause/resume/reset/speed multiplier
  - robust drawing controller with point cleanup/smoothing
  - larger tactical feature set
  But playback is phase-to-phase interpolation, not "player follows drawn pen stroke."

- **Codex audit/extraction branches**  
  Add model/interface files like:
  - `src/engine/paths/path-models.ts`
  - `src/engine/timeline/timeline-models.ts`
  - `src/engine/relationships/shadow-relationships.ts`
  These are schema-level scaffolds, not runnable shadow-run behavior.

### Best movement checkpoint branch
- **Best prototype checkpoint for movement/path-following intent:** `origin/feature/quickboard-flowlabs-movement-sync`
- **Best production-stable playback branch:** `origin/main`

Brutal truth: no audited branch fully implements "draw arbitrary path -> player follows that exact drawn path with raw/clean counters UI."

---

## B. Working movement system map

## Key files
- `src/engine/pixi/createTacticalPadLiteSurface.ts`
- `src/pages/TacticalPadLiteClean.tsx`
- `src/features/quickboard/drawing/tacticalDrawingController.ts`
- `src/features/quickboard/drawing/tacticalLineRenderer.ts`
- `src/features/quickboard/drawing/tacticalDrawingTypes.ts`

## Key functions
- Path capture (draw tools):
  - `startWhiteboardDrawing`
  - `updateWhiteboardDrawing`
  - `endWhiteboardDrawing`
- Point cleanup/simplification:
  - `cleanupPoints`
  - `chaikinSmooth`
  - `normalizeDraftPoints`
- Playback/traversal:
  - `captureCurrentSnapshot`
  - `startPlayback`
  - `stepPlayback`
  - `applySnapshotToSurface`
- Playback control/timing:
  - `play`, `pausePlayback`, `resumePlayback`, `reset`
  - `setPlaybackSpeedMultiplier`

## Data flow (actual, current)
1. User drags players and/or draws tactical lines.
2. Drawn line points are normalized and cleaned/smoothed (`normalizeDraftPoints`) for drawing artifacts.
3. Player movement state is captured as **phase snapshots** (`players[]` positions), not as drawn-line geometry.
4. Playback interpolates from phase snapshot A -> B over duration with optional speed multiplier.
5. Player token positions are updated per frame.

Important mismatch:
- Drawn lines are visual annotations.
- Player traversal path is derived from phase snapshots, not from pen path points.

---

## C. What is reusable for Taca-Labs-V2

- **Path sampling**
  - Quadratic sampling and path utilities from drawing renderer and movement-preview branch are reusable.

- **Point cleanup**
  - `cleanupPoints` + `chaikinSmooth` + `normalizeDraftPoints` are solid reusable primitives.

- **Traversal**
  - Segment-based playback stepping in `stepPlayback` is reusable with decoupling.

- **Timing**
  - Playback duration + speed multiplier adjustment logic is reusable.

- **Speed controls**
  - UI slider + multiplier plumbing in `TacticalPadLiteClean.tsx` is reusable.

- **UI concepts**
  - Play/pause/resume/reset ergonomics and phase trays are reusable as UX patterns.

---

## D. What is risky / prototype-only

- **Global mutable closure state**
  - `createTacticalPadLiteSurface.ts` carries large mutable state bags; hard to test and reason about.

- **Single-player / fixed-player historical assumptions**
  - Early branches hardcode `P1/P2/P3` and fixed maps.

- **DOM/canvas coupling**
  - Engine and UI coupling is tight (Pixi event handling, UI states, and board semantics intertwined).

- **Hardcoded values**
  - Fixed durations, thresholds, and world constants are spread and not centrally contracted.

- **Missing strict contracts**
  - Many `unknown[]` save/load shapes and runtime sanitizers instead of strong compile-time model contracts.

---

## E. Multiple-player failure diagnosis

## Likely root cause
Multiple-player attempts failed in older prototype branches because the movement core was architected around fixed IDs and fixed-size position maps, then incrementally patched.

## Exact files/functions involved
- `origin/cursor/engine-pixi-start-end-playback-8470:src/engine/pixi/createTacticalPadLiteSurface.ts`
  - `TacticalPlayer` id union: `"P1" | "P2" | "P3"`
- `origin/cursor/engine-pixi-add-phase-only-8470:...`
  - `TacticalPlayerPositionMap` fixed keys and snapshot mapping assumptions
- `origin/cursor/engine-pixi-fix-multi-phase-playback-8470:...`
  - Phase sequence logic still anchored to fixed-map assumptions
- `origin/feature/quickboard-flowlabs-movement-sync:...`
  - Better dynamic player handling, but still prototype-level and mixed concerns

## What must change for true many-player support
1. Replace fixed-key player maps with entity-ID indexed collections everywhere.
2. Decouple rendering order from movement model identity.
3. Separate movement engine (state + timeline) from Pixi UI/controller layer.
4. Persist and replay per-entity paths (not only phase snapshots).
5. Add tests for 1, 3, 8, 15+ players across add/remove/import/playback.

---

## F. Shadow-run readiness

## Does shadow-run logic exist?
- **Runtime shadow-run behavior:** No.
- **Model scaffolding exists only in codex extraction branches** (`shadow-relationships.ts`, timeline/path models).

## Reuse or discard?
- Reuse schema ideas (IDs, relationship shape) if needed.
- Do **not** reuse as-is expecting working runtime behavior.

## Safest next step
- Treat current shadow-run artifacts as design stubs only.
- Implement shadow runs in a clean engine module with deterministic timeline + per-entity path sampling.

---

## G. Final recommendation

## Choice: **2. Extract selected functions only**

Direct engine extraction is too risky due coupling and mixed prototype assumptions.  
Best path is selective extraction of proven pieces:
- point cleanup/smoothing (`normalizeDraftPoints` stack),
- segment playback stepping/timing logic,
- speed multiplier math,
- then rebuild path-following + multi-player + shadow-runs in a dedicated engine boundary.

---

## Requested checks (explicit answers)

1. **Best/most complete movement prototype branch:** `origin/feature/quickboard-flowlabs-movement-sync`  
2. **`test-board.html` exists?:** **No** (not found in audited branches)  
3. **Movement/path-following files:** primarily `createTacticalPadLiteSurface.ts`, `TacticalPadLiteClean.tsx`, drawing modules  
4. **Path capture logic:** yes (draw controller and/or movement-preview path creation, branch-dependent)  
5. **Point cleaning/simplification:** yes (main/playback-speed via `cleanupPoints` + smoothing)  
6. **Path traversal/player-following:** phase interpolation exists; exact pen-path following does not  
7. **Playback timing/speed:** yes (play/pause/resume/reset + speed multiplier in main and movement-sync lineage)  
8. **Checkpoint/backup files:** no dedicated checkpoint/backup files in working tree; checkpoint/backup exist as branch namespaces  
9. **Shadow-run attempt files:** model stubs only in codex extraction branches (`shadow-relationships.ts`, timeline/path models)  
10. **Why multiple players may not have shown:** fixed-ID/fixed-map assumptions in early movement branches and prototype-level architecture coupling
