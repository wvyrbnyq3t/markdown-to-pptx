import pptxgen from "pptxgenjs";

import type {
  InlineContent,
  MarkdownList,
  SlideElement,
  SlideData,
} from "../../types/slide";

import type { PresentationSettings } from "../../types/presentation";

import {
  pxToInches,
  pxToPoints,
  SLIDE_HEIGHT_PX,
  SLIDE_WIDTH_PX,
} from "../../utils/slideUnits";

import {
  getSlideGridGapPx,
  normalizeSlideGridColumns,
  splitSlideElementsIntoColumns,
} from "../../utils/slideGrid";

import { renderMathSvg } from "../math/renderMath";

const SLIDE_LAYOUT_NAME = "CUSTOM_1920_1080";

const BODY_LINE_HEIGHT = 1.7;
const TEXT_HEIGHT_SAFETY_RATIO = 1.1;
const CONTENT_HEADING_TOP_GAP_PX = 48;
const QUOTE_LINE_HEIGHT = 1.5;

/**
 * PowerPoint上のフォントメトリクスを考慮し、
 * 高さの見積もりに安全余白を加える。
 */
function addTextHeightSafetyPx(
  estimatedHeightPx: number,
  fontSizePx: number,
): number {
  const fontSafetyPx = Math.max(8, fontSizePx * 0.4);

  return Math.ceil(estimatedHeightPx * TEXT_HEIGHT_SAFETY_RATIO + fontSafetyPx);
}

type TextBoxHeightResult = {
  heightPx: number;
  fit: "resize" | "shrink";
};

/**
 * スライド内に収まる場合は、
 * PowerPoint側でテキストボックスを
 * 内容に合わせて拡張する。
 *
 * スライド下端を超える場合だけ
 * 文字を縮小して収める。
 */
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

