import { type TrainingLogEntry } from "../model/trainingTypes";

type Filter = "ALL" | "LAST_5" | "LAST_10";

export default function EventLog({
  logs,
  filter,
  onFilter,
  onDelete,
}: {
  logs: TrainingLogEntry[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  onDelete: (id: string) => void;
}) {
  const options: Filter[] = ["ALL", "LAST_5", "LAST_10"];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = filter === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onFilter(option)}
              className={[
                "rounded-lg border px-2 py-2 text-xs font-semibold transition",
                active
                  ? "border-cyan-300 bg-cyan-900/60 text-cyan-100 ring-1 ring-cyan-300"
                  : "border-slate-700 bg-slate-900 text-slate-300",
              ].join(" ")}
            >
              {option === "ALL" ? "All" : option === "LAST_5" ? "Last 5 min" : "Last 10 min"}
            </button>
          );
        })}
      </div>

      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
          <span className="text-xs text-slate-100">
            {log.elapsedSeconds}s {log.period} #{log.playerNumber} {log.playerName} {log.eventLabel}{" "}
            {log.points > 0 ? `+${log.points}` : log.points}
          </span>
          <button type="button" onClick={() => onDelete(log.id)} className="rounded-md border border-red-800/70 bg-red-950/70 px-2 py-1 text-xs text-red-200">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
