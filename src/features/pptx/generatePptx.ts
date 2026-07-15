import pptxgen from "pptxgenjs";

import type {
  InlineContent,
  MarkdownList,
  SlideData,
  SlideElement,
} from "../../types/slide";
import type { PresentationSettings } from "../../types/presentation";
import {
  pxToInches,
  pxToPoints,
  SLIDE_HEIGHT_PX,
  SLIDE_WIDTH_PX,
} from "../../utils/slideUnits";
import { getSlideSpacingPx } from "../../utils/slideSpacing";
import { renderMathSvg } from "../math/renderMath";

const SLIDE_LAYOUT_NAME = "CUSTOM_1920_1080";
const BODY_LINE_HEIGHT = 1.7;
const QUOTE_LINE_HEIGHT = 1.5;
const TEXT_HEIGHT_SAFETY_RATIO = 1.1;
const CONTENT_HEADING_TOP_GAP_PX = 48;
const MIN_GRID_COLUMNS = 1;
const MAX_GRID_COLUMNS = 6;
const DEFAULT_GRID_COLUMNS = 1;
const TABLE_FONT_SIZE_RATIO = 0.72;
const TABLE_CELL_PADDING_VERTICAL_PX = 16;
const TABLE_CELL_PADDING_HORIZONTAL_PX = 20;
const DEFAULT_CODE_BACKGROUND_COLOR = "111827";

type PptxInstance = InstanceType<typeof pptxgen>;
type PptxSlide = ReturnType<PptxInstance["addSlide"]>;
type TableAlignment = "left" | "center" | "right" | null;

type MarkdownTableCell = {
  runs: InlineContent[];
};

type MarkdownTableRow = {
  cells: MarkdownTableCell[];
};

type MarkdownTable = {
  alignments: TableAlignment[];
  rows: MarkdownTableRow[];
};

type TableSlideElement = {
  type: "table";
  table: MarkdownTable;
};

type ExtendedSlideElement = SlideElement | TableSlideElement;

type GridAwareSlideData = Omit<SlideData, "elements"> & {
  gridColumns?: number;
  elements: ExtendedSlideElement[];
};

type ExtendedPresentationSettings = PresentationSettings & {
  codeBackgroundColor?: string;
  tableHeaderColor?: string;
};

type TextBoxHeightResult = {
  heightPx: number;
  fit: "resize" | "shrink";
};

type FlattenedListItem = {
  runs: InlineContent[];
  depth: number;
  ordered: boolean;
  number: number;
};

type RenderColumnOptions = {
  pptx: PptxInstance;
  slide: PptxSlide;
  elements: ExtendedSlideElement[];
  columnXPx: number;
  columnWidthPx: number;
  contentStartYPx: number;
  bottomLimitPx: number;
  settings: PresentationSettings;
  textColor: string;
  accentColor: string;
  codeBackgroundColor: string;
  tableHeaderColor: string;
  tableHeaderTextColor: string;
};

function normalizeHexColor(
  color: string | undefined,
  fallback: string,
): string {
  const normalized = color?.trim() ?? "";

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `#${normalized.toUpperCase()}`;
  }

  const normalizedFallback = fallback.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(normalizedFallback)) {
    return normalizedFallback.toUpperCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalizedFallback)) {
    return `#${normalizedFallback.toUpperCase()}`;
  }

  return "#000000";
}

function removeHash(color: string): string {
  return color.replace(/^#/, "");
}

function getReadableTextColor(backgroundColor: string): "FFFFFF" | "000000" {
  const normalizedColor = normalizeHexColor(backgroundColor, "#2563EB");
  const hex = removeHash(normalizedColor);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  const toLinearColor = (value: number): number => {
    const normalizedValue = value / 255;

    return normalizedValue <= 0.04045
      ? normalizedValue / 12.92
      : Math.pow((normalizedValue + 0.055) / 1.055, 2.4);
  };

  const luminance =
    0.2126 * toLinearColor(red) +
    0.7152 * toLinearColor(green) +
    0.0722 * toLinearColor(blue);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  return whiteContrast >= blackContrast ? "FFFFFF" : "000000";
}

function normalizeGridColumns(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_GRID_COLUMNS;
  }

  return Math.min(
    MAX_GRID_COLUMNS,
    Math.max(MIN_GRID_COLUMNS, Math.trunc(value)),
  );
}

function getGridColumns(slide: SlideData): number {
  return normalizeGridColumns((slide as GridAwareSlideData).gridColumns);
}

