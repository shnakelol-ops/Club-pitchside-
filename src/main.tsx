import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import TacticalPadLitePage from "./pages/TacticalPadLitePage";

function pickRootComponent() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/tacticalpad-lite") {
    return TacticalPadLitePage;
  }
  return App;
}

const RootComponent = pickRootComponent();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
);
