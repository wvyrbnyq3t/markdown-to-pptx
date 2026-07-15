export const SLIDE_SPACING_UNIT_PX = 8;

export function getSlideSpacingPx(size: number): number {
  if (!Number.isFinite(size)) {
    return 0;
  }

  const normalizedSize = Math.max(0, Math.trunc(size));

  return normalizedSize * SLIDE_SPACING_UNIT_PX;
}
