import { layoutInlineRuns } from "./inlineLayout";
import { logoLayout } from "../logo/logo";
import pptxgen from "pptxgenjs";
import type { PresentationSettings } from "../../types/settings";
import type {
  SlideData,
  SlideElement,
  TableCell,
  TextAlignment,
  TextRun,
} from "../../types/slide";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "../../types/slide";
import {
  referencedImageIds,
  splitSlideColumns,
} from "../markdown/parseMarkdown";
import type { ImageAsset } from "../../types/image";
import { getImageAsset } from "../images/imageStore";
import { imageToPptxData } from "../images/imageFiles";
import { imageDisplaySize } from "../images/imageLayout";
import { sanitizeFilename } from "../../lib/files";
import {
  materialIconData,
  MATERIAL_ICONS_LICENSE,
} from "../icons/materialIcons";
import { contrastTextColor } from "../../lib/color";
import { mathToSvgData } from "./mathToSvg";

const PIXELS_PER_INCH = 96;
const FONT_FACE = "Yu Gothic";
const CODE_FONT_FACE = "Consolas";
type PptxImage = Pick<ImageAsset, "width" | "height"> & { data: string };
type PptxImages = ReadonlyMap<string, PptxImage>;
const pxToIn = (value: number) => value / PIXELS_PER_INCH;
const pxToPt = (value: number) => value * 0.75;
const pptColor = (value: string) => value.replace("#", "");
const lineHeight = (fontPx: number) => fontPx * 1.28;

function textOf(runs: TextRun[]): string {
  return runs.map((run) => run.text).join("");
}
function estimatedLines(text: string | TextRun[], width: number, size: number): number {
  if (Array.isArray(text)) {
    if (text.some((run) => run.icon)) return layoutInlineRuns(text, width, size).length;
    text = textOf(text);
  }
  const chars = Math.max(1, Math.floor(width / (size * 0.59)));
  return text
    .split("\n")
    .reduce(
      (total, line) => total + Math.max(1, Math.ceil(line.length / chars)),
      0,
    );
}

/** スライドの表示内容とPowerPointの文字サイズを同じpx単位から算出する。 */
function estimateHeight(
  element: SlideElement,
  columnWidth: number,
  settings: PresentationSettings,
  images: PptxImages,
): number {
  const body = settings.fontSize.text;
  switch (element.type) {
    case "subtitle":
      return (
        lineHeight(settings.fontSize.subTitle) *
        estimatedLines(element.runs ?? element.text, columnWidth, settings.fontSize.subTitle)
      );
    case "heading":
      return (
        lineHeight(body * 0.85) *
        estimatedLines(element.runs ?? element.text, columnWidth, body * 0.85)
      );
    case "paragraph":
      return (
        lineHeight(body) *
        estimatedLines(element.runs, columnWidth, body)
      );
    case "quote":
      return (
        lineHeight(body * 0.8) *
          estimatedLines(element.runs, columnWidth - 24, body * 0.8) +
        8
      );
    case "list":
      return element.lines.reduce(
        (height, line) =>
          height +
          lineHeight(body * 0.83) *
            estimatedLines(
              line.runs,
              columnWidth - 50 - line.depth * 30,
              body * 0.83,
            ),
        0,
      );
    case "code":
      return (
        (element.code.split("\n").length + 1) *
          lineHeight(settings.fontSize.code) +
        24
      );
    case "image": {
      const image = images.get(element.assetId);
      if (!image)
        throw new Error(
          `画像「${element.alt || element.assetId}」が見つかりません。画像を再挿入してください。`,
        );
      return imageDisplaySize(
        image,
        columnWidth,
        element.size,
        SLIDE_HEIGHT - settings.margin * 2,
      ).height;
    }
    case "math":
      return settings.fontSize.formula * 1.65;
    case "table":
      return (element.table.rows.length + 1) * lineHeight(body * 0.6) * 1.6;
    case "icon":
      return body * 1.6;
    case "card":
      return (
        estimatedLines(element.runs, columnWidth - 38, body * 0.85) *
          lineHeight(body * 0.85) +
        36
      );
    case "spacing":
      return element.amount;
    case "columnBreak":
      return 0;
  }
}

