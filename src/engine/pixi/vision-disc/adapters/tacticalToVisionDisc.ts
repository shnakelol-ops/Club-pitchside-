import type { VisionDiscCssTokenSet, VisionDiscRenderInput } from "../contracts";

export type TacticalPlayerForVisionDisc = {
  id: string;
  number: number;
  team: "BLUE" | "RED";
  teamColor: "blue" | "red" | "yellow" | "black";
  kitPattern?: "solid" | "gradient" | "hoops" | "stripes" | "slash" | "chestDash";
  labelMode?: "number" | "initials";
  initials?: string;
  isSelected?: boolean;
};

export type VisionDiscAdapterInput = {
  player: TacticalPlayerForVisionDisc;
  radiusPx: number;
  scale: number;
  playgroundTokens: VisionDiscCssTokenSet;
};

export type VisionDiscAdapterResult =
  | { ok: true; value: VisionDiscRenderInput }
  | { ok: false; reason: "invalid_label" | "invalid_pattern" | "invalid_color_token" };

function sanitizeInitials(value: string | undefined): string {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

export function adaptTacticalPlayerToVisionDisc(input: VisionDiscAdapterInput): VisionDiscAdapterResult {
  const pattern = input.player.kitPattern ?? "solid";
  if (
    pattern !== "solid" &&
    pattern !== "gradient" &&
    pattern !== "hoops" &&
    pattern !== "stripes" &&
    pattern !== "slash" &&
    pattern !== "chestDash"
  ) {
    return { ok: false, reason: "invalid_pattern" };
  }

  const initials = sanitizeInitials(input.player.initials);
  const label =
    input.player.labelMode === "initials"
      ? initials
      : String(Math.max(0, Math.floor(input.player.number))).slice(0, 3);
  if (label.length <= 0) {
    return { ok: false, reason: "invalid_label" };
  }

  return {
    ok: true,
    value: {
      label,
      number: input.player.number,
      labelMode: input.player.labelMode ?? "number",
      teamSide: input.player.team,
      teamColor: input.player.teamColor === "yellow" ? "yellow" : input.player.teamColor,
      pattern,
      selected: Boolean(input.player.isSelected),
      radiusPx: input.radiusPx,
      scale: input.scale,
      styleTokens: input.playgroundTokens,
    },
  };
}
