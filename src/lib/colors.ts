// Categorical colors for chart lines, in slot order. These are the dark-surface
// steps of the dataviz skill's validated eight-hue palette (checked against
// #1a1a19 with validate_palette.js --mode dark). A ninth hue is never invented:
// slots 9 and 10 reuse the first two hues with a dashed line.

export const palette = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
] as const;

export interface LineStyle {
  color: string;
  dashed: boolean;
}

export function slotStyle(slot: number): LineStyle {
  return { color: palette[slot % palette.length] as string, dashed: slot >= palette.length };
}
