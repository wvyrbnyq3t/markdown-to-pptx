import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { v4 as uuidv4 } from "uuid";

import type { Root } from "mdast";

import type {
  ContentHeadingLevel,
  InlineContent,
  InlineStyle,
  MarkdownList,
  MarkdownListItem,
  QuoteLine,
  SlideData,
  SlideElement,
  SlideGridColumns,
} from "../../types/slide";

type GenericNode = {
  type: string;
  value?: string;
  url?: string;
  title?: string | null;
  alt?: string | null;
  depth?: number;
  children?: GenericNode[];
  lang?: string | null;

  ordered?: boolean | null;
  start?: number | null;
};

function createSlide(title = ""): SlideData {
  return {
    id: uuidv4(),
    title,
    gridColumns: 1,
    elements: [],
  };
}

function parseGridColumnsDirective(
  value: string | undefined,
): SlideGridColumns | null {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^<!--\s*grid\s*:\s*([123])\s*-->$/i);

  if (!match) {
    return null;
  }

  const columns = Number(match[1]);

  if (columns === 1 || columns === 2 || columns === 3) {
    return columns;
  }

  return null;
}

function isColumnBreakDirective(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^<!--\s*column\s*-->$/i.test(value.trim());
}

function isContentHeadingLevel(
  depth: number | undefined,
): depth is ContentHeadingLevel {
  return depth === 3 || depth === 4 || depth === 5 || depth === 6;
}

function getNodeText(node: GenericNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  return (node.children ?? []).map(getNodeText).join("");
}

function hasSameStyle(first: InlineContent, second: InlineContent): boolean {
  return (
    first.bold === second.bold &&
    first.italic === second.italic &&
    first.accent === second.accent &&
    first.link === second.link &&
    first.linkTitle === second.linkTitle
  );
}

function mergeInlineRuns(runs: InlineContent[]): InlineContent[] {
  const merged: InlineContent[] = [];

  for (const run of runs) {
    const previous = merged.at(-1);

    if (
      run.type === "text" &&
      previous?.type === "text" &&
      hasSameStyle(previous, run)
    ) {
      previous.text += run.text;
      continue;
    }

    merged.push(run);
  }

  return merged;
}

function splitAccentText(
  text: string,
  inheritedStyle: InlineStyle,
): InlineContent[] {
  const runs: InlineContent[] = [];

  const accentPattern = /==([\s\S]+?)==/g;

  let previousIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = accentPattern.exec(text)) !== null) {
    /*
     * アクセント部分より前の通常テキスト。
     */
    if (match.index > previousIndex) {
      runs.push({
        type: "text",
        text: text.slice(previousIndex, match.index),
        ...inheritedStyle,
      });
    }

    /*
     * ==...==で囲まれた部分。
     */
    runs.push({
      type: "text",
      text: match[1],
      ...inheritedStyle,
      accent: true,
    });

    previousIndex = match.index + match[0].length;
  }

  /*
   * 最後のアクセント部分より後にある
   * 通常テキスト。
   */
  if (previousIndex < text.length) {
    runs.push({
      type: "text",
      text: text.slice(previousIndex),
      ...inheritedStyle,
    });
  }

  /*
   * ==...==が存在しない場合。
   */
  if (runs.length === 0) {
    return [
      {
        type: "text",
        text,
        ...inheritedStyle,
      },
    ];
  }

  return runs;
}

function parseInlineNode(
  node: GenericNode,
  inheritedStyle: InlineStyle = {},
): InlineContent[] {
  switch (node.type) {
    case "text":
      return splitAccentText(node.value ?? "", inheritedStyle);

    case "inlineMath":
      return [
        {
          type: "math",
          latex: node.value ?? "",
          ...inheritedStyle,
        },
      ];

    case "inlineCode":
      return [
        {
          type: "text",
          text: node.value ?? "",
          ...inheritedStyle,
        },
      ];

    case "break":
      return [
        {
          type: "text",
          text: "\n",
          ...inheritedStyle,
        },
      ];

    case "strong":
      return (node.children ?? []).flatMap((child) =>
        parseInlineNode(child, {
          ...inheritedStyle,
          bold: true,
        }),
      );

    case "emphasis":
      return (node.children ?? []).flatMap((child) =>
        parseInlineNode(child, {
          ...inheritedStyle,
          italic: true,
        }),
      );

    case "link":
      return (node.children ?? []).flatMap((child) =>
        parseInlineNode(child, {
          ...inheritedStyle,
          link: node.url ?? "",
          linkTitle: node.title ?? undefined,
        }),
      );

    case "image":
      return [
        {
          type: "text",
          text: node.alt ?? "",
          ...inheritedStyle,
        },
      ];

    default:
      return (node.children ?? []).flatMap((child) =>
        parseInlineNode(child, inheritedStyle),
      );
  }
}

