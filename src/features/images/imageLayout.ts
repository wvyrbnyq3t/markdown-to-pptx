/** プレビューとPPTXが同じ縦横比・大きさになるよう、画像の配置計算を共有する。 */
export const SLIDE_IMAGE_MAX_HEIGHT = 320;
export const MISSING_IMAGE_HEIGHT = 120;

export function imageDisplaySize(image: { width: number; height: number }, columnWidth: number) {
  const scale = Math.min(1, columnWidth / image.width, SLIDE_IMAGE_MAX_HEIGHT / image.height);
  return { width: image.width * scale, height: image.height * scale };
}
