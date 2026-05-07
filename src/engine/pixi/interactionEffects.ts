export type DrawAnimationEffectKind = "line" | "arrow" | "dashedLine" | "curvedArrow" | "freehand";

export type DrawAnimationEffect = {
  id: string;
  targetDrawingId: string;
  kind: DrawAnimationEffectKind;
  startedAt: number;
  durationMs: number;
};

export type PlayerTapFeedbackEffect = {
  id: string;
  playerId: string;
  startedAt: number;
  durationMs: number;
};

export type GhostTrailEffect = {
  id: string;
  playerId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  startedAt: number;
  durationMs: number;
};

export type MovePreviewEffect = {
  id: string;
  playerId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  startedAt: number;
  durationMs: number;
};

export const DRAW_ANIMATION_DURATION_MS: Record<DrawAnimationEffectKind, number> = {
  line: 140,
  arrow: 170,
  dashedLine: 170,
  curvedArrow: 190,
  freehand: 120,
};

export const PLAYER_TAP_FEEDBACK_DURATION_MS = 160;
export const GHOST_TRAIL_DURATION_MS = 650;
export const MOVE_PREVIEW_DURATION_MS = 450;

export function getEffectProgress(now: number, startedAt: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  return Math.max(0, Math.min(1, (now - startedAt) / durationMs));
}

export function isEffectActive(now: number, startedAt: number, durationMs: number): boolean {
  return getEffectProgress(now, startedAt, durationMs) < 1;
}