type PptxSlide = ReturnType<InstanceType<typeof pptxgen>["addSlide"]>;

function drawText(
  slide: PptxSlide,
  text: string | TextRun[],
  x: number,
  y: number,
  width: number,
  height: number,
  sizePx: number,
  color: string,
  options: {
    bold?: boolean;
    italic?: boolean;
    align?: TextAlignment;
    breakLine?: boolean;
    fontFace?: string;
  } = {},
): void {
  if (Array.isArray(text) && text.some((run) => run.icon)) {
    const styled = text.map((run) => ({ ...run, bold: run.bold ?? options.bold, italic: run.italic ?? options.italic }));
    const lines = layoutInlineRuns(styled, width, sizePx);
    const naturalHeight = lines.length * lineHeight(sizePx);
    const maxWidth = Math.max(width, ...lines.map((line) => line.width));
    const scale = Math.min(1, height / naturalHeight, width / maxWidth);
    const size = sizePx * scale;
    const top = y + (height - naturalHeight * scale) / 2;
    lines.forEach((line, index) => {
      const offset = options.align === "right" ? width - line.width * scale
        : options.align === "center" ? (width - line.width * scale) / 2 : 0;
      for (const fragment of line.fragments) {
        const left = x + offset + fragment.x * scale;
        const lineTop = top + index * lineHeight(size);
        if (fragment.run.icon) {
          // 折り返し計算と同じ幅を使い、文字サイズの1.25倍で描画する。
          const iconSize = fragment.width * scale;
          slide.addImage({
            data: materialIconData(fragment.run.icon, color),
            x: pxToIn(left), y: pxToIn(lineTop + (lineHeight(size) - iconSize) / 2),
            w: pxToIn(iconSize), h: pxToIn(iconSize),
            altText: `Material Icon: ${fragment.run.icon}`,
            hyperlink: fragment.run.link && /^https?:\/\//i.test(fragment.run.link) ? { url: fragment.run.link } : undefined,
          });
        } else if (fragment.run.text.trim()) {
          drawText(slide, [fragment.run], left, lineTop, fragment.width * scale, lineHeight(size), size, color,
            { ...options, align: "left", fontFace: fragment.run.code ? CODE_FONT_FACE : options.fontFace });
        }
      }
    });
    return;
  }
  const runs =
    typeof text === "string"
      ? text
      : text.map((run) => ({
          text: run.text,
          options: {
            bold: run.bold,
            italic: run.italic,
            strike: run.strike ? ("sngStrike" as const) : undefined,
            color: run.color === "accent" ? pptColor(color) : undefined,
            hyperlink:
              run.link && /^https?:\/\//i.test(run.link)
                ? { url: run.link }
                : undefined,
          },
        }));
  slide.addText(runs, {
    x: pxToIn(x),
    y: pxToIn(y),
    w: pxToIn(width),
    h: pxToIn(height),
    margin: 0,
    fontFace: options.fontFace ?? FONT_FACE,
    fontSize: pxToPt(sizePx),
    color: pptColor(color),
    bold: options.bold,
    italic: options.italic,
    align: options.align ?? "left",
    valign: "middle",
    lang: "ja-JP",
    breakLine: options.breakLine,
    // はみ出しを防ぐため、テキストが長い場合は自動縮小する。
    fit: "shrink",
  });
}

function drawRect(
  slide: PptxSlide,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  line?: string,
): void {
  slide.addShape("rect", {
    x: pxToIn(x),
    y: pxToIn(y),
    w: pxToIn(width),
    h: pxToIn(height),
    rectRadius: 0,
    line: { color: pptColor(line ?? fill), transparency: line ? 0 : 100 },
    fill: { color: pptColor(fill) },
  });
}

