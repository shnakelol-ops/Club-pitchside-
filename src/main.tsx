import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import PitchFlowCoachShell from "./pages/PitchFlowCoachShell";
import TacticalPadLiteClean from "./pages/TacticalPadLiteClean";

const boardShell = () => <PitchFlowCoachShell initialTab="home" />;
const QUICK_BOARD_PATH = "/quickboard";

function redirectToBoard() {
  if (window.location.pathname !== "/board") {
    window.history.replaceState(null, "", "/board");
  }
  return boardShell;
}

function redirectToQuickBoard() {
  if (window.location.pathname !== QUICK_BOARD_PATH) {
    window.history.replaceState(null, "", QUICK_BOARD_PATH);
  }
  return TacticalPadLiteClean;
}

function pickRootComponent() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/") {
    return redirectToBoard();
  }
  if (normalizedPath === QUICK_BOARD_PATH) {
    return TacticalPadLiteClean;
  }
  if (normalizedPath === "/simulator") {
    return redirectToQuickBoard();
  }
  if (normalizedPath === "/flowlab") {
    return redirectToQuickBoard();
  }
  if (normalizedPath === "/flowstats") {
    return () => <TacticalPadLiteClean initialMode="stats" />;
  }
  if (normalizedPath === "/stats") {
    return () => <TacticalPadLiteClean initialMode="stats" />;
  }
  if (normalizedPath === "/whiteboard") {
    return () => <TacticalPadLiteClean initialMode="whiteboard" />;
  }
  if (normalizedPath === "/board") {
    return boardShell;
  }
  if (normalizedPath === "/library") {
    return () => <PitchFlowCoachShell initialTab="library" />;
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
