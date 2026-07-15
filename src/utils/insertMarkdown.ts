export type MarkdownSelection = {
  start: number;
  end: number;
};

export type MarkdownInsertion = {
  /**
   * Markdownへ挿入する文字列。
   */
  text: string;

  /**
   * 挿入後に選択する範囲。
   *
   * textの先頭を0とした相対位置です。
   */
  selectionStartOffset?: number;
  selectionEndOffset?: number;

  /**
   * trueの場合、前後へ空行を自動的に追加します。
   */
  block?: boolean;
};

export type InsertMarkdownResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getLeadingSpacing(textBeforeSelection: string): string {
  if (
    textBeforeSelection.length === 0 ||
    textBeforeSelection.endsWith("\n\n")
  ) {
    return "";
  }

  if (textBeforeSelection.endsWith("\n")) {
    return "\n";
  }

  return "\n\n";
}

function getTrailingSpacing(textAfterSelection: string): string {
  if (
    textAfterSelection.length === 0 ||
    textAfterSelection.startsWith("\n\n")
  ) {
    return "";
  }

  if (textAfterSelection.startsWith("\n")) {
    return "\n";
  }

  return "\n\n";
}

/**
 * Markdownの指定位置へ文字列を挿入します。
 *
 * 選択範囲が存在する場合は、
 * その範囲を挿入内容へ置き換えます。
 */
export function insertMarkdownAtSelection(
  markdown: string,
  selection: MarkdownSelection,
  insertion: MarkdownInsertion,
): InsertMarkdownResult {
  const normalizedStart = clamp(
    Math.min(selection.start, selection.end),
    0,
    markdown.length,
  );

  const normalizedEnd = clamp(
    Math.max(selection.start, selection.end),
    normalizedStart,
    markdown.length,
  );

  const textBeforeSelection = markdown.slice(0, normalizedStart);

  const textAfterSelection = markdown.slice(normalizedEnd);

  const leadingSpacing = insertion.block
    ? getLeadingSpacing(textBeforeSelection)
    : "";

  const trailingSpacing = insertion.block
    ? getTrailingSpacing(textAfterSelection)
    : "";

  const insertedText = leadingSpacing + insertion.text + trailingSpacing;

  const nextMarkdown = textBeforeSelection + insertedText + textAfterSelection;

  const insertionStart = normalizedStart + leadingSpacing.length;

  const startOffset = clamp(
    insertion.selectionStartOffset ?? insertion.text.length,
    0,
    insertion.text.length,
  );

  const endOffset = clamp(
    insertion.selectionEndOffset ?? startOffset,
    startOffset,
    insertion.text.length,
  );

  return {
    value: nextMarkdown,

    selectionStart: insertionStart + startOffset,

    selectionEnd: insertionStart + endOffset,
  };
}
