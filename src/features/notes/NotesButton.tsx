import { useMemo, useState, type CSSProperties } from "react";

import { NotesQuickPanel } from "./NotesQuickPanel";
import type { CoachNoteContext } from "./types";

type NotesButtonProps = {
  defaultContext?: CoachNoteContext;
};

const BUTTON_STYLE: CSSProperties = {
  position: "fixed",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  bottom: "max(88px, calc(env(safe-area-inset-bottom, 0px) + 84px))",
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  border: "1px solid rgba(196, 208, 222, 0.42)",
  background: "rgba(10, 19, 24, 0.84)",
  color: "#f1f5f9",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  lineHeight: 1,
  cursor: "pointer",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 12px 26px rgba(2, 8, 15, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  zIndex: 26,
  touchAction: "manipulation",
};

const PANEL_ANCHOR_STYLE: CSSProperties = {
  position: "fixed",
  right: "max(12px, calc(env(safe-area-inset-right, 0px) + 10px))",
  bottom: "max(136px, calc(env(safe-area-inset-bottom, 0px) + 132px))",
  zIndex: 27,
  pointerEvents: "none",
};

const BUTTON_ACTIVE_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  border: "1px solid rgba(125, 211, 252, 0.82)",
  boxShadow: "0 0 0 1px rgba(125, 211, 252, 0.22), 0 12px 28px rgba(2, 8, 15, 0.44)",
};

export function NotesButton({ defaultContext = "match" }: NotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buttonStyle = useMemo(() => {
    return isOpen ? BUTTON_ACTIVE_STYLE : BUTTON_STYLE;
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle notes panel"
        aria-expanded={isOpen}
        style={buttonStyle}
        onClick={() => setIsOpen((open) => !open)}
      >
        📝
      </button>
      {isOpen ? (
        <div style={PANEL_ANCHOR_STYLE}>
          <NotesQuickPanel defaultContext={defaultContext} onRequestClose={() => setIsOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
