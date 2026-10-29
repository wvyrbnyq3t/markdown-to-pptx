const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MAX_EDGE = 1024;

/** 単独で描画できる静的SVGに限定し、外部通信や実行可能な内容を受け付けない。 */
export function prepareSvgLogo(source: string): {
  svg: string;
  width: number;
  height: number;
} {
  if (/<!DOCTYPE|<!ENTITY/i.test(source))
    throw new Error("DOCTYPE・ENTITYを含むSVGは使用できません。");
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;
  if (
    document.querySelector("parsererror") ||
    root.localName !== "svg" ||
    root.namespaceURI !== SVG_NAMESPACE
  ) {
    throw new Error("SVGの形式が正しくありません。");
  }
  for (const node of [root, ...root.querySelectorAll("*")]) {
    if (
      node.namespaceURI !== SVG_NAMESPACE ||
      /^(script|foreignObject|image|style|animate.*|set|discard)$/i.test(
        node.localName,
      )
    ) {
      throw new Error(
        "外部画像・スタイルシート・スクリプト・アニメーションを含まないSVGを選択してください。",
      );
    }
    for (const attribute of [...node.attributes]) {
      const value = attribute.value.trim();
      if (
        /^on/i.test(attribute.localName) ||
        attribute.name === "xml:base" ||
        ((attribute.localName === "href" || attribute.localName === "src") &&
          !/^#[\w:.-]+$/.test(value)) ||
        /@import|expression\s*\(|javascript:|\\/i.test(value) ||
        /url\s*\(/i.test(
          value.replace(/url\(\s*['"]?#[\w:.-]+['"]?\s*\)/gi, ""),
        )
      ) {
        throw new Error(
          "外部参照やスクリプトを含むSVGは使用できません。パスに変換して書き出してください。",
        );
      }
    }
  }
  // 処理命令（xml-stylesheet等）はシリアライズ対象外。
  const viewBox = root
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const validBox =
    viewBox?.length === 4 &&
    viewBox.every(Number.isFinite) &&
    viewBox[2] > 0 &&
    viewBox[3] > 0;
  function length(value: string | null): number | null {
    if (!value || !/^\d+(?:\.\d+)?(?:px)?$/.test(value.trim())) return null;
    const result = parseFloat(value);
    return Number.isFinite(result) && result > 0 ? result : null;
  }
  let width = length(root.getAttribute("width"));
  let height = length(root.getAttribute("height"));
  if (validBox && viewBox) {
    width ??= height ? (height * viewBox[2]) / viewBox[3] : viewBox[2];
    height ??= (width * viewBox[3]) / viewBox[2];
  }
  if (!width || !height || !Number.isFinite(width / height))
    throw new Error(
      "SVGに有効なwidth・heightまたはviewBoxを指定してください。",
    );
  const scale = MAX_EDGE / Math.max(width, height);
  const outputWidth = Math.max(1, Math.round(width * scale));
  const outputHeight = Math.max(1, Math.round(height * scale));
  if (!validBox) root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  root.setAttribute("width", String(outputWidth));
  root.setAttribute("height", String(outputHeight));
  return {
    svg: new XMLSerializer().serializeToString(root),
    width: outputWidth,
    height: outputHeight,
  };
}

/** SVGは画像として読み込み、透明背景を維持したPNGに変換して保存する。 */
export async function svgLogoToPng(file: File): Promise<Blob> {
  const { svg, width, height } = prepareSvgLogo(await file.text());
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        image.src = "";
        reject(new Error("SVGの読み込みがタイムアウトしました。"));
      }, 10000);
      image.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      image.onerror = () => {
        clearTimeout(timer);
        reject(
          new Error(
            "SVGを画像に変換できませんでした。パスに変換して書き出してください。",
          ),
        );
      };
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像変換を利用できません。");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("PNGへの変換に失敗しました。")),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