function getGridGapPx(gridColumns: number): number {
  if (gridColumns <= 3) {
    return 48;
  }

  return Math.max(24, 48 - (gridColumns - 3) * 8);
}

function isColumnBreak(element: ExtendedSlideElement): boolean {
  return element.type === "columnBreak";
}

function splitSlideElementsIntoColumns(
  elements: ExtendedSlideElement[],
  gridColumns: number,
): ExtendedSlideElement[][] {
  const normalizedColumns = normalizeGridColumns(gridColumns);
  const columns = Array.from(
    { length: normalizedColumns },
    () => [] as ExtendedSlideElement[],
  );

  let currentColumnIndex = 0;

  for (const element of elements) {
    if (isColumnBreak(element)) {
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

function addTextHeightSafetyPx(
  estimatedHeightPx: number,
  fontSizePx: number,
): number {
  const fontSafetyPx = Math.max(8, fontSizePx * 0.4);

  return Math.ceil(estimatedHeightPx * TEXT_HEIGHT_SAFETY_RATIO + fontSafetyPx);
}

function resolveTextBoxHeight(
  requiredHeightPx: number,
  remainingHeightPx: number,
): TextBoxHeightResult {
  if (requiredHeightPx <= remainingHeightPx) {
    return {
      heightPx: requiredHeightPx,
      fit: "resize",
    };
  }

  return {
    heightPx: Math.max(1, remainingHeightPx),
    fit: "shrink",
  };
}

function isSafeLinkUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url.trim());
}

function inlineRunsToPlainText(runs: InlineContent[]): string {
  return runs
    .map((run) => (run.type === "text" ? run.text : run.latex))
    .join("");
}

function toPptxTextRuns(
  runs: InlineContent[],
  textColor: string,
  accentColor: string,
) {
  return runs.map((run) => {
    const hasLink = Boolean(run.link) && isSafeLinkUrl(run.link ?? "");
    const usesAccentColor = run.accent === true || hasLink;

    return {
      text: run.type === "text" ? run.text : run.latex,
      options: {
        bold: run.bold,
        italic: run.italic,
        color: usesAccentColor ? accentColor : textColor,
        underline: hasLink
          ? {
              color: accentColor,
            }
          : undefined,
        hyperlink:
          hasLink && run.link
            ? {
                url: run.link,
                tooltip: run.linkTitle ?? run.link,
              }
            : undefined,
      },
    };
  });
}

function flattenMarkdownList(
  list: MarkdownList,
  depth = 0,
): FlattenedListItem[] {
  const result: FlattenedListItem[] = [];

  list.items.forEach((item, itemIndex) => {
    if (item.runs.length > 0) {
      result.push({
        runs: item.runs,
        depth,
        ordered: list.ordered,
        number: list.start + itemIndex,
      });
    }

    for (const childList of item.children) {
      result.push(...flattenMarkdownList(childList, depth + 1));
    }
  });

  return result;
}

function createNativeListTextRuns(
  items: FlattenedListItem[],
  textColor: string,
  accentColor: string,
) {
  return items.flatMap((item, itemIndex) => {
    const inlineRuns = toPptxTextRuns(item.runs, textColor, accentColor);

    const itemRuns =
      inlineRuns.length > 0
        ? inlineRuns
        : [
            {
              text: "",
              options: {
                color: textColor,
              },
            },
          ];

    const displayDepth = Math.min(item.depth, 5);
    const listOptions = item.ordered
      ? {
          bullet: {
            type: "number" as const,
            style: "arabicPeriod" as const,
            numberStartAt: item.number,
          },
          ...(displayDepth > 0
            ? {
                indentLevel: displayDepth,
              }
            : {}),
        }
      : {
          bullet: true,
          ...(displayDepth > 0
            ? {
                indentLevel: displayDepth,
              }
            : {}),
        };

    return itemRuns.map((run, runIndex) => {
      const isFirstRun = runIndex === 0;
      const isLastRun = runIndex === itemRuns.length - 1;
      const isLastItem = itemIndex === items.length - 1;

      return {
        text: run.text,
        options: {
          ...run.options,
          ...(isFirstRun ? listOptions : {}),
          ...(isFirstRun
            ? {
                paraSpaceAfter: pxToPoints(8),
              }
            : {}),
          ...(isLastRun && !isLastItem
            ? {
                breakLine: true,
              }
            : {}),
        },
      };
    });
  });
}

function estimateLineCount(
  text: string,
  availableWidthPx: number,
  fontSizePx: number,
): number {
  const estimatedCharacterWidth = fontSizePx * 0.55;
  const charactersPerLine = Math.max(
    10,
    Math.floor(availableWidthPx / estimatedCharacterWidth),
  );

  return text.split("\n").reduce((total, line) => {
    return total + Math.max(1, Math.ceil(line.length / charactersPerLine));
  }, 0);
}

function estimateTextHeightPx(
  text: string,
  availableWidthPx: number,
  fontSizePx: number,
  lineHeight: number,
): number {
  const lineCount = estimateLineCount(text, availableWidthPx, fontSizePx);

  return Math.ceil(lineCount * fontSizePx * lineHeight);
}

function getPptxTableAlignment(
  alignment: TableAlignment | undefined,
): "left" | "center" | "right" {
  if (alignment === "center" || alignment === "right") {
    return alignment;
  }

  return "left";
}

function getTableColumnCount(table: MarkdownTable): number {
  return Math.max(
    table.alignments.length,
    ...table.rows.map((row) => row.cells.length),
    1,
  );
}

function estimateTableHeightPx(
  table: MarkdownTable,
  contentWidthPx: number,
  fontSizePx: number,
): {
  heightPx: number;
  rowHeightsPx: number[];
} {
  const columnCount = getTableColumnCount(table);
  const cellWidthPx = contentWidthPx / columnCount;
  const textWidthPx = Math.max(
    40,
    cellWidthPx - TABLE_CELL_PADDING_HORIZONTAL_PX * 2,
  );

  const rowHeightsPx = table.rows.map((row) => {
    const maximumTextHeightPx = Math.max(
      fontSizePx * 1.4,
      ...Array.from({ length: columnCount }, (_, cellIndex) => {
        const cell = row.cells[cellIndex];
        const text = cell ? inlineRunsToPlainText(cell.runs) : "";

        return estimateTextHeightPx(text, textWidthPx, fontSizePx, 1.4);
      }),
    );

    return Math.ceil(maximumTextHeightPx + TABLE_CELL_PADDING_VERTICAL_PX * 2);
  });

  return {
    rowHeightsPx,
    heightPx: rowHeightsPx.reduce(
      (total, rowHeightPx) => total + rowHeightPx,
      0,
    ),
  };
}

function getElementTopGapPx(
  element: ExtendedSlideElement,
  hasPreviousElement: boolean,
  contentGapPx: number,
): number {
  if (!hasPreviousElement) {
    return 0;
  }

  if (element.type === "subtitle" || element.type === "contentHeading") {
    return Math.max(CONTENT_HEADING_TOP_GAP_PX, contentGapPx);
  }

  return contentGapPx;
}

function addTitleSlide(
  pptx: PptxInstance,
  settings: PresentationSettings,
  primaryColor: string,
  secondaryColor: string,
  textColor: string,
): void {
  const slide = pptx.addSlide();

  slide.background = {
    color: secondaryColor,
  };

  const marginPx = settings.marginPx;
  const contentWidthPx = SLIDE_WIDTH_PX - marginPx * 2;
  const titleText = settings.titlePageTitle || "無題のプレゼンテーション";
  const subtitleText = settings.titlePageSubtitle.trim();
  const hasSubtitle = subtitleText.length > 0;

  const titleHeightPx = Math.max(
    settings.titlePageTitleFontSizePx + 16,
    estimateTextHeightPx(
      titleText,
      contentWidthPx,
      settings.titlePageTitleFontSizePx,
      1,
    ),
  );

  const subtitleHeightPx = hasSubtitle
    ? Math.max(
        settings.titlePageSubtitleFontSizePx * BODY_LINE_HEIGHT,
        estimateTextHeightPx(
          subtitleText,
          contentWidthPx,
          settings.titlePageSubtitleFontSizePx,
          BODY_LINE_HEIGHT,
        ),
      )
    : 0;

  const titleSubtitleGapPx = hasSubtitle ? 32 : 0;
  const totalContentHeightPx =
    titleHeightPx + titleSubtitleGapPx + subtitleHeightPx;
  const startYPx = (SLIDE_HEIGHT_PX - totalContentHeightPx) / 2;

  slide.addText(titleText, {
    x: pxToInches(marginPx),
    y: pxToInches(startYPx),
    w: pxToInches(contentWidthPx),
    h: pxToInches(titleHeightPx),
    fontFace: "Yu Gothic",
    fontSize: pxToPoints(settings.titlePageTitleFontSizePx),
    bold: true,
    color: primaryColor,
    align: "center",
    lineSpacingMultiple: 1,
    margin: 0,
    fit: "shrink",
  });

  if (hasSubtitle) {
    slide.addText(subtitleText, {
      x: pxToInches(marginPx),
      y: pxToInches(startYPx + titleHeightPx + titleSubtitleGapPx),
      w: pxToInches(contentWidthPx),
      h: pxToInches(subtitleHeightPx),
      fontFace: "Yu Gothic",
      fontSize: pxToPoints(settings.titlePageSubtitleFontSizePx),
      color: textColor,
      align: "center",
      lineSpacingMultiple: BODY_LINE_HEIGHT,
      margin: 0,
      fit: "shrink",
    });
  }
}

function renderSlideColumn({
  pptx,
  slide,
  elements,
  columnXPx,
  columnWidthPx,
  contentStartYPx,
  bottomLimitPx,
  settings,
  textColor,
  accentColor,
  codeBackgroundColor,
  tableHeaderColor,
  tableHeaderTextColor,
}: RenderColumnOptions): void {
  let currentYPx = contentStartYPx;
  let hasPlacedContent = false;
  let previousElementWasSpacing = false;

  for (const element of elements) {
    if (element.type === "spacing") {
      const spacingHeightPx = getSlideSpacingPx(element.size);
      const availableHeightPx = Math.max(0, bottomLimitPx - currentYPx);

      currentYPx += Math.min(spacingHeightPx, availableHeightPx);
      previousElementWasSpacing = true;

      continue;
    }

    /*
     * spacing直後は通常のcontentGapを追加しません。
     */
    const topGapPx = previousElementWasSpacing
      ? 0
      : getElementTopGapPx(element, hasPlacedContent, settings.contentGapPx);
    const elementYPx = currentYPx + topGapPx;
    const remainingHeightPx = Math.max(0, bottomLimitPx - elementYPx);
    let placedHeightPx = 0;

    switch (element.type) {
      case "subtitle": {
        const estimatedHeightPx = Math.max(
          settings.subtitleFontSizePx + 8,
          estimateTextHeightPx(
            element.text,
            columnWidthPx,
            settings.subtitleFontSizePx,
            1,
          ),
        );
        const heightPx = Math.min(estimatedHeightPx, remainingHeightPx);

        slide.addText(element.text, {
          x: pxToInches(columnXPx),
          y: pxToInches(elementYPx),
          w: pxToInches(columnWidthPx),
          h: pxToInches(heightPx),
          fontFace: "Yu Gothic",
          fontSize: pxToPoints(settings.subtitleFontSizePx),
          bold: true,
          color: accentColor,
          lineSpacingMultiple: 1,
          margin: 0,
          valign: "top",
          fit: "shrink",
        });

        placedHeightPx = heightPx;
        break;
      }

      case "contentHeading": {
        const fontSizePx = settings.bodyFontSizePx * 1.25;
        const estimatedHeightPx = Math.max(
          fontSizePx,
          estimateTextHeightPx(element.text, columnWidthPx, fontSizePx, 1),
        );
        const requiredHeightPx = addTextHeightSafetyPx(
          estimatedHeightPx,
          fontSizePx,
        );
        const textBoxHeight = resolveTextBoxHeight(
          requiredHeightPx,
          remainingHeightPx,
        );

        slide.addText(element.text, {
          x: pxToInches(columnXPx),
          y: pxToInches(elementYPx),
          w: pxToInches(columnWidthPx),
          h: pxToInches(textBoxHeight.heightPx),
          fontFace: "Yu Gothic",
          fontSize: pxToPoints(fontSizePx),
          bold: true,
          color: textColor,
          lineSpacingMultiple: 1,
          margin: 0,
          valign: "top",
          fit: textBoxHeight.fit,
        });

        placedHeightPx = textBoxHeight.heightPx;
        break;
      }

      case "paragraph": {
        const plainText = inlineRunsToPlainText(element.runs);
        const estimatedHeightPx = Math.max(
          settings.bodyFontSizePx * BODY_LINE_HEIGHT,
          estimateTextHeightPx(
            plainText,
            columnWidthPx,
            settings.bodyFontSizePx,
            BODY_LINE_HEIGHT,
          ),
        );
        const requiredHeightPx = addTextHeightSafetyPx(
          estimatedHeightPx,
          settings.bodyFontSizePx,
        );
        const textBoxHeight = resolveTextBoxHeight(
          requiredHeightPx,
          remainingHeightPx,
        );

        slide.addText(toPptxTextRuns(element.runs, textColor, accentColor), {
          x: pxToInches(columnXPx),
          y: pxToInches(elementYPx),
          w: pxToInches(columnWidthPx),
          h: pxToInches(textBoxHeight.heightPx),
          fontFace: "Yu Gothic",
          fontSize: pxToPoints(settings.bodyFontSizePx),
          color: textColor,
          lineSpacingMultiple: BODY_LINE_HEIGHT,
          margin: 0,
          valign: "top",
          fit: textBoxHeight.fit,
        });

        placedHeightPx = textBoxHeight.heightPx;
        break;
      }

      case "list": {
        const flattenedItems = flattenMarkdownList(element.list);

        if (flattenedItems.length === 0) {
          break;
        }

        const itemGapPx = 8;
        const depthIndentPx = 48;
        const markerAreaPx = 48;
        let estimatedContentHeightPx = 0;

        flattenedItems.forEach((item, itemIndex) => {
          const displayDepth = Math.min(item.depth, 5);
          const indentPx = displayDepth * depthIndentPx;
          const estimatedTextWidthPx = Math.max(
            120,
            columnWidthPx - indentPx - markerAreaPx,
          );
          const plainText = inlineRunsToPlainText(item.runs);
          const estimatedItemHeightPx = estimateTextHeightPx(
            plainText,
            estimatedTextWidthPx,
            settings.bodyFontSizePx,
            BODY_LINE_HEIGHT,
          );
          const minimumItemHeightPx =
            settings.bodyFontSizePx * BODY_LINE_HEIGHT;

          estimatedContentHeightPx += Math.max(
            estimatedItemHeightPx,
            minimumItemHeightPx,
          );

          if (itemIndex < flattenedItems.length - 1) {
            estimatedContentHeightPx += itemGapPx;
          }
        });

        const requiredHeightPx = addTextHeightSafetyPx(
          estimatedContentHeightPx,
          settings.bodyFontSizePx,
        );
        const textBoxHeight = resolveTextBoxHeight(
          requiredHeightPx,
          remainingHeightPx,
        );
        const listRuns = createNativeListTextRuns(
          flattenedItems,
          textColor,
          accentColor,
        );

        slide.addText(listRuns, {
          x: pxToInches(columnXPx),
          y: pxToInches(elementYPx),
          w: pxToInches(columnWidthPx),
          h: pxToInches(textBoxHeight.heightPx),
          fontFace: "Yu Gothic",
          fontSize: pxToPoints(settings.bodyFontSizePx),
          color: textColor,
          lineSpacingMultiple: BODY_LINE_HEIGHT,
          margin: 0,
          valign: "top",
          fit: textBoxHeight.fit,
          breakLine: false,
        });

        placedHeightPx = textBoxHeight.heightPx;
        break;
      }

      case "table": {
        const rows = element.table.rows;

        if (rows.length === 0) {
          break;
        }

        const columnCount = getTableColumnCount(element.table);
        const tableFontSizePx = Math.max(
          14,
          settings.bodyFontSizePx * TABLE_FONT_SIZE_RATIO,
        );
        const { heightPx: estimatedTableHeightPx, rowHeightsPx } =
          estimateTableHeightPx(element.table, columnWidthPx, tableFontSizePx);
        const tableHeightPx = Math.min(
          estimatedTableHeightPx,
          remainingHeightPx,
        );
        const heightScale =
          estimatedTableHeightPx > 0
            ? tableHeightPx / estimatedTableHeightPx
            : 1;
        const adjustedRowHeights = rowHeightsPx.map((rowHeightPx) =>
          pxToInches(Math.max(1, rowHeightPx * heightScale)),
        );
        const columnWidthInches = pxToInches(columnWidthPx / columnCount);
        const cellMargin: [number, number, number, number] = [
          pxToInches(TABLE_CELL_PADDING_VERTICAL_PX),
          pxToInches(TABLE_CELL_PADDING_HORIZONTAL_PX),
          pxToInches(TABLE_CELL_PADDING_VERTICAL_PX),
          pxToInches(TABLE_CELL_PADDING_HORIZONTAL_PX),
        ];

        const tableRows: Parameters<PptxSlide["addTable"]>[0] = rows.map(
          (row, rowIndex) => {
            return Array.from({ length: columnCount }, (_, cellIndex) => {
              const cell = row.cells[cellIndex];
              const cellText = cell ? inlineRunsToPlainText(cell.runs) : "";
              const alignment = getPptxTableAlignment(
                element.table.alignments[cellIndex],
              );

              if (rowIndex === 0) {
                return {
                  text: cellText,
                  options: {
                    bold: true,
                    color: tableHeaderTextColor,
                    fill: {
                      color: tableHeaderColor,
                    },
                    align: alignment,
                    valign: "middle" as const,
                    margin: cellMargin,
                  },
                };
              }

              return {
                text: cellText,
                options: {
                  color: textColor,
                  align: alignment,
                  valign: "middle" as const,
                  margin: cellMargin,
                },
              };
            });
          },
        );

        slide.addTable(tableRows, {
          x: pxToInches(columnXPx),
          y: pxToInches(elementYPx),
          w: pxToInches(columnWidthPx),
          h: pxToInches(tableHeightPx),
          colW: Array.from({ length: columnCount }, () => columnWidthInches),
          rowH: adjustedRowHeights,
          fontFace: "Yu Gothic",
          fontSize: pxToPoints(tableFontSizePx),
          color: textColor,
          margin: cellMargin,
          valign: "middle",
          border: {
            type: "solid",
            color: "D0D5DD",
            pt: 1,
          },
          autoPage: false,
        });

        placedHeightPx = tableHeightPx;
        break;
      }

      case "quote": {
        const quoteGapPx = 8;
        const quotePaddingTopPx = 16;
        const quotePaddingRightPx = 16;
        const quotePaddingBottomPx = 16;
        const quotePaddingLeftPx = 32;
        const quoteBarWidthPx = 4;
        const quoteDepthIndentPx = 28;
        const quoteBackgroundColor = "0F172A";
        const normalizedAccentColor = accentColor.replace(/^#/, "");

        let currentQuoteYPx = elementYPx;
        let totalHeightPx = 0;

        for (const line of element.lines) {
          const depth = Math.min(Math.max(line.depth, 1), 2);
          const quoteBoxIndentPx = (depth - 1) * quoteDepthIndentPx;
          const quoteBoxXPx = columnXPx + quoteBoxIndentPx;
          const quoteBoxWidthPx = Math.max(
            120,
            columnWidthPx - quoteBoxIndentPx,
          );
          const quoteTextXPx = quoteBoxXPx + quotePaddingLeftPx;
          const quoteTextWidthPx = Math.max(
            80,
            quoteBoxWidthPx - quotePaddingLeftPx - quotePaddingRightPx,
          );
          const plainText = inlineRunsToPlainText(line.runs);
          const estimatedTextHeightPx = Math.max(
            settings.bodyFontSizePx * QUOTE_LINE_HEIGHT,
            estimateTextHeightPx(
              plainText,
              quoteTextWidthPx,
              settings.bodyFontSizePx,
              QUOTE_LINE_HEIGHT,
            ),
          );
          const quoteTextHeightPx = Math.ceil(
            estimatedTextHeightPx + Math.max(4, settings.bodyFontSizePx * 0.2),
          );
          const requiredQuoteBoxHeightPx =
            quotePaddingTopPx + quoteTextHeightPx + quotePaddingBottomPx;
          const availableHeightPx = Math.max(
            1,
            remainingHeightPx - totalHeightPx,
          );
          const quoteBoxHeightPx = Math.min(
            requiredQuoteBoxHeightPx,
            availableHeightPx,
          );

          slide.addShape(pptx.ShapeType.rect, {
            x: pxToInches(quoteBoxXPx),
            y: pxToInches(currentQuoteYPx),
            w: pxToInches(quoteBoxWidthPx),
            h: pxToInches(quoteBoxHeightPx),
            fill: {
              color: quoteBackgroundColor,
              transparency: 96,
            },
            line: {
              color: quoteBackgroundColor,
              transparency: 100,
            },
          });

          for (let barIndex = 0; barIndex < depth; barIndex += 1) {
            const barXPx = columnXPx + barIndex * quoteDepthIndentPx;
            const isInnerBar = barIndex === depth - 1;

            slide.addShape(pptx.ShapeType.rect, {
              x: pxToInches(barXPx),
              y: pxToInches(currentQuoteYPx),
              w: pxToInches(quoteBarWidthPx),
              h: pxToInches(quoteBoxHeightPx),
              fill: {
                color: normalizedAccentColor,
                transparency: isInnerBar ? 0 : 55,
              },
              line: {
                color: normalizedAccentColor,
                transparency: 100,
              },
            });
          }

          const quoteInnerHeightPx = Math.max(
            1,
            quoteBoxHeightPx - quotePaddingTopPx - quotePaddingBottomPx,
          );
          const shouldShrinkText = requiredQuoteBoxHeightPx > availableHeightPx;

          slide.addText(toPptxTextRuns(line.runs, textColor, accentColor), {
            x: pxToInches(quoteTextXPx),
            y: pxToInches(currentQuoteYPx + quotePaddingTopPx),
            w: pxToInches(quoteTextWidthPx),
            h: pxToInches(quoteInnerHeightPx),
            fontFace: "Yu Gothic",
            fontSize: pxToPoints(settings.bodyFontSizePx),
            color: textColor,
            lineSpacingMultiple: QUOTE_LINE_HEIGHT,
            margin: 0,
            valign: "middle",
            fit: shouldShrinkText ? "shrink" : "none",
          });

          currentQuoteYPx += quoteBoxHeightPx + quoteGapPx;
          totalHeightPx += quoteBoxHeightPx + quoteGapPx;

          if (totalHeightPx >= remainingHeightPx) {
            break;
          }
        }

        placedHeightPx = Math.max(0, totalHeightPx - quoteGapPx);
        break;
      }

      case "code": {
        const lineCount = element.code.split("\n").length;
        const codePaddingPx = 20;
        const heightPx = Math.min(
          Math.max(
            100,
            lineCount * settings.codeFontSizePx * 1.5 + codePaddingPx * 2,
          ),
          Math.min(420, remainingHeightPx),
        );

        slide.addText(element.code, {
          x: pxToInches(columnXPx),
          y: pxToInches(elementYPx),
          w: pxToInches(columnWidthPx),
          h: pxToInches(heightPx),
          fontFace: "Courier New",
          fontSize: pxToPoints(settings.codeFontSizePx),
          color: "F3F4F6",
          fill: {
            color: codeBackgroundColor,
          },
          line: {
            color: accentColor,
            width: pxToPoints(2),
          },
          lineSpacingMultiple: 1.5,
          margin: pxToPoints(codePaddingPx),
          valign: "top",
          fit: "shrink",
        });

        placedHeightPx = heightPx;
        break;
      }

      case "math": {
        try {
          const math = renderMathSvg(element.latex, true, settings.textColor);

          let mathHeightPx = Math.max(90, settings.mathFontSizePx * 2.2);
          let mathWidthPx = mathHeightPx * math.aspectRatio;

          if (mathWidthPx > columnWidthPx) {
            const scale = columnWidthPx / mathWidthPx;
            mathWidthPx *= scale;
            mathHeightPx *= scale;
          }

          if (mathHeightPx > remainingHeightPx) {
            const scale = remainingHeightPx / mathHeightPx;
            mathWidthPx *= scale;
            mathHeightPx *= scale;
          }

          slide.addImage({
            data: math.dataUri,
            x: pxToInches(columnXPx + (columnWidthPx - mathWidthPx) / 2),
            y: pxToInches(elementYPx),
            w: pxToInches(mathWidthPx),
            h: pxToInches(mathHeightPx),
          });

          placedHeightPx = mathHeightPx;
        } catch {
          const heightPx = Math.min(
            settings.mathFontSizePx * 2,
            remainingHeightPx,
          );

          slide.addText(element.latex, {
            x: pxToInches(columnXPx),
            y: pxToInches(elementYPx),
            w: pxToInches(columnWidthPx),
            h: pxToInches(heightPx),
            fontFace: "Times New Roman",
            fontSize: pxToPoints(settings.mathFontSizePx),
            color: textColor,
            align: "center",
            margin: 0,
            fit: "shrink",
          });

          placedHeightPx = heightPx;
        }

        break;
      }

      case "image": {
        if (!element.src.startsWith("data:image/")) {
          break;
        }

        const imageHeightPx = Math.min(500, remainingHeightPx);

        if (imageHeightPx < 80) {
          break;
        }

        slide.addImage({
          data: element.src,
          x: pxToInches(columnXPx),
          y: pxToInches(elementYPx),
          w: pxToInches(columnWidthPx),
          h: pxToInches(imageHeightPx),
        });

        placedHeightPx = imageHeightPx;
        break;
      }

      default:
        break;
    }

    if (placedHeightPx > 0) {
      currentYPx = elementYPx + placedHeightPx;
      hasPlacedContent = true;
      previousElementWasSpacing = false;
    }
  }
}

export async function generatePptx(
  slides: SlideData[],
  fileName: string,
  settings: PresentationSettings,
): Promise<void> {
  if (slides.length === 0 && !settings.includeTitleSlide) {
    throw new Error("出力するスライドがありません。");
  }

  const pptx = new pptxgen();

  pptx.defineLayout({
    name: SLIDE_LAYOUT_NAME,
    width: pxToInches(SLIDE_WIDTH_PX),
    height: pxToInches(SLIDE_HEIGHT_PX),
  });

  pptx.layout = SLIDE_LAYOUT_NAME;
  pptx.author = "Markdown PPTX Generator";
  pptx.subject = "Generated from Markdown";
  pptx.title = fileName.replace(/\.pptx$/i, "");

  const extendedSettings = settings as ExtendedPresentationSettings;
  const primaryHex = normalizeHexColor(settings.primaryColor, "#2563EB");
  const secondaryHex = normalizeHexColor(settings.secondaryColor, "#FFFFFF");
  const textHex = normalizeHexColor(settings.textColor, "#334155");
  const accentHex = normalizeHexColor(settings.accentColor, "#F97316");
  const codeBackgroundHex = normalizeHexColor(
    extendedSettings.codeBackgroundColor,
    `#${DEFAULT_CODE_BACKGROUND_COLOR}`,
  );
  const tableHeaderHex = normalizeHexColor(
    extendedSettings.tableHeaderColor,
    primaryHex,
  );

  const primaryColor = removeHash(primaryHex);
  const secondaryColor = removeHash(secondaryHex);
  const textColor = removeHash(textHex);
  const accentColor = removeHash(accentHex);
  const codeBackgroundColor = removeHash(codeBackgroundHex);
  const tableHeaderColor = removeHash(tableHeaderHex);
  const tableHeaderTextColor = getReadableTextColor(tableHeaderHex);

  if (settings.includeTitleSlide) {
    addTitleSlide(pptx, settings, primaryColor, secondaryColor, textColor);
  }

  const slideMarginPx = settings.marginPx;
  const slideContentWidthPx = SLIDE_WIDTH_PX - slideMarginPx * 2;

  for (const [slideIndex, slideData] of slides.entries()) {
    const slide = pptx.addSlide();

    slide.background = {
      color: secondaryColor,
    };

    const titleHeightPx = Math.max(48, settings.titleFontSizePx + 12);

    slide.addText(slideData.title || "無題のスライド", {
      x: pxToInches(slideMarginPx),
      y: pxToInches(slideMarginPx),
      w: pxToInches(slideContentWidthPx),
      h: pxToInches(titleHeightPx),
      fontFace: "Yu Gothic",
      fontSize: pxToPoints(settings.titleFontSizePx),
      bold: true,
      color: primaryColor,
      lineSpacingMultiple: 1,
      margin: 0,
      fit: "shrink",
    });

    const contentStartYPx = slideMarginPx + titleHeightPx + slideMarginPx;
    const pageNumberHeightPx = Math.max(
      28,
      settings.pageNumberFontSizePx * 1.5,
    );
    const bottomLimitPx =
      SLIDE_HEIGHT_PX -
      slideMarginPx -
      (settings.showPageNumber ? pageNumberHeightPx + slideMarginPx : 0);

    const gridSlide = slideData as GridAwareSlideData;
    const gridColumns = getGridColumns(slideData);
    const gridGapPx = getGridGapPx(gridColumns);
    const columns = splitSlideElementsIntoColumns(
      gridSlide.elements,
      gridColumns,
    );
    const totalGridGapPx = gridGapPx * (gridColumns - 1);
    const availableColumnWidthPx = Math.max(
      gridColumns,
      slideContentWidthPx - totalGridGapPx,
    );
    const columnWidthPx = availableColumnWidthPx / gridColumns;

    columns.forEach((columnElements, columnIndex) => {
      const columnXPx =
        slideMarginPx + columnIndex * (columnWidthPx + gridGapPx);

      renderSlideColumn({
        pptx,
        slide,
        elements: columnElements,
        columnXPx,
        columnWidthPx,
        contentStartYPx,
        bottomLimitPx,
        settings,
        textColor,
        accentColor,
        codeBackgroundColor,
        tableHeaderColor,
        tableHeaderTextColor,
      });
    });

    if (settings.showPageNumber) {
      const pageNumberWidthPx = Math.max(80, settings.pageNumberFontSizePx * 4);

      slide.addText(`${slideIndex + 1}`, {
        x: pxToInches(SLIDE_WIDTH_PX - slideMarginPx - pageNumberWidthPx),
        y: pxToInches(SLIDE_HEIGHT_PX - slideMarginPx - pageNumberHeightPx),
        w: pxToInches(pageNumberWidthPx),
        h: pxToInches(pageNumberHeightPx),
        fontFace: "Yu Gothic",
        fontSize: pxToPoints(settings.pageNumberFontSizePx),
        color: textColor,
        transparency: 30,
        align: "right",
        margin: 0,
      });
    }
  }

  await pptx.writeFile({
    fileName,
  });
}
