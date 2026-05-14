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
    <section className="space-y-3 rounded-2xl border border-[#17324a] bg-[#0b1f31] p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-wide text-slate-300">EVENT LOG</h3>
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#081726] p-1">
        {options.map((option) => {
          const active = filter === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onFilter(option)}
              className={[
                "rounded-lg border px-3 py-2 text-sm font-bold transition",
                active
                  ? "border-slate-200 bg-slate-100 text-slate-900"
                  : "border-transparent bg-transparent text-slate-400",
              ].join(" ")}
            >
              {option === "ALL" ? "ALL" : option === "LAST_5" ? "L5" : "L10"}
            </button>
          );
        })}
        </div>
      </div>

      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#17324a] bg-[#081726] p-3">
          <span className="text-sm text-slate-100">
            {String(Math.floor(log.elapsedSeconds/60)).padStart(2,"0")}:{String(log.elapsedSeconds%60).padStart(2,"0")} {log.period} #{log.playerNumber} {log.playerName} {log.eventLabel}{" "}
            {log.points > 0 ? `+${log.points}` : log.points}
          </span>
          <button type="button" onClick={() => onDelete(log.id)} className="rounded-md border border-red-800/70 bg-red-950/70 px-2 py-1 text-xs text-red-200">
            Delete
          </button>
        </div>
      ))}
    </section>
  );
}