function drawCell(
  slide: PptxSlide,
  cell: TableCell,
  x: number,
  y: number,
  w: number,
  h: number,
  size: number,
  color: string,
  align: TextAlignment,
) {
  drawText(slide, cell.runs, x + 10, y + 3, w - 20, h - 6, size, color, {
    align,
  });
}

function drawElement(
  slide: PptxSlide,
  element: SlideElement,
  x: number,
  y: number,
  w: number,
  settings: PresentationSettings,
  images: PptxImages,
): number {
  const height = estimateHeight(element, w, settings, images);
  const body = settings.fontSize.text;
  const text = settings.color.text;
  const accent = settings.color.accent;
  const align = "align" in element ? element.align : "left";

  switch (element.type) {
    case "subtitle":
      drawText(
        slide,
        element.runs ?? element.text,
        x,
        y,
        w,
        height,
        settings.fontSize.subTitle,
        accent,
        { bold: true, align },
      );
      break;
    case "heading":
      drawText(
        slide,
        element.runs ?? element.text,
        x,
        y,
        w,
        height,
        body * 0.85,
        settings.color.secondary,
        { bold: true, align },
      );
      break;
    case "paragraph":
      drawText(slide, element.runs, x, y, w, height, body, text, { align });
      break;
    case "list": {
      let currentY = y;
      for (const line of element.lines) {
        const lineWidth = w - 30 - line.depth * 24;
        const lineHeightPx =
          lineHeight(body * 0.83) *
          estimatedLines(line.runs, lineWidth, body * 0.83);
        const xLine = x + line.depth * 24;
        drawText(
          slide,
          line.ordered ? `${line.number ?? 1}.` : "•",
          xLine,
          currentY,
          28,
          lineHeightPx,
          body * 0.83,
          accent,
        );
        drawText(
          slide,
          line.runs,
          xLine + 30,
          currentY,
          lineWidth,
          lineHeightPx,
          body * 0.83,
          text,
        );
        currentY += lineHeightPx;
      }
      break;
    }
    case "quote": {
      slide.addShape("line", {
        x: pxToIn(x + 2),
        y: pxToIn(y),
        w: 0,
        h: pxToIn(height),
        line: { color: pptColor(accent), width: 3 },
      });
      drawText(
        slide,
        element.runs,
        x + 20,
        y,
        w - 20,
        height,
        body * 0.8,
        text,
        { italic: true, align },
      );
      break;
    }
    case "code": {
      drawRect(slide, x, y, w, height, "F1F5F9");
      drawText(
        slide,
        element.code,
        x + 16,
        y + 12,
        w - 32,
        height - 24,
        settings.fontSize.code,
        "334155",
        { fontFace: CODE_FONT_FACE },
      );
      break;
    }
    case "image": {
      const image = images.get(element.assetId)!;
      const size = imageDisplaySize(
        image,
        w,
        element.size,
        SLIDE_HEIGHT - settings.margin * 2,
      );
      const offsetX =
        align === "right"
          ? w - size.width
          : align === "center"
            ? (w - size.width) / 2
            : 0;
      slide.addImage({
        data: image.data,
        altText: element.alt,
        x: pxToIn(x + offsetX),
        y: pxToIn(y),
        w: pxToIn(size.width),
        h: pxToIn(size.height),
      });
      break;
    }
    case "math": {
      try {
        const formula = mathToSvgData(element.latex, settings.color.text);
        const targetW = Math.min(w, height * Math.max(formula.ratio, 0.1));
        const targetH = Math.min(
          height,
          targetW / Math.max(formula.ratio, 0.1),
        );
        const offsetX =
          align === "right"
            ? w - targetW
            : align === "left"
              ? 0
              : (w - targetW) / 2;
        slide.addImage({
          data: formula.data,
          x: pxToIn(x + offsetX),
          y: pxToIn(y + (height - targetH) / 2),
          w: pxToIn(targetW),
          h: pxToIn(targetH),
        });
      } catch {
        // 不正な数式でもPPTX全体のエクスポートは続行する。
        drawText(
          slide,
          element.latex,
          x,
          y,
          w,
          height,
          settings.fontSize.formula,
          text,
          { align },
        );
      }
      break;
    }
    case "table": {
      const table = element.table;
      const columns = Math.max(1, table.headers.length);
      const cellWidth = w / columns;
      const rows = [table.headers, ...table.rows];
      const rowHeight = height / Math.max(1, rows.length);
      rows.forEach((cells, rowIndex) =>
        cells.forEach((cell, colIndex) => {
          const cellX = x + colIndex * cellWidth;
          const cellY = y + rowIndex * rowHeight;
          drawRect(
            slide,
            cellX,
            cellY,
            cellWidth,
            rowHeight,
            rowIndex === 0
              ? pptColor(settings.color.tableHeader)
              : pptColor(settings.color.background),
            "E2E8F0",
          );
          drawCell(
            slide,
            cell,
            cellX,
            cellY,
            cellWidth,
            rowHeight,
            body * 0.6,
            rowIndex === 0
              ? contrastTextColor(settings.color.tableHeader)
              : text,
            table.alignments[colIndex] ?? "left",
          );
        }),
      );
      break;
    }
    case "icon": {
      const size = Math.min(body * 1.4, w);
      const offset =
        align === "right" ? w - size : align === "center" ? (w - size) / 2 : 0;
      slide.addImage({
        data: materialIconData(element.name, accent),
        x: pxToIn(x + offset),
        y: pxToIn(y),
        w: pxToIn(size),
        h: pxToIn(size),
        altText: `Material Icon: ${element.name}`,
      });
      break;
    }
    case "card": {
      drawRect(slide, x, y, w, height, "F8FAFC", "CBD5E1");
      drawText(
        slide,
        element.runs,
        x + 18,
        y + 18,
        w - 36,
        height - 36,
        body * 0.85,
        text,
        { align },
      );
      break;
    }
    case "spacing":
    case "columnBreak":
      break;
  }
  return height;
}

