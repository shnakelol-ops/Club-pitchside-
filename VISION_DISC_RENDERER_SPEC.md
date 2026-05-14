# VisionDiscRenderer Architecture & Interface Specification

Status: **LOCKED PRE-IMPLEMENTATION SPEC**  
Date: 2026-05-14  
Scope: **Architecture and interfaces only. No production implementation in this phase.**

---

## 0) Intent and Constraints

This spec defines a clean-room VisionDisc renderer pipeline so Vision V3 can be implemented from the interactive HTML token playground without legacy Classic/Glow/Torso contamination.

Hard constraints for implementation phases:

- Do **not** patch `src/engine/pixi/createVisionV3PlayerToken.ts`.
- Do **not** touch production board rendering in this phase.
- Do **not** touch save/load, stats, equipment, ball, pitch, controls.
- Route work is deferred to Phase 2 (`/token-debug` only).

---

## 1) VisionDiscRenderer Folder Structure (planned)

```text
src/engine/pixi/vision-disc/
  contracts.ts                  # All public and internal TypeScript contracts
  constants.ts                  # Locked geometry ratios and visual constants
  cssToPixiMap.ts               # Explicit CSS token -> Pixi property mapping
  geometry.ts                   # Pure geometry calculators from normalized ratios
  colorMath.ts                  # Pure color/alpha conversion utilities (isolated)
  patternPainter.ts             # Hoops/stripes/slash painters (VisionDisc only)
  layerBuilder.ts               # Ordered layer assembly into Pixi Graphics/Text
  createVisionDiscToken.ts      # Public renderer entrypoint
  adapters/
    tacticalToVisionDisc.ts     # Tactical player data -> VisionDisc config adapter
  debug/
    createVisionDiscDebugScene.ts   # Side-by-side debug harness (Phase 2)
```

No file in this folder may import Classic/Glow/Torso renderer modules.

---

## 2) Exact TypeScript Contracts

## 2.1 Core enums and discriminated unions

```ts
export type VisionDiscTeamSide = "BLUE" | "RED";
export type VisionDiscTeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
export type VisionDiscKitPattern = "plain" | "hoops" | "stripes" | "slash";
export type VisionDiscLabelMode = "number" | "initials";
```

## 2.2 Normalized geometry contract

```ts
export type VisionDiscGeometryRatios = {
  outerRadius: 1.0;                 // canonical normalized radius
  innerDiscRadius: 0.84;            // exact
  ringThickness: 0.16;              // exact = 1.0 - 0.84
  selectedHaloRadiusOffset: 0.12;   // exact
  selectedHaloStrokeWidth: 0.08;    // exact
  numberFontRatioSingle: 0.56;      // exact
  numberFontRatioMulti: 0.48;       // exact
  initialsFontRatio: 0.36;          // exact
  patternStrokeRatio: 0.12;         // exact baseline for hoops/stripes/slash
  shadowOffsetY: 0.18;              // exact
  shadowEllipseRx: 0.78;            // exact
  shadowEllipseRy: 0.22;            // exact
  shadowAlpha: 0.22;                // exact
  ambientShadowRadiusRatio: 1.10;   // exact
  ambientShadowAlpha: 0.08;         // exact
};
```

## 2.3 Visual token contract (from playground CSS tokens)

```ts
export type VisionDiscCssTokenSet = {
  ringColor: string;          // CSS color
  ringStrokeColor: string;
  discBaseColor: string;
  discHighlightColor: string;
  discEdgeColor: string;
  patternColor: string;
  glyphColor: string;
  labelColor: string;
  labelStrokeColor: string;
  labelPlateColor: string;
  shadowColor: string;
  haloColor: string;
};
```

## 2.4 Resolved Pixi style contract

```ts
export type VisionDiscResolvedStyle = {
  colors: {
    ringColor: number;
    ringStrokeColor: number;
    discBaseColor: number;
    discHighlightColor: number;
    discEdgeColor: number;
    patternColor: number;
    glyphColor: number;
    labelColor: number;
    labelStrokeColor: number;
    labelPlateColor: number;
    shadowColor: number;
    haloColor: number;
  };
  alpha: {
    shadow: number;
    ambientShadow: number;
    ringStroke: number;
    pattern: number;
    highlight: number;
    labelPlate: number;
    halo: number;
  };
};
```

## 2.5 Renderer input/output contract

