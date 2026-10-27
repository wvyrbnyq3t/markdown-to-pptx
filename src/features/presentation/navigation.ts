/** 表紙を含むスライド枚数から、安全な表示位置を計算する。 */
export function clampSlideIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(0, index), total - 1);
}

export function nextSlideIndex(index: number, total: number): number {
  return clampSlideIndex(index + 1, total);
}

export function previousSlideIndex(index: number, total: number): number {
  return clampSlideIndex(index - 1, total);
}
