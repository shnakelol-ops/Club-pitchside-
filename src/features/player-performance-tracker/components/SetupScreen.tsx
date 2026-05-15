import { type SavedSquad, type TrainingPlayer } from "../model/trainingTypes";

type Props = {
  sessionName: string;
  players: TrainingPlayer[];
  onSessionNameChange: (name: string) => void;
  onPlayerChange: (id: string, updates: Partial<TrainingPlayer>) => void;
  onAddPlayer: () => void;
  onStart: () => void;
  squads: SavedSquad[];
  activeSquadId: string | null;
  onSelectSquad: (squadId: string) => void;
  onSaveCurrentSquad: () => void;
};

export default function SetupScreen({ sessionName, players, onSessionNameChange, onPlayerChange, onAddPlayer, onStart, squads, activeSquadId, onSelectSquad, onSaveCurrentSquad }: Props) {
  return <div className="ppt-wrap ppt-setup"><h1>Vision Training</h1><div className="ppt-sub">Player Performance Tracker</div>
    <div className="ppt-panel"><div className="ppt-sub">Squads ({squads.length}/10)</div>{squads.length===0?<div className="ppt-active">No saved squads yet.</div>:squads.map((s)=><button key={s.id} className="ppt-action" style={{opacity:activeSquadId===s.id?1:0.8}} onClick={()=>onSelectSquad(s.id)}>{activeSquadId===s.id?"✓ ":""}{s.name} ({s.players.length})</button>)}<button className="ppt-action primary" onClick={onSaveCurrentSquad} disabled={squads.length>=10 && !activeSquadId}>Save Current Squad</button></div>
    <input className="ppt-input" value={sessionName} onChange={(e)=>onSessionNameChange(e.target.value)} />
    {players.map((p)=><div className="ppt-setup-row" key={p.id}><input className="ppt-number" type='number' value={p.number} onChange={(e)=>onPlayerChange(p.id,{number:Number(e.target.value)})}/><input className="ppt-input" value={p.name} onChange={(e)=>onPlayerChange(p.id,{name:e.target.value})}/></div>)}
    <button className="ppt-action" onClick={onAddPlayer} disabled={players.length>=30}>Add Player</button>
    <button className="ppt-action primary" onClick={onStart}>Start Session</button>
  </div>;
}
