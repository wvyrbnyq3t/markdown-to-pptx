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
 * 1つのリスト項目。
 *
 * childrenには、この項目の下にある
 * ネストされたリストが入る。
 */
export type MarkdownListItem = {
  runs: InlineContent[];
  children: MarkdownList[];
};

/**
 * 箇条書き・番号付きリストの共通構造。
 */
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
    };

export type SlideData = {
  id: string;
  title: string;
  elements: SlideElement[];
};
