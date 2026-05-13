# TACA_LABS_V2_BOOTSTRAP_REPORT

## Bootstrap summary
Initialized a lightweight standalone laboratory workspace under:
- `taca-labs-v2/`

This lab migration includes only approved Vision Labs V2 architecture artifacts and extraction modules.

---

## Migrated files

### Architecture / audit markdown
- `taca-labs-v2/VISION_LABS_V2_ARCHITECTURE_PLAN.md`
- `taca-labs-v2/GOD_OBJECT_SEPARATION_AUDIT.md`
- `taca-labs-v2/VISION_LABS_PHASE_0_MODEL_AUDIT.md`
- `taca-labs-v2/VISION_LABS_PHASE_A_EXTRACTION_REPORT.md`
- `taca-labs-v2/VISION_LABS_PHASE_B_EXTRACTION_REPORT.md`

### Phase 0 model contracts
- `taca-labs-v2/src/engine/entities/models.ts`
- `taca-labs-v2/src/engine/paths/path-models.ts`
- `taca-labs-v2/src/engine/timeline/timeline-models.ts`
- `taca-labs-v2/src/engine/relationships/shadow-relationships.ts`
- `taca-labs-v2/src/engine/scenarios/scenario-models.ts`

### Phase A helper/constants extraction
- `taca-labs-v2/src/engine/tactical-surface/constants/tacticalSurfaceConstants.ts`
- `taca-labs-v2/src/engine/tactical-surface/utils/tacticalSurfacePureUtils.ts`

### Phase B viewport/hit-testing modules
- `taca-labs-v2/src/renderer/pixi/surface/viewport-mapper.ts`
- `taca-labs-v2/src/interaction/hit-testing.ts`

### Minimal Pixi sandbox bootstrap (required)
- `taca-labs-v2/src/renderer/pixi/surface/createV2TacticalSurface.ts`
- `taca-labs-v2/src/ui/v2/VisionLabsV2Page.tsx`

### Persistence contract (V2 schema only)
- `taca-labs-v2/src/persistence/scenario-schema.ts`

---

## Intentionally excluded systems

Not migrated into `taca-labs-v2/`:
- Production Vision Board route wiring
- Production V1 tactical runtime (`createTacticalPadLiteSurface.ts`)
- Production save/load implementation systems
- Production menu/navigation systems
- Vision Stats systems
- Notes systems
- Legacy God Object runtime behavior

This keeps the lab isolated and lightweight.

---

## Current architecture status

`taca-labs-v2/` now has initial lab structure:
- `src/engine/`
- `src/renderer/`
- `src/interaction/`
- `src/persistence/`
- `src/ui/v2/`

Status:
- Contains architectural docs, Phase 0 contracts, Phase A/B extraction modules, and minimal Pixi sandbox bootstrap.
- Excludes production app coupling and feature bloat.

---

## Readiness assessment

### Ready for GSAP installation?
**Yes.**
- The sandbox/lab boundary is isolated enough to add GSAP experimentally without touching V1.

### Ready for V2 Pixi sandbox experiments?
**Yes.**
- Minimal surface/bootstrap modules are present in the lab tree.

### Ready for timeline experiments?
**Yes (contract-level).**
- Timeline models are present; runtime timeline engine can be prototyped next.

### Ready for path movement experiments?
**Yes (contract-level).**
- Path models + viewport/hit-testing utilities are present for initial motion prototypes.

---

## Guardrail reminder
This lab is intentionally not a production app. Continue keeping experiments isolated inside `taca-labs-v2/` until promoted deliberately.
