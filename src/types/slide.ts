export type InlineStyle = {
  accent?: boolean;
  bold?: boolean;
  italic?: boolean;
  link?: string;
  linkTitle?: string;
};

export type InlineContent = (
  | {
      type: "text";
      text: string;
    }
  | {
      type: "math";
      latex: string;
    }
) &
  InlineStyle;

export type ContentHeadingLevel = 3 | 4 | 5 | 6;

/**
 * スライドの横方向の分割数。
 */
export type SlideGridColumns = number;

export type MarkdownListItem = {
  runs: InlineContent[];
  children: MarkdownList[];
};

export type MarkdownList = {
  ordered: boolean;
  start: number;
  items: MarkdownListItem[];
};

export type QuoteLine = {
  depth: number;
  runs: InlineContent[];
};

export type SlideElement =
  | {
      type: "subtitle";
      text: string;
    }
  | {
      type: "contentHeading";
      text: string;
      level: ContentHeadingLevel;
    }
  | {
      type: "paragraph";
      runs: InlineContent[];
    }
  | {
      type: "list";
      list: MarkdownList;
    }
  | {
      type: "quote";
      lines: QuoteLine[];
    }
  | {
      type: "code";
      language?: string;
      code: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
    }
  | {
      type: "math";
      latex: string;
    }
  | {
      type: "table";
      table: MarkdownTable;
    }
  | {
      type: "columnBreak";
    }
  | {
      type: "spacing";
      size: number;
    };

export type SlideData = {
  id: string;
  title: string;

  /**
   * 1列、2列、3列のいずれか。
   */
  gridColumns: SlideGridColumns;

  elements: SlideElement[];
};

export type TableAlignment = "left" | "center" | "right" | null;

export type MarkdownTableCell = {
  runs: InlineContent[];
};

export type MarkdownTableRow = {
  cells: MarkdownTableCell[];
};

export type MarkdownTable = {
  alignments: TableAlignment[];
  rows: MarkdownTableRow[];
};
