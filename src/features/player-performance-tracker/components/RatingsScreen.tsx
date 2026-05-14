import { ratingColor } from "../model/trainingScoring";
import { type EventCategory, type TrainingLogEntry, type TrainingPlayer } from "../model/trainingTypes";

const cats: EventCategory[] = ["score","shots","wides","turnovers","kickouts","frees","decisions","passes"];

export default function RatingsScreen({ players, logs, ratings }: {players: TrainingPlayer[]; logs: TrainingLogEntry[]; ratings: Record<string, number>}) {
  const sorted = [...players].sort((a,b)=>(ratings[b.id]??0)-(ratings[a.id]??0));
  return <section className="space-y-3 px-4 py-4 text-white">
    <h2 className="text-4xl font-semibold">Squad Ratings</h2>
    {sorted.map((p, idx)=>{const playerLogs=logs.filter((l)=>l.playerId===p.id); return <div key={p.id} className={["rounded-2xl border bg-[#0b1f31] p-4",idx===0?"border-yellow-700 bg-yellow-950/20":idx===sorted.length-1?"border-red-700 bg-red-950/20":"border-[#17324a]"].join(" ")}><div className="flex items-center justify-between"><div className="text-3xl font-semibold">#{p.number} {p.name}</div><span className="text-4xl font-bold" style={{color:ratingColor(ratings[p.id]??0)}}>{ratings[p.id]??0}</span></div><div className="mt-3 grid grid-cols-2 gap-1 text-sm text-slate-300">{cats.map((c)=>{const total=playerLogs.filter((l)=>l.category===c).reduce((a,l)=>a+l.points,0);return <span key={c}>{c}: {total}</span>;})}</div></div>;})}
  </section>;
}
