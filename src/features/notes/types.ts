export type CoachNoteType = "text" | "voice";

export type CoachNoteContext = "match" | "training" | "session" | "library";

export type CoachNote = {
  id: string;
  type: CoachNoteType;
  context: CoachNoteContext;
  title?: string;
  text?: string;
  audioUrl?: string;
  audioBlobId?: string;
  durationMs?: number;
  matchId?: string;
  sessionId?: string;
  eventId?: string;
  matchClockMs?: number;
  half?: 1 | 2;
  createdAt: number;
  updatedAt: number;
  starred?: boolean;
  pinnedToNextSession?: boolean;
};
