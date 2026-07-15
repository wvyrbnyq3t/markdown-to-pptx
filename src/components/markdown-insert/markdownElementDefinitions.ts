import type { MarkdownInsertion } from "../../utils/insertMarkdown";

export type MarkdownElementCategoryId =
  | "slide"
  | "text"
  | "list"
  | "decoration"
  | "advanced";

export type MarkdownElementCategory = {
  id: MarkdownElementCategoryId;
  label: string;
  description: string;
};

export type MarkdownElementDefinition = {
  id: string;
  categoryId: MarkdownElementCategoryId;

  /**
   * シート上に表示する簡易アイコン。
   */
  symbol: string;

  label: string;
  description: string;

  /**
   * ユーザー向けに表示するMarkdown例。
   */
  syntax: string;

  /**
   * 選択中の文字から挿入内容を生成します。
   */
  createInsertion: (selectedText: string) => MarkdownInsertion;
};

export const MARKDOWN_ELEMENT_CATEGORIES: readonly MarkdownElementCategory[] = [
  {
    id: "slide",
    label: "スライド",
    description: "ページやレイアウトを追加します。",
  },
  {
    id: "text",
    label: "文章",
    description: "見出しや本文を追加します。",
  },
  {
    id: "list",
    label: "リスト",
    description: "項目を一覧で表示します。",
  },
  {
    id: "decoration",
    label: "文字装飾",
    description: "選択した文字を装飾します。",
  },
  {
    id: "advanced",
    label: "その他",
    description: "コードや数式を追加します。",
  },
];

function hasSelectedText(selectedText: string): boolean {
  return selectedText.trim().length > 0;
}

function normalizeSelectedText(selectedText: string): string {
  return selectedText.trim();
}

function createSelectionInsertion(
  text: string,
  selectedValue: string,
  block = true,
): MarkdownInsertion {
  const foundIndex = text.indexOf(selectedValue);

  const selectionStartOffset = foundIndex >= 0 ? foundIndex : text.length;

  return {
    text,
    block,
    selectionStartOffset,

    selectionEndOffset: selectionStartOffset + selectedValue.length,
  };
}

function createWrappedInsertion(
  selectedText: string,
  before: string,
  placeholder: string,
  after: string,
): MarkdownInsertion {
  const content = hasSelectedText(selectedText) ? selectedText : placeholder;

  return {
    text: before + content + after,

    block: false,

    selectionStartOffset: before.length,

    selectionEndOffset: before.length + content.length,
  };
}

function createNewSlideInsertion(selectedText: string): MarkdownInsertion {
  const hasSelection = hasSelectedText(selectedText);

  const title = hasSelection
    ? normalizeSelectedText(selectedText).replace(/\s+/g, " ")
    : "スライドタイトル";

  const bodyPlaceholder = "本文を入力";

  const text = [`# ${title}`, "", bodyPlaceholder].join("\n");

  /*
   * 文字が選択されていた場合は、
   * その文字をタイトルにして本文へ移動します。
   */
  return createSelectionInsertion(text, hasSelection ? bodyPlaceholder : title);
}

function getGridColumnLabels(columns: number): string[] {
  if (columns === 2) {
    return ["左側", "右側"];
  }

  if (columns === 3) {
    return ["左側", "中央", "右側"];
  }

  return Array.from(
    {
      length: columns,
    },
    (_, index) => `${index + 1}列目`,
  );
}

function createGridInsertion(
  selectedText: string,
  columns: number,
): MarkdownInsertion {
  const hasSelection = hasSelectedText(selectedText);

  const labels = getGridColumnLabels(columns);

  const contents = labels.map((label, index) => {
    if (index === 0 && hasSelection) {
      return normalizeSelectedText(selectedText);
    }

    return `${label}の内容`;
  });

  const lines: string[] = [`<!-- grid: ${columns} -->`, ""];

  labels.forEach((label, index) => {
    lines.push(`## ${label}`, "", contents[index] ?? `${label}の内容`);

    if (index < labels.length - 1) {
      lines.push("", "<!-- column -->", "");
    }
  });

  const text = lines.join("\n");

  /*
   * 選択中の文章を1列目へ入れた場合は、
   * 2列目の仮テキストを選択します。
   */
  const selectionTarget =
    hasSelection && contents.length > 1 ? contents[1] : contents[0];

  return createSelectionInsertion(text, selectionTarget ?? text);
}

