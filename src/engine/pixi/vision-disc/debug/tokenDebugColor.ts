export function clampColorChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function mixColor(base: number, target: number, amount: number): number {
  const baseR = (base >> 16) & 0xff;
  const baseG = (base >> 8) & 0xff;
  const baseB = base & 0xff;
  const targetR = (target >> 16) & 0xff;
  const targetG = (target >> 8) & 0xff;
  const targetB = target & 0xff;

  const r = clampColorChannel(baseR + (targetR - baseR) * amount);
  const g = clampColorChannel(baseG + (targetG - baseG) * amount);
  const b = clampColorChannel(baseB + (targetB - baseB) * amount);

  return (r << 16) | (g << 8) | b;
}

export function luminance(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableTextColor(background: number): number {
  return luminance(background) > 142 ? 0x07110c : 0xf8fafc;
}

export function contrastStrokeColor(textColor: number): number {
  return luminance(textColor) > 142 ? 0x07110c : 0xf8fafc;
}
