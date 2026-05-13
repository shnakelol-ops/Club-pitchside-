# TACA_LABS_V2_PRODUCTION_REPO_CLEANUP_REPORT

## Cleanup action completed
Removed accidental nested lab copy from production repo:
- `taca-labs-v2/` (entire folder tree)

This removes duplicate-source ambiguity between:
- `src/...`
- `taca-labs-v2/src/...` (now deleted)

---

## Files/folders removed

Deleted entire nested folder and contents, including:
- `taca-labs-v2/GOD_OBJECT_SEPARATION_AUDIT.md`
- `taca-labs-v2/VISION_LABS_PHASE_0_MODEL_AUDIT.md`
- `taca-labs-v2/VISION_LABS_PHASE_A_EXTRACTION_REPORT.md`
- `taca-labs-v2/VISION_LABS_PHASE_B_EXTRACTION_REPORT.md`
- `taca-labs-v2/VISION_LABS_V2_ARCHITECTURE_PLAN.md`
- `taca-labs-v2/src/engine/...`
- `taca-labs-v2/src/interaction/...`
- `taca-labs-v2/src/persistence/...`
- `taca-labs-v2/src/renderer/...`
- `taca-labs-v2/src/ui/v2/...`

---

## Files intentionally kept (for current branch stability)

Kept in `Club-pitchside-` because they are currently part of branch history/runtime compile surface:
- `src/engine/entities/models.ts`
- `src/engine/paths/path-models.ts`
- `src/engine/relationships/shadow-relationships.ts`
- `src/engine/scenarios/scenario-models.ts`
- `src/engine/timeline/timeline-models.ts`
- `src/interaction/hit-testing.ts`
- `src/persistence/scenario-schema.ts`
- `src/renderer/pixi/surface/createV2TacticalSurface.ts`
- `src/renderer/pixi/surface/viewport-mapper.ts`
- `src/ui/v2/VisionLabsV2Page.tsx`
- Existing root-level V2 reports/docs

### Audit judgment on whether these should remain in production repo
- **Preferred long-term:** move ongoing V2 lab iteration to standalone `/workspace/Taca-Labs-V2` only.
- **Short-term on this branch:** keep current root-level V2 files unchanged to avoid touching route/runtime integration unexpectedly under this hygiene task.

---

## Production systems untouched

Confirmed untouched by this cleanup:
- V1 runtime engine behavior
- Vision Board production runtime
- Vision Stats systems
- Notes systems
- Current save/load systems
- Current menu systems
- Existing route behavior (no route edits in this cleanup)

---

## Validation commands run
- `git status --short`
- `npm run typecheck --silent`
- `npm run build --silent`

Result:
- Typecheck/build pass after nested-folder removal.

---

## Safety status

`Club-pitchside-` is cleaner and safer after removing nested duplicate lab tree.

### Recommendation for future V2 work
Continue future V2 lab development **only** in standalone repo:
- `/workspace/Taca-Labs-V2`

And avoid reintroducing nested copies into production repo.
