import { NORMALIZED_MAX, NORMALIZED_MIN, type NormalizedPoint } from "../../shared/normalization";
import { DEFAULT_PLAYBACK_SPEED_MULTIPLIER, KIT_COLOR_NAMES, MAX_PLAYBACK_SPEED_MULTIPLIER, MIN_PLAYBACK_SPEED_MULTIPLIER, type TacticalKitColor } from "../constants/tacticalSurfaceConstants";

export type TacticalKitPattern = "plain" | "hoops" | "stripes" | "slash";
export type TacticalLabelMode = "number" | "initials";
export type PhaseBallSnapshot = { id: string; x: number; y: number };
export type PhaseSnapshot = { players: NormalizedPoint[]; football: PhaseBallSnapshot[] };

export function clampWorld(value: number, max: number): number { if (!Number.isFinite(value)) return 0; if (value < 0) return 0; if (value > max) return max; return value; }
export function clampTeamCount(value: number | undefined): number { const parsed = Number.isFinite(value) ? Math.floor(value as number) : 1; return Math.max(1, Math.min(15, parsed)); }
export function sanitizePlaybackSpeedMultiplier(value: number): number { if (!Number.isFinite(value)) return DEFAULT_PLAYBACK_SPEED_MULTIPLIER; return Math.max(MIN_PLAYBACK_SPEED_MULTIPLIER, Math.min(MAX_PLAYBACK_SPEED_MULTIPLIER, value)); }
export function sanitizeKitColor(value: string | undefined): TacticalKitColor | undefined { if (typeof value !== "string") return undefined; const normalized = value.trim().toLowerCase(); if ((KIT_COLOR_NAMES as readonly string[]).includes(normalized)) return normalized as TacticalKitColor; return undefined; }
export function sanitizeKitPattern(value: TacticalKitPattern | undefined): TacticalKitPattern | undefined { if (!value) return undefined; if (value === "plain" || value === "hoops" || value === "slash" || value === "stripes") return value; return undefined; }
export function sanitizeLabelMode(value: TacticalLabelMode | undefined): TacticalLabelMode | undefined { if (value === "number" || value === "initials") return value; return undefined; }
export function clampNormalizedValue(value: number): number { if (!Number.isFinite(value)) return NORMALIZED_MIN; return Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, value)); }
export function cloneSnapshot(snapshot: PhaseSnapshot): PhaseSnapshot { return { players: snapshot.players.map((point) => ({ x: point.x, y: point.y })), football: snapshot.football.map((point) => ({ id: point.id, x: point.x, y: point.y })) }; }