```ts
export type VisionDiscRenderInput = {
  label: string;                      // max 3 chars already sanitized by adapter
  number: number;
  labelMode: VisionDiscLabelMode;
  teamSide: VisionDiscTeamSide;
  teamColor: VisionDiscTeamColor;
  kitPattern: VisionDiscKitPattern;
  selected: boolean;
  radiusPx: number;                   // outer radius in world units
  scale: number;
  styleTokens: VisionDiscCssTokenSet; // source-of-truth visual token payload
};

export type VisionDiscRenderOutput = {
  token: import("pixi.js").Container;
  shadow: import("pixi.js").Graphics;
  layers: {
    shadow: import("pixi.js").Graphics;
    ambient: import("pixi.js").Graphics;
    ring: import("pixi.js").Graphics;
    disc: import("pixi.js").Graphics;
    pattern: import("pixi.js").Graphics;
    glyph: import("pixi.js").Graphics;
    labelPlate: import("pixi.js").Graphics;
    labelText: import("pixi.js").Text;
    orientationTick: import("pixi.js").Graphics;
    selectedHalo?: import("pixi.js").Graphics;
  };
};

export type VisionDiscRenderer = (input: VisionDiscRenderInput) => VisionDiscRenderOutput;
```

---

## 3) Exact CSS-to-Pixi Mapping (interactive HTML playground source-of-truth)

Rule: The interactive HTML playground must expose computed CSS variables for VisionDisc. Pixi must consume those values 1:1 via `VisionDiscCssTokenSet` before conversion to numeric color/alpha.

## 3.1 CSS token names (contract)

```css
--vd-ring-color
--vd-ring-stroke-color
--vd-disc-base-color
--vd-disc-highlight-color
--vd-disc-edge-color
--vd-pattern-color
--vd-glyph-color
--vd-label-color
--vd-label-stroke-color
--vd-label-plate-color
--vd-shadow-color
--vd-halo-color
```

## 3.2 Mapping table

| CSS token | Pixi layer | Pixi property |
|---|---|---|
| `--vd-shadow-color` | `shadow`, `ambient` | `fill.color` |
| `--vd-ring-color` | `ring` | `fill.color` |
| `--vd-ring-stroke-color` | `ring` | `stroke.color` |
| `--vd-disc-base-color` | `disc` | `fill.color` |
| `--vd-disc-highlight-color` | `disc` | highlight `fill.color` |
| `--vd-disc-edge-color` | `disc` | edge `stroke.color` |
| `--vd-pattern-color` | `pattern` | `stroke.color` / `fill.color` |
| `--vd-glyph-color` | `glyph` | `fill.color` |
| `--vd-label-plate-color` | `labelPlate` | `fill.color` |
| `--vd-label-color` | `labelText` | `TextStyle.fill` |
| `--vd-label-stroke-color` | `labelText` | `TextStyle.stroke.color` |
| `--vd-halo-color` | `selectedHalo` | `stroke.color` / `fill.color` |

No fallback color mixing from legacy renderers is allowed in VisionDisc.

---

## 4) Exact Layer Order

Layer order is strict and must not vary by style:

1. `shadow` (ground ellipse)
2. `ambient` (soft radial underglow)
3. `ring` (outer annulus)
4. `disc` (inner disc base + highlight + edge)
5. `pattern` (kit pattern overlay, clipped to inner disc)
6. `glyph` (shirt/person icon geometry)
7. `labelPlate`
8. `labelText`
9. `orientationTick`
10. `selectedHalo` (only when selected; always topmost)

---

## 5) Exact Geometry Ratios (locked)

All ratios are relative to outer radius `R`.

- Outer token radius: `R = 1.00` (runtime uses `radiusPx`)
- Inner disc radius: `0.84R` (**exact**)
- Ring thickness: `0.16R` (**exact**)
- Selected halo radius: `R + 0.12R = 1.12R` (**exact offset**)
- Selected halo stroke width: `0.08R`
- Number font size:
  - single digit: `0.56R`
  - 2+ digits: `0.48R`
  - initials: `0.36R`
- Shadow:
  - ellipse center Y offset: `+0.18R`
  - ellipse radii: `rx = 0.78R`, `ry = 0.22R`
  - shadow alpha: `0.22`
  - ambient radial radius: `1.10R`
  - ambient alpha: `0.08`
- Pattern widths:
  - baseline pattern stroke: `0.12R`
  - hoops centerlines: `y = -0.30R` and `y = +0.30R`
  - stripes centerlines: `x = -0.30R` and `x = +0.30R`
  - slash line: from `(-0.62R, +0.48R)` to `(+0.62R, -0.48R)` with `0.12R` stroke

---

