import type { SlideElement, SlideGridColumns } from "../types/slide";

/**
 * columnBreakを基準として、
 * スライド要素を指定された列数に分割する。
 */
export function splitSlideElementsIntoColumns(
  elements: SlideElement[],
  gridColumns: SlideGridColumns,
): SlideElement[][] {
  const columns = Array.from(
    {
      length: gridColumns,
    },
    () => [] as SlideElement[],
  );

  let currentColumnIndex = 0;

  for (const element of elements) {
    if (element.type === "columnBreak") {
      currentColumnIndex = Math.min(currentColumnIndex + 1, gridColumns - 1);

      continue;
    }

    columns[currentColumnIndex].push(element);
  }

  return columns;
}
