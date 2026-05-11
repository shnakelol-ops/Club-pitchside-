# Save/Load Trust Audit (Vision Board + Vision Stats)

Date: 2026-05-11 (UTC)
Branch: `audit/save-load-trust-system`
Scope: Audit only, no runtime code changes.

## 1) Map of save/load files and functions

### Vision Board (QuickBoard)
- `src/pages/TacticalPadLiteClean.tsx`
  - Save trigger: `handleSaveCurrentBoard()`
  - Load trigger: `handleOpenSavedBoard(boardId)`
  - List saved boards UI: `savedBoards` state + My Boards popover
  - User warnings: `beforeunload`, new-board confirm
- `src/features/quickboard/storage/quickboard-storage.ts`
  - Storage I/O: `readBoardsFromStorage`, `writeBoardsToStorage`
  - CRUD: `loadAllBoards`, `loadBoard`, `saveBoard`, `renameBoard`, `duplicateBoard`, `deleteBoard`, `setBoardThumbnail`
- `src/features/quickboard/storage/quickboard-types.ts`
  - Key/schema/sanitizers: `QUICKBOARD_STORAGE_KEY`, `QuickBoardBoardState`, `SavedQuickBoard`, `sanitizeQuickBoardState`, `sanitizeSavedQuickBoard`
- `src/features/quickboard/storage/quickboard-snapshot.ts`
  - Capture/restore: `captureQuickBoardSnapshot`, `restoreQuickBoardSnapshot`
- `src/engine/pixi/createTacticalPadLiteSurface.ts`
  - Canonical board payload shape: `TacticalBoardState`
  - Serializer: `captureBoardState()` via `exportBoardState`
  - Deserializer: `importBoardState`

### Vision Stats
- `src/StatsModeSurface.tsx`
  - Storage keys: `SAVED_MATCHES_STORAGE_KEY`, `SAVED_SQUADS_STORAGE_KEY`, `SQUADS_STORAGE_KEY`
  - Save trigger: `saveCurrentMatchSnapshot()`
  - Load trigger: `loadSavedMatchRecord(record)`
  - Saved list panel: `utilityPanel === "SAVED_MATCHES"`
  - Parse/sanitize: `parseStoredSavedMatch`, `parseStoredSavedMatches`, `sanitizeSavedMatches`
  - Restore context logic: `resolveSavedMatchRestoreContext`
  - Persist: `persistSavedMatches`

### Notes/voice linkage (adjacent to stats trust)
- `src/features/notes/notes-storage.ts`
- `src/features/notes/audio-storage.ts`
- `src/features/notes/NotesQuickPanel.tsx`

## 2) Exact current Vision Board saved data model

Saved object type: `SavedQuickBoard`
- `id: string`
- `name: string`
- `createdAt: number`
- `updatedAt: number`
- `version: number` (currently `1` on save entry)
- `boardState: QuickBoardBoardState`
- `thumbnail?: string`

`boardState` payload (from tactical surface export/import)
- `version` (surface exports `2`)
- `players[]`
- `items[]`
- `drawings[]`
- `phases[]`
- `movementPaths[]`
- `kits` (per-player kit fields)
- `teamKits`
- `teamState` (team colors/counts)
- `viewport` (width/height)
- `startSnapshot`
- `drawTool`
- `drawColor`
- `itemMode`

## 3) Exact current Vision Stats saved data model

Saved object type: `SavedMatch`
- `id: string`
- `createdAt: number`
- `label: string` (`HOME v AWAY`)
- `homeTeamName: string`
- `awayTeamName: string`
- `venue: string`
- `events: LoggedMatchEvent[]`
- `eventCount: number`
- `scorelineSnapshot: string`
- `restoreContext?`
  - `matchState?`
  - `currentHalf?`
  - `matchTimeSeconds?`
  - `firstHalfAttackingDirection?`
  - `fullTimeResumeState?` (state/half/clock)

Per-event persisted fields
- Required: `id`, `kind`, `nx`, `ny`, `half`, `timestamp`
- Optional: `playerId`, `playerName`, `playerNumber`, `squadId`, `team`

## 4) Missing state not being saved

### Vision Board
- **Unsaved indicator state is not persisted** (only transient toast/feedback).
- **No active-board pointer** (which saved board is currently open is not persisted explicitly).
- **Playback runtime state** (`isPlaying`, `isPaused`, chosen speed in React state) is not included in saved board load UX; speed is app-level state not tied to board entry.
- **Any UI panel/open state** (menus/popovers) intentionally not saved.

### Vision Stats
- **No explicit score fields** persisted; score is recomputed from `events` at runtime.
- **No explicit date/opponent metadata field** beyond `createdAt`, `awayTeamName`, and `label`.
- **No link from match save to notes/voice references** despite notes panel using `matchId`; saved match payload has no note IDs or voice IDs.

