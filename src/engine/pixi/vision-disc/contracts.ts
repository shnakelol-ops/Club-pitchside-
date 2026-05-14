import type { Container, Graphics, Text } from "pixi.js";

export type VisionDiscTeamSide = "BLUE" | "RED";
export type VisionDiscTeamColor = "blue" | "red" | "green" | "yellow" | "black" | "white";
export type VisionDiscPattern = "solid" | "gradient" | "hoops" | "stripes" | "slash" | "chestDash";
export type VisionDiscLabelMode = "number" | "initials";

export type VisionDiscCssTokenSet = {
  ringColor: string;
  ringStrokeColor: string;
  discBaseColor: string;
  discHighlightColor: string;
  discEdgeColor: string;
  patternColor: string;
  glyphColor: string;
  labelColor: string;
  labelStrokeColor: string;
  labelPlateColor: string;
  shadowColor: string;
  haloColor: string;
};

export type VisionDiscResolvedStyle = {
  colors: {
    ringColor: number;
    ringStrokeColor: number;
    discBaseColor: number;
    discHighlightColor: number;
    discEdgeColor: number;
    patternColor: number;
    glyphColor: number;
    labelColor: number;
    labelStrokeColor: number;
    labelPlateColor: number;
    shadowColor: number;
    haloColor: number;
  };
  alpha: {
    ringColor: number;
    ringStrokeColor: number;
    discBaseColor: number;
    discHighlightColor: number;
    discEdgeColor: number;
    patternColor: number;
    glyphColor: number;
    labelColor: number;
    labelStrokeColor: number;
    labelPlateColor: number;
    shadowColor: number;
    haloColor: number;
  };
};

export type VisionDiscRenderInput = {
  label: string;
  number: number;
  labelMode: VisionDiscLabelMode;
  teamSide: VisionDiscTeamSide;
  teamColor: VisionDiscTeamColor;
  pattern: VisionDiscPattern;
  selected: boolean;
  radiusPx: number;
  scale?: number;
  styleTokens: VisionDiscCssTokenSet;
};

export type VisionDiscRenderOutput = {
  token: Container;
  shadow: Graphics;
  layers: {
    shadow: Graphics;
    ambient: Graphics;
    ring: Graphics;
    disc: Graphics;
    pattern: Graphics;
    glyph: Graphics;
    labelPlate: Graphics;
    labelText: Text;
    orientationTick: Graphics;
    selectedHalo?: Graphics;
  };
};

export type VisionDiscRenderer = (input: VisionDiscRenderInput) => VisionDiscRenderOutput;

export type VisionDiscDebugPreset = {
  id: string;
  label: string;
  description: string;
  tokens: VisionDiscCssTokenSet;
};
