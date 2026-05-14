# VISION LABS V2 ARCHITECTURE PLAN

## 0) Scope truth (keep us honest)

This is a **lightweight tactical engine plan**, not an enterprise platform.

### In scope (V2)
- Path-based player movement (including curves)
- Timeline play/pause/reset/speed + simple scrubber
- Shadow-run links
- Saved tactical scenarios
- Clean Pixi rendering
- Mobile/tablet touch editing
- Basic GAA templates
- Stable save/load schema
- Share/export flow

### Explicitly out of scope (V2)
- AI coaching suggestions
- Large community library
- Cloud sync
- Multiplayer collaboration
- Full stats-to-tactics automation
- Exhaustive template catalog

---

## 1) Target folder structure

```text
src/
  engine/
    entities/
      models.ts
      entity-store.ts
      entity-commands.ts
    paths/
      path-models.ts
      path-builder.ts
      path-sampler.ts
      path-constraints.ts
    timeline/
      timeline-models.ts
      timeline-store.ts
      timeline-machine.ts
      timeline-controls.ts
      timeline-scrubber.ts
    relationships/
      shadow-relationships.ts
      relationship-store.ts
    scenarios/
      scenario-models.ts
      scenario-builder.ts
      scenario-validation.ts
    state/
      board-session-store.ts
      selectors.ts
      actions.ts
      invariants.ts
  renderer/
    pixi/
      surface/
        createV2TacticalSurface.ts
        scene-layers.ts
        viewport-mapper.ts
      renderers/
        pitch-renderer.ts
        player-renderer.ts
        path-renderer.ts
        overlay-renderer.ts
      adapters/
        engine-to-pixi-sync.ts
  interaction/
    input-router.ts
    pointer-controller.ts
    gesture-controller.ts
    tool-controller.ts
    hit-testing.ts
  persistence/
    scenario-schema.ts
    scenario-serializer.ts
    scenario-deserializer.ts
    scenario-storage.ts
    export-image.ts
    export-share-payload.ts
  templates/
    gaa/
      index.ts
      football/
        kickout-template.ts
        press-template.ts
      hurling/
        puckout-template.ts
  ui/
    v2/
      VisionLabsV2Page.tsx
      components/
        TimelineControls.tsx
        Scrubber.tsx
        ToolPalette.tsx
        ScenarioPanel.tsx
      hooks/
        useV2BoardSession.ts
        useV2Playback.ts
```

**Rule:** engine/renderer/interaction/persistence are framework-light; `ui/` is React-facing.

---

## 2) Core TypeScript models

```ts
export type EntityId = string;
export type PathId = string;
export type TimelineTrackId = string;
export type SegmentId = string;
export type ScenarioId = string;

export type TeamSide = "HOME" | "AWAY" | "NEUTRAL";
export type EntityKind = "player" | "ball" | "marker";

export interface TacticalEntity {
  id: EntityId;
  kind: EntityKind;
  label?: string;
  visible: boolean;
  locked?: boolean;
}

export interface PlayerEntity extends TacticalEntity {
  kind: "player";
  number?: number;
  team: TeamSide;
  role?: "outfield" | "goalkeeper";
  // normalized 0..100 source-of-truth position (edit-time/static state)
  position: { x: number; y: number };
  style?: {
    tokenStyle?: "classic" | "premium" | "torso";
    color?: "blue" | "red" | "yellow" | "black";
    initials?: string;
  };
}

export type PathSegmentType = "line" | "quadratic" | "cubic";

export interface PathSegment {
  id: SegmentId;
  type: PathSegmentType;
  // normalized control points, interpretation by type
  points: Array<{ x: number; y: number }>;
  durationMs: number;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface TacticalPath {
  id: PathId;
  entityId: EntityId;
  segments: PathSegment[];
  closed?: false;
  totalDurationMs: number;
}

export interface TimelineSegment {
  id: SegmentId;
  trackId: TimelineTrackId;
  pathId?: PathId;
  startMs: number;
  endMs: number;
  enabled: boolean;
}

export interface TimelineTrack {
  id: TimelineTrackId;
  entityId: EntityId;
  segments: TimelineSegment[];
  muted?: boolean;
}

export interface TacticalTimeline {
  durationMs: number;
  currentMs: number;
  isPlaying: boolean;
  speed: 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5;
  tracks: TimelineTrack[];
  loop?: boolean;
}

export interface ShadowRelationship {
  id: string;
  leaderEntityId: EntityId;
  followerEntityId: EntityId;
  // follower follows leader path with optional temporal/spatial offset
  offsetMs?: number;
  offsetDistance?: number;
  enabled: boolean;
}

export interface ScenarioMetadata {
  id: ScenarioId;
  name: string;
  sport: "football" | "hurling" | "camogie" | "ladiesFootball";
  createdAt: number;
  updatedAt: number;
  version: 1;
  tags?: string[];
}

export interface TacticalScenario {
  metadata: ScenarioMetadata;
  entities: TacticalEntity[];
  players: PlayerEntity[];
  paths: TacticalPath[];
  timeline: TacticalTimeline;
  relationships: ShadowRelationship[];
  drawings?: Array<unknown>; // V1-compatible tactical drawings (typed in drawing module)
}

export interface ViewportState {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  worldWidth: number;
  worldHeight: number;
}

export interface SavedScenarioDocument {
  schema: "pitchflow.v2.scenario";
  schemaVersion: 1;
  metadata: ScenarioMetadata;
  scenario: TacticalScenario;
  exportInfo?: {
    exportedAt: number;
    source: "vision-labs-v2";
  };
}
```