function createNativeListTextRuns(
  items: FlattenedListItem[],
  textColor: string,
  accentColor: string,
) {
  return items.flatMap((item, itemIndex) => {
    const inlineRuns = toPptxTextRuns(item.runs, textColor, accentColor);

    /*
     * 空のリスト項目にも
     * 段落を生成できるようにする。
     */
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

    /*
     * Markdownの番号を正確に維持するため、
     * 番号付きリストには開始番号を指定する。
     */
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

          /*
           * bulletとindentLevelは、
           * 各段落の先頭ランへ設定する。
           */
          ...(isFirstRun ? listOptions : {}),

          /*
           * リスト項目同士の間隔。
           */
          ...(isFirstRun
            ? {
                paraSpaceAfter: pxToPoints(8),
              }
            : {}),

          /*
           * 次のリスト項目へ改行する。
           */
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

type FlattenedListItem = {
  runs: InlineContent[];
  depth: number;
  ordered: boolean;
  number: number;
};

function flattenMarkdownList(
  list: MarkdownList,
  depth = 0,
): FlattenedListItem[] {
  const result: FlattenedListItem[] = [];

  list.items.forEach((item, itemIndex) => {
    /*
     * 本文を持つ項目だけを
     * PPTX上の1行として追加する。
     */
    if (item.runs.length > 0) {
      result.push({
        runs: item.runs,
        depth,
        ordered: list.ordered,
        number: list.start + itemIndex,
      });
    }

    /*
     * 子リストを親項目の直後に追加する。
     */
    for (const childList of item.children) {
      result.push(...flattenMarkdownList(childList, depth + 1));
    }
  });

  return result;
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

function removeHash(color: string): string {
  return color.replace("#", "");
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

/**
 * コンテンツ要素の上側に設ける余白を返す。
 *
 * 最初の要素:
 *   0px
 *
 * 通常の要素:
 *   8px
 *
 * 上に要素がある小見出し:
 *   16px
 */
function getElementTopGapPx(
  element: SlideElement,
  hasPreviousElement: boolean,
  contentGapPx: number,
): number {
  if (!hasPreviousElement) {
    return 0;
  }

  if (element.type === "subtitle" || element.type === "contentHeading") {
    /*
     * 見出しの上は最低48px。
     * 設定値が48pxより大きい場合は、
     * 設定値を優先する。
     */
    return Math.max(CONTENT_HEADING_TOP_GAP_PX, contentGapPx);
  }

  return contentGapPx;
}

function addTitleSlide(
  pptx: InstanceType<typeof pptxgen>,
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
        settings.titlePageSubtitleFontSizePx * 1.7,
        estimateTextHeightPx(
          subtitleText,
          contentWidthPx,
          settings.titlePageSubtitleFontSizePx,
          1.7,
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

  const primaryColor = removeHash(settings.primaryColor);

  const secondaryColor = removeHash(settings.secondaryColor);

  const textColor = removeHash(settings.textColor);

  const accentColor = removeHash(settings.accentColor);

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

    /*
     * ページタイトルは行の高さ1.0。
     * 1行表示を基本とし、少しだけ上下の余裕を持たせる。
     */
    const titleHeightPx = Math.max(48, settings.titleFontSizePx + 12);

    slide.addText(slideData.title || "無題のスライド", {
      x: pxToInches(slideMarginPx),

      y: pxToInches(slideMarginPx),

      w: pxToInches(slideContentWidthPx),

      // 以下は既存設定
    });

    /*
     * タイトルの下には、外周余白と
     * 同じ大きさの余白を設ける。
     */
    const contentStartYPx = slideMarginPx + titleHeightPx + slideMarginPx;

    const pageNumberHeightPx = Math.max(
      28,
      settings.pageNumberFontSizePx * 1.5,
    );

    const bottomLimitPx =
      SLIDE_HEIGHT_PX -
      slideMarginPx -
      (settings.showPageNumber ? pageNumberHeightPx + slideMarginPx : 0);

    const gridColumns = normalizeSlideGridColumns(slideData.gridColumns);

    const gridGapPx = getSlideGridGapPx(gridColumns);

    const columns = splitSlideElementsIntoColumns(
      slideData.elements,
      gridColumns,
    );

    const totalGridGapPx = gridGapPx * (gridColumns - 1);

    const availableColumnWidthPx = Math.max(
      gridColumns,
      slideContentWidthPx - totalGridGapPx,
    );

    const columnWidthPx = availableColumnWidthPx / gridColumns;

    for (const [columnIndex, columnElements] of columns.entries()) {
      /*
       * 既存のswitch内で使われている
       * marginPxとcontentWidthPxを、
       * この列専用の値として定義する。
       */
      const marginPx =
        slideMarginPx + columnIndex * (columnWidthPx + gridGapPx);

      const contentWidthPx = columnWidthPx;

      let currentYPx = contentStartYPx;

      let hasPlacedContent = false;

      for (const element of columnElements) {
        const topGapPx = getElementTopGapPx(
          element,
          hasPlacedContent,
          settings.contentGapPx,
        );

        const elementYPx = currentYPx + topGapPx;

        const remainingHeightPx = bottomLimitPx - elementYPx;

        if (remainingHeightPx < 40) {
          break;
        }

        let placedHeightPx = 0;

        switch (element.type) {
          case "subtitle": {
            const estimatedHeightPx = Math.max(
              settings.subtitleFontSizePx + 8,

              estimateTextHeightPx(
                element.text,
                contentWidthPx,
                settings.subtitleFontSizePx,
                1,
              ),
            );

            const heightPx = Math.min(estimatedHeightPx, remainingHeightPx);

            slide.addText(element.text, {
              x: pxToInches(marginPx),

              y: pxToInches(elementYPx),

              w: pxToInches(contentWidthPx),

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

              estimateTextHeightPx(element.text, contentWidthPx, fontSizePx, 1),
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
              x: pxToInches(marginPx),

              y: pxToInches(elementYPx),

              w: pxToInches(contentWidthPx),

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
                contentWidthPx,
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

            slide.addText(
              toPptxTextRuns(element.runs, textColor, accentColor),
              {
                x: pxToInches(marginPx),

                y: pxToInches(elementYPx),

                w: pxToInches(contentWidthPx),

                h: pxToInches(textBoxHeight.heightPx),

                fontFace: "Yu Gothic",

                fontSize: pxToPoints(settings.bodyFontSizePx),

                color: textColor,

                lineSpacingMultiple: BODY_LINE_HEIGHT,

                margin: 0,
                valign: "top",

                fit: textBoxHeight.fit,
              },
            );

            placedHeightPx = textBoxHeight.heightPx;

            break;
          }

          case "list": {
            const flattenedItems = flattenMarkdownList(element.list);

            if (flattenedItems.length === 0) {
              placedHeightPx = 0;
              break;
            }

            const itemGapPx = 8;
            const depthIndentPx = 48;
            const markerAreaPx = 48;

            let estimatedContentHeightPx = 0;

            flattenedItems.forEach((item, itemIndex) => {
              const displayDepth = Math.min(item.depth, 5);

              const indentPx = displayDepth * depthIndentPx;

              /*
               * リスト記号・番号と
               * ぶら下げインデントの領域を除いた
               * 実際の本文幅で高さを見積もる。
               */
              const estimatedTextWidthPx = Math.max(
                160,
                contentWidthPx - indentPx - markerAreaPx,
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

            /*
             * PowerPoint上でテキストが
             * 下にはみ出さないよう安全余白を追加する。
             */
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
              x: pxToInches(marginPx),

              y: pxToInches(elementYPx),

              w: pxToInches(contentWidthPx),

              h: pxToInches(textBoxHeight.heightPx),

              fontFace: "Yu Gothic",

              fontSize: pxToPoints(settings.bodyFontSizePx),

              color: textColor,

              lineSpacingMultiple: BODY_LINE_HEIGHT,

              margin: 0,

              valign: "top",

              /*
               * 通常はテキスト量に合わせて
               * テキストボックスを拡張する。
               *
               * スライドの残り領域を超える場合のみ
               * shrinkへ切り替える。
               */
              fit: textBoxHeight.fit,

              breakLine: false,
            });

            placedHeightPx = textBoxHeight.heightPx;

            break;
          }

          case "quote": {
            const quoteGapPx = 8;

            /*
             * CSSと同じ余白
             */
            const quotePaddingTopPx = 16;
            const quotePaddingRightPx = 16;
            const quotePaddingBottomPx = 16;
            const quotePaddingLeftPx = 32;

            const quoteBarWidthPx = 4;
            const quoteDepthIndentPx = 28;

            /*
             * CSS:
             * background: rgb(15 23 42 / 4%);
             *
             * PPTXでは#0F172Aを96%透明にして、
             * 4%の濃さで表示する。
             */
            const quoteBackgroundColor = "0F172A";

            const normalizedAccentColor = accentColor.replace(/^#/, "");

            let currentQuoteYPx = elementYPx;

            let totalHeightPx = 0;

            for (const line of element.lines) {
              /*
               * デザイン上は二重引用まで表示する。
               */
              const depth = Math.min(Math.max(line.depth, 1), 2);

              /*
               * depth 1:
               *   marginPxから開始
               *
               * depth 2:
               *   28px右へ移動
               */
              const quoteBoxIndentPx = (depth - 1) * quoteDepthIndentPx;

              const quoteBoxXPx = marginPx + quoteBoxIndentPx;

              const quoteBoxWidthPx = Math.max(
                160,
                contentWidthPx - quoteBoxIndentPx,
              );

              const quoteTextXPx = quoteBoxXPx + quotePaddingLeftPx;

              const quoteTextWidthPx = Math.max(
                120,
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

              /*
               * PowerPointのフォントメトリクスによる
               * 高さ不足を防ぐため、少し余裕を持たせる。
               */
              const quoteTextHeightPx = Math.ceil(
                estimatedTextHeightPx +
                  Math.max(4, settings.bodyFontSizePx * 0.2),
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

              /*
               * 背景を最初に追加する。
               *
               * PptxGenJSでは後から追加した要素ほど
               * 手前に表示されるため、
               * 背景 → 引用線 → 本文の順に追加する。
               */
              slide.addShape(pptx.ShapeType.rect, {
                x: pxToInches(quoteBoxXPx),

                y: pxToInches(currentQuoteYPx),

                w: pxToInches(quoteBoxWidthPx),

                h: pxToInches(quoteBoxHeightPx),

                fill: {
                  color: quoteBackgroundColor,

                  /*
                   * 96%透明 = 4%表示
                   */
                  transparency: 96,
                },

                line: {
                  color: quoteBackgroundColor,

                  transparency: 100,
                },
              });

              /*
               * 引用線を追加する。
               *
               * depth 1: 1本
               * depth 2: 2本
               */
              for (let barIndex = 0; barIndex < depth; barIndex += 1) {
                const barXPx = marginPx + barIndex * quoteDepthIndentPx;

                const isInnerBar = barIndex === depth - 1;

                slide.addShape(pptx.ShapeType.rect, {
                  x: pxToInches(barXPx),

                  y: pxToInches(currentQuoteYPx),

                  w: pxToInches(quoteBarWidthPx),

                  h: pxToInches(quoteBoxHeightPx),

                  fill: {
                    color: normalizedAccentColor,

                    /*
                     * 外側の引用線は少し薄くする。
                     */
                    transparency: isInnerBar ? 0 : 55,
                  },

                  line: {
                    color: normalizedAccentColor,

                    transparency: 100,
                  },
                });
              }

              /*
               * 引用本文
               */
              const quoteInnerHeightPx = Math.max(
                1,
                quoteBoxHeightPx - quotePaddingTopPx - quotePaddingBottomPx,
              );

              const shouldShrinkText =
                requiredQuoteBoxHeightPx > availableHeightPx;

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

                /*
                 * 内側領域の中央へ配置する。
                 */
                valign: "middle",

                /*
                 * resizeを使うとテキストボックス自体の
                 * 高さが変わり、中央位置がずれる。
                 *
                 * 高さが足りる場合は変更せず、
                 * 足りない場合だけ文字を縮小する。
                 */
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
              x: pxToInches(marginPx),

              y: pxToInches(elementYPx),

              w: pxToInches(contentWidthPx),

              h: pxToInches(heightPx),

              fontFace: "Courier New",

              fontSize: pxToPoints(settings.codeFontSizePx),

              color: "F3F4F6",

              fill: {
                color: "111827",
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
              const math = renderMathSvg(
                element.latex,
                true,
                settings.textColor,
              );

              let mathHeightPx = Math.max(90, settings.mathFontSizePx * 2.2);

              let mathWidthPx = mathHeightPx * math.aspectRatio;

              if (mathWidthPx > contentWidthPx) {
                const scale = contentWidthPx / mathWidthPx;

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

                x: pxToInches(marginPx + (contentWidthPx - mathWidthPx) / 2),

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
                x: pxToInches(marginPx),

                y: pxToInches(elementYPx),

                w: pxToInches(contentWidthPx),

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
            /*
             * PPTXへの直接挿入は
             * Data URI形式の画像に対応する。
             */
            if (!element.src.startsWith("data:image/")) {
              break;
            }

            const imageHeightPx = Math.min(500, remainingHeightPx);

            if (imageHeightPx < 80) {
              break;
            }

            slide.addImage({
              data: element.src,

              x: pxToInches(marginPx),

              y: pxToInches(elementYPx),

              w: pxToInches(contentWidthPx),

              h: pxToInches(imageHeightPx),
            });

            placedHeightPx = imageHeightPx;

            break;
          }
        }

        if (placedHeightPx > 0) {
          currentYPx = elementYPx + placedHeightPx;

          hasPlacedContent = true;
        }
      }
    }

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
