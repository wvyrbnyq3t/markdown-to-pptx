import type { SlideElement, SlideGridColumns } from "../types/slide";

/**
 * 使用できる最小列数。
 */
export const MIN_SLIDE_GRID_COLUMNS = 1;

/**
 * 使用できる最大列数。
 *
 * さらに増やしたい場合は、
 * この値だけ変更します。
 */
export const MAX_SLIDE_GRID_COLUMNS = 10;

export const DEFAULT_SLIDE_GRID_COLUMNS = 1;

/**
 * 不正な列数や古い保存データを、
 * 使用可能な範囲へ補正します。
 */
export function normalizeSlideGridColumns(value: unknown): SlideGridColumns {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_SLIDE_GRID_COLUMNS;
  }

  const integerValue = Math.trunc(value);

  return Math.min(
    MAX_SLIDE_GRID_COLUMNS,
    Math.max(MIN_SLIDE_GRID_COLUMNS, integerValue),
  );
}

/**
 * 指定された列数が使用可能か判定します。
 */
export function isValidSlideGridColumns(
  value: unknown,
): value is SlideGridColumns {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_SLIDE_GRID_COLUMNS &&
    value <= MAX_SLIDE_GRID_COLUMNS
  );
}

/**
 * 列数が増えた場合は、
 * 列間の余白を少しずつ狭くします。
 *
 * 1〜3列: 48px
 * 4列: 40px
 * 5列: 32px
 * 6列: 24px
 */
export function getSlideGridGapPx(gridColumns: unknown): number {
  const normalizedColumns = normalizeSlideGridColumns(gridColumns);

  if (normalizedColumns <= 3) {
    return 48;
  }

  return Math.max(24, 48 - (normalizedColumns - 3) * 8);
}

/**
 * columnBreakを基準として、
 * スライド要素を列ごとに分割します。
 */
export function splitSlideElementsIntoColumns(
  elements: SlideElement[],
  gridColumns: SlideGridColumns,
): SlideElement[][] {
  const normalizedColumns = normalizeSlideGridColumns(gridColumns);

  const columns = Array.from(
    {
      length: normalizedColumns,
    },
    () => [] as SlideElement[],
  );

  let currentColumnIndex = 0;

  for (const element of elements) {
    if (element.type === "columnBreak") {
      currentColumnIndex = Math.min(
        currentColumnIndex + 1,
        normalizedColumns - 1,
      );

      continue;
    }

    columns[currentColumnIndex].push(element);
  }

  return columns;
}