---

## 3) Data ownership rules

### Single-source ownership
- **Entity position (authoring/base state):** `engine/entities` store (Zustand state).
- **Playback-resolved runtime position:** `engine/timeline` + sampled path output (derived state, not manually edited).
- **Playback state (play/pause/time/speed):** XState timeline machine (`engine/timeline/timeline-machine.ts`).
- **Selected player/entity + active tool:** interaction store (`interaction/tool-controller.ts` backed by Zustand).
- **Saved scenario data:** persistence module owns schema + serialization.

### Mutation boundaries
- **Pixi is allowed to mutate:** only display objects (Container/Graphics/Sprite props) in renderer adapter layer.
- **Pixi is NOT allowed to mutate:** canonical engine scenario/entity/timeline stores.
- **React is allowed to mutate:** UI-only state + dispatch commands to engine stores/machines.
- **React is NOT allowed to mutate:** raw Pixi scene graph directly.

### Library ownership
- **Zustand owns:** durable authoring/session state (entities, paths, selection, tools, viewport state snapshot).
- **XState owns:** timeline/playback finite state (`idle`, `playing`, `paused`, `scrubbing`, `ended`).
- **GSAP owns:** interpolation/execution of movement along already-defined path segments (runtime animator only).

**Hard rule:** no dual-write state. All writes go through explicit engine commands.

---

## 4) Library/tooling placement

### GSAP Timeline + MotionPath
- Place in `engine/timeline/timeline-controls.ts` and `renderer/pixi/adapters/engine-to-pixi-sync.ts`.
- Use GSAP only to advance runtime transforms from engine timeline state.
- Do not let GSAP become persistence schema.

### Zustand
- Place in `engine/state/board-session-store.ts` + domain slices (`entities`, `paths`, `relationships`, `selection`).
- Keep stores serializable and easy to snapshot.

### XState
- Place in `engine/timeline/timeline-machine.ts`.
- Machine controls allowed transitions and guards (e.g., cannot play with empty tracks).

### bezier-js / spline helper
- Place in `engine/paths/path-sampler.ts`.
- This is geometry math only; no Pixi or React imports.

### PixiJS
- Place in `renderer/pixi/*` only.
- Pixi consumes engine state and draws; it does not own tactical truth.

---

## 5) God Object separation roadmap (A–G)

## Phase A — pure helpers/constants
- **Goal:** extract static constants and pure clamps/sanitizers/snapshot helpers.
- **Likely files:**
  - `engine/state/invariants.ts`
  - `engine/paths/path-constraints.ts`
  - `persistence/scenario-validation.ts`
- **Risk level:** Low
- **Acceptance tests:** clamp behavior parity, serialization helper parity.
- **Do-not-touch boundaries:** existing V1 public surface API and board JSON shape.

## Phase B — coordinates/viewport
- **Goal:** isolate normalized/world/viewport mapping and hit-area scaling rules.
- **Likely files:**
  - `renderer/pixi/surface/viewport-mapper.ts`
  - `interaction/hit-testing.ts`
- **Risk level:** Medium
- **Acceptance tests:** drag accuracy, resize/reflow parity, touch hit-area parity.
- **Do-not-touch:** normalized domain (0..100), letterbox semantics.

## Phase C — rendering setup
- **Goal:** split scene/layer composition and token/item rendering from engine logic.
- **Likely files:**
  - `renderer/pixi/surface/scene-layers.ts`
  - `renderer/pixi/renderers/player-renderer.ts`
  - `renderer/pixi/renderers/pitch-renderer.ts`
- **Risk level:** Medium
- **Acceptance tests:** z-order parity, token style parity, performance smoke test.
- **Do-not-touch:** visual layer ordering and token index behavior.

