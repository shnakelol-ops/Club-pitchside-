import { useEffect, useMemo, useState } from "react";
import SetupScreen from "../features/player-performance-tracker/components/SetupScreen";
import TrackerScreen from "../features/player-performance-tracker/components/TrackerScreen";
import RatingsScreen from "../features/player-performance-tracker/components/RatingsScreen";
import { TRAINING_EVENTS } from "../features/player-performance-tracker/model/trainingScoring";
import { loadSessionState, saveSessionState } from "../features/player-performance-tracker/storage/trainingSessionStorage";
import { type TrainingLogEntry, type TrainingPeriod, type TrainingSessionState } from "../features/player-performance-tracker/model/trainingTypes";

function id(){return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}

export default function PlayerPerformanceTracker(){
  const [state,setState]=useState<TrainingSessionState>(()=>loadSessionState());

  useEffect(()=>{saveSessionState(state);},[state]);
  useEffect(()=>{if(!state.hasStarted||!state.isRunning) return;const t=window.setInterval(()=>setState((s)=>({...s,elapsedSeconds:Math.max(0,(s.elapsedSeconds||0)+1)})),1000);return ()=>window.clearInterval(t);},[state.hasStarted,state.isRunning]);

  const ratings = useMemo(()=>state.players.reduce<Record<string,number>>((acc,p)=>{acc[p.id]=state.logs.filter((l)=>l.playerId===p.id).reduce((a,l)=>a+l.points,0);return acc;},{}),[state.players,state.logs]);

  const onTapPlayer=(playerId:string)=>{if(!state.activeEventKey) return; const player=state.players.find((p)=>p.id===playerId); const ev=TRAINING_EVENTS.find((e)=>e.key===state.activeEventKey); if(!player||!ev) return; const log:TrainingLogEntry={id:id(),eventKey:ev.key,eventLabel:ev.label,points:ev.points,category:ev.category,playerId:player.id,playerName:player.name,playerNumber:player.number,elapsedSeconds:Math.max(0,state.elapsedSeconds||0),period:state.period,createdAt:Date.now()}; setState((s)=>({...s,logs:[...s.logs,log]}));};

  if(!state.hasStarted) return <SetupScreen sessionName={state.sessionName} players={state.players}
   onSessionNameChange={(sessionName)=>setState((s)=>({...s,sessionName}))}
   onPlayerChange={(id,updates)=>setState((s)=>({...s,players:s.players.map((p)=>p.id===id?{...p,...updates}:p)}))}
   onAddPlayer={()=>setState((s)=>s.players.length>=30?s:{...s,players:[...s.players,{id:`player-${id()}`,name:`Player ${s.players.length+1}`,number:s.players.length+1}]})}
   onStart={()=>setState((s)=>({...s,hasStarted:true,activeTab:"tracker"}))}
  />;

  return <div style={{background:'#0b1118',color:'#eaf1f8',minHeight:'100dvh',padding:12}}>
    <h1 style={{margin:0}}>Vision Training</h1><div>Player Performance Tracker</div>
    {state.activeTab==='tracker' ? <TrackerScreen players={state.players} logs={state.logs} elapsedSeconds={state.elapsedSeconds} isRunning={state.isRunning} period={state.period} activeEventKey={state.activeEventKey}
      onToggleTimer={()=>setState((s)=>({...s,isRunning:!s.isRunning}))}
      onReset={()=>{if(window.confirm('Reset session timer and logs?')) setState((s)=>({...s,elapsedSeconds:0,logs:[],isRunning:false,lastDeleted:null}));}}
      onPeriod={(period:TrainingPeriod)=>setState((s)=>({...s,period}))}
      onSelectEvent={(k)=>setState((s)=>({...s,activeEventKey:s.activeEventKey===k?null:k}))}
      onTapPlayer={onTapPlayer}
      onDelete={(id)=>setState((s)=>{const found=s.logs.find((l)=>l.id===id)??null; return {...s,logs:s.logs.filter((l)=>l.id!==id),lastDeleted:found};})}
      onUndo={()=>setState((s)=>s.lastDeleted?{...s,logs:[...s.logs,s.lastDeleted],lastDeleted:null}:s)}
      lastDeleted={state.lastDeleted}
    /> : <RatingsScreen players={state.players} logs={state.logs} ratings={ratings} />}
    <div style={{position:'fixed',bottom:0,left:0,right:0,display:'grid',gridTemplateColumns:'1fr 1fr'}}><button onClick={()=>setState((s)=>({...s,activeTab:'tracker'}))}>Tracker</button><button onClick={()=>setState((s)=>({...s,activeTab:'ratings'}))}>Ratings</button></div>
  </div>;
}
