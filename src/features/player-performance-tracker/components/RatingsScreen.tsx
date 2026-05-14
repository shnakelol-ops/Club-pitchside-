import { ratingColor } from "../model/trainingScoring";
import { type EventCategory, type TrainingLogEntry, type TrainingPlayer } from "../model/trainingTypes";

const cats: EventCategory[] = ["score","shots","wides","turnovers","kickouts","frees","decisions","passes"];
const labels: Record<EventCategory,string> = { score:"Score", shots:"Shots", wides:"Wides", turnovers:"TO", kickouts:"KO", frees:"FR", decisions:"Dec", passes:"Pass" };

export default function RatingsScreen({ players, logs, ratings }: {players: TrainingPlayer[]; logs: TrainingLogEntry[]; ratings: Record<string, number>}) {
  const sorted = [...players].sort((a,b)=>(ratings[b.id]??0)-(ratings[a.id]??0));
  return <section className="ppt-wrap"><h2 className="ppt-ratings-title">Squad Ratings</h2>{sorted.map((p, idx)=>{const playerLogs=logs.filter((l)=>l.playerId===p.id); return <div key={p.id} className={`ppt-rating-card compact ${idx===0?"top":""} ${idx===sorted.length-1?"low":""}`}><div className="ppt-rating-head"><div className="ppt-rating-name compact">#{p.number} {p.name}</div><span className="ppt-rating-score compact" style={{color:ratingColor(ratings[p.id]??0)}}>{ratings[p.id]??0}</span></div><div className="ppt-break compact">{cats.map((c)=>{const total=playerLogs.filter((l)=>l.category===c).reduce((a,l)=>a+l.points,0);return <span key={c}>{labels[c]} {total}</span>;})}</div></div>;})}</section>;
}
