import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type {
  ListLine,
  SlideData,
  SlideElement,
  TableCell,
  TextAlignment,
  TextRun,
} from "../../types/slide";

/** mdastの必要なフィールドだけを参照する、読み取り専用の内部型。 */
interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  depth?: number;
  ordered?: boolean;
  start?: number;
  lang?: string;
  url?: string;
  align?: Array<"left" | "center" | "right" | null>;
}

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

function plainText(node: MarkdownNode): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(plainText).join("");
}

function addRun(runs: TextRun[], run: TextRun): void {
  if (!run.text) return;
  const previous = runs[runs.length - 1];
  if (
    previous &&
    previous.bold === run.bold &&
    previous.italic === run.italic &&
    previous.strike === run.strike &&
    previous.code === run.code &&
    previous.math === run.math &&
    previous.link === run.link &&
    previous.color === run.color
  ) {
    previous.text += run.text;
  } else {
    runs.push(run);
  }
}

/** ASTのインライン要素を、PPTXでも利用できるテキストランへ変換する。 */
function parseInline(
  nodes: MarkdownNode[],
  style: Omit<TextRun, "text"> = {},
): TextRun[] {
  const result: TextRun[] = [];
  for (const node of nodes) {
    if (node.type === "text" || node.type === "inlineCode") {
      addRun(result, {
        ...style,
        text: node.value ?? "",
        code: style.code || node.type === "inlineCode",
      });
    } else if (node.type === "inlineMath") {
      addRun(result, { ...style, text: node.value ?? "", math: true });
    } else if (node.type === "break") {
      addRun(result, { ...style, text: "\n" });
    } else if (
      node.type === "strong" ||
      node.type === "emphasis" ||
      node.type === "delete" ||
      node.type === "link"
    ) {
      const nextStyle = {
        ...style,
        ...(node.type === "strong" ? { bold: true } : {}),
        ...(node.type === "emphasis" ? { italic: true } : {}),
        ...(node.type === "delete" ? { strike: true } : {}),
        ...(node.type === "link" ? { link: node.url } : {}),
      };
      for (const nested of parseInline(node.children ?? [], nextStyle))
        addRun(result, nested);
    } else if (node.children) {
      for (const nested of parseInline(node.children, style))
        addRun(result, nested);
    }
    // 未対応のHTMLタグなどは出力しない。任意のHTMLは描画しない。
  }
  return result;
}

function flattenList(node: MarkdownNode, depth = 0): ListLine[] {
  const lines: ListLine[] = [];
  const ordered = Boolean(node.ordered);
  let number = node.start ?? 1;
  for (const item of node.children ?? []) {
    const contentNodes = (item.children ?? []).filter(
      (child) => child.type !== "list",
    );
    const textNodes = contentNodes.flatMap(
      (child) => child.children ?? (child.type === "text" ? [child] : []),
    );
    lines.push({
      runs: parseInline(textNodes),
      depth: Math.min(depth, 4),
      ordered,
      number: ordered ? number : undefined,
    });
    number += 1;
    for (const child of item.children ?? []) {
      if (child.type === "list") lines.push(...flattenList(child, depth + 1));
    }
  }
  return lines;
}

function tableCell(node: MarkdownNode): TableCell {
  return { runs: parseInline(node.children ?? []) };
}

function parseNode(node: MarkdownNode): SlideElement | null {
  switch (node.type) {
    case "heading":
      return node.depth === 2
        ? { type: "subtitle", text: plainText(node) }
        : node.depth && node.depth >= 3 && node.depth <= 6
          ? {
              type: "heading",
              level: node.depth as 3 | 4 | 5 | 6,
              text: plainText(node),
            }
          : null;
    case "paragraph": {
      const runs = parseInline(node.children ?? []);
      return runs.length ? { type: "paragraph", runs } : null;
    }
    case "blockquote": {
      const runs: TextRun[] = [];
      for (const [index, child] of (node.children ?? []).entries()) {
        if (index !== 0) runs.push({ text: "\n" });
        runs.push(...parseInline(child.children ?? []));
      }
      return { type: "quote", runs };
    }
    case "list":
      return { type: "list", lines: flattenList(node) };
    case "code":
      return { type: "code", code: node.value ?? "", language: node.lang };
    case "math":
      return { type: "math", latex: node.value ?? "" };
    case "table": {
      const rows = (node.children ?? []).map((row) =>
        (row.children ?? []).map(tableCell),
      );
      return {
        type: "table",
        table: {
          headers: rows[0] ?? [],
          rows: rows.slice(1),
          alignments: (node.align ?? []).map((align) => align ?? "left"),
        },
      };
    }
    default:
      return null;
  }
}

const DIRECTIVE_ALIGNMENT = /^<!--\s*align\s*:\s*(left|center|right)\s*-->$/i;
const DIRECTIVE_GRID = /^<!--\s*(?:grid|grid-columns)\s*:\s*(\d+)\s*-->$/i;
const DIRECTIVE_SPACING = /^<!--\s*spacing\s*:\s*(\d+)\s*-->$/i;
const DIRECTIVE_ICON = /^<!--\s*icon\s*:\s*([a-z0-9_\-]+)\s*-->$/i;
const DIRECTIVE_COLUMN = /^<!--\s*(?:column|column-break)\s*-->$/i;
const DIRECTIVE_CARD_START = /^<!--\s*card:start\s*-->$/i;
const DIRECTIVE_CARD_END = /^<!--\s*card:end\s*-->$/i;