function createHeadingInsertion(
  selectedText: string,
  prefix: string,
  placeholder: string,
): MarkdownInsertion {
  const content = hasSelectedText(selectedText)
    ? normalizeSelectedText(selectedText)
    : placeholder;

  const text = `${prefix} ${content}`;

  return createSelectionInsertion(text, content);
}

function createParagraphInsertion(selectedText: string): MarkdownInsertion {
  const content = hasSelectedText(selectedText)
    ? normalizeSelectedText(selectedText)
    : "本文を入力";

  return createSelectionInsertion(content, content);
}

function createQuoteInsertion(selectedText: string): MarkdownInsertion {
  const source = hasSelectedText(selectedText)
    ? normalizeSelectedText(selectedText)
    : "引用文を入力";

  const lines = source.split(/\r?\n/);

  const text = lines
    .map((line) => {
      return `> ${line}`;
    })
    .join("\n");

  if (lines.length === 1) {
    return {
      text,
      block: true,
      selectionStartOffset: 2,
      selectionEndOffset: 2 + source.length,
    };
  }

  return {
    text,
    block: true,
    selectionStartOffset: 0,
    selectionEndOffset: text.length,
  };
}

function createBulletListInsertion(selectedText: string): MarkdownInsertion {
  if (hasSelectedText(selectedText)) {
    const text = normalizeSelectedText(selectedText)
      .split(/\r?\n/)
      .filter((line) => {
        return line.trim().length > 0;
      })
      .map((line) => {
        const cleanedLine = line.replace(/^\s*[-*+]\s+/, "");

        return `- ${cleanedLine}`;
      })
      .join("\n");

    return {
      text,
      block: true,
      selectionStartOffset: 0,
      selectionEndOffset: text.length,
    };
  }

  const text = ["- 項目1", "- 項目2"].join("\n");

  return createSelectionInsertion(text, "項目1");
}

function createOrderedListInsertion(selectedText: string): MarkdownInsertion {
  if (hasSelectedText(selectedText)) {
    const text = normalizeSelectedText(selectedText)
      .split(/\r?\n/)
      .filter((line) => {
        return line.trim().length > 0;
      })
      .map((line, index) => {
        const cleanedLine = line.replace(/^\s*\d+\.\s+/, "");

        return `${index + 1}. ` + cleanedLine;
      })
      .join("\n");

    return {
      text,
      block: true,
      selectionStartOffset: 0,
      selectionEndOffset: text.length,
    };
  }

  const text = ["1. 項目1", "2. 項目2"].join("\n");

  return createSelectionInsertion(text, "項目1");
}

function createLinkInsertion(selectedText: string): MarkdownInsertion {
  const hasSelection = hasSelectedText(selectedText);

  const label = hasSelection ? selectedText : "リンクの文字";

  const url = "https://example.com";

  const text = `[${label}](${url})`;

  /*
   * 文字を選択済みならURLを選択します。
   * 未選択ならリンク文字を選択します。
   */
  const selectedValue = hasSelection ? url : label;

  return createSelectionInsertion(text, selectedValue, false);
}

function createCodeInsertion(selectedText: string): MarkdownInsertion {
  const content = hasSelectedText(selectedText) ? selectedText : "コードを入力";

  const firstLine = "```text";

  const text = [firstLine, content, "```"].join("\n");

  const contentStart = firstLine.length + 1;

  return {
    text,
    block: true,

    selectionStartOffset: contentStart,

    selectionEndOffset: contentStart + content.length,
  };
}

function createInlineMathInsertion(selectedText: string): MarkdownInsertion {
  return createWrappedInsertion(selectedText, "$", "x + y", "$");
}

function createBlockMathInsertion(selectedText: string): MarkdownInsertion {
  const content = hasSelectedText(selectedText) ? selectedText : "x = y";

  const text = ["$$", content, "$$"].join("\n");

  return {
    text,
    block: true,
    selectionStartOffset: 3,
    selectionEndOffset: 3 + content.length,
  };
}

const GRID_ELEMENT_DEFINITIONS: readonly MarkdownElementDefinition[] =
  Array.from(
    {
      length: 2,
    },
    (_, index) => {
      const columns = index + 2;

      return {
        id: `${columns}-columns`,

        categoryId: "slide",

        symbol: `${columns}`,

        label: `${columns}列レイアウト`,

        description: `内容を横方向に${columns}列で並べます。`,

        syntax: `<!-- grid: ${columns} -->`,

        createInsertion: (selectedText) => {
          return createGridInsertion(selectedText, columns);
        },
      };
    },
  );

