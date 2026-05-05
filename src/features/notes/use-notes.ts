import { useCallback, useState } from "react";

import { deleteAudioBlob, saveAudioBlob } from "./audio-storage";
import { readCoachNotes, removeCoachNote, upsertCoachNote } from "./notes-store";
import type { CoachNote, CoachNoteContext } from "./types";

export type SaveTextNoteInput = {
  text: string;
  title?: string;
  context?: CoachNoteContext;
};

export type SaveVoiceNoteInput = {
  blob: Blob;
  durationMs: number;
  title?: string;
  context?: CoachNoteContext;
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
      const nextNote: CoachNote = {
        id: newLocalId("note"),
        type: "text",
        context: input.context ?? "match",
        title: input.title?.trim() || undefined,
        text,
        createdAt: now,
        updatedAt: now,
      };

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
      const nextNote: CoachNote = {
        id: noteId,
        type: "voice",
        context: input.context ?? "match",
        title: input.title?.trim() || undefined,
        audioBlobId: blobId,
        durationMs: Math.max(0, Math.floor(input.durationMs)),
        createdAt: now,
        updatedAt: now,
      };

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

  return {
    notes,
    isSaving,
    error,
    clearError,
    reloadNotes,
    saveTextNote,
    saveVoiceNote,
    deleteNote,
  };
}
