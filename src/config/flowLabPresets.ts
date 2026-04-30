export type FlowPresetTeam = "blue" | "red";
export type FlowPresetDrawingType = "line" | "arrow" | "dashed";
export type FlowPresetDrawingColor = "black";

export type FlowPresetPlayer = {
  team: FlowPresetTeam;
  number: number;
  x: number;
  y: number;
};

export type FlowPresetDrawing = {
  type: FlowPresetDrawingType;
  color: FlowPresetDrawingColor;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export type FlowPreset = {
  id: string;
  name: string;
  category: "Kickouts" | "Attack" | "Press" | "Support";
  players: FlowPresetPlayer[];
  drawings: FlowPresetDrawing[];
};

export const FLOW_PRESETS: FlowPreset[] = [
  {
    id: "standard-kickout-spread",
    name: "Standard Kickout Spread",
    category: "Kickouts",
    players: [
      { team: "blue", number: 1, x: 8, y: 50 },
      { team: "blue", number: 2, x: 18, y: 22 },
      { team: "blue", number: 3, x: 18, y: 50 },
      { team: "blue", number: 4, x: 18, y: 78 },
      { team: "blue", number: 5, x: 34, y: 24 },
      { team: "blue", number: 6, x: 34, y: 50 },
      { team: "blue", number: 7, x: 34, y: 76 },
      { team: "blue", number: 8, x: 48, y: 42 },
      { team: "blue", number: 9, x: 48, y: 58 },
    ],
    drawings: [
      { type: "arrow", color: "black", from: { x: 8, y: 50 }, to: { x: 18, y: 22 } },
      { type: "arrow", color: "black", from: { x: 8, y: 50 }, to: { x: 18, y: 50 } },
      { type: "arrow", color: "black", from: { x: 8, y: 50 }, to: { x: 18, y: 78 } },
    ],
  },
  {
    id: "short-kickout-triangle",
    name: "Short Kickout Triangle",
    category: "Kickouts",
    players: [
      { team: "blue", number: 1, x: 8, y: 50 },
      { team: "blue", number: 3, x: 20, y: 42 },
      { team: "blue", number: 4, x: 20, y: 58 },
      { team: "blue", number: 6, x: 32, y: 50 },
    ],
    drawings: [
      { type: "arrow", color: "black", from: { x: 8, y: 50 }, to: { x: 20, y: 42 } },
      { type: "arrow", color: "black", from: { x: 20, y: 42 }, to: { x: 20, y: 58 } },
      { type: "dashed", color: "black", from: { x: 20, y: 58 }, to: { x: 8, y: 50 } },
      { type: "arrow", color: "black", from: { x: 20, y: 42 }, to: { x: 32, y: 50 } },
    ],
  },
  {
    id: "right-side-overload",
    name: "Right Side Overload",
    category: "Attack",
    players: [
      { team: "blue", number: 1, x: 8, y: 50 },
      { team: "blue", number: 2, x: 22, y: 70 },
      { team: "blue", number: 5, x: 38, y: 72 },
      { team: "blue", number: 8, x: 48, y: 60 },
      { team: "blue", number: 10, x: 60, y: 72 },
      { team: "blue", number: 13, x: 72, y: 78 },
      { team: "red", number: 2, x: 56, y: 68 },
      { team: "red", number: 5, x: 66, y: 75 },
    ],
    drawings: [
      { type: "arrow", color: "black", from: { x: 8, y: 50 }, to: { x: 22, y: 70 } },
      { type: "arrow", color: "black", from: { x: 22, y: 70 }, to: { x: 38, y: 72 } },
      { type: "arrow", color: "black", from: { x: 38, y: 72 }, to: { x: 60, y: 72 } },
      { type: "dashed", color: "black", from: { x: 48, y: 60 }, to: { x: 72, y: 78 } },
    ],
  },
  {
    id: "high-press-funnel",
    name: "High Press Funnel",
    category: "Press",
    players: [
      { team: "red", number: 1, x: 92, y: 50 },
      { team: "red", number: 2, x: 82, y: 28 },
      { team: "red", number: 3, x: 82, y: 50 },
      { team: "red", number: 4, x: 82, y: 72 },
      { team: "blue", number: 13, x: 70, y: 35 },
      { team: "blue", number: 14, x: 70, y: 50 },
      { team: "blue", number: 15, x: 70, y: 65 },
      { team: "blue", number: 10, x: 60, y: 25 },
      { team: "blue", number: 12, x: 60, y: 75 },
    ],
    drawings: [
      { type: "arrow", color: "black", from: { x: 70, y: 35 }, to: { x: 82, y: 28 } },
      { type: "arrow", color: "black", from: { x: 70, y: 50 }, to: { x: 82, y: 50 } },
      { type: "arrow", color: "black", from: { x: 70, y: 65 }, to: { x: 82, y: 72 } },
      { type: "dashed", color: "black", from: { x: 60, y: 25 }, to: { x: 78, y: 18 } },
      { type: "dashed", color: "black", from: { x: 60, y: 75 }, to: { x: 78, y: 82 } },
    ],
  },
  {
    id: "midfield-diamond-support",
    name: "Midfield Diamond Support",
    category: "Support",
    players: [
      { team: "blue", number: 8, x: 50, y: 50 },
      { team: "blue", number: 6, x: 42, y: 50 },
      { team: "blue", number: 9, x: 58, y: 50 },
      { team: "blue", number: 10, x: 50, y: 36 },
      { team: "blue", number: 11, x: 50, y: 64 },
      { team: "red", number: 8, x: 52, y: 54 },
    ],
    drawings: [
      { type: "line", color: "black", from: { x: 50, y: 50 }, to: { x: 42, y: 50 } },
      { type: "line", color: "black", from: { x: 50, y: 50 }, to: { x: 58, y: 50 } },
      { type: "line", color: "black", from: { x: 50, y: 50 }, to: { x: 50, y: 36 } },
      { type: "line", color: "black", from: { x: 50, y: 50 }, to: { x: 50, y: 64 } },
    ],
  },
  {
    id: "overlap-run-pattern",
    name: "Overlap Run Pattern",
    category: "Attack",
    players: [
      { team: "blue", number: 7, x: 45, y: 72 },
      { team: "blue", number: 10, x: 55, y: 70 },
      { team: "blue", number: 12, x: 62, y: 58 },
      { team: "red", number: 5, x: 60, y: 70 },
      { team: "red", number: 6, x: 68, y: 60 },
    ],
    drawings: [
      { type: "arrow", color: "black", from: { x: 45, y: 72 }, to: { x: 55, y: 70 } },
      { type: "dashed", color: "black", from: { x: 55, y: 70 }, to: { x: 72, y: 76 } },
      { type: "arrow", color: "black", from: { x: 55, y: 70 }, to: { x: 62, y: 58 } },
    ],
  },
  {
    id: "diagonal-cut-inside",
    name: "Diagonal Cut Inside",
    category: "Attack",
    players: [
      { team: "blue", number: 11, x: 58, y: 24 },
      { team: "blue", number: 14, x: 72, y: 42 },
      { team: "blue", number: 10, x: 54, y: 50 },
      { team: "red", number: 4, x: 66, y: 30 },
      { team: "red", number: 6, x: 72, y: 50 },
    ],
    drawings: [
      { type: "arrow", color: "black", from: { x: 58, y: 24 }, to: { x: 72, y: 42 } },
      { type: "dashed", color: "black", from: { x: 54, y: 50 }, to: { x: 68, y: 46 } },
      { type: "line", color: "black", from: { x: 72, y: 42 }, to: { x: 78, y: 50 } },
    ],
  },
  {
    id: "kickout-midfield-break",
    name: "Kickout to Midfield Break",
    category: "Kickouts",
    players: [
      { team: "blue", number: 1, x: 8, y: 50 },
      { team: "blue", number: 8, x: 48, y: 45 },
      { team: "blue", number: 9, x: 48, y: 58 },
      { team: "blue", number: 10, x: 62, y: 45 },
      { team: "blue", number: 11, x: 62, y: 58 },
      { team: "red", number: 8, x: 50, y: 50 },
      { team: "red", number: 6, x: 62, y: 52 },
    ],
    drawings: [
      { type: "arrow", color: "black", from: { x: 8, y: 50 }, to: { x: 48, y: 45 } },
      { type: "arrow", color: "black", from: { x: 48, y: 45 }, to: { x: 62, y: 45 } },
      { type: "dashed", color: "black", from: { x: 48, y: 58 }, to: { x: 62, y: 58 } },
    ],
  },
];