function addCover(pptx: pptxgen, settings: PresentationSettings): void {
  const slide = pptx.addSlide();
  slide.background = { color: pptColor(settings.color.background) };
  drawText(
    slide,
    settings.pageTitle.title.content,
    90,
    235,
    SLIDE_WIDTH - 180,
    150,
    settings.pageTitle.title.fontSize,
    settings.color.primary,
    { bold: true, align: "center" },
  );
  if (settings.pageTitle.subTitle.content) {
    drawText(
      slide,
      settings.pageTitle.subTitle.content,
      100,
      400,
      SLIDE_WIDTH - 200,
      100,
      settings.pageTitle.subTitle.fontSize,
      settings.color.secondary,
      { align: "center" },
    );
  }
}

/** 表・リスト・見出し内だけのアイコンにもライセンスを添付する。 */
export function slideHasIcons(data: SlideData): boolean {
  const has = (runs: TextRun[] | undefined) => runs?.some((run) => Boolean(run.icon)) ?? false;
  return has(data.titleRuns) || data.elements.some((element) => {
    if (element.type === "icon") return true;
    if ("runs" in element) return has(element.runs);
    if (element.type === "list") return element.lines.some((line) => has(line.runs));
    if (element.type === "table") return [element.table.headers, ...element.table.rows].some((row) => row.some((cell) => has(cell.runs)));
    return false;
  });
}

