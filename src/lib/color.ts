/** 指定の背景色で読みやすい前景色を選ぶ。WCAGの相対輝度に基づく。 */
export function contrastTextColor(backgroundHex: string): string {
  const hex = backgroundHex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#FFFFFF";
  const values = [0, 2, 4].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = values.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.179 ? "#111827" : "#FFFFFF";
}

/** #の省略・3桁の短縮表記を許可し、#RRGGBBへ統一する。 */
export function normalizeHexColor(value: string): string | null {
  const hex = value.trim().replace(/^#/, "");
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null;
  const full =
    hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
  return `#${full.toUpperCase()}`;
}
