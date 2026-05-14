import { type TrainingLogEntry } from "../model/trainingTypes";

type Filter = "ALL"|"LAST_5"|"LAST_10";

export default function EventLog({ logs, filter, onFilter, onDelete }: {logs: TrainingLogEntry[]; filter: Filter; onFilter:(f:Filter)=>void; onDelete:(id:string)=>void}) {
  return <div><div>{(["ALL","LAST_5","LAST_10"] as Filter[]).map((f)=><button key={f} onClick={()=>onFilter(f)}>{f}</button>)}</div>
  {logs.map((l)=><div key={l.id}><span>{l.elapsedSeconds}s {l.period} #{l.playerNumber} {l.playerName} {l.eventLabel} {l.points>0?`+${l.points}`:l.points}</span><button onClick={()=>onDelete(l.id)}>Delete</button></div>)}
  </div>;
}