function isAlignable(
  element: SlideElement,
): element is Extract<SlideElement, { align?: TextAlignment }> {
  return [
    "subtitle",
    "heading",
    "paragraph",
    "quote",
    "math",
    "icon",
    "card",
  ].includes(element.type);
}

/** HTMLコメントを命令として扱う。任意のHTMLは無視し、XSSを避ける。 */
export function parseMarkdown(markdown: string): SlideData[] {
  const tree = processor.parse(markdown) as unknown as {
    children: MarkdownNode[];
  };
  const slides: SlideData[] = [];
  let current: SlideData = {
    id: "slide-1",
    title: "スライド 1",
    gridColumns: 1,
    elements: [],
  };
  let pendingAlignment: TextAlignment | null = null;
  let cardNodes: MarkdownNode[] | null = null;
  let sawContent = false;

  function pushSlide(): void {
    slides.push(current);
    current = {
      id: `slide-${slides.length + 1}`,
      title: `スライド ${slides.length + 1}`,
      gridColumns: 1,
      elements: [],
    };
    pendingAlignment = null;
    cardNodes = null;
    sawContent = false;
  }

  function addElement(element: SlideElement): void {
    if (pendingAlignment && isAlignable(element)) {
      current.elements.push({ ...element, align: pendingAlignment });
      pendingAlignment = null;
    } else {
      current.elements.push(element);
    }
    sawContent = true;
  }

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1) {
      if (sawContent || slides.length > 0 || current.title !== "スライド 1")
        pushSlide();
      current.title = plainText(node).trim() || `スライド ${slides.length + 1}`;
      sawContent = true;
      pendingAlignment = null;
      continue;
    }

    if (node.type === "html") {
      const directive = (node.value ?? "").trim();
      if (DIRECTIVE_CARD_START.test(directive)) {
        cardNodes = [];
        continue;
      }
      if (DIRECTIVE_CARD_END.test(directive)) {
        if (cardNodes !== null) {
          const runs: TextRun[] = [];
          for (const [index, child] of cardNodes.entries()) {
            if (index > 0) runs.push({ text: "\n" });
            runs.push(...parseInline(child.children ?? []));
          }
          addElement({ type: "card", runs });
          cardNodes = null;
        }
        continue;
      }
      const alignment = directive
        .match(DIRECTIVE_ALIGNMENT)?.[1]
        ?.toLowerCase();
      if (alignment) {
        pendingAlignment = alignment as TextAlignment;
        continue;
      }
      const columns = Number(directive.match(DIRECTIVE_GRID)?.[1]);
      if (columns >= 1 && columns <= 6) {
        current.gridColumns = columns;
        continue;
      }
      const spacingMatch = directive.match(DIRECTIVE_SPACING);
      if (spacingMatch) {
        addElement({
          type: "spacing",
          amount: Math.min(Number(spacingMatch[1]), 240),
        });
        continue;
      }
      if (DIRECTIVE_COLUMN.test(directive)) {
        addElement({ type: "columnBreak" });
        continue;
      }
      const icon = directive.match(DIRECTIVE_ICON)?.[1];
      if (icon) {
        addElement({ type: "icon", name: icon });
        continue;
      }
      continue;
    }
    if (cardNodes) {
      cardNodes.push(node);
      continue;
    }
    const element = parseNode(node);
    if (element) addElement(element);
  }
  if (sawContent || slides.length === 0) slides.push(current);
  return slides;
}

/** カラム区切りがある場合は優先し、ない場合は要素数で均等分配する。 */
export function splitSlideColumns(slide: SlideData): SlideElement[][] {
  const count = Math.max(1, Math.min(6, slide.gridColumns));
  const parts: SlideElement[][] = [[]];
  let hasExplicitBreak = false;
  for (const element of slide.elements) {
    if (element.type === "columnBreak") {
      hasExplicitBreak = true;
      parts.push([]);
    } else {
      parts[parts.length - 1].push(element);
    }
  }
  if (count === 1)
    return [slide.elements.filter((element) => element.type !== "columnBreak")];
  if (hasExplicitBreak)
    return Array.from({ length: count }, (_, index) => parts[index] ?? []);
  const elements = parts[0];
  const perColumn = Math.ceil(elements.length / count);
  return Array.from({ length: count }, (_, index) =>
    elements.slice(index * perColumn, (index + 1) * perColumn),
  );
}

/** テキストエディタでのカーソル位置に対応するスライド番号（0始まり）。 */
export function slideIndexAtCursor(markdown: string, cursor: number): number {
  const preceding = markdown.slice(0, cursor).split("\n");
  let count = 0;
  let fence = false;
  for (const line of preceding) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (!fence && /^#\s+/.test(line)) count += 1;
  }
  return Math.max(0, count - 1);
}
