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
      /**
       * 次のグリッド列へ移動する。
       * 画面やPPTXには直接表示しない。
       */
      type: "columnBreak";
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
