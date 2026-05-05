import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { NotesQuickPanel } from "./NotesQuickPanel";
import type { CoachNoteContext } from "./types";

type NotesButtonProps = {
  defaultContext?: CoachNoteContext;
  variant?: "menu" | "floating";
};

type PanelAnchorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const FLOATING_BUTTON_STYLE: CSSProperties = {
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

const FLOATING_BUTTON_ACTIVE_STYLE: CSSProperties = {
  ...FLOATING_BUTTON_STYLE,
  border: "1px solid rgba(125, 211, 252, 0.82)",
  boxShadow: "0 0 0 1px rgba(125, 211, 252, 0.22), 0 12px 28px rgba(2, 8, 15, 0.44)",
};

const MENU_BUTTON_STYLE: CSSProperties = {
  height: "34px",
  borderRadius: "8px",
  border: "1px solid rgba(148, 163, 184, 0.36)",
  background: "rgba(15, 23, 42, 0.86)",
  color: "#dbe7f5",
  fontSize: "10px",
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: "0.2px",
  cursor: "pointer",
  padding: "0 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  textTransform: "uppercase",
  width: "100%",
};

const MENU_BUTTON_ACTIVE_STYLE: CSSProperties = {
  ...MENU_BUTTON_STYLE,
  border: "1px solid rgba(125, 211, 252, 0.82)",
  background: "rgba(14, 116, 144, 0.36)",
};

export function NotesButton({ defaultContext = "match", variant = "menu" }: NotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<PanelAnchorRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const syncAnchorRect = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchorRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const buttonStyle = useMemo(() => {
    if (variant === "floating") {
      return isOpen ? FLOATING_BUTTON_ACTIVE_STYLE : FLOATING_BUTTON_STYLE;
    }
    return isOpen ? MENU_BUTTON_ACTIVE_STYLE : MENU_BUTTON_STYLE;
  }, [isOpen, variant]);

  const panelAnchorStyle = useMemo<CSSProperties | undefined>(() => {
    if (!anchorRect) return undefined;
    if (typeof window === "undefined") return undefined;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const horizontalMargin = 12;
    const verticalMargin = 12;
    const panelWidth = window.matchMedia("(orientation: landscape)").matches ? 360 : 380;

    const preferredRightSideLeft = anchorRect.left + anchorRect.width + 8;
    const preferredLeftSideLeft = anchorRect.left - panelWidth - 8;
    const maxLeft = viewportWidth - horizontalMargin - panelWidth;

    const resolvedLeft =
      preferredRightSideLeft <= maxLeft
        ? preferredRightSideLeft
        : Math.max(horizontalMargin, Math.min(preferredLeftSideLeft, maxLeft));
    const resolvedTop = Math.min(
      Math.max(anchorRect.top - 2, verticalMargin),
      Math.max(verticalMargin, viewportHeight - verticalMargin - 120),
    );

    return {
      position: "fixed",
      left: `${Math.round(resolvedLeft)}px`,
      top: `${Math.round(resolvedTop)}px`,
    };
  }, [anchorRect]);

  useEffect(() => {
    if (!isOpen) return;
    syncAnchorRect();
    const onViewportChange = () => {
      syncAnchorRect();
    };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [isOpen, syncAnchorRect]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Toggle notes panel"
        aria-expanded={isOpen}
        style={buttonStyle}
        onClick={() => {
          syncAnchorRect();
          setIsOpen((open) => !open);
        }}
      >
        📝 <span>Notes</span>
      </button>
      {isOpen ? (
        <NotesQuickPanel
          defaultContext={defaultContext}
          onRequestClose={() => setIsOpen(false)}
          panelAnchorStyle={panelAnchorStyle}
        />
      ) : null}
    </>
  );
}
