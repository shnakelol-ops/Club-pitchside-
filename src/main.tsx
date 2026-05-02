import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import PitchFlowCoachShell from "./pages/PitchFlowCoachShell";
import TacticalPadLiteClean from "./pages/TacticalPadLiteClean";
import TacticalPadLitePage from "./pages/TacticalPadLitePage";

const boardShell = () => <PitchFlowCoachShell initialTab="home" />;

function redirectToBoard() {
  if (window.location.pathname !== "/board") {
    window.history.replaceState(null, "", "/board");
  }
  return boardShell;
}

function pickRootComponent() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/") {
    return redirectToBoard();
  }
  if (normalizedPath === "/simulator") {
    return TacticalPadLiteClean;
  }
  if (normalizedPath === "/tacticalpad-lite-clean") {
    return TacticalPadLiteClean;
  }
  if (normalizedPath === "/flowlab") {
    return TacticalPadLiteClean;
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
  if (normalizedPath === "/tacticalpad-lite") {
    return TacticalPadLitePage;
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
