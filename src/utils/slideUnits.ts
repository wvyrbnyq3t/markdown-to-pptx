export const SLIDE_WIDTH_PX = 1920;
export const SLIDE_HEIGHT_PX = 1080;

/**
 * 1920px × 1080pxを
 * 13.333inch × 7.5inchとしてPPTXへ出力する。
 */
export const DESIGN_PIXELS_PER_INCH = 144;

/**
 * 1inch = 72pt
 * 144px ÷ 72pt = 2px/pt
 */
export const DESIGN_PIXELS_PER_POINT = 2;

export function pxToInches(px: number): number {
  return px / DESIGN_PIXELS_PER_INCH;
}

export function pxToPoints(px: number): number {
  return px / DESIGN_PIXELS_PER_POINT;
}
