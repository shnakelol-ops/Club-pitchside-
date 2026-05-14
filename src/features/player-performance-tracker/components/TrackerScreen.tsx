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
  return <div className="space-y-3 px-4 py-4 text-white">
    <section className="rounded-2xl border border-[#17324a] bg-[#0a2134] p-4 text-center">
      <div className="text-xs font-bold tracking-[0.3em] text-slate-400">MY SQUAD</div>
      <div className="mt-2 text-6xl font-semibold tabular-nums">{fmt(props.elapsedSeconds)}</div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button className="rounded-xl bg-emerald-700 px-5 py-2 font-semibold text-white" onClick={props.onToggleTimer}>{props.isRunning?"Pause":"Start"}</button>
        <button className="rounded-xl bg-red-800 px-4 py-2 font-semibold text-white" onClick={props.onReset}>Reset</button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {(["PRE","1H","2H","ET"] as TrainingPeriod[]).map((p)=><button key={p} className={["rounded-lg border px-2 py-2 text-sm font-semibold",props.period===p?"border-slate-200 bg-slate-100 text-slate-900":"border-slate-700 bg-slate-900/70 text-slate-200"].join(" ")} onClick={()=>props.onPeriod(p)}>{p}</button>)}
      </div>
      <div className="mt-2 text-xs text-slate-300">Active: {active?active.label:"None"}</div>
    </section>
    <EventGrid activeEventKey={props.activeEventKey} onSelectEvent={props.onSelectEvent} showShots={showShots} onToggleShots={()=>setShowShots((s)=>!s)} />
    <PlayerPicker players={props.players} ratings={ratings} onTapPlayer={props.onTapPlayer} />
    <EventLog logs={filtered} filter={filter} onFilter={setFilter} onDelete={props.onDelete} />
    {props.lastDeleted && <button className="fixed bottom-24 right-4 rounded-full bg-[#1c3149] px-5 py-4 text-lg text-white shadow-2xl" onClick={props.onUndo}>↩</button>}
  </div>;
}
