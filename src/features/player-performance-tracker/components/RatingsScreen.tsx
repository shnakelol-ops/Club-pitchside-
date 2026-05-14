import { ratingColor } from "../model/trainingScoring";
import { type EventCategory, type TrainingLogEntry, type TrainingPlayer } from "../model/trainingTypes";

const cats: EventCategory[] = ["score","shots","wides","turnovers","kickouts","frees","decisions","passes"];

export default function RatingsScreen({ players, logs, ratings }: {players: TrainingPlayer[]; logs: TrainingLogEntry[]; ratings: Record<string, number>}) {
  const sorted = [...players].sort((a,b)=>(ratings[b.id]??0)-(ratings[a.id]??0));
  return <div>{sorted.map((p, idx)=>{const playerLogs=logs.filter((l)=>l.playerId===p.id); return <div key={p.id} style={{border: idx===0?'1px solid gold':idx===sorted.length-1?'1px solid red':'1px solid #333'}}><div>#{p.number} {p.name} <span style={{color:ratingColor(ratings[p.id]??0)}}>{ratings[p.id]??0}</span></div><div>{cats.map((c)=>{const total=playerLogs.filter((l)=>l.category===c).reduce((a,l)=>a+l.points,0);return <span key={c} style={{marginRight:8}}>{c}:{total}</span>;})}</div></div>;})}</div>;
}
