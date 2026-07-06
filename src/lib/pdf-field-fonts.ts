/** Standard PDF field font sizes (pt) — matched to BTS form row heights (~16–22pt) */

export const PDF_HEADER_FONT_SIZE = 9;
export const PDF_CODE_FONT_SIZE = 8.5;
export const PDF_BODY_FONT_SIZE = 8;
export const PDF_COMPACT_FONT_SIZE = 7;
export const PDF_DROPDOWN_FONT_SIZE = 7.5;
export const PDF_MIN_FONT_SIZE = 5.5;

const COMPACT_FIELDS = new Set([
  "Text14", "Text17", "Text18", "Text15", "Text2", "Text19",
  "Text20", "Text21", "Text22", "Text23", "Text24", "Text25", "Text26", "Text27",
  "Text28", "Text29", "Text30", "Text31", "Text32", "Text33", "Text34", "Text35",
  "Text36", "Text37", "Text38", "Text39", "Text40", "Text41", "Text42", "Text9",
  "Text43", "Text44", "Text45", "Text16", "Text47", "Text49",
]);

const DROPDOWN_FIELDS = new Set(["Dropdown1", "Dropdown3", "12"]);

function baseSize(fieldName: string): number {
  if (fieldName === "Tex2") return PDF_HEADER_FONT_SIZE;
  if (fieldName === "Text1") return PDF_CODE_FONT_SIZE;
  if (DROPDOWN_FIELDS.has(fieldName)) return PDF_DROPDOWN_FONT_SIZE;
  if (COMPACT_FIELDS.has(fieldName)) return PDF_COMPACT_FONT_SIZE;
  return PDF_BODY_FONT_SIZE;
}

/** Fit text inside field width; only shrink when it would overflow */
function fitToWidth(size: number, value: string, maxWidth?: number): number {
  if (!maxWidth || maxWidth <= 0) return size;
  const usable = maxWidth - 4;
  const charWidth = size * 0.48;
  const needed = value.length * charWidth;
  if (needed <= usable) return size;
  const fitted = usable / (value.length * 0.48);
  return Math.max(PDF_MIN_FONT_SIZE, Math.min(size, fitted));
}

export function resolveFontSize(fieldName: string, value: string, maxWidth?: number): number {
  if (!value?.trim()) return baseSize(fieldName);
  let size = baseSize(fieldName);
  size = fitToWidth(size, value, maxWidth);
  return size;
}

export function verticalTextOffset(fieldName: string, fieldHeight: number, fontSize: number): number {
  if (fieldName === "Tex2") return (fieldHeight - fontSize) * 0.55;
  if (fieldName === "Text1") return (fieldHeight - fontSize) * 0.48;
  return (fieldHeight - fontSize) * 0.42;
}
