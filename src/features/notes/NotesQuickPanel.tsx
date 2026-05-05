import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { useVoiceRecorder } from "./use-voice-recorder";
import type { CoachNoteContext } from "./types";
import { useNotes } from "./use-notes";

type NotesQuickPanelProps = {
  defaultContext?: CoachNoteContext;
  onRequestClose?: () => void;
  panelAnchorStyle?: CSSProperties;
  matchContext?: {
    matchId?: string;
    sessionId?: string;
    eventId?: string;
    matchClockMs?: number;
    half?: 1 | 2;
  };
};

const PANEL_STYLE_BASE: CSSProperties = {
  display: "grid",
  borderRadius: "12px",
  border: "1px solid rgba(187, 211, 233, 0.24)",
  background: "rgba(11, 21, 29, 0.86)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 12px 28px rgba(2, 8, 15, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.11)",
  zIndex: 10030,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: "#eff8ff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.16px",
};

const TEXTAREA_STYLE_BASE: CSSProperties = {
  width: "100%",
  resize: "vertical",
  borderRadius: "10px",
  border: "1px solid rgba(163, 190, 212, 0.32)",
  background: "rgba(10, 19, 24, 0.74)",
  color: "#e4eff8",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  lineHeight: 1.35,
  padding: "10px",
  outline: "none",
};

const ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const BUTTON_STYLE: CSSProperties = {
  minHeight: "42px",
  borderRadius: "10px",
  border: "1px solid rgba(163, 190, 212, 0.3)",
  background: "rgba(15, 23, 42, 0.84)",
  color: "#e2e8f0",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.16px",
  padding: "0 10px",
  cursor: "pointer",
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  border: "1px solid rgba(34, 197, 94, 0.58)",
  background: "rgba(22, 101, 52, 0.72)",
  color: "#ecfdf5",
};

const DANGER_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  border: "1px solid rgba(248, 113, 113, 0.54)",
  background: "rgba(127, 29, 29, 0.62)",
  color: "#fee2e2",
};

const META_TEXT_STYLE: CSSProperties = {
  margin: 0,
  color: "rgba(208, 227, 242, 0.9)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10px",
  fontWeight: 560,
  lineHeight: 1.35,
};

const ERROR_TEXT_STYLE: CSSProperties = {
  ...META_TEXT_STYLE,
  color: "#fecaca",
};

const RECENT_NOTES_WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: "6px",
  marginTop: "2px",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "contain",
};

const RECENT_NOTE_ITEM_STYLE: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "7px",
  borderRadius: "9px",
  border: "1px solid rgba(163, 190, 212, 0.22)",
  background: "rgba(10, 19, 24, 0.62)",
};

const RECENT_NOTE_TOP_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const RECENT_NOTE_TYPE_STYLE: CSSProperties = {
  color: "#dbeafe",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.16px",
  textTransform: "uppercase",
};

const RECENT_NOTE_TIME_STYLE: CSSProperties = {
  color: "rgba(208, 227, 242, 0.78)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "9px",
  fontWeight: 560,
};

const RECENT_NOTE_TEXT_STYLE: CSSProperties = {
  margin: 0,
  color: "#e4eff8",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  lineHeight: 1.35,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const RECENT_NOTE_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "8px",
  alignItems: "center",
};

const RECENT_NOTE_PLAY_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  minHeight: "28px",
  minWidth: "34px",
  padding: "0 8px",
  fontSize: "12px",
};

function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatRelativeTime(timestampMs: number, nowMs: number): string {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return "just now";
  const deltaSeconds = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (deltaSeconds < 60) return "just now";
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)}m ago`;
  if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)}h ago`;
  return `${Math.floor(deltaSeconds / 86400)}d ago`;
}

function trimPreview(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= 40) return normalized;
  return `${normalized.slice(0, 40)}…`;
}

function isDisabledRecorderStatus(status: string): boolean {
  return status === "requesting-permission" || status === "stopping";
}

