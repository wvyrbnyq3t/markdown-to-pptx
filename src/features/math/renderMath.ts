import katex from "katex";

import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

const adaptor = liteAdaptor();

RegisterHTMLHandler(adaptor);

const tex = new TeX({
  packages: AllPackages,
});

const svgOutput = new SVG({
  /*
   * 文字のパスをSVG内に直接含める。
   * PowerPointへ単独の画像として渡しやすくする。
   */
  fontCache: "none",
});

const mathDocument = mathjax.document("", {
  InputJax: tex,
  OutputJax: svgOutput,
});

export type MathSvgData = {
  dataUri: string;
  aspectRatio: number;
};

function encodeSvg(svg: string): string {
  const bytes = new TextEncoder().encode(svg);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return (
    "data:image/svg+xml;base64," +
    btoa(binary)
  );
}

function extractSvg(
  containerHtml: string,
): string {
  const startIndex =
    containerHtml.indexOf("<svg");

  const endIndex =
    containerHtml.lastIndexOf("</svg>");

  if (
    startIndex === -1 ||
    endIndex === -1
  ) {
    throw new Error(
      "数式SVGを生成できませんでした。",
    );
  }

  let svg = containerHtml.slice(
    startIndex,
    endIndex + "</svg>".length,
  );

  /*
   * MathJaxの出力に名前空間がない場合だけ追加する。
   */
  if (!/\sxmlns=/.test(svg)) {
    svg = svg.replace(
      "<svg",
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  return svg;
}

/**
 * MathJaxは数式の色にcurrentColorを使用する。
 *
 * SVG要素へ新しいstyle属性を追加すると、
 * MathJaxが既に持っているstyle属性と重複する可能性がある。
 *
 * そのため、style属性は追加せず、
 * SVG内のcurrentColorを直接カラーコードへ置き換える。
 */
function applySvgColor(
  svg: string,
  color: string,
): string {
  const normalizedColor =
    color.startsWith("#")
      ? color
      : `#${color}`;

  return svg.replace(
    /currentColor/g,
    normalizedColor,
  );
}

function getSvgAspectRatio(
  svg: string,
): number {
  const viewBoxMatch = svg.match(
    /viewBox="([^"]+)"/,
  );

  if (!viewBoxMatch) {
    return 4;
  }

  const values = viewBoxMatch[1]
    .trim()
    .split(/\s+/)
    .map(Number);

  if (
    values.length !== 4 ||
    !Number.isFinite(values[2]) ||
    !Number.isFinite(values[3]) ||
    values[2] <= 0 ||
    values[3] <= 0
  ) {
    return 4;
  }

  return values[2] / values[3];
}

/**
 * SVGがブラウザで読み込める形式か検証する。
 */
function validateSvg(svg: string): void {
  const parser = new DOMParser();

  const document = parser.parseFromString(
    svg,
    "image/svg+xml",
  );

  const parserError =
    document.querySelector(
      "parsererror",
    );

  if (parserError) {
    console.error(
      "Invalid MathJax SVG:",
      parserError.textContent,
      svg,
    );

    throw new Error(
      "生成された数式SVGの形式が正しくありません。",
    );
  }

  if (
    document.documentElement.tagName.toLowerCase() !==
    "svg"
  ) {
    throw new Error(
      "数式SVGのルート要素が見つかりません。",
    );
  }
}

export function renderKatexHtml(
  latex: string,
  displayMode: boolean,
): string {
  return katex.renderToString(latex, {
    displayMode,
    throwOnError: false,
    strict: false,
    output: "htmlAndMathml",
  });
}

export function renderMathSvg(
  latex: string,
  displayMode: boolean,
  color: string,
): MathSvgData {
  const convertedNode =
    mathDocument.convert(latex, {
      display: displayMode,
    });

  const containerHtml =
    adaptor.outerHTML(convertedNode);

  let svg = extractSvg(containerHtml);

  svg = applySvgColor(
    svg,
    color,
  );

  validateSvg(svg);

  return {
    dataUri: encodeSvg(svg),
    aspectRatio:
      getSvgAspectRatio(svg),
  };
}