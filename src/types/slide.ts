/** PowerPointとプレビューで共有する、中間データの型定義。 */
export type TextAlignment = "left" | "center" | "right";

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  code?: boolean;
  math?: boolean;
  link?: string;
  color?: "accent";
}

export interface ListLine {
  runs: TextRun[];
  depth: number;
  ordered: boolean;
  number?: number;
}

export interface TableCell {
  runs: TextRun[];
}

export interface TableData {
  headers: TableCell[];
  rows: TableCell[][];
  alignments: TextAlignment[];
}

export type SlideElement =
  | { type: "subtitle"; text: string; align?: TextAlignment }
  | { type: "heading"; text: string; level: 3 | 4 | 5 | 6; align?: TextAlignment }
  | { type: "paragraph"; runs: TextRun[]; align?: TextAlignment }
  | { type: "list"; lines: ListLine[] }
  | { type: "quote"; runs: TextRun[]; align?: TextAlignment }
  | { type: "code"; code: string; language?: string }
  | { type: "image"; assetId: string; alt: string; align?: TextAlignment }
  | { type: "math"; latex: string; inline?: boolean; align?: TextAlignment }
  | { type: "table"; table: TableData }
  | { type: "icon"; name: string; align?: TextAlignment }
  | { type: "card"; runs: TextRun[]; align?: TextAlignment }
  | { type: "spacing"; amount: number }
  | { type: "columnBreak" };

export interface SlideData {
  id: string;
  title: string;
  gridColumns: number;
  elements: SlideElement[];
}

export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;