export const MARKDOWN_ELEMENTS: readonly MarkdownElementDefinition[] = [
  {
    id: "new-slide",
    categoryId: "slide",
    symbol: "▭",
    label: "新しいスライド",
    description: "次のページを追加します。",
    syntax: "# スライドタイトル",
    createInsertion: createNewSlideInsertion,
  },

  ...GRID_ELEMENT_DEFINITIONS,

  {
    id: "column-break",
    categoryId: "slide",
    symbol: "→",
    label: "次の列",
    description: "グリッドの次の列へ移動します。",
    syntax: "<!-- column -->",
    createInsertion: () => {
      const text = "<!-- column -->";

      return {
        text,
        block: true,

        selectionStartOffset: text.length,

        selectionEndOffset: text.length,
      };
    },
  },
  {
    id: "subtitle",
    categoryId: "text",
    symbol: "H2",
    label: "小見出し",
    description: "スライド内の小見出しを追加します。",
    syntax: "## 小見出し",
    createInsertion: (selectedText) => {
      return createHeadingInsertion(selectedText, "##", "小見出し");
    },
  },
  {
    id: "content-heading",
    categoryId: "text",
    symbol: "H3",
    label: "コンテンツ見出し",
    description: "本文中の見出しを追加します。",
    syntax: "### 見出し",
    createInsertion: (selectedText) => {
      return createHeadingInsertion(selectedText, "###", "見出し");
    },
  },
  {
    id: "paragraph",
    categoryId: "text",
    symbol: "T",
    label: "本文",
    description: "通常の文章を追加します。",
    syntax: "本文を入力",
    createInsertion: createParagraphInsertion,
  },
  {
    id: "quote",
    categoryId: "text",
    symbol: "“",
    label: "引用",
    description: "引用として目立たせます。",
    syntax: "> 引用文",
    createInsertion: createQuoteInsertion,
  },
  {
    id: "bullet-list",
    categoryId: "list",
    symbol: "•",
    label: "箇条書き",
    description: "項目を箇条書きにします。",
    syntax: "- 項目",
    createInsertion: createBulletListInsertion,
  },
  {
    id: "ordered-list",
    categoryId: "list",
    symbol: "1.",
    label: "番号付きリスト",
    description: "項目へ順番を付けます。",
    syntax: "1. 項目",
    createInsertion: createOrderedListInsertion,
  },
  {
    id: "bold",
    categoryId: "decoration",
    symbol: "B",
    label: "太字",
    description: "文字を太く表示します。",
    syntax: "**太字**",
    createInsertion: (selectedText) => {
      return createWrappedInsertion(selectedText, "**", "太字", "**");
    },
  },
  {
    id: "italic",
    categoryId: "decoration",
    symbol: "I",
    label: "斜体",
    description: "文字を斜体で表示します。",
    syntax: "*斜体*",
    createInsertion: (selectedText) => {
      return createWrappedInsertion(selectedText, "*", "斜体", "*");
    },
  },
  {
    id: "accent",
    categoryId: "decoration",
    symbol: "A",
    label: "強調色",
    description: "アクセントカラーで強調します。",
    syntax: "==強調する文字==",
    createInsertion: (selectedText) => {
      return createWrappedInsertion(selectedText, "==", "強調する文字", "==");
    },
  },
  {
    id: "link",
    categoryId: "decoration",
    symbol: "↗",
    label: "リンク",
    description: "クリックできるリンクを追加します。",
    syntax: "[文字](https://example.com)",
    createInsertion: createLinkInsertion,
  },
  {
    id: "code",
    categoryId: "advanced",
    symbol: "</>",
    label: "コードブロック",
    description: "プログラムのコードを追加します。",
    syntax: "```text",
    createInsertion: createCodeInsertion,
  },
  {
    id: "inline-math",
    categoryId: "advanced",
    symbol: "x",
    label: "インライン数式",
    description: "文章の途中へ数式を追加します。",
    syntax: "$x + y$",
    createInsertion: createInlineMathInsertion,
  },
  {
    id: "block-math",
    categoryId: "advanced",
    symbol: "Σ",
    label: "ブロック数式",
    description: "大きな数式を中央に表示します。",
    syntax: "$$ x = y $$",
    createInsertion: createBlockMathInsertion,
  },
];
