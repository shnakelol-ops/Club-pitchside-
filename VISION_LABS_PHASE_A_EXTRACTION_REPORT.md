# VISION LABS PHASE A EXTRACTION REPORT

## Scope
Phase A extraction completed for **pure helpers/constants only** from `src/engine/pixi/createTacticalPadLiteSurface.ts`.

No changes were made to:
- playback logic behavior
- Pixi rendering behavior
- drag/pointer routing behavior
- mapper implementation behavior
- timeline sequencing behavior
- token rendering behavior
- import/export contract shapes

---

## Extracted functions and constants

### New constants module
- `src/engine/tactical-surface/constants/tacticalSurfaceConstants.ts`

Extracted:
- world + interaction constants (`WORLD_SIZE`, touch radii, drag thresholds, etc.)
- tactical kit color constants and numeric map
- initial team count constants
- playback speed bounds/default constants

### New pure utils module
- `src/engine/tactical-surface/utils/tacticalSurfacePureUtils.ts`

Extracted pure helpers:
- `clampWorld`
- `clampTeamCount`
- `sanitizePlaybackSpeedMultiplier`
- `sanitizeKitColor`
- `sanitizeKitPattern`
- `sanitizeLabelMode`
- `clampNormalizedValue`
- `cloneSnapshot`

### Integration in surface module
- `createTacticalPadLiteSurface.ts` now imports the extracted constants/helpers and removes duplicate local definitions.
- Public API surface remains unchanged.

---

## Untouched systems

The following systems were intentionally not modified beyond calling extracted pure helpers:
- Playback stepping and segment interpolation flow
- Pointer event binding and routing
- Drag state transitions / thresholds behavior semantics
- World/viewport mapper behavior
- Pixi scene graph creation and rendering layering
- Token renderer selection and visual behavior
- Scenario import/export schema and `movementPaths` compatibility

---

## Risks encountered

1. **Behavior drift risk from helper movement**
   - Mitigation: extraction was literal (same logic, no algorithm rewrite).

2. **Constant shadowing risk**
   - Mitigation: removed duplicate in-surface constant definitions and sourced from extracted constants.

3. **Type coupling risk for extracted helpers**
   - Mitigation: util module keeps narrow local type contracts and uses existing shared normalization types only.

4. **Accidental runtime flow edits while relocating clone helper**
   - Mitigation: `cloneSnapshot` logic preserved exactly and reused from utility module.

---

## Compatibility and behavior preservation status

- TacticalPadLiteSurface public API: **preserved**
- Save/load compatibility: **preserved**
- `movementPaths` compatibility: **preserved**
- Visual behavior: **no intended change**
- Playback behavior: **no intended change**
- Pointer/touch behavior: **no intended change**

---

## Phase B readiness

### Can Phase B begin?
**Yes, with normal caution.**

Reason:
- Phase A extracted only pure constants/helpers.
- Runtime sequencing logic and interaction systems stayed in place.
- Typecheck passes after extraction.

Recommended guardrails for Phase B:
- continue strict no-behavior-change extraction boundaries,
- add targeted parity checks around mapper + hit testing when moving coordinate/viewport responsibilities.