/** 表紙→本文の順に、全スライドを編集可能なPPTXとして生成する。 */
export async function generatePptx(
  slides: SlideData[],
  settings: PresentationSettings,
  fileName: string,
): Promise<void> {
  // ブラウザ内の画像を先に取得する。未保存の画像があれば、不完全なPPTXを出力しない。
  const images = new Map<string, PptxImage>();
  for (const id of referencedImageIds(slides)) {
    const image = await getImageAsset(id);
    if (!image)
      throw new Error(
        `画像「${id}」が見つかりません。画像込みZIPを読み込むか、画像を再挿入してください。`,
      );
    images.set(id, {
      width: image.width,
      height: image.height,
      data: await imageToPptxData(image.blob),
    });
  }
  const pptx = new pptxgen();
  pptx.defineLayout({
    name: "PON_WIDE",
    width: pxToIn(SLIDE_WIDTH),
    height: pxToIn(SLIDE_HEIGHT),
  });
  pptx.layout = "PON_WIDE";
  pptx.author = "ポンっ！";
  pptx.subject = "Markdownから生成したプレゼンテーション";
  pptx.title = fileName;
  pptx.theme = { headFontFace: FONT_FACE, bodyFontFace: FONT_FACE };

  if (settings.pageTitle.isEnabled) addCover(pptx, settings);
  const pageOffset = settings.pageTitle.isEnabled ? 1 : 0;
  slides.forEach((data, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: pptColor(settings.color.background) };
    if (slideHasIcons(data))
      slide.addNotes(MATERIAL_ICONS_LICENSE);
    const margin = settings.margin;
    const titleY = margin;
    const logo = logoLayout(settings);
    const titleWidth = logo?.titleWidth ?? SLIDE_WIDTH - margin * 2;
    const textHeight =
      lineHeight(settings.fontSize.title) *
      estimatedLines(data.titleRuns ?? data.title, titleWidth, settings.fontSize.title);
    const titleH = Math.max(textHeight, logo?.height ?? 0);
    drawText(
      slide,
      data.titleRuns ?? data.title,
      logo?.titleX ?? margin,
      titleY,
      titleWidth,
      textHeight,
      settings.fontSize.title,
      settings.color.primary,
      { bold: true },
    );
    if (logo)
      slide.addImage({
        data: settings.logo.dataUrl,
        altText: "ロゴ",
        x: pxToIn(logo.x),
        y: pxToIn(logo.y),
        w: pxToIn(logo.width),
        h: pxToIn(logo.height),
      });
    const columns = splitSlideColumns(data);
    const usableW = SLIDE_WIDTH - margin * 2;
    const spacing = settings.gap * 3;
    const columnWidth =
      (usableW - spacing * (columns.length - 1)) / columns.length;
    const bodyTop = titleY + titleH + settings.gap * 3;
    const bodyEnd =
      SLIDE_HEIGHT -
      margin -
      (settings.pageNumber.isEnabled ? settings.pageNumber.fontSize * 1.4 : 0);
    columns.forEach((elements, colIndex) => {
      const x = margin + colIndex * (columnWidth + spacing);
      let y = bodyTop;
      for (const element of elements) {
        if (element.type === "spacing") {
          y += element.amount;
          continue;
        }
        const height = estimateHeight(element, columnWidth, settings, images);
        if (y + height > bodyEnd + 5) {
          // PPTX側では溢れた内容も出力する。事前のプレビューで確認する。
          // 自動改ページは元のスライド区切りを変えるため行わない。
        }
        drawElement(slide, element, x, y, columnWidth, settings, images);
        y += height + settings.gap * 1.8;
      }
    });
    if (settings.pageNumber.isEnabled) {
      drawText(
        slide,
        String(index + pageOffset + 1),
        SLIDE_WIDTH - margin - 62,
        SLIDE_HEIGHT - margin + 8,
        62,
        36,
        settings.pageNumber.fontSize,
        settings.color.secondary,
        { align: "right" },
      );
    }
  });
  await pptx.writeFile({ fileName: `${sanitizeFilename(fileName)}.pptx` });
}
