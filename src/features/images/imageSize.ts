export interface ImageSize {
  axis: "width" | "height";
  value: number;
  unit: "px" | "%";
}

/** 独立したコメントで、次の画像1枚のサイズを指定する。 */
export function parseImageSize(value: string): ImageSize | null {
  const match =
    /^<!--\s*image-(width|height)\s*:\s*(\d+(?:\.\d+)?)\s*(px|%)\s*-->$/i.exec(
      value.trim(),
    );
  if (!match) return null;
  const amount = Number(match[2]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return {
    axis: match[1].toLowerCase() as ImageSize["axis"],
    value: amount,
    unit: match[3].toLowerCase() as ImageSize["unit"],
  };
}
