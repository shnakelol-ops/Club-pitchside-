# TACA_LABS_V2_STRUCTURE_AUDIT

## Root path checked
- Working directory checked: `/workspace/Club-pitchside-`
- Git repo root: `/workspace/Club-pitchside-`
- Git status: inside work tree = `true`
- `.git` directories found at depth <=2: only `./.git`

## Conclusion on repo root
There is only **one** git repository root here: `/workspace/Club-pitchside-`.

`taca-labs-v2/` is **not** a standalone git repo; it is a nested folder copy inside the production repo.

---

## Duplicate file findings

### Duplicate V2 code exists in both locations
- `src/...` (primary app tree)
- `taca-labs-v2/src/...` (nested copy)

Compared duplicates are byte-identical for all migrated Phase 0/A/B and sandbox files:
- `renderer/pixi/surface/createV2TacticalSurface.ts`
- `renderer/pixi/surface/viewport-mapper.ts`
- `engine/relationships/shadow-relationships.ts`
- `engine/timeline/timeline-models.ts`
- `engine/paths/path-models.ts`
- `engine/entities/models.ts`
- `engine/tactical-surface/constants/tacticalSurfaceConstants.ts`
- `engine/tactical-surface/utils/tacticalSurfacePureUtils.ts`
- `engine/scenarios/scenario-models.ts`
- `interaction/hit-testing.ts`
- `ui/v2/VisionLabsV2Page.tsx`
- `persistence/scenario-schema.ts`

### Duplicate docs also exist
At least these are duplicated at root and under `taca-labs-v2/`:
- `GOD_OBJECT_SEPARATION_AUDIT.md`
- `VISION_LABS_PHASE_0_MODEL_AUDIT.md`
- `VISION_LABS_PHASE_A_EXTRACTION_REPORT.md`
- `VISION_LABS_PHASE_B_EXTRACTION_REPORT.md`
- `VISION_LABS_V2_ARCHITECTURE_PLAN.md`

---

## Contamination findings

## 1) Nested lab is currently a copy, not isolation
Because `taca-labs-v2/` is nested inside the production repo, any branch/release operation still includes both production and lab artifacts unless filtered.

## 2) Source-of-truth ambiguity risk
Having identical files in two paths creates immediate maintenance risk:
- edits may land in only one copy,
- reviewers may miss divergence,
- future merges become noisy/confusing.

## 3) Production repo bloat risk
Duplicated docs + code increase repo size and review overhead without true environment isolation.

---

## Which location is the true Taca-Labs-V2 repo root?

**Currently: none.**

There is no separate git root for Taca-Labs-V2 yet.
- Current true repo root is production repo root: `/workspace/Club-pitchside-`.
- `taca-labs-v2/` is a nested directory snapshot, not an independent repository.

---

## Recommended cleanup plan

## Preferred (cleanest)
1. Create a separate git repository for Taca-Labs-V2 (outside production repo).
2. Move only approved V2 files into that repo.
3. Remove `taca-labs-v2/` nested copy from production repo.
4. Keep production repo with a single V2 source location (`src/...`) or remove V2 code entirely from prod if policy requires strict separation.

## Minimum viable (if staying in one repo temporarily)
1. Choose **one** canonical location for V2 files now (recommend `src/...` since currently wired).
2. Delete duplicated `taca-labs-v2/src/...` and duplicated markdown inside `taca-labs-v2/`.
3. Keep only a small pointer file in `taca-labs-v2/README.md` if needed.

---

## Exact files/folders to keep (recommended in current repo)

Keep as canonical in current repo:
- `src/engine/entities/models.ts`
- `src/engine/paths/path-models.ts`
- `src/engine/timeline/timeline-models.ts`
- `src/engine/relationships/shadow-relationships.ts`
- `src/engine/scenarios/scenario-models.ts`
- `src/engine/tactical-surface/constants/tacticalSurfaceConstants.ts`
- `src/engine/tactical-surface/utils/tacticalSurfacePureUtils.ts`
- `src/renderer/pixi/surface/viewport-mapper.ts`
- `src/renderer/pixi/surface/createV2TacticalSurface.ts`
- `src/interaction/hit-testing.ts`
- `src/persistence/scenario-schema.ts`
- `src/ui/v2/VisionLabsV2Page.tsx`
- root-level Vision Labs docs/reports (single copy each)

---

## Exact files/folders to remove (recommended cleanup)

Remove duplicated nested lab copy:
- `taca-labs-v2/src/` (entire subtree)
- `taca-labs-v2/GOD_OBJECT_SEPARATION_AUDIT.md`
- `taca-labs-v2/VISION_LABS_PHASE_0_MODEL_AUDIT.md`
- `taca-labs-v2/VISION_LABS_PHASE_A_EXTRACTION_REPORT.md`
- `taca-labs-v2/VISION_LABS_PHASE_B_EXTRACTION_REPORT.md`
- `taca-labs-v2/VISION_LABS_V2_ARCHITECTURE_PLAN.md`

(If creating separate repo, move these there instead of keeping in production.)

---

## Is it safe to proceed to Pixi sandbox work now?

**Conditionally yes**, but only after resolving duplicate-location ambiguity.

Why:
- Current duplicated structure is operationally confusing and high-risk for drift.
- Once a single canonical location/repo is enforced, sandbox progression is safe to continue.

---

## Bottom line
This migration was not a clean standalone repo bootstrap; it was a nested copy inside production.
Resolve location ownership first, then continue V2 sandbox/timeline/path experimentation.
