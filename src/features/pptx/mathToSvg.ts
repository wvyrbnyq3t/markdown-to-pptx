import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const texInput = new TeX({ packages: AllPackages });
const svgOutput = new SVG({ fontCache: "none" });
const mathDocument = mathjax.document("", { InputJax: texInput, OutputJax: svgOutput });

/** KaTeXのHTMLではなく、Office互換性のある素のSVGを生成する。 */
export function mathToSvgData(latex: string, textColor: string): { data: string; ratio: number } {
  const node = mathDocument.convert(latex, { display: true });
  const wrapper = adaptor.outerHTML(node);
  const start = wrapper.indexOf("<svg ");
  const end = wrapper.lastIndexOf("</svg>");
  if (start < 0 || end < 0) throw new Error("数式をSVGへ変換できませんでした。");
  let svg = wrapper.slice(start, end + "</svg>".length);
  const match = svg.match(/viewBox="([^"]+)"/);
  const coordinates = match?.[1].split(/\s+/).map(Number) ?? [0, 0, 1000, 500];
  const ratio = coordinates[2] > 0 && coordinates[3] > 0 ? coordinates[2] / coordinates[3] : 2;
  svg = svg.replace(/\swidth="[^"]*"/, "").replace(/\sheight="[^"]*"/, "");
  svg = svg.replace("<svg ", `<svg width="${Math.max(1, Math.round(ratio * 400))}px" height="400px" `);
  svg = svg.replace(/currentColor/g, textColor).replace(/<svg /, `<svg color="${textColor}" `);
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { data: `data:image/svg+xml;base64,${btoa(binary)}`, ratio };
}