export function NotesQuickPanel({
  defaultContext = "match",
  onRequestClose,
  panelAnchorStyle,
  matchContext,
}: NotesQuickPanelProps) {
  const [textDraft, setTextDraft] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(orientation: landscape)").matches,
  );
  const [pendingVoiceResult, setPendingVoiceResult] = useState<{
    blob: Blob;
    durationMs: number;
  } | null>(null);
  const [pendingVoiceLabel, setPendingVoiceLabel] = useState<string>("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { notes, saveTextNote, saveVoiceNote, readVoiceNoteBlob, isSaving } = useNotes();
  const recorder = useVoiceRecorder();
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const stopPanelInteraction = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  const recorderErrorText = useMemo(() => {
    if (!recorder.error) return null;
    return recorder.error.message;
  }, [recorder.error]);

  useEffect(() => {
    const media = window.matchMedia("(orientation: landscape)");
    const updateOrientation = () => {
      setIsLandscape(media.matches);
    };
    updateOrientation();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateOrientation);
    } else {
      media.addListener(updateOrientation);
    }
    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", updateOrientation);
      } else {
        media.removeListener(updateOrientation);
      }
    };
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    const timeoutId = window.setTimeout(() => {
      setSaveMessage(null);
    }, 2000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveMessage]);

  const panelStyle = useMemo<CSSProperties>(() => {
    if (isLandscape) {
      const anchorStyle =
        panelAnchorStyle ??
        ({
          position: "fixed",
          right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
          bottom: "max(140px, calc(env(safe-area-inset-bottom, 0px) + 136px))",
        } as const);
      return {
        ...PANEL_STYLE_BASE,
        ...anchorStyle,
        width: "min(calc(100vw - 24px), 360px)",
        maxHeight: "min(65vh, calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 20px))",
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
        gap: "6px",
        padding: "7px",
      };
    }

    return {
      ...PANEL_STYLE_BASE,
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      top: "max(18px, calc(env(safe-area-inset-top, 0px) + 12px))",
      width: "min(360px, calc(100vw - 24px))",
      maxHeight: "70vh",
      overflowY: "auto",
      overflowX: "hidden",
      overscrollBehavior: "contain",
      gap: "8px",
      padding: "10px",
    };
  }, [isLandscape, panelAnchorStyle]);

  const textAreaStyle = useMemo<CSSProperties>(() => {
    return {
      ...TEXTAREA_STYLE_BASE,
      minHeight: isLandscape ? "52px" : "86px",
      maxHeight: isLandscape ? "82px" : "150px",
    };
  }, [isLandscape]);

  const recentNotesWrapStyle = useMemo<CSSProperties>(
    () => ({
      ...RECENT_NOTES_WRAP_STYLE,
      maxHeight: isLandscape ? "100px" : "140px",
    }),
    [isLandscape],
  );

  const clearFeedback = () => {
    setSaveMessage(null);
    setPanelError(null);
  };

  const handleSaveTextNote = () => {
    const nextText = textDraft.trim();
    if (nextText.length === 0) {
      setPanelError("Add note text before saving.");
      setSaveMessage(null);
      return;
    }

    const result = saveTextNote({
      context: defaultContext,
      text: nextText,
      title: nextText.slice(0, 48),
      matchId: matchContext?.matchId,
      sessionId: matchContext?.sessionId,
      eventId: matchContext?.eventId,
      matchClockMs: matchContext?.matchClockMs,
      half: matchContext?.half,
    });
    if (result.ok === false) {
      setPanelError(result.error);
      setSaveMessage(null);
      return;
    }
    setTextDraft("");
    setPanelError(null);
    setSaveMessage("Saved ✓");
  };

  const handleStartVoiceRecording = async () => {
    clearFeedback();
    setPendingVoiceResult(null);
    const started = await recorder.startRecording();
    if (started.ok === false) {
      setPanelError(started.error.message);
      return;
    }
    setPendingVoiceLabel("");
  };

  const handleStopVoiceRecording = async () => {
    clearFeedback();
    const stopped = await recorder.stopRecording();
    if (stopped.ok === false) {
      setPanelError(stopped.error.message);
      return;
    }
    setPendingVoiceResult({
      blob: stopped.blob,
      durationMs: stopped.durationMs,
    });
  };

  const handleCancelVoiceRecording = async () => {
    clearFeedback();
    const cancelled = await recorder.cancelRecording();
    if (cancelled.ok === false) {
      setPanelError(cancelled.error.message);
      return;
    }
    setPendingVoiceResult(null);
    setPendingVoiceLabel("");
  };

  const handleSaveVoiceNote = async () => {
    if (!pendingVoiceResult) {
      setPanelError("Record audio first.");
      return;
    }
    clearFeedback();
    const result = await saveVoiceNote({
      context: defaultContext,
      blob: pendingVoiceResult.blob,
      durationMs: pendingVoiceResult.durationMs,
      title: pendingVoiceLabel.trim() || "Voice note",
      matchId: matchContext?.matchId,
      sessionId: matchContext?.sessionId,
      eventId: matchContext?.eventId,
      matchClockMs: matchContext?.matchClockMs,
      half: matchContext?.half,
    });
    if (result.ok === false) {
      setPanelError(result.error);
      return;
    }

    const cleared = await recorder.cancelRecording();
    if (cleared.ok === false) {
      setPanelError(cleared.error.message);
      return;
    }

    setPendingVoiceResult(null);
    setPendingVoiceLabel("");
    setSaveMessage("Saved ✓");
  };

  const currentMatchId = matchContext?.matchId;
  const recentNotes = useMemo(() => {
    if (!currentMatchId) {
      return [];
    }
    const now = Date.now();
    return notes
      .filter((note) => note.matchId === currentMatchId)
      .slice(0, 5)
      .map((note) => ({
        note,
        label: formatRelativeTime(note.createdAt, now),
        preview: note.type === "text" ? trimPreview(note.text ?? "") : "Voice note",
      }));
  }, [notes, currentMatchId]);

  const selectedTextNote = useMemo(() => {
    if (!selectedNoteId) return null;
    const note = notes.find((entry) => entry.id === selectedNoteId);
    if (!note || note.type !== "text") return null;
    return note;
  }, [notes, selectedNoteId]);

  const handlePlayVoiceNote = async (audioBlobId: string) => {
    const result = await readVoiceNoteBlob(audioBlobId);

    if (!result.ok) {
      setPanelError(result.error);
      setPlayingNoteId(null);
      return;
    }

    const audioUrl = URL.createObjectURL(result.data);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      setPlayingNoteId(null);
    };

    try {
      await audio.play();
    } catch {
      URL.revokeObjectURL(audioUrl);
      setPanelError("Could not play voice note.");
      setPlayingNoteId(null);
    }
  };

  const hasPendingVoiceClip = pendingVoiceResult != null;
  const recorderBusy = isDisabledRecorderStatus(recorder.status);
  const isRecording = recorder.status === "recording";

  return (
    <div
      style={panelStyle}
      role="dialog"
      aria-modal="false"
      aria-label="Quick notes panel"
      data-notes-quick-panel-root="true"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <p style={TITLE_STYLE}>My Notes</p>

      <p style={TITLE_STYLE}>Recent Notes</p>
      {recentNotes.length === 0 ? (
        <p style={META_TEXT_STYLE}>No notes yet</p>
      ) : (
        <div style={recentNotesWrapStyle}>
          {recentNotes.map(({ note, label, preview }) => (
            <div
              key={note.id}
              style={{
                ...RECENT_NOTE_ITEM_STYLE,
                cursor: note.type === "text" ? "pointer" : "default",
              }}
              onPointerDown={stopPanelInteraction}
              onTouchStart={stopPanelInteraction}
              onClick={(event) => {
                event.stopPropagation();
                if (note.type === "text") {
                  setSelectedNoteId(note.id);
                }
              }}
            >
              <div style={RECENT_NOTE_TOP_ROW_STYLE}>
                <span style={RECENT_NOTE_TYPE_STYLE}>{note.type === "voice" ? "Voice" : "Text"}</span>
                <span style={RECENT_NOTE_TIME_STYLE}>{label}</span>
              </div>
              <div style={RECENT_NOTE_ROW_STYLE}>
                <p style={RECENT_NOTE_TEXT_STYLE}>{preview || "(empty note)"}</p>
                {note.type === "voice" ? (
                  <button
                    type="button"
                    style={RECENT_NOTE_PLAY_STYLE}
                    disabled={!note.audioBlobId || playingNoteId === note.id}
                    onPointerDown={stopPanelInteraction}
                    onTouchStart={stopPanelInteraction}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!note.audioBlobId) return;
                      setPanelError(null);
                      setPlayingNoteId(note.id);
                      void handlePlayVoiceNote(note.audioBlobId);
                    }}
                  >
                    {playingNoteId === note.id ? "…" : "▶️"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedTextNote ? (
        <div
          style={RECENT_NOTE_ITEM_STYLE}
          onPointerDown={stopPanelInteraction}
          onTouchStart={stopPanelInteraction}
          onClick={stopPanelInteraction}
        >
          <div style={RECENT_NOTE_TOP_ROW_STYLE}>
            <span style={RECENT_NOTE_TYPE_STYLE}>Full Text</span>
            <button
              type="button"
              style={RECENT_NOTE_PLAY_STYLE}
              onPointerDown={stopPanelInteraction}
              onTouchStart={stopPanelInteraction}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedNoteId(null);
              }}
            >
              Back
            </button>
          </div>
          <p style={RECENT_NOTE_TEXT_STYLE}>{selectedTextNote.text ?? "(empty note)"}</p>
          <p style={RECENT_NOTE_TIME_STYLE}>Saved {formatRelativeTime(selectedTextNote.createdAt, Date.now())}</p>
        </div>
      ) : null}

      <textarea
        style={textAreaStyle}
        placeholder="Quick text note..."
        value={textDraft}
        onPointerDown={stopPanelInteraction}
        onClick={stopPanelInteraction}
        onTouchStart={stopPanelInteraction}
        onChange={(event) => setTextDraft(event.target.value)}
      />
      <div style={ROW_STYLE}>
        <button
          type="button"
          style={PRIMARY_BUTTON_STYLE}
          onPointerDown={stopPanelInteraction}
          onTouchStart={stopPanelInteraction}
          onClick={handleSaveTextNote}
          disabled={isSaving}
        >
          Save Text
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          onPointerDown={stopPanelInteraction}
          onTouchStart={stopPanelInteraction}
          onClick={onRequestClose}
        >
          Close
        </button>
      </div>
      {saveMessage ? <p style={META_TEXT_STYLE}>{saveMessage}</p> : null}

      <p style={TITLE_STYLE}>Voice Note</p>
      <div style={ROW_STYLE}>
        {!isRecording ? (
          <button
            type="button"
            style={PRIMARY_BUTTON_STYLE}
            disabled={!recorder.isSupported || recorderBusy || isSaving}
            onPointerDown={stopPanelInteraction}
            onTouchStart={stopPanelInteraction}
            onClick={handleStartVoiceRecording}
          >
            {recorder.status === "requesting-permission" ? "Requesting..." : "Start Voice"}
          </button>
        ) : (
          <button
            type="button"
            style={PRIMARY_BUTTON_STYLE}
            disabled={recorderBusy || isSaving}
            onPointerDown={stopPanelInteraction}
            onTouchStart={stopPanelInteraction}
            onClick={handleStopVoiceRecording}
          >
            Stop Voice
          </button>
        )}

        <button
          type="button"
          style={DANGER_BUTTON_STYLE}
          disabled={recorderBusy || isSaving}
          onPointerDown={stopPanelInteraction}
          onTouchStart={stopPanelInteraction}
          onClick={handleCancelVoiceRecording}
        >
          Clear
        </button>
      </div>

      <p style={META_TEXT_STYLE}>
        {recorder.isSupported
          ? `Recorder: ${recorder.status} · ${formatDuration(recorder.durationMs)}`
          : "Recorder unsupported on this browser"}
      </p>

      {hasPendingVoiceClip ? (
        <>
          <input
            value={pendingVoiceLabel}
            onPointerDown={stopPanelInteraction}
            onClick={stopPanelInteraction}
            onTouchStart={stopPanelInteraction}
            onChange={(event) => setPendingVoiceLabel(event.target.value)}
            placeholder="Voice note title (optional)"
            style={{
              ...TEXTAREA_STYLE_BASE,
              minHeight: isLandscape ? "36px" : "42px",
              maxHeight: isLandscape ? "36px" : "42px",
              resize: "none",
              paddingTop: isLandscape ? "8px" : "11px",
            }}
          />
          <button
            type="button"
            style={PRIMARY_BUTTON_STYLE}
            onPointerDown={stopPanelInteraction}
            onTouchStart={stopPanelInteraction}
            onClick={handleSaveVoiceNote}
            disabled={isSaving}
          >
            Save Voice
          </button>
        </>
      ) : null}
      {panelError ? <p style={ERROR_TEXT_STYLE}>{panelError}</p> : null}
      {!panelError && recorderErrorText ? <p style={ERROR_TEXT_STYLE}>{recorderErrorText}</p> : null}
    </div>
  );
}
