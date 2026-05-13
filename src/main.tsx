import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import PitchFlowCoachShell from "./pages/PitchFlowCoachShell";
import TacticalPadLiteClean from "./pages/TacticalPadLiteClean";
import VisionLabsV2Page from "./ui/v2/VisionLabsV2Page";

const boardShell = () => <PitchFlowCoachShell initialTab="home" />;
const VISION_BOARD_PATH = "/vision-board";
const QUICK_BOARD_PATH = "/quickboard";
const FLOW_STATS_PATH = "/flowstats";
const NOTES_PATH = "/notes";
const VISION_LABS_V2_SANDBOX_PATH = "/vision-labs-v2-sandbox";

function redirectToBoard() {
  if (window.location.pathname !== "/board") {
    window.history.replaceState(null, "", "/board");
  }
  return boardShell;
}

function redirectToVisionBoard() {
  if (window.location.pathname !== VISION_BOARD_PATH) {
    window.history.replaceState(null, "", VISION_BOARD_PATH);
  }
  return TacticalPadLiteClean;
}

function redirectToFlowStats() {
  if (window.location.pathname !== FLOW_STATS_PATH) {
    window.history.replaceState(null, "", FLOW_STATS_PATH);
  }
  return () => <TacticalPadLiteClean initialMode="stats" />;
}

function redirectToNotes() {
  if (window.location.pathname !== NOTES_PATH) {
    window.history.replaceState(null, "", NOTES_PATH);
  }
  return () => <PitchFlowCoachShell initialTab="notes" />;
}

function pickRootComponent() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/") {
    return redirectToBoard();
  }
  if (normalizedPath === VISION_BOARD_PATH) {
    return TacticalPadLiteClean;
  }
  if (normalizedPath === QUICK_BOARD_PATH) {
    return redirectToVisionBoard();
  }
  if (normalizedPath === "/simulator") {
    return redirectToVisionBoard();
  }
  if (normalizedPath === "/flowlab") {
    return redirectToVisionBoard();
  }
  if (normalizedPath === "/tacticalpad-lite") {
    return redirectToVisionBoard();
  }
  if (normalizedPath === "/tacticalpad-lite-clean") {
    return redirectToVisionBoard();
  }
  if (normalizedPath === FLOW_STATS_PATH) {
    return () => <TacticalPadLiteClean initialMode="stats" />;
  }
  if (normalizedPath === "/stats") {
    return redirectToFlowStats();
  }
  if (normalizedPath === "/whiteboard") {
    return redirectToVisionBoard();
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
  if (normalizedPath === VISION_LABS_V2_SANDBOX_PATH) {
    return VisionLabsV2Page;
  }
  return redirectToBoard();
}

const RootComponent = pickRootComponent();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
);

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
