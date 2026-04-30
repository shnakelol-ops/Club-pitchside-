import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { createTacticalPadLiteSurface } from "../engine/pixi/createTacticalPadLiteSurface";

type WhiteboardPadMode = "tactical" | "stats" | "whiteboard";
type WhiteboardTool = "move" | "pen" | "eraser";

type WhiteboardModeSurfaceProps = {
  onRequestPadModeChange?: (mode: WhiteboardPadMode) => void;
  modeToggle?: ReactNode;
};

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  margin: 0,
  padding: "10px",
  background: "#edf1f5",
  boxSizing: "border-box",
  display: "grid",
  placeItems: "center",
};

const CONTENT_STYLE: CSSProperties = {
  width: "min(calc(100dvw - 24px), calc((100dvh - 24px) * 1.6), 1320px)",
  maxWidth: "calc(100vw - 24px)",
  maxHeight: "calc(100dvh - 24px)",
  aspectRatio: "16 / 10",
  position: "relative",
};

const BOARD_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 24px 56px rgba(20, 30, 42, 0.22)",
  border: "1px solid #d0d8e2",
  background: "#ffffff",
};

const PIXI_HOST_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
};

const TOOLBAR_STYLE: CSSProperties = {
  position: "absolute",
  left: "12px",
  top: "12px",
  display: "flex",
  gap: "6px",
  zIndex: 5,
  padding: "6px",
  borderRadius: "10px",
  border: "1px solid #ced8e2",
  background: "rgba(252, 254, 255, 0.92)",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.14)",
};

const TOOL_BUTTON_STYLE: CSSProperties = {
  height: "30px",
  minWidth: "62px",
  borderRadius: "8px",
  border: "1px solid #cad5e0",
  background: "#f5f8fb",
  color: "#213140",
  fontSize: "11px",
  fontWeight: 600,
  fontFamily: "Inter, system-ui, sans-serif",
  cursor: "pointer",
  padding: "0 10px",
};

const MODE_TOGGLE_STYLE: CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "12px",
  display: "flex",
  gap: "4px",
  padding: "5px",
  borderRadius: "11px",
  border: "1px solid #ced8e2",
  background: "rgba(252, 254, 255, 0.92)",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.14)",
  zIndex: 5,
};

const MODE_BUTTON_STYLE: CSSProperties = {
  border: "1px solid #cad5e0",
  borderRadius: "8px",
  background: "#f5f8fb",
  color: "#213140",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "10.5px",
  fontWeight: 600,
  padding: "6px 10px",
  cursor: "pointer",
};

const ACTIVE_MODE_BUTTON_STYLE: CSSProperties = {
  ...MODE_BUTTON_STYLE,
  border: "1px solid #4c8fd8",
  background: "#e6f1ff",
  color: "#1d4a76",
};

const DRAW_CANVAS_BASE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
};

const STATUS_STYLE: CSSProperties = {
  position: "absolute",
  left: "12px",
  bottom: "12px",
  zIndex: 5,
  height: "30px",
  borderRadius: "8px",
  border: "1px solid #ced8e2",
  background: "rgba(252, 254, 255, 0.92)",
  color: "#2d3c4a",
  fontSize: "10.5px",
  fontWeight: 600,
  fontFamily: "Inter, system-ui, sans-serif",
  display: "flex",
  alignItems: "center",
  padding: "0 10px",
};

function setCanvasSize(canvas: HTMLCanvasElement): void {
  const bounds = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const pixelWidth = Math.max(1, Math.round(bounds.width * dpr));
  const pixelHeight = Math.max(1, Math.round(bounds.height * dpr));
  if (canvas.width === pixelWidth && canvas.height === pixelHeight) return;

  const previous = document.createElement("canvas");
  previous.width = canvas.width;
  previous.height = canvas.height;
  const previousContext = previous.getContext("2d");
  if (previousContext) {
    previousContext.drawImage(canvas, 0, 0);
  }

  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  const context = canvas.getContext("2d");
  if (!context) return;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (previous.width > 0 && previous.height > 0) {
    context.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, canvas.width, canvas.height);
  }
}

