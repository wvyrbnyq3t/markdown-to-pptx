export type PresentationSettings = {
  marginPx: number;

  /**
   * コンテンツ部分の通常要素間の余白。
   */
  contentGapPx: number;

  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;

  titleFontSizePx: number;
  subtitleFontSizePx: number;
  bodyFontSizePx: number;
  codeFontSizePx: number;
  mathFontSizePx: number;

  showPageNumber: boolean;
  pageNumberFontSizePx: number;

  includeTitleSlide: boolean;
  titlePageTitle: string;
  titlePageSubtitle: string;
  titlePageTitleFontSizePx: number;
  titlePageSubtitleFontSizePx: number;
};

export const DEFAULT_PRESENTATION_SETTINGS: PresentationSettings = {
  marginPx: 64,

  /*
   * コンテンツ要素間の初期余白。
   */
  contentGapPx: 8,

  primaryColor: "#2563EB",
  secondaryColor: "#FFFFFF",
  textColor: "#334155",
  accentColor: "#F97316",

  titleFontSizePx: 56,
  subtitleFontSizePx: 40,
  bodyFontSizePx: 34,
  codeFontSizePx: 26,
  mathFontSizePx: 48,

  showPageNumber: true,
  pageNumberFontSizePx: 20,

  includeTitleSlide: true,
  titlePageTitle: "プレゼンテーション",
  titlePageSubtitle: "",
  titlePageTitleFontSizePx: 96,
  titlePageSubtitleFontSizePx: 36,
};
