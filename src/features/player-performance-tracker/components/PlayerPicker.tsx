import { ratingColor } from "../model/trainingScoring";
import { type TrainingPlayer } from "../model/trainingTypes";

type Props = { players: TrainingPlayer[]; ratings: Record<string, number>; onTapPlayer: (id: string)=>void };

export default function PlayerPicker({ players, ratings, onTapPlayer }: Props){
  return <div className="grid grid-cols-2 gap-2">
    {players.map((p)=><button key={p.id} type="button" onClick={()=>onTapPlayer(p.id)} className="flex items-center justify-between rounded-xl border border-[#17324a] bg-[#0b1f31] p-3 text-left text-white shadow">
      <div className="text-xl font-semibold">#{p.number} {p.name}</div>
      <div className="rounded-md bg-amber-400 px-3 py-1 text-xl font-bold" style={{color:ratingColor(ratings[p.id] ?? 0)}}>{ratings[p.id] ?? 0}</div>
    </button>)}
  </div>;
}
