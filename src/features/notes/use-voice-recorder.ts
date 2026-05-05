import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceRecorderStatus =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "stopping"
  | "error";

export type VoiceRecorderErrorCode =
  | "unsupported-browser"
  | "permission-denied"
  | "device-unavailable"
  | "already-recording"
  | "busy"
  | "not-recording"
  | "recorder-start-failed"
  | "recorder-stop-failed"
  | "recorder-runtime-error"
  | "empty-recording"
  | "cancelled"
  | "unknown";

export type VoiceRecorderError = {
  code: VoiceRecorderErrorCode;
  message: string;
  cause?: unknown;
};

export type StartRecordingResult =
  | { ok: true }
  | { ok: false; error: VoiceRecorderError };

export type StopRecordingResult =
  | {
      ok: true;
      blob: Blob;
      durationMs: number;
      mimeType: string;
    }
  | { ok: false; error: VoiceRecorderError };

export type CancelRecordingResult =
  | { ok: true }
  | { ok: false; error: VoiceRecorderError };

type PendingStop = {
  promise: Promise<StopRecordingResult>;
  resolve: (result: StopRecordingResult) => void;
};

const STOP_TIMEOUT_MS = 8000;

function buildError(
  code: VoiceRecorderErrorCode,
  message: string,
  cause?: unknown,
): VoiceRecorderError {
  return { code, message, cause };
}

function getPermissionError(error: unknown): VoiceRecorderError {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return buildError("permission-denied", "Microphone permission was denied", error);
    }
    if (error.name === "NotFoundError" || error.name === "NotReadableError" || error.name === "AbortError") {
      return buildError("device-unavailable", "No usable microphone device is available", error);
    }
  }
  return buildError("unknown", "Unable to access the microphone", error);
}

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return undefined;
  }
  const preferredTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const mimeType of preferredTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return undefined;
}

