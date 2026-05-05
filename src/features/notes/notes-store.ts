import type { CoachNote, CoachNoteContext, CoachNoteType } from "./types";

export const NOTES_STORAGE_KEY = "pitchflow_notes_v1";
const MAX_STORED_NOTES = 500;
const MAX_TITLE_LENGTH = 120;
const MAX_TEXT_LENGTH = 5000;
const COACH_NOTE_TYPES: ReadonlySet<CoachNoteType> = new Set(["text", "voice"]);
const COACH_NOTE_CONTEXTS: ReadonlySet<CoachNoteContext> = new Set([
  "match",
  "training",
  "session",
  "library",
]);

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function asCoachNoteType(value: unknown): CoachNoteType | null {
  if (typeof value !== "string") return null;
  if (!COACH_NOTE_TYPES.has(value as CoachNoteType)) return null;
  return value as CoachNoteType;
}

function asCoachNoteContext(value: unknown): CoachNoteContext | null {
  if (typeof value !== "string") return null;
  if (!COACH_NOTE_CONTEXTS.has(value as CoachNoteContext)) return null;
  return value as CoachNoteContext;
}

function parseStoredCoachNote(input: unknown): CoachNote | null {
  if (!input || typeof input !== "object") return null;

  const maybeId = "id" in input ? asNonEmptyString(input.id) : null;
  const maybeType = "type" in input ? asCoachNoteType(input.type) : null;
  const maybeContext = "context" in input ? asCoachNoteContext(input.context) : null;
  const maybeCreatedAt = "createdAt" in input ? asFiniteNumber(input.createdAt) : null;
  const maybeUpdatedAt = "updatedAt" in input ? asFiniteNumber(input.updatedAt) : null;

  if (!maybeId || !maybeType || !maybeContext || maybeCreatedAt == null || maybeUpdatedAt == null) {
    return null;
  }

  const titleValue = "title" in input ? asNonEmptyString(input.title) : null;
  const textValue = "text" in input ? asNonEmptyString(input.text) : null;
  const audioBlobIdValue = "audioBlobId" in input ? asNonEmptyString(input.audioBlobId) : null;
  const audioUrlValue = "audioUrl" in input ? asNonEmptyString(input.audioUrl) : null;

  if (!textValue && !audioBlobIdValue && !audioUrlValue) {
    return null;
  }

  const maybeDuration = "durationMs" in input ? asFiniteNumber(input.durationMs) : null;
  const maybeMatchClock = "matchClockMs" in input ? asFiniteNumber(input.matchClockMs) : null;
  const maybeHalf = "half" in input && (input.half === 1 || input.half === 2) ? input.half : undefined;
  const maybeMatchId = "matchId" in input ? asNonEmptyString(input.matchId) : null;
  const maybeSessionId = "sessionId" in input ? asNonEmptyString(input.sessionId) : null;
  const maybeEventId = "eventId" in input ? asNonEmptyString(input.eventId) : null;
  const maybeStarred = "starred" in input && typeof input.starred === "boolean" ? input.starred : undefined;
  const maybePinned =
    "pinnedToNextSession" in input && typeof input.pinnedToNextSession === "boolean"
      ? input.pinnedToNextSession
      : undefined;

  const parsed: CoachNote = {
    id: maybeId,
    type: maybeType,
    context: maybeContext,
    createdAt: Math.max(0, Math.floor(maybeCreatedAt)),
    updatedAt: Math.max(0, Math.floor(maybeUpdatedAt)),
  };

  if (titleValue) parsed.title = titleValue.slice(0, MAX_TITLE_LENGTH);
  if (textValue) parsed.text = textValue.slice(0, MAX_TEXT_LENGTH);
  if (audioUrlValue) parsed.audioUrl = audioUrlValue;
  if (audioBlobIdValue) parsed.audioBlobId = audioBlobIdValue;
  if (maybeDuration != null) parsed.durationMs = Math.max(0, Math.floor(maybeDuration));
  if (maybeMatchId) parsed.matchId = maybeMatchId;
  if (maybeSessionId) parsed.sessionId = maybeSessionId;
  if (maybeEventId) parsed.eventId = maybeEventId;
  if (maybeMatchClock != null) parsed.matchClockMs = Math.max(0, Math.floor(maybeMatchClock));
  if (maybeHalf) parsed.half = maybeHalf;
  if (maybeStarred != null) parsed.starred = maybeStarred;
  if (maybePinned != null) parsed.pinnedToNextSession = maybePinned;

  return parsed;
}

function sanitizeNotes(notes: readonly CoachNote[]): CoachNote[] {
  const byId = new Map<string, CoachNote>();

  for (const note of notes) {
    const parsed = parseStoredCoachNote(note);
    if (!parsed) continue;
    const existing = byId.get(parsed.id);
    if (!existing || existing.updatedAt <= parsed.updatedAt) {
      byId.set(parsed.id, parsed);
    }
  }

  return [...byId.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_STORED_NOTES);
}

export function parseStoredCoachNotes(input: string | null): CoachNote[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) return [];
    return sanitizeNotes(parsed);
  } catch {
    return [];
  }
}

export function readCoachNotes(): CoachNote[] {
  if (typeof window === "undefined") return [];
  return parseStoredCoachNotes(window.localStorage.getItem(NOTES_STORAGE_KEY));
}

export function writeCoachNotes(notes: readonly CoachNote[]): CoachNote[] {
  const sanitized = sanitizeNotes(notes);
  if (typeof window === "undefined") return sanitized;
  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function upsertCoachNote(note: CoachNote): CoachNote[] {
  const existing = readCoachNotes().filter((entry) => entry.id !== note.id);
  return writeCoachNotes([note, ...existing]);
}

export function removeCoachNote(noteId: string): CoachNote[] {
  const next = readCoachNotes().filter((entry) => entry.id !== noteId);
  return writeCoachNotes(next);
}
