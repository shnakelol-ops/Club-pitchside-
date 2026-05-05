import { useCallback, useState } from "react";

import { deleteAudioBlob, readAudioBlob, saveAudioBlob } from "./audio-storage";
import { readCoachNotes, removeCoachNote, upsertCoachNote } from "./notes-store";
import type { CoachNote, CoachNoteContext } from "./types";

export type SaveTextNoteInput = {
  text: string;
  title?: string;
  context?: CoachNoteContext;
  matchId?: string;
  sessionId?: string;
  eventId?: string;
  matchClockMs?: number;
  half?: 1 | 2;
};

export type SaveVoiceNoteInput = {
  blob: Blob;
  durationMs: number;
  title?: string;
  context?: CoachNoteContext;
  matchId?: string;
  sessionId?: string;
  eventId?: string;
  matchClockMs?: number;
  half?: 1 | 2;
};

export type NotesActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function newLocalId(prefix: string): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c && typeof c.randomUUID === "function") {
    return `${prefix}-${c.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function applyContextMetadata(
  note: CoachNote,
  input: Pick<SaveTextNoteInput, "matchId" | "sessionId" | "eventId" | "matchClockMs" | "half">,
): CoachNote {
  const nextNote: CoachNote = { ...note };
  if (input.matchId) nextNote.matchId = input.matchId;
  if (input.sessionId) nextNote.sessionId = input.sessionId;
  if (input.eventId) nextNote.eventId = input.eventId;
  if (typeof input.matchClockMs === "number" && Number.isFinite(input.matchClockMs)) {
    nextNote.matchClockMs = Math.max(0, Math.floor(input.matchClockMs));
  }
  if (input.half === 1 || input.half === 2) {
    nextNote.half = input.half;
  }
  return nextNote;
}

export function useNotes() {
  const [notes, setNotes] = useState<CoachNote[]>(() => readCoachNotes());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadNotes = useCallback(() => {
    setNotes(readCoachNotes());
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const saveTextNote = useCallback(
    (input: SaveTextNoteInput): NotesActionResult<CoachNote> => {
      const text = input.text.trim();
      if (text.length === 0) {
        return { ok: false, error: "Text note cannot be empty." };
      }

      const now = Date.now();
      const baseNote: CoachNote = {
        id: newLocalId("note"),
        type: "text",
        context: input.context ?? "match",
        title: input.title?.trim() || undefined,
        text,
        createdAt: now,
        updatedAt: now,
      };
      const nextNote = applyContextMetadata(baseNote, input);

      try {
        setIsSaving(true);
        setError(null);
        const nextNotes = upsertCoachNote(nextNote);
        setNotes(nextNotes);
        return { ok: true, data: nextNote };
      } catch {
        const message = "Could not save text note.";
        setError(message);
        return { ok: false, error: message };
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const saveVoiceNote = useCallback(
    async (input: SaveVoiceNoteInput): Promise<NotesActionResult<CoachNote>> => {
      if (input.blob.size <= 0) {
        return { ok: false, error: "Voice note recording is empty." };
      }

      const now = Date.now();
      const noteId = newLocalId("note");
      const blobId = newLocalId("blob");
      const baseNote: CoachNote = {
        id: noteId,
        type: "voice",
        context: input.context ?? "match",
        title: input.title?.trim() || undefined,
        audioBlobId: blobId,
        durationMs: Math.max(0, Math.floor(input.durationMs)),
        createdAt: now,
        updatedAt: now,
      };
      const nextNote = applyContextMetadata(baseNote, input);

      setIsSaving(true);
      setError(null);
      try {
        await saveAudioBlob(blobId, input.blob);
        const nextNotes = upsertCoachNote(nextNote);
        setNotes(nextNotes);
        return { ok: true, data: nextNote };
      } catch {
        try {
          await deleteAudioBlob(blobId);
        } catch {
          // Best-effort cleanup only.
        }
        const message = "Could not save voice note.";
        setError(message);
        return { ok: false, error: message };
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const deleteNote = useCallback(
    async (noteId: string): Promise<NotesActionResult<CoachNote[]>> => {
      const target = notes.find((note) => note.id === noteId);
      setError(null);
      try {
        setIsSaving(true);
        const nextNotes = removeCoachNote(noteId);
        setNotes(nextNotes);
        if (target?.audioBlobId) {
          await deleteAudioBlob(target.audioBlobId);
        }
        return { ok: true, data: nextNotes };
      } catch {
        const message = "Could not delete note.";
        setError(message);
        return { ok: false, error: message };
      } finally {
        setIsSaving(false);
      }
    },
    [notes],
  );

  const readVoiceNoteBlob = useCallback(
    async (audioBlobId: string): Promise<NotesActionResult<Blob>> => {
      if (!audioBlobId.trim()) {
        return { ok: false, error: "Voice note audio is unavailable." };
      }
      try {
        const blob = await readAudioBlob(audioBlobId);
        if (!blob) {
          return { ok: false, error: "Voice recording data is missing." };
        }
        return { ok: true, data: blob };
      } catch {
        return { ok: false, error: "Could not load voice note audio." };
      }
    },
    [],
  );

  return {
    notes,
    isSaving,
    error,
    clearError,
    reloadNotes,
    saveTextNote,
    saveVoiceNote,
    deleteNote,
    readVoiceNoteBlob,
  };
}
