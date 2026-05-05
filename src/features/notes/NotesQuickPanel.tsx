import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { useVoiceRecorder } from "./use-voice-recorder";
import type { CoachNote, CoachNoteContext } from "./types";
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
  maxHeight: "170px",
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

const RECENT_NOTE_META_STYLE: CSSProperties = {
  color: "rgba(208, 227, 242, 0.82)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "9.5px",
  fontWeight: 560,
};

const RECENT_NOTE_PLAY_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  minHeight: "34px",
  fontSize: "10px",
  textTransform: "uppercase",
};

function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatTimestamp(timestampMs: number): string {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return "Unknown";
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mo} ${hh}:${mm}`;
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
  const { notes, saveTextNote, saveVoiceNote, readVoiceNoteBlob, isSaving } = useNotes();
  const recorder = useVoiceRecorder();
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);

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
    setSaveMessage("Text note saved");
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
    setSaveMessage("Recording ready to save");
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
    setSaveMessage("Recording cleared");
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
    setSaveMessage("Voice note saved");
  };

  const recentNotes = useMemo(() => notes.slice(0, 6), [notes]);

  const handlePlayVoiceNote = async (note: CoachNote) => {
    if (note.type !== "voice" || !note.audioBlobId) {
      setPanelError("Voice note audio is unavailable.");
      return;
    }
    setPanelError(null);
    setPlayingNoteId(note.id);
    try {
      const blobResult = await readVoiceNoteBlob(note.audioBlobId);
      if (!blobResult.ok) {
        const failureResult: { ok: false; error: string } = blobResult;
        setPanelError(failureResult.error);
        return;
      }
      const blob = blobResult.data;
      const objectUrl = window.URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      audio.onended = () => {
        window.URL.revokeObjectURL(objectUrl);
        setPlayingNoteId((current) => (current === note.id ? null : current));
      };
      audio.onerror = () => {
        window.URL.revokeObjectURL(objectUrl);
        setPanelError("Could not play voice note.");
        setPlayingNoteId((current) => (current === note.id ? null : current));
      };
      await audio.play();
    } catch {
      setPanelError("Could not play voice note.");
      setPlayingNoteId((current) => (current === note.id ? null : current));
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

      <textarea
        style={textAreaStyle}
        placeholder="Quick text note..."
        value={textDraft}
        onChange={(event) => setTextDraft(event.target.value)}
      />
      <div style={ROW_STYLE}>
        <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleSaveTextNote} disabled={isSaving}>
          Save Text
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={onRequestClose}>
          Close
        </button>
      </div>

      <p style={TITLE_STYLE}>Voice Note</p>
      <div style={ROW_STYLE}>
        {!isRecording ? (
          <button
            type="button"
            style={PRIMARY_BUTTON_STYLE}
            disabled={!recorder.isSupported || recorderBusy || isSaving}
            onClick={handleStartVoiceRecording}
          >
            {recorder.status === "requesting-permission" ? "Requesting..." : "Start Voice"}
          </button>
        ) : (
          <button
            type="button"
            style={PRIMARY_BUTTON_STYLE}
            disabled={recorderBusy || isSaving}
            onClick={handleStopVoiceRecording}
          >
            Stop Voice
          </button>
        )}

        <button
          type="button"
          style={DANGER_BUTTON_STYLE}
          disabled={recorderBusy || isSaving}
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
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleSaveVoiceNote} disabled={isSaving}>
            Save Voice
          </button>
        </>
      ) : null}

      <p style={TITLE_STYLE}>Recent Notes</p>
      {recentNotes.length === 0 ? (
        <p style={META_TEXT_STYLE}>No saved notes yet.</p>
      ) : (
        <div style={RECENT_NOTES_WRAP_STYLE}>
          {recentNotes.map((note) => (
            <div key={note.id} style={RECENT_NOTE_ITEM_STYLE}>
              <div style={RECENT_NOTE_TOP_ROW_STYLE}>
                <span style={RECENT_NOTE_TYPE_STYLE}>{note.type === "voice" ? "Voice" : "Text"}</span>
                <span style={RECENT_NOTE_TIME_STYLE}>{formatTimestamp(note.createdAt)}</span>
              </div>
              {note.type === "text" ? (
                <p style={RECENT_NOTE_TEXT_STYLE}>{note.text ?? "(empty note)"}</p>
              ) : (
                <>
                  <span style={RECENT_NOTE_META_STYLE}>
                    Duration: {formatDuration(note.durationMs ?? 0)}
                    {note.half ? ` · H${note.half}` : ""}
                    {note.matchClockMs != null ? ` · ${formatDuration(note.matchClockMs)}` : ""}
                  </span>
                  <button
                    type="button"
                    style={RECENT_NOTE_PLAY_STYLE}
                    disabled={!note.audioBlobId || playingNoteId === note.id}
                    onClick={() => {
                      void handlePlayVoiceNote(note);
                    }}
                  >
                    {playingNoteId === note.id ? "Playing..." : "Play"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {saveMessage ? <p style={META_TEXT_STYLE}>{saveMessage}</p> : null}
      {panelError ? <p style={ERROR_TEXT_STYLE}>{panelError}</p> : null}
      {!panelError && recorderErrorText ? <p style={ERROR_TEXT_STYLE}>{recorderErrorText}</p> : null}
    </div>
  );
}