## 6) Exact Adapter Contract (Tactical Player -> VisionDisc)

Adapter file target: `src/engine/pixi/vision-disc/adapters/tacticalToVisionDisc.ts`

```ts
export type TacticalPlayerForVisionDisc = {
  id: string;
  number: number;
  team: "BLUE" | "RED";
  teamColor: "blue" | "red" | "yellow" | "black";
  kitBaseColor?: string;
  kitPattern?: "plain" | "hoops" | "stripes" | "slash";
  kitPatternColor?: string;
  labelMode?: "number" | "initials";
  initials?: string;
  isSelected?: boolean;
};

export type VisionDiscAdapterInput = {
  player: TacticalPlayerForVisionDisc;
  radiusPx: number;
  scale: number;
  playgroundTokens: VisionDiscCssTokenSet;
};

export type VisionDiscAdapterResult =
  | { ok: true; value: VisionDiscRenderInput }
  | { ok: false; reason: "invalid_label" | "invalid_pattern" | "invalid_color_token" };

export function adaptTacticalPlayerToVisionDisc(
  input: VisionDiscAdapterInput,
): VisionDiscAdapterResult;
```

Adapter rules:

1. Sanitize label to max 3 chars.
2. Resolve label precedence:
   - `labelMode === "initials"` and valid initials -> use initials
   - otherwise use number string.
3. Normalize pattern to one of 4 allowed values.
4. Never import legacy style objects (`MicroAthleteStyle`, etc.).
5. Never perform legacy goalkeeper black/navy override inside adapter.
6. Style must come from `playgroundTokens` only.

---

## 7) Isolation Rules from Classic/Glow/Torso

VisionDisc isolation is mandatory:

1. `vision-disc/*` files may not import:
   - `createMicroAthleteToken.ts`
   - `createPremiumGlowPlayerToken.ts`
   - `createTorsoPlayerToken.ts`
   - `createVisionV3PlayerToken.ts`
2. `vision-disc/contracts.ts` owns its own type domain.
3. No shared mutable constants between VisionDisc and legacy renderers.
4. No legacy dark base constants (`TOKEN_BASE_COLOR`, old mixColor recipes) in VisionDisc.
5. Integration point only:
   - renderer selection switch in `playerTokenRenderer.ts` (Phase 4)
   - tactical adapter callsite in tactical surface (Phase 4)

---

## 8) `/token-debug` Validation Plan (before live wiring)

Purpose: compare HTML playground reference vs Pixi VisionDisc output in isolation.

Debug view requirements:

1. Route path: `/token-debug` (Phase 2).
2. Two columns:
   - Left: HTML playground token (reference snapshot/data)
   - Right: Pixi VisionDisc token
3. Shared controls:
   - team color
   - pattern
   - label mode/value
   - selected state
4. Toggle overlays:
   - layer-by-layer visibility
   - geometry guides (R, inner 0.84R, halo 1.12R)
5. Acceptance checks:
   - ratio checks exact to spec constants
   - visual diff tolerance target <= 2 px on ring/disc boundaries at reference scale
   - text baseline alignment delta <= 1 px

Live integration is blocked until `/token-debug` sign-off.

---

## 9) Implementation Phases (gated)

## Phase 1: Add isolated files

- Create `vision-disc/` folder and contracts/constants/mappers only.
- No renderer wiring.
- No route changes.

Deliverable: compile-safe isolated module skeleton with zero runtime impact.

## Phase 2: Build `/token-debug` only

- Add debug scene + debug page.
- Add route entry for `/token-debug` only.
- Do not touch tactical production board path.

Deliverable: isolated visual validation environment.

## Phase 3: Compare against HTML playground

- Load/lock playground token values.
- Run visual parity checks across full token matrix.
- Record sign-off checklist with pass/fail.

Deliverable: approved parity report.

## Phase 4: Wire Vision V3 live (after approval only)

- Update Vision V3 renderer resolution to use `createVisionDiscToken`.
- Keep Classic/Glow/Torso untouched.
- Keep save/load and all non-token systems untouched.

Deliverable: Vision V3 uses VisionDisc pipeline in production path only after approval.

---

## 10) Non-goals for this spec phase

- No production renderer implementation.
- No modifications to `createVisionV3PlayerToken.ts`.
- No tactical board runtime behavior changes.
- No persistence model changes.

---

## 11) Spec Lock

This document is the authoritative implementation contract for VisionDisc architecture and rollout gates.  
Any change to ratios, layer order, adapter rules, or isolation rules requires an explicit spec revision before coding.
