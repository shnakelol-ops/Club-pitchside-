import { ratingColor } from "../model/trainingScoring";
import { type TrainingPlayer } from "../model/trainingTypes";

type Props = { players: TrainingPlayer[]; ratings: Record<string, number>; onTapPlayer: (id: string)=>void };

export default function PlayerPicker({ players, ratings, onTapPlayer }: Props){
  return <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
    {players.map((p)=><button key={p.id} onClick={()=>onTapPlayer(p.id)} style={{padding:12,textAlign:'left'}}><div>#{p.number} {p.name}</div><div style={{color:ratingColor(ratings[p.id] ?? 0)}}>{ratings[p.id] ?? 0}</div></button>)}
  </div>;
}
