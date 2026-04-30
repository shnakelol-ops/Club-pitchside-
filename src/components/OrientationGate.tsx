import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type OrientationGateProps = {
  modeLabel: string;
  children: ReactNode;
};

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 15% 12%, rgba(75, 135, 95, 0.18), transparent 42%), radial-gradient(circle at 85% 18%, rgba(76, 112, 90, 0.16), transparent 38%), linear-gradient(165deg, #07110d 0%, #0c1913 38%, #102319 66%, #0e1b14 100%)",
};

const TEXTURE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.018) 0px, rgba(255, 255, 255, 0.018) 2px, transparent 2px, transparent 22px), repeating-linear-gradient(0deg, rgba(80, 135, 98, 0.04) 0px, rgba(80, 135, 98, 0.04) 3px, transparent 3px, transparent 30px)",
  opacity: 0.9,
};

const CONTENT_STYLE: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "min(84vw, 420px)",
  textAlign: "center",
  color: "#f0f6f3",
  display: "grid",
  placeItems: "center",
  gap: "18px",
  padding: "20px 16px",
};

const WORDMARK_WRAP_STYLE: CSSProperties = {
  display: "grid",
  placeItems: "center",
  gap: "6px",
};

const WORDMARK_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: "Inter, Arial Narrow, system-ui, sans-serif",
  fontSize: "clamp(34px, 9.2vw, 58px)",
  fontWeight: 900,
  lineHeight: 0.96,
  letterSpacing: "0.14em",
  color: "#f4f7f5",
  textTransform: "uppercase",
};

const WORDMARK_ACCENT_STYLE: CSSProperties = {
  width: "min(44vw, 180px)",
  height: "3px",
  borderRadius: "99px",
  background: "linear-gradient(90deg, rgba(242, 201, 76, 0.92), rgba(242, 201, 76, 0.58))",
  filter: "drop-shadow(0 12px 26px rgba(0, 0, 0, 0.45))",
};

const MESSAGE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "clamp(16px, 2.9vw, 21px)",
  fontWeight: 600,
  lineHeight: 1.35,
  letterSpacing: "0.2px",
  color: "rgba(243, 250, 247, 0.96)",
};

function usePortraitOrientation(): boolean {
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

export default function OrientationGate({ modeLabel, children }: OrientationGateProps) {
  const isPortrait = usePortraitOrientation();
  if (!isPortrait) return <>{children}</>;

  return (
    <div style={ROOT_STYLE}>
      <div style={TEXTURE_STYLE} aria-hidden="true" />
      <div style={CONTENT_STYLE}>
        <div style={WORDMARK_WRAP_STYLE} aria-hidden="true">
          <p style={WORDMARK_STYLE}>PITCHFLOW</p>
          <div style={WORDMARK_ACCENT_STYLE} />
        </div>
        <p style={MESSAGE_STYLE}>Rotate to landscape to use {modeLabel}</p>
      </div>
    </div>
  );
}
