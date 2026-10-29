import type { ImageSize } from "./imageSize";

export const SLIDE_IMAGE_MAX_HEIGHT = 320;
export const MISSING_IMAGE_HEIGHT = 120;

/** %の高さは上下余白を除いた高さ。明示指定では拡大も許可し、縦横比を保持する。 */
export function imageDisplaySize(
  image: { width: number; height: number },
  columnWidth: number,
  size?: ImageSize,
  contentHeight = SLIDE_IMAGE_MAX_HEIGHT,
) {
  if (image.width <= 0 || image.height <= 0) return { width: 0, height: 0 };
  const maxWidth = Math.max(0, columnWidth);
  const maxHeight = Math.max(0, contentHeight);
  if (!size || !Number.isFinite(size.value) || size.value <= 0) {
    const scale = Math.min(
      1,
      maxWidth / image.width,
      SLIDE_IMAGE_MAX_HEIGHT / image.height,
    );
    return { width: image.width * scale, height: image.height * scale };
  }
  const reference = size.axis === "width" ? maxWidth : maxHeight;
  const pixels =
    size.unit === "%" ? reference * (size.value / 100) : size.value;
  const original = size.axis === "width" ? image.width : image.height;
  const scale = Math.min(
    pixels / original,
    maxWidth / image.width,
    maxHeight / image.height,
  );
  return { width: image.width * scale, height: image.height * scale };
}