## Phase D — input controller
- **Goal:** move pointer routing, drag state machine, and tool gating out of monolith.
- **Likely files:**
  - `interaction/input-router.ts`
  - `interaction/pointer-controller.ts`
  - `interaction/tool-controller.ts`
- **Risk level:** High
- **Acceptance tests:** desktop drag, touch drag, threshold/pointerId parity, no stuck drag states.
- **Do-not-touch:** playback lock precedence and move-vs-draw gating logic.

## Phase E — drawing boundary
- **Goal:** keep drawing module separate and minimize tactical surface orchestration.
- **Likely files:**
  - `interaction/gesture-controller.ts`
  - `renderer/pixi/renderers/overlay-renderer.ts`
- **Risk level:** Medium-High
- **Acceptance tests:** all drawing tools + erase/undo/clear parity.
- **Do-not-touch:** current drawing snapshot compatibility.

## Phase F — playback/timeline controller
- **Goal:** replace ad-hoc playback closure state with timeline domain controller.
- **Likely files:**
  - `engine/timeline/timeline-models.ts`
  - `engine/timeline/timeline-store.ts`
  - `engine/timeline/timeline-machine.ts`
  - `engine/timeline/timeline-controls.ts`
- **Risk level:** High
- **Acceptance tests:** play/pause/resume/reset/speed parity, scrubber correctness, deterministic end-state.
- **Do-not-touch:** initial V1 playback behavior until V2 toggle is enabled.

## Phase G — persistence/export
- **Goal:** stable V2 schema + V1 bridge serializer and export flow.
- **Likely files:**
  - `persistence/scenario-schema.ts`
  - `persistence/scenario-serializer.ts`
  - `persistence/scenario-deserializer.ts`
  - `persistence/export-image.ts`
- **Risk level:** Medium
- **Acceptance tests:** round-trip save/load, migration import, share/export payload validation.
- **Do-not-touch:** V1 save slots and existing quickboard records.

---

## 6) V1 → V2 migration strategy (protect V1)

### Core strategy
Build V2 engine **in parallel** under new folders. Do not replace V1 surface until V2 parity gates pass.

### Practical rollout
1. Keep current V1 board routes/components untouched.
2. Add a hidden/internal V2 route (or feature flag) that mounts `ui/v2/VisionLabsV2Page.tsx`.
3. Maintain independent persistence keyspace for V2 scenarios.
4. Add one-way bridge importer:
   - Input: V1 board state (`players`, `phases`, `drawings`, items)
   - Output: V2 `SavedScenarioDocument`
5. Delay reverse export (V2→V1) unless required.

### Bridge mapping (safe baseline)
- V1 player current positions → `PlayerEntity.position`
- V1 phases → generate linear `TacticalPath` + timeline segments per player
- V1 drawings → carry forward as opaque typed drawing snapshots (compat layer)
- V1 movementPaths alias → map to timeline segments where possible

**Non-goal:** perfect semantic conversion of every legacy edge case. Support “best effort + warning” for unsupported constructs.

---

## 7) Six-month lightweight build roadmap

## Month 1 — architecture separation
- Create new folder skeleton + model contracts.
- Implement state ownership boundaries (Zustand + XState scaffolding).
- Add V1/V2 feature flag mount path.

## Month 2 — path movement
- Implement path model, segment editor basics, sampler.
- Support line + quadratic + cubic segments.
- Render paths in Pixi and bind to entity tracks.

## Month 3 — timeline/scrubber
- Implement play/pause/reset/speed machine.
- Add simple scrubber UI with deterministic seeking.
- Validate stable runtime playback with 30 players.

## Month 4 — shadow runs + scenarios
- Add shadow relationship model and runtime linker.
- Add scenario create/save/load in V2 schema.
- Add V1→V2 import bridge for internal migration.

## Month 5 — GAA templates + touch editing
- Ship basic GAA templates (small curated set).
- Harden touch-first interactions (drag handles, tool ergonomics, iPad landscape/portrait checks).
- Optimize input hit testing and rendering updates.

## Month 6 — polish/testing/export
- Fix parity bugs, improve stability and performance.
- Finalize share/export payload and image export flow.
- Document schema/versioning and migration policy.

---

## 8) Final recommendation

### Recommendation: **Build parallel V2 engine** (with selective reuse)

Brutal truth:
- Reusing current monolithic surface directly will slow V2 and multiply regression risk.
- Throwing everything away is wasteful because current coordinate + Pixi + interaction learnings are valuable.

Best path:
1. **Protect current working V1** as-is.
2. **Extract selected reusable pieces** (math, renderer patterns, touch heuristics) into V2 architecture.
3. **Develop V2 engine in parallel** with strict ownership boundaries and stable schema.

This is the minimum-risk approach that stays lightweight and GAA-first without overengineering.
