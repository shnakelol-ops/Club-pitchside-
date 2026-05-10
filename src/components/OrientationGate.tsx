import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type OrientationGateProps = {
  modeLabel?: string;
  children: ReactNode;
};

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  top: "max(10px, calc(env(safe-area-inset-top, 0px) + 8px))",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(92vw, 440px)",
  zIndex: 30,
  pointerEvents: "none",
};

const BANNER_STYLE: CSSProperties = {
  display: "grid",
  gap: "6px",
  textAlign: "center",
  borderRadius: "16px",
  border: "1px solid rgba(236, 246, 255, 0.22)",
  background: "linear-gradient(165deg, rgba(7, 15, 22, 0.56) 0%, rgba(10, 22, 34, 0.48) 100%)",
  boxShadow: "0 14px 36px rgba(3, 9, 14, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  padding: "11px 14px",
  color: "#edf4fa",
};

const HEADING_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "clamp(14px, 3.1vw, 16px)",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(243, 249, 255, 0.94)",
};

const BODY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "clamp(12px, 2.7vw, 13px)",
  fontWeight: 500,
  lineHeight: 1.35,
  letterSpacing: "0.01em",
  color: "rgba(215, 228, 239, 0.9)",
};

export function usePortraitOrientation(): boolean {
  const getValue = () => window.matchMedia("(orientation: portrait)").matches || window.innerHeight > window.innerWidth;
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getValue();
  });

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const update = () => setIsPortrait(getValue());
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
    } else {
      media.addListener(update);
    }
    window.addEventListener("resize", update);

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", update);
      } else {
        media.removeListener(update);
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  return isPortrait;
}

export default function OrientationGate({ modeLabel = "Vision Board", children }: OrientationGateProps) {
  const isPortrait = usePortraitOrientation();

  return (
    <>
      {children}
      {isPortrait ? (
        <div style={ROOT_STYLE} role="status" aria-live="polite" aria-label={`${modeLabel} viewing mode notice`}>
          <div style={BANNER_STYLE}>
            <p style={HEADING_STYLE}>Viewing Mode</p>
            <p style={BODY_STYLE}>Rotate to landscape to create your vision.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