## 5) Legacy naming/storage risks

- Vision Board key is still legacy-branded: `pitchflow_quickboard_boards_v1`.
- Stats keys include mixed branding:
  - `pitchflow_matches_v1`
  - `pitchflow_saved_squads_v1`
  - `pitchsideclub.squads`
- UI still contains legacy label in ARIA: `aria-label="PitchFlow Pixi pitch"` in stats surface.
- No migration/version registry across products; each parser silently drops invalid records.
- QuickBoard has two version notions (`SavedQuickBoard.version=1` vs `boardState.version=2`) without migration logic.

## 6) Silent failure risks

- Vision Board `readBoardsFromStorage` catches JSON/storage errors and returns `[]` silently.
- Vision Board `writeBoardsToStorage` returns `false` with no diagnostic detail; UI only shows generic "Save failed".
- Board thumbnail generation failure is silent (main save succeeds but preview may never appear).
- Stats `safeWriteLocalStorage` only `console.warn`s and does not propagate failure; `saveCurrentMatchSnapshot` still reports "Match saved" even when write fails (high trust risk).
- Stats parse failures return empty arrays without user-facing corruption notice.
- Quota/private mode/storage disabled paths collapse into generic failures or false-success semantics.

## 7) UX trust gaps

- No persistent "dirty/unsaved" badge for Vision Board or Stats; only temporary messages and unload prompt.
- No visible "currently loaded board name" after loading a board.
- No save overwrite flow for boards (every save creates a new entry); can feel like duplicates/no clear latest lineage.
- Board fallback names are time-only (`Board HH:MM:SS`) and omit date, so cross-day ambiguity.
- Board timestamps are `DD/MM HH:MM` (no year), reducing clarity in beta support/debugging.
- Stats save success feedback expires after 2 seconds; no durable "last saved at" indicator.
- Stats load has no unsaved-work confirmation before replacing live state.
- Stats load panel shows saved entries, but after load there is no strong top-level banner confirming which match is now active.

## 8) Failure-case audit outcomes

- Refresh/close tab warnings exist for both modes via `beforeunload` when applicable.
- PWA/home-screen reopen durability depends entirely on localStorage availability; no fallback.
- iOS Safari/private browsing/quota-full likely to trigger storage exceptions; handling is partial and can be misleading (especially stats false-positive success).
- Corrupt payload handling: parsers reject invalid records, resulting in disappearance rather than repair path.
- Duplicate IDs: `sanitizeSavedMatches` dedupes by first-seen ID after sorting.
- Missing player references: events still load; UI can fall back to "Unknown player"/generic labels.

## 9) Beta risk ratings

### BLOCKER
1. **Stats can report "Match saved" even if localStorage write failed** (trust-breaking false confirmation, potential data loss).
2. **Stats load can replace live session without explicit unsaved-work confirmation** (accidental overwrite risk during live use).

### HIGH
1. Board/Stats storage failures often collapse into generic/silent outcomes with poor diagnosability.
2. No durable "last saved"/"active loaded item" status for either workflow.
3. Legacy key/brand fragmentation (`pitchflow*`, `pitchsideclub*`) increases support confusion and migration ambiguity.

### MEDIUM
1. Board naming/timestamps are weak for human recall (time-only names, no year in formatted timestamp).
2. Save model mismatch (`SavedQuickBoard.version` vs `boardState.version`) without migration policy.
3. Notes/voice not linked in saved match payload; cross-feature continuity unclear.

### LOW
1. Minor UI label legacy references (e.g., PitchFlow aria-label).
2. Thumbnail absence after successful board save has no explicit notice.

## 10) Minimal beta-safe fixes (no redesign)

1. **Make Stats save truthy only on confirmed write** (propagate write success/failure; block "Match saved" on write failure).
2. **Add pre-load confirmation in Stats when current session is dirty** (events exist or match started).
3. **Add persistent in-session status text** for both modes:
   - "Loaded: <name>"
   - "Last saved: <timestamp>"
4. **Improve error specificity** for storage exceptions (quota/private/parse) in user-facing feedback.
5. **Document storage key contract + versioning policy** (single source of truth; include migration intent).
6. **Normalize save naming/timestamps for supportability** (include full date in fallback and display).

## 11) Do-not-touch list to avoid regressions

- Pixi pitch rendering internals (`create-pixi-pitch-surface`, draw renderers).
- Tactical player movement/playback engine (`createTacticalPadLiteSurface` playback logic).
- Event logging mechanics and event-kind model in core stats engine.
- Existing event coordinate schema (`nx`, `ny`) and match clock engine behavior.

## 12) Final verdict

**beta-blocked** for trust until false-positive stats save confirmation and unsafe stats load overwrite risk are addressed.
