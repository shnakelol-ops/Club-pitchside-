import React from "react";
import EventGrid from "./EventGrid";
import PlayerPicker from "./PlayerPicker";
import EventLog from "./EventLog";
import { TRAINING_EVENTS } from "../model/trainingScoring";
import { type TrainingEventKey, type TrainingLogEntry, type TrainingPeriod, type TrainingPlayer } from "../model/trainingTypes";

type Filter = "ALL"|"LAST_5"|"LAST_10";

function fmt(sec:number){const s=Math.max(0,Number.isFinite(sec)?Math.floor(sec):0);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}

export default function TrackerScreen(props:{players:TrainingPlayer[];logs:TrainingLogEntry[];elapsedSeconds:number;isRunning:boolean;period:TrainingPeriod;activeEventKey:TrainingEventKey|null;onToggleTimer:()=>void;onReset:()=>void;onPeriod:(p:TrainingPeriod)=>void;onSelectEvent:(k:TrainingEventKey)=>void;onTapPlayer:(id:string)=>void;onDelete:(id:string)=>void;onUndo:()=>void;lastDeleted:TrainingLogEntry|null|undefined}){
  const [showShots,setShowShots]=React.useState(false);
  const [filter,setFilter]=React.useState<Filter>("ALL");
  const now=props.elapsedSeconds;
  const filtered=props.logs.filter((l)=>filter==="ALL"?true:filter==="LAST_5"?now-l.elapsedSeconds<=300:now-l.elapsedSeconds<=600).slice().reverse();
  const ratings=props.players.reduce<Record<string,number>>((acc,p)=>{acc[p.id]=props.logs.filter((l)=>l.playerId===p.id).reduce((a,l)=>a+l.points,0);return acc;},{});
  const active=TRAINING_EVENTS.find((e)=>e.key===props.activeEventKey);
  return <div>
    <div>{fmt(props.elapsedSeconds)} <button onClick={props.onToggleTimer}>{props.isRunning?"Pause":"Start"}</button><button onClick={props.onReset}>Reset</button></div>
    <div>{(["PRE","1H","2H","ET"] as TrainingPeriod[]).map((p)=><button key={p} onClick={()=>props.onPeriod(p)}>{p}</button>)}</div>
    <div>Active Event: {active?active.label:"None"}</div>
    <EventGrid activeEventKey={props.activeEventKey} onSelectEvent={props.onSelectEvent} showShots={showShots} onToggleShots={()=>setShowShots((s)=>!s)} />
    <PlayerPicker players={props.players} ratings={ratings} onTapPlayer={props.onTapPlayer} />
    <EventLog logs={filtered} filter={filter} onFilter={setFilter} onDelete={props.onDelete} />
    {props.lastDeleted && <button onClick={props.onUndo}>Undo Last</button>}
  </div>;
}
