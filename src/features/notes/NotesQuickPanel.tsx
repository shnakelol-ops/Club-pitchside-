import { useMemo, useState, type CSSProperties } from "react";

import { useVoiceRecorder } from "./use-voice-recorder";
import type { CoachNoteContext } from "./types";
import { useNotes } from "./use-notes";

type NotesQuickPanelProps = {
  defaultContext?: CoachNoteContext;
  onRequestClose?: () => void;
};

const PANEL_STYLE: CSSProperties = {
  position: "fixed",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  bottom: "max(62px, calc(env(safe-area-inset-bottom, 0px) + 60px))",
  width: "min(320px, calc(100vw - 24px))",
  display: "grid",
  gap: "8px",
  padding: "10px",
  borderRadius: "12px",
  border: "1px solid rgba(187, 211, 233, 0.24)",
  background: "rgba(11, 21, 29, 0.86)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 12px 28px rgba(2, 8, 15, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.11)",
  zIndex: 26,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: "#eff8ff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.16px",
};

const TEXTAREA_STYLE: CSSProperties = {
  width: "100%",
  minHeight: "86px",
  maxHeight: "150px",
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

function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function isDisabledRecorderStatus(status: string): boolean {
  return status === "requesting-permission" || status === "stopping";
}

export function NotesQuickPanel({ defaultContext = "match", onRequestClose }: NotesQuickPanelProps) {
  const [textDraft, setTextDraft] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [pendingVoiceResult, setPendingVoiceResult] = useState<{
    blob: Blob;
    durationMs: number;
  } | null>(null);
  const [pendingVoiceLabel, setPendingVoiceLabel] = useState<string>("");
  const { saveTextNote, saveVoiceNote, isSaving } = useNotes();
  const recorder = useVoiceRecorder();

  const recorderErrorText = useMemo(() => {
    if (!recorder.error) return null;
    return recorder.error.message;
  }, [recorder.error]);

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
    });
    if (result.ok) {
      setTextDraft("");
      setPanelError(null);
      setSaveMessage("Text note saved");
      return;
    }
    setPanelError(result.error);
    setSaveMessage(null);
  };

  const handleStartVoiceRecording = async () => {
    clearFeedback();
    setPendingVoiceResult(null);
    const started = await recorder.startRecording();
    if (started.ok) {
      setPendingVoiceLabel("");
      return;
    }
    setPanelError(started.error.message);
  };

  const handleStopVoiceRecording = async () => {
    clearFeedback();
    const stopped = await recorder.stopRecording();
    if (stopped.ok) {
      setPendingVoiceResult({
        blob: stopped.blob,
        durationMs: stopped.durationMs,
      });
      setSaveMessage("Recording ready to save");
      return;
    }
    setPanelError(stopped.error.message);
  };

  const handleCancelVoiceRecording = async () => {
    clearFeedback();
    const cancelled = await recorder.cancelRecording();
    if (cancelled.ok) {
      setPendingVoiceResult(null);
      setPendingVoiceLabel("");
      setSaveMessage("Recording cleared");
      return;
    }
    setPanelError(cancelled.error.message);
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
    });
    if (result.ok) {
      const cleared = await recorder.cancelRecording();
      if (cleared.ok) {
        setPendingVoiceResult(null);
        setPendingVoiceLabel("");
        setSaveMessage("Voice note saved");
        return;
      }
      setPanelError(cleared.error.message);
      return;
    }
    setPanelError(result.error);
  };

  const hasPendingVoiceClip = pendingVoiceResult != null;
  const recorderBusy = isDisabledRecorderStatus(recorder.status);
  const isRecording = recorder.status === "recording";

  return (
    <div style={PANEL_STYLE} role="dialog" aria-modal="false" aria-label="Quick notes panel">
      <p style={TITLE_STYLE}>My Notes</p>

      <textarea
        style={TEXTAREA_STYLE}
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
              ...TEXTAREA_STYLE,
              minHeight: "42px",
              maxHeight: "42px",
              resize: "none",
              paddingTop: "11px",
            }}
          />
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleSaveVoiceNote} disabled={isSaving}>
            Save Voice
          </button>
        </>
      ) : null}

      {saveMessage ? <p style={META_TEXT_STYLE}>{saveMessage}</p> : null}
      {panelError ? <p style={ERROR_TEXT_STYLE}>{panelError}</p> : null}
      {!panelError && recorderErrorText ? <p style={ERROR_TEXT_STYLE}>{recorderErrorText}</p> : null}
    </div>
  );
}
