# TACA_LABS_V2_STANDALONE_REPO_SETUP_REPORT

## Setup outcome
A standalone local repository was created at:
- `/workspace/Taca-Labs-V2`

This repository has its own git root (`/workspace/Taca-Labs-V2/.git`) and is no longer nested under Club-pitchside.

---

## Actual standalone repo root
- Local standalone root: `/workspace/Taca-Labs-V2`
- Git root verified: `/workspace/Taca-Labs-V2/.git`

## Remote URL configured
- `origin`: `https://github.com/shnakelol-ops/Taca-Labs-V2.git`

Note: network/auth in this environment blocks GitHub push (HTTP 403 CONNECT tunnel), so push could not be completed from this runtime.

---

## Files migrated into standalone Taca-Labs-V2

### Architecture/audit docs
- `GOD_OBJECT_SEPARATION_AUDIT.md`
- `VISION_LABS_V2_ARCHITECTURE_PLAN.md`
- `VISION_LABS_PHASE_0_MODEL_AUDIT.md`
- `VISION_LABS_PHASE_A_EXTRACTION_REPORT.md`
- `VISION_LABS_PHASE_B_EXTRACTION_REPORT.md`

### Phase 0 model contracts
- `src/engine/entities/models.ts`
- `src/engine/paths/path-models.ts`
- `src/engine/timeline/timeline-models.ts`
- `src/engine/relationships/shadow-relationships.ts`
- `src/engine/scenarios/scenario-models.ts`
- `src/persistence/scenario-schema.ts`

### Phase A extraction modules
- `src/engine/tactical-surface/constants/tacticalSurfaceConstants.ts`
- `src/engine/tactical-surface/utils/tacticalSurfacePureUtils.ts`

### Phase B extraction modules
- `src/renderer/pixi/surface/viewport-mapper.ts`
- `src/interaction/hit-testing.ts`

### Minimal V2 sandbox files
- `src/renderer/pixi/surface/createV2TacticalSurface.ts`
- `src/ui/v2/VisionLabsV2Page.tsx`

---

## Files/systems explicitly excluded from standalone
- Production V1 app runtime and routes
- Vision Stats systems
- Notes systems
- Production menu/navigation systems
- Production save/load runtime systems
- Legacy God Object runtime implementation (`createTacticalPadLiteSurface.ts`)
- Nested duplicate `taca-labs-v2/` structure inside the standalone repo (not present)

---

## Production repo impact
- Production repo (`/workspace/Club-pitchside-`) was left functionally untouched for runtime systems.
- No production V1 route/runtime migration was performed as part of this hygiene task.

---

## Build/typecheck status in standalone
- No package/toolchain initialization was performed in `/workspace/Taca-Labs-V2` (repo-hygiene-only scope).
- Therefore build/typecheck in standalone are **not yet initialized** in this environment.

---

## Ready for Pixi sandbox?
**Yes, structurally.**

Why:
- Standalone repo now contains minimal V2 sandbox files and core Phase 0/A/B contracts.
- Production systems are not mixed into standalone root.

---

## Cleanup recommendation for old nested copy
To remove ambiguity in `Club-pitchside`:
1. Remove nested folder: `/workspace/Club-pitchside-/taca-labs-v2/`
2. Keep only a pointer note (optional) referencing the standalone GitHub repo.
3. Continue all future V2 lab commits in `/workspace/Taca-Labs-V2` only.

This prevents dual-source drift between `src/...` and `taca-labs-v2/src/...` copies.