export function useVoiceRecorder() {
  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function";

  const [status, setStatusState] = useState<VoiceRecorderStatus>("idle");
  const [durationMs, setDurationMsState] = useState(0);
  const [error, setErrorState] = useState<VoiceRecorderError | null>(null);

  const unmountedRef = useRef(false);
  const statusRef = useRef<VoiceRecorderStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const runtimeErrorRef = useRef<VoiceRecorderError | null>(null);
  const cancelRequestedRef = useRef(false);
  const durationTimerRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const pendingStopRef = useRef<PendingStop | null>(null);
  const hasFinalizedActiveRecordingRef = useRef(true);

  const safeSetStatus = useCallback((nextStatus: VoiceRecorderStatus) => {
    statusRef.current = nextStatus;
    if (!unmountedRef.current) {
      setStatusState(nextStatus);
    }
  }, []);

  const safeSetDurationMs = useCallback((nextDurationMs: number) => {
    if (!unmountedRef.current) {
      setDurationMsState(nextDurationMs);
    }
  }, []);

  const safeSetError = useCallback((nextError: VoiceRecorderError | null) => {
    if (!unmountedRef.current) {
      setErrorState(nextError);
    }
  }, []);

  const clearDurationTimer = useCallback(() => {
    if (durationTimerRef.current != null) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const clearStopTimeout = useCallback(() => {
    if (stopTimeoutRef.current != null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    for (const track of mediaStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    mediaStreamRef.current = null;
  }, []);

  const clearPendingStop = useCallback(() => {
    pendingStopRef.current = null;
    clearStopTimeout();
  }, [clearStopTimeout]);

  const elapsedDurationMs = useCallback((): number => {
    const startedAt = startedAtRef.current;
    if (startedAt == null) return 0;
    return Math.max(0, Date.now() - startedAt);
  }, []);

  const finishWithStopResult = useCallback(
    (result: StopRecordingResult) => {
      const pendingStop = pendingStopRef.current;
      clearPendingStop();
      if (pendingStop) {
        pendingStop.resolve(result);
      }
    },
    [clearPendingStop],
  );

  const finalizeRecording = useCallback(() => {
    if (hasFinalizedActiveRecordingRef.current) {
      return;
    }
    hasFinalizedActiveRecordingRef.current = true;

    clearDurationTimer();
    const wasCancelled = cancelRequestedRef.current;
    cancelRequestedRef.current = false;

    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    const duration = elapsedDurationMs();
    startedAtRef.current = null;
    safeSetDurationMs(duration);

    cleanupStream();

    if (wasCancelled) {
      safeSetError(null);
      safeSetStatus("idle");
      finishWithStopResult({
        ok: false,
        error: buildError("cancelled", "Recording was cancelled"),
      });
      return;
    }

    const runtimeError = runtimeErrorRef.current;
    runtimeErrorRef.current = null;
    if (runtimeError) {
      safeSetError(runtimeError);
      safeSetStatus("error");
      finishWithStopResult({ ok: false, error: runtimeError });
      return;
    }

    const blob = new Blob(chunksRef.current, {
      type: recorder?.mimeType || "audio/webm",
    });
    chunksRef.current = [];

    if (blob.size <= 0) {
      const nextError = buildError("empty-recording", "Recording completed without audio data");
      safeSetError(nextError);
      safeSetStatus("error");
      finishWithStopResult({ ok: false, error: nextError });
      return;
    }

    safeSetError(null);
    safeSetStatus("idle");
    finishWithStopResult({
      ok: true,
      blob,
      durationMs: duration,
      mimeType: blob.type || recorder?.mimeType || "audio/webm",
    });
  }, [
    cleanupStream,
    clearDurationTimer,
    elapsedDurationMs,
    finishWithStopResult,
    safeSetDurationMs,
    safeSetError,
    safeSetStatus,
  ]);

  const stopRecording = useCallback(async (): Promise<StopRecordingResult> => {
    if (!isSupported) {
      const unsupportedError = buildError("unsupported-browser", "MediaRecorder is not supported in this browser");
      safeSetError(unsupportedError);
      safeSetStatus("error");
      return { ok: false, error: unsupportedError };
    }

    const existingPendingStop = pendingStopRef.current;
    if (existingPendingStop) {
      return existingPendingStop.promise;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      const notRecordingError = buildError("not-recording", "No active recording to stop");
      safeSetError(notRecordingError);
      safeSetStatus("error");
      return { ok: false, error: notRecordingError };
    }

    safeSetError(null);
    safeSetStatus("stopping");

    const pendingStop: PendingStop = (() => {
      let resolveRef: ((result: StopRecordingResult) => void) | null = null;
      const promise = new Promise<StopRecordingResult>((resolve) => {
        resolveRef = resolve;
      });
      return {
        promise,
        resolve: (result) => resolveRef?.(result),
      };
    })();
    pendingStopRef.current = pendingStop;

    stopTimeoutRef.current = window.setTimeout(() => {
      const timeoutError = buildError("recorder-stop-failed", "Timed out while stopping recording");
      runtimeErrorRef.current = timeoutError;
      try {
        recorder.stop();
      } catch {
        // Ignore stop errors here and force finalization below.
      }
      finalizeRecording();
    }, STOP_TIMEOUT_MS);

    try {
      recorder.stop();
    } catch (errorCause) {
      clearStopTimeout();
      const stopError = buildError("recorder-stop-failed", "Failed to stop recording", errorCause);
      runtimeErrorRef.current = stopError;
      finalizeRecording();
    }

    return pendingStop.promise;
  }, [finalizeRecording, isSupported, safeSetError, safeSetStatus, clearStopTimeout]);

  const cancelRecording = useCallback(async (): Promise<CancelRecordingResult> => {
    if (!isSupported) {
      return {
        ok: false,
        error: buildError("unsupported-browser", "MediaRecorder is not supported in this browser"),
      };
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      safeSetError(null);
      safeSetStatus("idle");
      safeSetDurationMs(0);
      return { ok: true };
    }

    cancelRequestedRef.current = true;
    const result = await stopRecording();
    if (!result.ok) {
      if (result.error.code !== "cancelled") {
        return { ok: false, error: result.error };
      }
    }

    safeSetError(null);
    safeSetStatus("idle");
    safeSetDurationMs(0);
    return { ok: true };
  }, [isSupported, safeSetDurationMs, safeSetError, safeSetStatus, stopRecording]);

  const startRecording = useCallback(async (): Promise<StartRecordingResult> => {
    if (!isSupported) {
      const unsupportedError = buildError("unsupported-browser", "MediaRecorder is not supported in this browser");
      safeSetError(unsupportedError);
      safeSetStatus("error");
      return { ok: false, error: unsupportedError };
    }

    if (statusRef.current === "requesting-permission" || statusRef.current === "stopping") {
      const busyError = buildError("busy", "Recorder is busy, please wait");
      safeSetError(busyError);
      safeSetStatus("error");
      return { ok: false, error: busyError };
    }

    const activeRecorder = mediaRecorderRef.current;
    if (activeRecorder && activeRecorder.state !== "inactive") {
      const alreadyRecordingError = buildError("already-recording", "A recording is already in progress");
      safeSetError(alreadyRecordingError);
      safeSetStatus("error");
      return { ok: false, error: alreadyRecordingError };
    }

    safeSetError(null);
    safeSetDurationMs(0);
    chunksRef.current = [];
    runtimeErrorRef.current = null;
    cancelRequestedRef.current = false;
    safeSetStatus("requesting-permission");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (errorCause) {
      const permissionError = getPermissionError(errorCause);
      safeSetError(permissionError);
      safeSetStatus("error");
      return { ok: false, error: permissionError };
    }

    if (unmountedRef.current) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      return {
        ok: false,
        error: buildError("cancelled", "Recorder was unmounted before recording started"),
      };
    }

    const mimeType = pickSupportedMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (errorCause) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      const startError = buildError("recorder-start-failed", "Failed to start MediaRecorder", errorCause);
      safeSetError(startError);
      safeSetStatus("error");
      return { ok: false, error: startError };
    }

    mediaStreamRef.current = stream;
    mediaRecorderRef.current = recorder;
    hasFinalizedActiveRecordingRef.current = false;
    startedAtRef.current = Date.now();
    safeSetDurationMs(0);

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event: Event) => {
      const asRecorderEvent = event as unknown as {
        error?: DOMException;
      };
      runtimeErrorRef.current = buildError(
        "recorder-runtime-error",
        "Recording failed due to a runtime MediaRecorder error",
        asRecorderEvent.error ?? event,
      );
    };

    recorder.onstop = () => {
      finalizeRecording();
    };

    durationTimerRef.current = window.setInterval(() => {
      safeSetDurationMs(elapsedDurationMs());
    }, 150);

    try {
      recorder.start();
    } catch (errorCause) {
      clearDurationTimer();
      cleanupStream();
      mediaRecorderRef.current = null;
      startedAtRef.current = null;
      const startError = buildError("recorder-start-failed", "Unable to begin recording", errorCause);
      safeSetError(startError);
      safeSetStatus("error");
      return { ok: false, error: startError };
    }

    safeSetStatus("recording");
    return { ok: true };
  }, [
    cleanupStream,
    clearDurationTimer,
    elapsedDurationMs,
    finalizeRecording,
    isSupported,
    safeSetDurationMs,
    safeSetError,
    safeSetStatus,
  ]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      clearDurationTimer();
      clearStopTimeout();
      const pendingStop = pendingStopRef.current;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        cancelRequestedRef.current = true;
        try {
          recorder.stop();
        } catch {
          hasFinalizedActiveRecordingRef.current = true;
          cleanupStream();
          if (pendingStop) {
            pendingStop.resolve({
              ok: false,
              error: buildError("cancelled", "Recorder was unmounted during stop"),
            });
            clearPendingStop();
          }
        }
      } else {
        hasFinalizedActiveRecordingRef.current = true;
        cleanupStream();
        if (pendingStop) {
          pendingStop.resolve({
            ok: false,
            error: buildError("cancelled", "Recorder was unmounted before stop completed"),
          });
          clearPendingStop();
        }
      }
    };
  }, [clearDurationTimer, clearPendingStop, clearStopTimeout, cleanupStream]);

  return {
    isSupported,
    status,
    durationMs,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
