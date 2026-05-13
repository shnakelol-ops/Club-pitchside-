# VISION LABS PHASE A+B REGRESSION AUDIT

## Scope reviewed
- `src/engine/pixi/createTacticalPadLiteSurface.ts`
- `src/engine/tactical-surface/constants/tacticalSurfaceConstants.ts`
- `src/engine/tactical-surface/utils/tacticalSurfacePureUtils.ts`
- `src/renderer/pixi/surface/viewport-mapper.ts`
- `src/interaction/hit-testing.ts`

Audit-only; no code changes.

---

## 1) What changed

## Phase A changes
- Pure tactical-surface constants moved out of `createTacticalPadLiteSurface.ts` into `tacticalSurfaceConstants.ts`.
- Pure utility helpers (clamps/sanitizers/snapshot clone) moved into `tacticalSurfacePureUtils.ts`.
- Surface now imports and uses those extracted symbols.

## Phase B changes
- Viewport creation in surface now uses `createViewportMapper(...)` wrapper from `src/renderer/pixi/surface/viewport-mapper.ts`.
- Player/item hit-area radius resolution and circle hit-area creation moved into `src/interaction/hit-testing.ts`.
- Surface helper methods now call extracted hit-testing functions.

---

## 2) What stayed untouched

The following critical systems appear intentionally unchanged in behavior flow:
- Playback sequencing/interpolation loop
- Pause/resume/play state transitions
- Drag lifecycle sequencing and pointer capture rules
- Pointer event routing logic
- Pixi stage ownership and scene setup ordering
- Token renderer behavior and style selection
- Save/load import/export contract shape, including `movementPaths` compatibility field
- TacticalPadLiteSurface public API surface methods/signatures

---

## 3) Main regression risks

## A. Behavior parity risk (Low-Medium)
Extraction was mostly literal, but any helper movement carries risk if formulas changed subtly. Biggest sensitivity points:
- hit radius computation
- clamp/sanitize defaults
- mapper creation call path

Current read suggests formulas were preserved; risk remains low-medium until manual parity checks are done.

## B. Import/layering risk (Medium)
`src/renderer/pixi/surface/viewport-mapper.ts` now imports from `src/engine/pixi/createWorldViewport.ts`.
- This is not a direct cycle today, but it blurs intended architecture layering (renderer consuming engine/pixi implementation detail).
- Not a blocker for current stability, but this can become a cycle trap during Phase C if renderer and engine boundaries are not enforced.

## C. Coordinate drift risk (Low-Medium)
Because mapper logic is delegated, drift risk is low **if** wrapper remains pass-through.
- Risk increases if wrapper starts adding transform logic later without parity tests.

## D. Hit-area regression risk (Medium)
Hit-testing moved into standalone helpers.
- Even with identical formulas, runtime feel regressions can occur from subtle scale assumptions and floating-point edge behavior.
- Must be validated on touch hardware (not just desktop).

## E. Save/load compatibility risk (Low)
No direct schema or import/export logic change in reviewed files.
- Residual risk: indirect snapshot utility extraction affecting serialization shape.
- Current extraction appears shape-preserving.

## F. Accidental V2 runtime behavior risk (Low-Medium)
`viewport-mapper.ts` moved from throw-stub to working wrapper.
- This is practical for extraction, but it means the file is no longer “pure contract-only.”
- If V2 wiring accidentally references this module, runtime path now exists.

## G. Helper purity assessment
- `tacticalSurfacePureUtils.ts`: genuinely pure (no side effects, deterministic transforms).
- `tacticalSurfaceConstants.ts`: pure constants only.
- `hit-testing.ts`: pure functions.
- `viewport-mapper.ts`: not pure utility in strict sense (delegates to implementation), but deterministic and side-effect free.

---

## 4) Manual tests required before merge

These are mandatory to protect V1:

1. **Resize/reflow parity**
- Resize browser repeatedly and rotate tablet/phone.
- Confirm no drift in token/item positions after reflow.

2. **Drag accuracy parity (desktop)**
- Drag multiple players/items across pitch edges.
- Confirm drag-to-position fidelity matches pre-extraction.

3. **Touch parity (real device)**
- iPad + phone touch drag, including near-token edge taps.
- Confirm no missed grabs and no oversized/undersized hit feeling.

4. **Playback visual parity**
- Run start/phase playback and compare token trajectories visually.
- Verify no coordinate jump when play starts after resize.

5. **Save/load compatibility smoke**
- Save board with phases + drawings + items.
- Reload and replay; ensure no mismatch.

6. **Regression on item hit areas**
- Cones/poles/football/sliotar selection and drag should remain consistent.

7. **No API break check**
- Ensure all existing UI controls invoking TacticalPadLiteSurface methods still function unchanged.

---

## 5) Should this merge?

### Recommendation: **Merge with caution (conditional)**

I would merge **only if** the manual parity checklist above passes on at least:
- one desktop browser,
- one iPad-class touch device,
- one phone viewport.

If touch hit feel differs or any resize drift appears, do not merge until resolved.

---

## 6) Can Phase C begin?

### Recommendation: **Not immediately by default; yes after parity gate passes**

Phase C rendering extraction should begin only after:
1. Phase A/B parity tests pass,
2. no hitbox regressions found,
3. no resize drift found,
4. layering rule documented to prevent renderer↔engine cycle creep.

Brutal truth:
- The extraction direction is correct.
- V1 is still exposed to interaction regressions unless hardware touch tests are done first.
- Treat Phase C as blocked until Phase A/B parity is proven, not assumed.
