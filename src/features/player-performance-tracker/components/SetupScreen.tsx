import { type TrainingPlayer } from "../model/trainingTypes";

type Props = {
  sessionName: string;
  players: TrainingPlayer[];
  onSessionNameChange: (name: string) => void;
  onPlayerChange: (id: string, updates: Partial<TrainingPlayer>) => void;
  onAddPlayer: () => void;
  onStart: () => void;
};

export default function SetupScreen({ sessionName, players, onSessionNameChange, onPlayerChange, onAddPlayer, onStart }: Props) {
  return <div><h1>Vision Training</h1><h2>Player Performance Tracker</h2>
    <input value={sessionName} onChange={(e)=>onSessionNameChange(e.target.value)} />
    {players.map((p)=><div key={p.id}><input type='number' value={p.number} onChange={(e)=>onPlayerChange(p.id,{number:Number(e.target.value)})}/><input value={p.name} onChange={(e)=>onPlayerChange(p.id,{name:e.target.value})}/></div>)}
    <button onClick={onAddPlayer} disabled={players.length>=30}>Add Player</button>
    <button onClick={onStart}>Start Session</button>
  </div>;
}
