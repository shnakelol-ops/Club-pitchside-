# VISION LABS BRANCH SETUP REPORT

## Branch created
- New long-lived branch: `architecture/vision-labs-v2`
- Created from local stable working base branch: `work`
- Default branch was **not** changed.
- No merge into `main` performed.

---

## Base branch used
- Base branch: `work`
- Base HEAD at branch creation: `e040c6a` (included latest Phase A/B build-fix state)
- Stable production lineage preserved (V1 runtime remains intact on same base lineage).

---

## Retarget/merge status for Vision Labs extraction work

The Phase 0/A/B work is now present on `architecture/vision-labs-v2` via branch cut from the stabilized extraction line.

Included commits for V2 extraction package:
- `8455818` — Extract tactical-surface helpers/constants, add viewport & hit-testing, and scaffold V2 models
- `e040c6a` — Fix Phase A/B extraction build regressions

Result: Phase 0 scaffolding + Phase A + Phase B are all included on `architecture/vision-labs-v2` only.

---

## Files added (V2 architecture + extraction docs/contracts/helpers)

### Reports / planning docs
- `GOD_OBJECT_SEPARATION_AUDIT.md`
- `VISION_LABS_V2_ARCHITECTURE_PLAN.md`
- `VISION_LABS_PHASE_0_MODEL_AUDIT.md`
- `VISION_LABS_PHASE_A_EXTRACTION_REPORT.md`
- `VISION_LABS_PHASE_B_EXTRACTION_REPORT.md`
- `VISION_LABS_PHASE_AB_REGRESSION_AUDIT.md`
- `VISION_LABS_PHASE_AB_BUILD_FIX_REPORT.md`

### V2 model scaffolding
- `src/engine/entities/models.ts`
- `src/engine/paths/path-models.ts`
- `src/engine/timeline/timeline-models.ts`
- `src/engine/relationships/shadow-relationships.ts`
- `src/engine/scenarios/scenario-models.ts`
- `src/persistence/scenario-schema.ts`

### Phase A/B extraction modules
- `src/engine/tactical-surface/constants/tacticalSurfaceConstants.ts`
- `src/engine/tactical-surface/utils/tacticalSurfacePureUtils.ts`
- `src/renderer/pixi/surface/viewport-mapper.ts`
- `src/interaction/hit-testing.ts`

---

## Files modified
- `src/engine/pixi/createTacticalPadLiteSurface.ts`
  - Updated to consume extracted constants/helpers and viewport/hit-testing modules.
  - Build-fix cleanup applied for stale imports/type references.

---

## Untouched production systems

The following production-critical systems remain behavior-preserved in intent and extraction scope:
- V1 routing and board entry selection
- Playback sequencing logic
- Drag/pointer lifecycle sequencing
- Pixi stage ownership and scene pipeline
- Save/load contract shape (including `movementPaths` compatibility)
- TacticalPadLiteSurface public API signatures

No Phase C rendering decomposition was started.

---

## Validation executed after branch setup
- `npm run typecheck --silent` ✅
- `npm run build --silent` ✅

V1 routes compile as part of production build.

---

## Safety assessment for next steps

### Is `architecture/vision-labs-v2` safe for future Phase C work?
**Yes, with guardrails.**

Why:
- Branch now contains stabilized Phase 0/A/B extraction state with passing typecheck/build.
- Mainline production remains protected (no merge to main, no default-branch change).

Guardrails before Phase C:
1. Keep strict no-behavior-change extraction policy.
2. Run parity checks on resize/reflow + touch hit areas before and after Phase C slices.
3. Keep save/load schema compatibility frozen until explicitly versioned.