export default function WhiteboardModeSurface({
  onRequestPadModeChange,
  modeToggle,
}: WhiteboardModeSurfaceProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<WhiteboardTool>("move");
  const drawStateRef = useRef<{ activePointerId: number | null; isDrawing: boolean }>({
    activePointerId: null,
    isDrawing: false,
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let destroySurface: (() => void) | null = null;

    void createTacticalPadLiteSurface(host, { surfaceVariant: "whiteboard" }).then((surface) => {
      if (disposed) {
        surface.destroy();
        return;
      }
      destroySurface = surface.destroy;
    });

    return () => {
      disposed = true;
      destroySurface?.();
    };
  }, []);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    setCanvasSize(canvas);
    const observer = new ResizeObserver(() => {
      setCanvasSize(canvas);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const drawCanvasStyle = useMemo<CSSProperties>(
    () => ({
      ...DRAW_CANVAS_BASE_STYLE,
      pointerEvents: tool === "move" ? "none" : "auto",
      cursor: tool === "pen" ? "crosshair" : tool === "eraser" ? "cell" : "default",
      zIndex: 3,
    }),
    [tool],
  );

  const drawAtPoint = (canvas: HTMLCanvasElement, x: number, y: number, isStart: boolean): void => {
    const context = canvas.getContext("2d");
    if (!context) return;
    context.strokeStyle = "#1f2f3d";
    context.lineWidth = tool === "eraser" ? 16 : 3;
    context.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";

    if (isStart) {
      context.beginPath();
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "move") return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    const x = (event.clientX - rect.left) * dpr;
    const y = (event.clientY - rect.top) * dpr;
    drawStateRef.current.activePointerId = event.pointerId;
    drawStateRef.current.isDrawing = true;
    drawAtPoint(canvas, x, y, true);
    drawAtPoint(canvas, x, y, false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    if (!drawStateRef.current.isDrawing || drawStateRef.current.activePointerId !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    const x = (event.clientX - rect.left) * dpr;
    const y = (event.clientY - rect.top) * dpr;
    drawAtPoint(canvas, x, y, false);
  };

  const endDrawing = () => {
    drawStateRef.current.isDrawing = false;
    drawStateRef.current.activePointerId = null;
  };

  return (
    <div style={ROOT_STYLE}>
      <div style={CONTENT_STYLE}>
        <div style={BOARD_STYLE}>
          <div ref={hostRef} style={PIXI_HOST_STYLE} />
          <canvas
            ref={drawCanvasRef}
            style={drawCanvasStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrawing}
            onPointerCancel={endDrawing}
            onPointerLeave={endDrawing}
          />
          <div style={TOOLBAR_STYLE}>
            <button
              type="button"
              style={tool === "move" ? ACTIVE_MODE_BUTTON_STYLE : TOOL_BUTTON_STYLE}
              onClick={() => setTool("move")}
            >
              Move
            </button>
            <button
              type="button"
              style={tool === "pen" ? ACTIVE_MODE_BUTTON_STYLE : TOOL_BUTTON_STYLE}
              onClick={() => setTool("pen")}
            >
              Pen
            </button>
            <button
              type="button"
              style={tool === "eraser" ? ACTIVE_MODE_BUTTON_STYLE : TOOL_BUTTON_STYLE}
              onClick={() => setTool("eraser")}
            >
              Erase
            </button>
            <button
              type="button"
              style={TOOL_BUTTON_STYLE}
              onClick={() => {
                const canvas = drawCanvasRef.current;
                const context = canvas?.getContext("2d");
                if (!canvas || !context) return;
                context.clearRect(0, 0, canvas.width, canvas.height);
              }}
            >
              Clear
            </button>
          </div>
          {modeToggle ? (
            <div style={MODE_TOGGLE_STYLE}>{modeToggle}</div>
          ) : (
            <div style={MODE_TOGGLE_STYLE}>
              <button type="button" style={MODE_BUTTON_STYLE} onClick={() => onRequestPadModeChange?.("tactical")}>
                Tactical
              </button>
              <button type="button" style={MODE_BUTTON_STYLE} onClick={() => onRequestPadModeChange?.("stats")}>
                Stats
              </button>
              <button type="button" style={ACTIVE_MODE_BUTTON_STYLE}>
                Whiteboard
              </button>
            </div>
          )}
          <div style={STATUS_STYLE}>Move tool keeps player dragging active.</div>
        </div>
      </div>
    </div>
  );
}
