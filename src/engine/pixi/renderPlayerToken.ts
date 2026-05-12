import { Container, Graphics, Text } from "pixi.js";

export type PlayerTokenTeamColor = "blue" | "red" | "yellow" | "black";
export type PlayerTokenKitPattern = "plain" | "hoops" | "slash" | "stripes";

type PlayerTokenPalette = {
  shirt: number;
  shorts: number;
  socks: number;
  boots: number;
  sleeveAccent: number;
  base: number;
  baseRim: number;
  baseHighlight: number;
};

const FALLBACK_SHIRT_BY_TEAM: Record<PlayerTokenTeamColor, number> = {
  blue: 0x2563eb,
  red: 0xdc2626,
  yellow: 0xfacc15,
  black: 0x111827,
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(base: number, target: number, amount: number): number {
  const baseR = (base >> 16) & 0xff;
  const baseG = (base >> 8) & 0xff;
  const baseB = base & 0xff;
  const targetR = (target >> 16) & 0xff;
  const targetG = (target >> 8) & 0xff;
  const targetB = target & 0xff;
  const r = clampChannel(baseR + (targetR - baseR) * amount);
  const g = clampChannel(baseG + (targetG - baseG) * amount);
  const b = clampChannel(baseB + (targetB - baseB) * amount);
  return (r << 16) | (g << 8) | b;
}

function getPalette(teamColor: PlayerTokenTeamColor, shirtColor: number, goalkeeper: boolean): PlayerTokenPalette {
  const fallback = FALLBACK_SHIRT_BY_TEAM[teamColor];
  const resolvedShirt = Number.isFinite(shirtColor) ? shirtColor : fallback;
  const keeperTint = goalkeeper ? 0.22 : 0;
  const primaryShirt = mixColor(resolvedShirt, 0xffffff, keeperTint);
  return {
    shirt: primaryShirt,
    shorts: mixColor(primaryShirt, 0x0b1220, goalkeeper ? 0.58 : 0.44),
    socks: mixColor(primaryShirt, 0xe2e8f0, goalkeeper ? 0.28 : 0.2),
    boots: mixColor(0x0f172a, primaryShirt, 0.1),
    sleeveAccent: goalkeeper ? 0xa3e635 : mixColor(primaryShirt, 0xffffff, 0.2),
    base: 0x121a2a,
    baseRim: 0x020617,
    baseHighlight: 0x243247,
  };
}

function drawTorsoPattern(target: Graphics, pattern: PlayerTokenKitPattern, patternColor: number): void {
  if (pattern === "plain") return;
  const alpha = 0.36;
  if (pattern === "hoops") {
    for (let y = -3.18; y <= -0.64; y += 0.76) {
      target.roundRect(-1.06, y, 2.12, 0.34, 0.16).fill({ color: patternColor, alpha });
    }
    return;
  }
  if (pattern === "stripes") {
    for (let x = -0.76; x <= 0.56; x += 0.64) {
      target.roundRect(x, -3.38, 0.22, 2.96, 0.09).fill({ color: patternColor, alpha });
    }
    return;
  }
  target
    .poly([-1.12, -3.22, -0.62, -3.52, 1.08, -0.86, 0.62, -0.54])
    .fill({ color: patternColor, alpha: alpha + 0.06 });
}

export function renderPlayerToken({
  label,
  teamColor,
  shirtColor,
  kitPattern = "plain",
  kitPatternColor,
  scale = 1,
  goalkeeper = false,
}: {
  label: string;
  teamColor: PlayerTokenTeamColor;
  shirtColor: number;
  kitPattern?: PlayerTokenKitPattern;
  kitPatternColor?: number;
  scale?: number;
  goalkeeper?: boolean;
}): { token: Container; shadow: Graphics } {
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "grab";
  token.scale.set(scale, scale);

  const palette = getPalette(teamColor, shirtColor, goalkeeper);
  const resolvedPatternColor = Number.isFinite(kitPatternColor)
    ? Number(kitPatternColor)
    : mixColor(palette.shirt, palette.shirt === 0xffffff ? 0x111827 : 0xffffff, 0.62);

  const shadow = new Graphics();
  shadow
    .ellipse(0, 3.62, 2.38, 0.62)
    .fill({ color: 0x020617, alpha: 0.16 })
    .ellipse(0, 3.52, 1.86, 0.44)
    .fill({ color: 0x020617, alpha: 0.12 });
  token.addChild(shadow);

  const base = new Graphics();
  base
    .ellipse(0, 3.16, 2.24, 1.02)
    .fill({ color: palette.base, alpha: 0.98 })
    .ellipse(0, 2.92, 1.66, 0.36)
    .fill({ color: palette.baseHighlight, alpha: 0.26 })
    .ellipse(0, 3.16, 2.24, 1.02)
    .stroke({ color: palette.baseRim, width: 0.22, alpha: 0.88, alignment: 0.5 });
  token.addChild(base);

  const athlete = new Graphics();
  // Legs, boots and shorts establish "standing on base" readability.
  athlete
    .roundRect(-0.72, -0.34, 0.5, 2.32, 0.22)
    .fill({ color: palette.socks })
    .roundRect(0.22, -0.34, 0.5, 2.32, 0.22)
    .fill({ color: palette.socks })
    .roundRect(-0.84, 1.75, 0.74, 0.34, 0.16)
    .fill({ color: palette.boots })
    .roundRect(0.12, 1.75, 0.74, 0.34, 0.16)
    .fill({ color: palette.boots })
    .poly([-1.06, -0.62, 1.06, -0.62, 0.86, 0.34, -0.86, 0.34])
    .fill({ color: palette.shorts });

  // Athletic tapered torso and cleaner arm geometry.
  athlete
    .poly([-1.24, -3.58, 1.24, -3.58, 0.86, -0.54, -0.86, -0.54])
    .fill({ color: palette.shirt })
    .poly([-1.24, -3.58, -1.86, -2.14, -1.28, -1.16, -0.86, -2.5])
    .fill({ color: mixColor(palette.shirt, 0x0f172a, 0.14) })
    .poly([1.24, -3.58, 1.86, -2.14, 1.28, -1.16, 0.86, -2.5])
    .fill({ color: mixColor(palette.shirt, 0x0f172a, 0.14) });
  drawTorsoPattern(athlete, kitPattern, resolvedPatternColor);

  // Goalkeeper gets a bright cuff accent while keeping team shirt color.
  if (goalkeeper) {
    athlete
      .roundRect(-1.66, -2.26, 0.28, 0.56, 0.12)
      .fill({ color: palette.sleeveAccent })
      .roundRect(1.38, -2.26, 0.28, 0.56, 0.12)
      .fill({ color: palette.sleeveAccent });
  }

  const headSkin = 0xf0c7a4;
  const hair = 0x111827;
  athlete
    .roundRect(-0.24, -3.9, 0.48, 0.34, 0.12)
    .fill({ color: headSkin })
    .circle(0, -4.7, 0.74)
    .fill({ color: headSkin })
    .ellipse(0, -4.92, 0.78, 0.3)
    .fill({ color: hair, alpha: 0.95 })
    .ellipse(0, -4.52, 0.56, 0.14)
    .fill({ color: 0xffffff, alpha: 0.1 });
  token.addChild(athlete);

  const compactLabel = label.trim().slice(0, 2);
  const isTwoChars = compactLabel.length >= 2;
  const textResolution =
    typeof window !== "undefined" ? Math.max(2, Math.min(3, window.devicePixelRatio || 1)) : 2;
  const numberText = new Text({
    text: compactLabel,
    style: {
      fill: 0xffffff,
      fontSize: isTwoChars ? 1.44 : 1.62,
      fontWeight: "900",
      fontFamily: "\"Barlow Condensed\", \"Inter Tight\", Inter, system-ui, sans-serif",
      align: "center",
      letterSpacing: isTwoChars ? 0.02 : 0.04,
      stroke: { color: 0x0b1220, width: 0.14, join: "round" },
    },
  });
  numberText.anchor.set(0.5, 0.5);
  numberText.position.set(0, 3.1);
  numberText.resolution = textResolution;
  numberText.roundPixels = true;
  token.addChild(numberText);

  return { token, shadow };
}