function parseInlineChildren(children: GenericNode[] = []): InlineContent[] {
  return mergeInlineRuns(children.flatMap((child) => parseInlineNode(child)));
}

function parseMarkdownListItem(node: GenericNode): MarkdownListItem {
  const runs: InlineContent[] = [];
  const children: MarkdownList[] = [];

  for (const child of node.children ?? []) {
    /*
     * リスト項目の本文。
     */
    if (child.type === "paragraph") {
      const paragraphRuns = parseInlineChildren(child.children);

      /*
       * 1つのリスト項目に複数段落がある場合は、
       * 改行でつなぐ。
       */
      if (runs.length > 0 && paragraphRuns.length > 0) {
        runs.push({
          type: "text",
          text: "\n",
        });
      }

      runs.push(...paragraphRuns);

      continue;
    }

    /*
     * リスト項目内にあるlistは
     * 子リストとして再帰的に解析する。
     */
    if (child.type === "list") {
      children.push(parseMarkdownList(child));
    }
  }

  return {
    runs: mergeInlineRuns(runs),
    children,
  };
}

function parseMarkdownList(node: GenericNode): MarkdownList {
  const items = (node.children ?? [])
    .filter((child) => child.type === "listItem")
    .map(parseMarkdownListItem);

  return {
    ordered: node.ordered === true,

    start: node.ordered === true ? (node.start ?? 1) : 1,

    items,
  };
}

function parseQuoteLines(node: GenericNode, depth = 1): QuoteLine[] {
  const lines: QuoteLine[] = [];

  for (const child of node.children ?? []) {
    if (child.type === "paragraph") {
      lines.push({
        depth,
        runs: parseInlineChildren(child.children),
      });

      continue;
    }

    if (child.type === "blockquote") {
      lines.push(...parseQuoteLines(child, depth + 1));

      continue;
    }

    /*
     * 引用内に見出しなどが書かれた場合も、
     * 引用文として表示する。
     */
    if (child.children) {
      lines.push({
        depth,
        runs: parseInlineChildren(child.children),
      });
    }
  }

  return lines;
}

function parseElement(node: GenericNode): SlideElement | null {
  if (node.type === "heading" && node.depth === 2) {
    return {
      type: "subtitle",
      text: getNodeText(node),
    };
  }

  if (node.type === "heading" && isContentHeadingLevel(node.depth)) {
    return {
      type: "contentHeading",
      text: getNodeText(node),
      level: node.depth,
    };
  }

  if (node.type === "paragraph") {
    const children = node.children ?? [];

    if (children.length === 1 && children[0].type === "image") {
      return {
        type: "image",
        src: children[0].url ?? "",
        alt: children[0].alt ?? "",
      };
    }

    return {
      type: "paragraph",
      runs: parseInlineChildren(children),
    };
  }

  if (node.type === "list") {
    return {
      type: "list",
      list: parseMarkdownList(node),
    };
  }

  if (node.type === "blockquote") {
    return {
      type: "quote",
      lines: parseQuoteLines(node),
    };
  }

  if (node.type === "code") {
    return {
      type: "code",
      language: node.lang ?? undefined,
      code: node.value ?? "",
    };
  }

  if (node.type === "math") {
    return {
      type: "math",
      latex: node.value ?? "",
    };
  }

  return null;
}

export function parseMarkdown(markdown: string): SlideData[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .parse(markdown) as Root;

  const slides: SlideData[] = [];

  let currentSlide: SlideData | null = null;

  for (const originalNode of tree.children) {
    const node = originalNode as unknown as GenericNode;

    if (node.type === "heading" && node.depth === 1) {
      if (currentSlide) {
        slides.push(currentSlide);
      }

      currentSlide = createSlide(getNodeText(node));

      continue;
    }

    if (!currentSlide) {
      currentSlide = createSlide();
    }

    /*
     * <!-- grid: 2 -->
     * <!-- grid: 3 -->
     */
    if (node.type === "html") {
      const gridColumns = parseGridColumnsDirective(node.value);

      if (gridColumns !== null) {
        currentSlide.gridColumns = gridColumns;

        continue;
      }

      /*
       * <!-- column -->
       */
      if (isColumnBreakDirective(node.value)) {
        currentSlide.elements.push({
          type: "columnBreak",
        });

        continue;
      }
    }

    const element = parseElement(node);

    if (element) {
      currentSlide.elements.push(element);
    }
  }

  if (currentSlide) {
    slides.push(currentSlide);
  }

  return slides;
}
