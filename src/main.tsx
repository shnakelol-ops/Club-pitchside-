import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import PitchFlowCoachShell from "./pages/PitchFlowCoachShell";
import TacticalPadLiteClean from "./pages/TacticalPadLiteClean";

const boardShell = () => <PitchFlowCoachShell initialTab="home" />;
const VISION_BOARD_PATH = "/vision-board";
const QUICK_BOARD_PATH = "/quickboard";
const FLOW_STATS_PATH = "/flowstats";
const NOTES_PATH = "/notes";

function redirectToBoard() {
  if (window.location.pathname !== "/board") {
    window.history.replaceState(null, "", "/board");
  }
  return boardShell;
}

function redirectToQuickBoard() {
  if (window.location.pathname !== VISION_BOARD_PATH) {
    window.history.replaceState(null, "", VISION_BOARD_PATH);
  }
  return TacticalPadLiteClean;
}

function redirectToNotes() {
  if (window.location.pathname !== NOTES_PATH) {
    window.history.replaceState(null, "", NOTES_PATH);
  }
  return () => <PitchFlowCoachShell initialTab="notes" />;
}

function redirectToFlowStats() {
  if (window.location.pathname !== FLOW_STATS_PATH) {
    window.history.replaceState(null, "", FLOW_STATS_PATH);
  }
  return () => <TacticalPadLiteClean initialMode="stats" />;
}

function pickRootComponent() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/") {
    return redirectToBoard();
  }
  if (normalizedPath === QUICK_BOARD_PATH) {
    return redirectToQuickBoard();
  }
  if (normalizedPath === VISION_BOARD_PATH) {
    return TacticalPadLiteClean;
  }
  if (normalizedPath === "/simulator") {
    return redirectToQuickBoard();
  }
  if (normalizedPath === "/flowlab") {
    return redirectToQuickBoard();
  }
  if (normalizedPath === FLOW_STATS_PATH) {
    return () => <TacticalPadLiteClean initialMode="stats" />;
  }
  if (normalizedPath === "/stats") {
    return redirectToFlowStats();
  }
  if (normalizedPath === "/whiteboard") {
    return redirectToQuickBoard();
  }
  if (normalizedPath === "/tacticalpad-lite") {
    return redirectToQuickBoard();
  }
  if (normalizedPath === "/tacticalpad-lite-clean") {
    return redirectToQuickBoard();
  }
  if (normalizedPath === "/board") {
    return boardShell;
  }
  if (normalizedPath === NOTES_PATH) {
    return () => <PitchFlowCoachShell initialTab="notes" />;
  }
  if (normalizedPath === "/library") {
    return redirectToNotes();
  }
  if (normalizedPath === "/sessions") {
    return () => <PitchFlowCoachShell initialTab="sessions" />;
  }
  if (normalizedPath === "/plans") {
    return () => <PitchFlowCoachShell initialTab="plans" />;
  }
  return redirectToBoard();
}

const RootComponent = pickRootComponent();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
);
