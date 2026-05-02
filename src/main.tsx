import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import PitchFlowCoachShell from "./pages/PitchFlowCoachShell";
import TacticalPadLiteClean from "./pages/TacticalPadLiteClean";
import TacticalPadLitePage from "./pages/TacticalPadLitePage";

function pickRootComponent() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/" || normalizedPath === "/tacticalpad-lite-clean") {
    return TacticalPadLiteClean;
  }
  if (normalizedPath === "/tacticalpad-lite") {
    return TacticalPadLitePage;
  }
  if (normalizedPath === "/board") {
    return () => <PitchFlowCoachShell initialTab="board" />;
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
  return App;
}

const RootComponent = pickRootComponent();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
);
