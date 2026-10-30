import type { TextRun } from "../../types/slide";

export interface InlineFragment {
  run: TextRun;
  x: number;
  width: number;
}
export interface InlineLine {
  fragments: InlineFragment[];
  width: number;
}
export type MeasureText = (text: string, run: TextRun, size: number) => number;

let context: CanvasRenderingContext2D | null | undefined;
export const measureInlineText: MeasureText = (text, run, size) => {
  if (context === undefined)
    context = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  if (context) {
    context.font = `${run.italic ? "italic " : ""}${run.bold ? "bold " : ""}${size}px ${run.code ? "Consolas" : '"Yu Gothic"'}, sans-serif`;
    return context.measureText(text).width;
  }
  return Array.from(text).reduce((sum, char) => sum + size * ((char.codePointAt(0) ?? 0) > 255 ? 1 : 0.59), 0);
};

/** 同じ計算を高さの見積もりと描画に使用し、画像の分だけ文字の領域を確保する。 */
export function layoutInlineRuns(
  runs: TextRun[], width: number, size: number, measure: MeasureText = measureInlineText,
): InlineLine[] {
  const lines: InlineLine[] = [{ fragments: [], width: 0 }];
  const limit = Math.max(1, width);
  function append(run: TextRun, text: string, tokenWidth: number) {
    let line = lines[lines.length - 1];
    if (line.width > 0 && line.width + tokenWidth > limit) {
      line = { fragments: [], width: 0 };
      lines.push(line);
    }
    line.fragments.push({ run: { ...run, text }, x: line.width, width: tokenWidth });
    line.width += tokenWidth;
  }
  for (const run of runs) {
    if (run.icon) { append(run, run.text, size * 1.25); continue; }
    // 英単語は可能な限りまとめ、日本語は文字単位で折り返す。
    for (const token of run.text.match(/\n|[A-Za-z0-9_]+|[^\S\n]+|./gu) ?? []) {
      if (token === "\n") { lines.push({ fragments: [], width: 0 }); continue; }
      const tokenWidth = measure(token, run, size);
      if (tokenWidth <= limit) append(run, token, tokenWidth);
      else for (const char of Array.from(token)) append(run, char, measure(char, run, size));
    }
  }
  // 隣り合う同じ書式の文字は一つの編集可能なテキストボックスにまとめる。
  for (const line of lines) {
    const merged: InlineFragment[] = [];
    for (const fragment of line.fragments) {
      const last = merged[merged.length - 1];
      const sameStyle = last && (["bold", "italic", "strike", "code", "math", "link", "color"] as const)
        .every((key) => last.run[key] === fragment.run[key]);
      if (last && !last.run.icon && !fragment.run.icon && sameStyle) {
        last.run.text += fragment.run.text;
        last.width += fragment.width;
      } else merged.push(fragment);
    }
    line.fragments = merged;
  }
  return lines;
}
