import { SHOT_EVENT_KEYS, TRAINING_EVENTS } from "../model/trainingScoring";
import { type TrainingEventDef, type TrainingEventKey } from "../model/trainingTypes";

type Props = {
  activeEventKey: TrainingEventKey | null;
  onSelectEvent: (eventKey: TrainingEventKey) => void;
  showShots: boolean;
  onToggleShots: () => void;
};

const topRow: TrainingEventKey[] = ["goal", "point", "two-pt"];

function pointsClass(points: number): string {
  if (points > 0) return "text-emerald-400";
  if (points < 0) return "text-red-300";
  return "text-slate-400";
}

function toneClass(event: TrainingEventDef): string {
  if (event.key.startsWith("shot-")) return "bg-red-950/80 border-red-800/70 text-red-50";

  switch (event.color) {
    case "blue":
      return "bg-blue-600 border-blue-400 text-white";
    case "orange":
      return "bg-orange-600 border-orange-400 text-white";
    case "purple":
      return "bg-purple-600 border-purple-400 text-white";
    case "green":
      return "bg-emerald-700 border-emerald-500 text-white";
    case "darkred":
    default:
      return "bg-red-700 border-red-500 text-white";
  }
}

function activeRingClass(event: TrainingEventDef): string {
  return event.key.startsWith("shot-") ? "ring-red-300 shadow-[0_0_18px_rgba(252,165,165,0.45)]" : "ring-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]";
}

function displayLabel(event: TrainingEventDef): string {
  return event.key.startsWith("shot-") ? event.label.replace("Shot — ", "") : event.label;
}

function EventButton({ event, active, onClick }: { event: TrainingEventDef; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-2 py-3 text-left min-h-[82px] transition shadow-lg",
        toneClass(event),
        active ? `ring-2 ${activeRingClass(event)}` : "",
      ].join(" ")}
    >
      <div className="text-lg font-bold uppercase leading-tight">{displayLabel(event)}</div>
      <div className={`mt-1 text-sm font-bold ${pointsClass(event.points)}`}>
        {event.points > 0 ? `+${event.points}` : event.points}
      </div>
    </button>
  );
}

export default function EventGrid({ activeEventKey, onSelectEvent, showShots, onToggleShots }: Props) {
  const eventMap = new Map(TRAINING_EVENTS.map((event) => [event.key, event]));
  const topEvents = topRow.map((key) => eventMap.get(key)).filter((event): event is TrainingEventDef => Boolean(event));
  const shotEvents = TRAINING_EVENTS.filter((event) => SHOT_EVENT_KEYS.includes(event.key));
  const remaining = TRAINING_EVENTS.filter((event) => !SHOT_EVENT_KEYS.includes(event.key) && !topRow.includes(event.key));
  const shotActive = showShots || (activeEventKey != null && SHOT_EVENT_KEYS.includes(activeEventKey));

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {topEvents.map((event) => (
          <EventButton key={event.key} event={event} active={activeEventKey === event.key} onClick={() => onSelectEvent(event.key)} />
        ))}
        <button
          type="button"
          onClick={onToggleShots}
          className={[
            "rounded-xl border px-2 py-3 text-left min-h-[70px] transition",
            "bg-blue-600 border-blue-400 text-white",
            shotActive ? "ring-2 ring-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]" : "",
          ].join(" ")}
        >
          <div className="text-lg font-bold uppercase">Shot</div>
          <div className="mt-1 text-sm font-bold text-slate-100">Outcomes {showShots ? "▲" : "▼"}</div>
        </button>
      </div>

      {showShots && (
        <div className="grid grid-cols-2 gap-2">
          {shotEvents.map((event) => (
            <EventButton key={event.key} event={event} active={activeEventKey === event.key} onClick={() => onSelectEvent(event.key)} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {remaining.map((event) => (
          <EventButton key={event.key} event={event} active={activeEventKey === event.key} onClick={() => onSelectEvent(event.key)} />
        ))}
      </div>
    </section>
  );
}
