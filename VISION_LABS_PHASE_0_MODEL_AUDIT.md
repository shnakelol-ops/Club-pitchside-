# VISION LABS PHASE 0 MODEL AUDIT

## Scope
Audit-only review of these Phase 0 V2 files:
- `src/engine/entities/models.ts`
- `src/engine/paths/path-models.ts`
- `src/engine/timeline/timeline-models.ts`
- `src/engine/relationships/shadow-relationships.ts`
- `src/engine/scenarios/scenario-models.ts`
- `src/renderer/pixi/surface/viewport-mapper.ts`
- `src/persistence/scenario-schema.ts`

No runtime files were modified.

---

## 1) TypeScript correctness

### Status: **Pass (for scaffold intent)**
- Interfaces and type aliases are valid TS contracts.
- Import paths resolve cleanly across the new V2 modules.
- Contracts are minimal and coherent for a non-runtime Phase 0 skeleton.

### Caveat
- `createViewportMapper` intentionally throws. This is TS-correct, but operationally unsafe if accidentally wired into runtime before implementation.

---

## 2) Import / circular dependency risk

### Current status: **Low now, medium later**
Current directional graph is simple and acyclic:
- `entities` has no imports.
- `paths` imports `entities`.
- `timeline` imports `entities` + `paths`.
- `relationships` imports `entities`.
- `scenarios` imports `entities`/`paths`/`timeline`/`relationships`.
- `persistence` imports `scenarios`.
- `viewport-mapper` imports normalized point type from `entities`.

No immediate cycle detected in the current model-only set.

### Future risk vector
Cycles become likely once behavior modules start importing model files bidirectionally (e.g., scenario utilities importing timeline services that import scenario builders). This is avoidable with strict one-way layering.

---

## 3) Duplicate source-of-truth risks

### Primary risk: **High**
`TacticalScenario` currently includes both:
- `entities: TacticalEntity[]`
- `players: PlayerEntity[]`

Given `PlayerEntity extends TacticalEntity`, this is a classic dual-source trap.

### Why this is dangerous
- Entity visibility/lock/label can diverge between `entities` and `players`.
- Import/export/migration pipelines must reconcile two stores for one conceptual object.
- Bugs become silent because both shapes are type-valid.

### Recommendation (minimal)
Pick one canonical truth before Phase A:
- either **canonical `entities` only** and derive players by `kind === "player"`,
- or **canonical `players` only** and remove player duplicates from `entities`.

If dual arrays are temporarily retained, formally mark one as derived/transient and **non-persisted**.

---

## 4) Serializability

### Status: **Mostly good, needs invariant hardening**
Good:
- Models are plain JSON-compatible objects/arrays/primitives.
- No functions, class instances, Dates, Maps, Sets in persisted shapes.

Gaps:
- No contract-level guards for numeric validity (`NaN`, `Infinity`, negatives).
- No uniqueness guarantees for IDs.
- No normalized bounds enforcement for `{x,y}` in 0..100.

Result: TS compiles, but corrupted documents can still serialize and load incorrectly.

---

## 5) Save/load compatibility

### Status: **Good foundation, incomplete compatibility posture**
Good:
- Explicit schema id/version (`pitchflow.v2.scenario`, version `1`) is the correct baseline.

Missing:
- Migration policy for future versions (`1 -> 2`, etc.).
- Validation contract for required/optional fields during deserialize.
- Policy for unknown fields preservation vs stripping.

### Practical risk
Without parser/validator rules, “versioned schema” exists in name only.

---

## 6) Capability coverage check

### a) Path-based movement: **Supported structurally**
- `TacticalPath` + `PathSegment` provide basic motion path structure.

### b) Curved runs: **Supported structurally**
- `PathSegmentType` includes `quadratic` and `cubic`.

### c) Timeline playback: **Supported structurally, weak state semantics**
- `TacticalTimeline`, tracks, and segments exist.
- But playback mode is underspecified (`isPlaying` only), which is too thin for robust scrub/play/pause state.

### d) Shadow relationships: **Supported structurally**
- `ShadowRelationship` with leader/follower + offsets is enough for Phase A start.

### e) Saved tactical scenarios: **Supported structurally**
- `SavedScenarioDocument` + metadata + scenario envelope exists.

### f) V1-to-V2 migration: **Partially supported**
- Strong start for target schema.
- Missing explicit bridge fields/policies for legacy ambiguities (e.g., V1 phase snapshots vs V2 path/timeline decomposition).

---

## 7) Should `TacticalScenario` contain both `entities` and `players`?

### Brutal answer: **No, not as two equal persisted truths.**
Keeping both as first-class persisted arrays is very likely to create long-term drift bugs.

### Safer options
1. Canonical `entities[]`; derive `players[]` in selectors/runtime.
2. Canonical `players[]` and model non-player tactical objects separately.

If both are needed temporarily for migration, enforce:
- one canonical owner,
- one derived mirror,
- explicit write rules,
- deserializer reconciliation strategy.

---

## 8) Should `ViewportMapper` stay a stub contract now?

### Answer: **Yes, with strict isolation.**
Keeping it as a stub is appropriate for Phase 0 architecture scaffolding.

### Non-negotiable guardrail
It must remain unreachable from active runtime paths until implemented. A throwing stub is acceptable only when not wired.

---

## 9) Minimal changes recommended before Phase A

Keep this lightweight; do not overbuild.

1. **Resolve canonical entity truth** (`entities` vs `players`) before any behavior coding.
2. **Add timeline status enum/union** (`idle | playing | paused | scrubbing | ended`) to avoid future state drift.
3. **Document core invariants**:
   - normalized coordinates in `[0,100]`
   - non-negative durations
   - `currentMs` bounded by `durationMs`
   - ID uniqueness scopes
4. **Define path/timeline linkage rule** (when `pathId` is required vs optional).
5. **Add minimal deserialize policy doc** for schema v1 (required fields, unknown-field handling, migration stance).
6. **Keep viewport mapper stub un-wired** until Phase B.

---

## Final call: Can Phase A safely begin?

### **Yes — conditionally.**
Phase A is safe to start if the team first closes the dual-source scenario risk and writes minimal invariants/state contracts. If not, rework debt is almost guaranteed by Phase C/F.

### Bottom line
- Direction is correct.
- Scaffolding quality is decent.
- Biggest blocker is ownership ambiguity (`entities` + `players` both persisted).
- With minimal pre-Phase-A guardrails, risk is manageable.
