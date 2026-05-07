export type WhiteboardDrawingType = "pen" | "line" | "arrow" | "dashedArrow";

export type WhiteboardPoint = { x: number; y: number };

export type WhiteboardPenGeometry = { points: WhiteboardPoint[] };

export type WhiteboardLinearGeometry = {
  start: WhiteboardPoint;
  end: WhiteboardPoint;
  controlPoint: WhiteboardPoint | null;
};

export type WhiteboardDrawingGeometry = WhiteboardPenGeometry | WhiteboardLinearGeometry;

export type WhiteboardDrawingObject = {
  id: string;
  type: WhiteboardDrawingType;
  color: number;
  geometry: WhiteboardDrawingGeometry;
  createdAt: number;
};

export function isWhiteboardPenGeometry(geometry: WhiteboardDrawingGeometry): geometry is WhiteboardPenGeometry {
  return "points" in geometry;
}

export function isWhiteboardLinearGeometry(geometry: WhiteboardDrawingGeometry): geometry is WhiteboardLinearGeometry {
  return "start" in geometry && "end" in geometry;
}
