import {
  DEFAULT_PRESENTATION_SETTINGS,
  type PresentationSettings,
} from "../types/presentation";

import {
  normalizeFileName,
  normalizePresentationSettings,
} from "./presentationApp";

export type PresentationSettingsJson = {
  margin: number;
  gap: number;

  fontSize: {
    title: number;
    subTitle: number;
    text: number;
    code: number;
    formula: number;
  };

  color: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
    tableHeader: string;
  };

  pageNumber: {
    isEnabled: boolean;
    fontSize: number;
  };

  pageTitle: {
    isEnabled: boolean;

    title: {
      content: string;
      fontSize: number;
    };

    subTitle: {
      content: string;
      fontSize: number;
    };
  };
};

type UnknownRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getNumber(
  value: unknown,
  fallback: number,
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function getString(
  value: unknown,
  fallback: string,
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function getBoolean(
  value: unknown,
  fallback: boolean,
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

/**
 * アプリ内部のPresentationSettingsを、
 * 保存用JSON形式へ変換します。
 */
export function toPresentationSettingsJson(
  settings:
    PresentationSettings,
): PresentationSettingsJson {
  const normalizedSettings =
    normalizePresentationSettings(
      settings,
    );

  return {
    margin:
      normalizedSettings.marginPx,

    gap:
      normalizedSettings.contentGapPx,

    fontSize: {
      title:
        normalizedSettings.titleFontSizePx,

      subTitle:
        normalizedSettings.subtitleFontSizePx,

      text:
        normalizedSettings.bodyFontSizePx,

      code:
        normalizedSettings.codeFontSizePx,

      formula:
        normalizedSettings.mathFontSizePx,
    },

    color: {
      primary:
        normalizedSettings.primaryColor,

      secondary:
        normalizedSettings.secondaryColor,

      text:
        normalizedSettings.textColor,

      accent:
        normalizedSettings.accentColor,

      tableHeader:
        normalizedSettings.tableHeaderColor,
    },

    pageNumber: {
      isEnabled:
        normalizedSettings.showPageNumber,

      fontSize:
        normalizedSettings.pageNumberFontSizePx,
    },

    pageTitle: {
      isEnabled:
        normalizedSettings.includeTitleSlide,

      title: {
        content:
          normalizedSettings.titlePageTitle,

        fontSize:
          normalizedSettings
            .titlePageTitleFontSizePx,
      },

      subTitle: {
        content:
          normalizedSettings
            .titlePageSubtitle,

        fontSize:
          normalizedSettings
            .titlePageSubtitleFontSizePx,
      },
    },
  };
}

/**
 * 保存用JSON形式を、
 * アプリ内部のPresentationSettingsへ変換します。
 *
 * 不足項目や型が不正な項目には
 * DEFAULT_PRESENTATION_SETTINGSを使用します。
 */
export function fromPresentationSettingsJson(
  value: unknown,
): PresentationSettings {
  if (!isRecord(value)) {
    throw new Error(
      "設定ファイルの内容が正しくありません。",
    );
  }

  const fontSize =
    isRecord(value.fontSize)
      ? value.fontSize
      : {};

  const color =
    isRecord(value.color)
      ? value.color
      : {};

  const pageNumber =
    isRecord(value.pageNumber)
      ? value.pageNumber
      : {};

  const pageTitle =
    isRecord(value.pageTitle)
      ? value.pageTitle
      : {};

  const pageTitleTitle =
    isRecord(pageTitle.title)
      ? pageTitle.title
      : {};

  const pageTitleSubTitle =
    isRecord(pageTitle.subTitle)
      ? pageTitle.subTitle
      : {};

  const settings:
    PresentationSettings = {
    marginPx:
      getNumber(
        value.margin,
        DEFAULT_PRESENTATION_SETTINGS
          .marginPx,
      ),

    contentGapPx:
      getNumber(
        value.gap,
        DEFAULT_PRESENTATION_SETTINGS
          .contentGapPx,
      ),

    titleFontSizePx:
      getNumber(
        fontSize.title,
        DEFAULT_PRESENTATION_SETTINGS
          .titleFontSizePx,
      ),

    subtitleFontSizePx:
      getNumber(
        fontSize.subTitle,
        DEFAULT_PRESENTATION_SETTINGS
          .subtitleFontSizePx,
      ),

    bodyFontSizePx:
      getNumber(
        fontSize.text,
        DEFAULT_PRESENTATION_SETTINGS
          .bodyFontSizePx,
      ),

    codeFontSizePx:
      getNumber(
        fontSize.code,
        DEFAULT_PRESENTATION_SETTINGS
          .codeFontSizePx,
      ),

    mathFontSizePx:
      getNumber(
        fontSize.formula,
        DEFAULT_PRESENTATION_SETTINGS
          .mathFontSizePx,
      ),

    primaryColor:
      getString(
        color.primary,
        DEFAULT_PRESENTATION_SETTINGS
          .primaryColor,
      ),

    secondaryColor:
      getString(
        color.secondary,
        DEFAULT_PRESENTATION_SETTINGS
          .secondaryColor,
      ),

    textColor:
      getString(
        color.text,
        DEFAULT_PRESENTATION_SETTINGS
          .textColor,
      ),

    accentColor:
      getString(
        color.accent,
        DEFAULT_PRESENTATION_SETTINGS
          .accentColor,
      ),

    tableHeaderColor:
      getString(
        color.tableHeader,
        DEFAULT_PRESENTATION_SETTINGS
          .tableHeaderColor,
      ),

    showPageNumber:
      getBoolean(
        pageNumber.isEnabled,
        DEFAULT_PRESENTATION_SETTINGS
          .showPageNumber,
      ),

    pageNumberFontSizePx:
      getNumber(
        pageNumber.fontSize,
        DEFAULT_PRESENTATION_SETTINGS
          .pageNumberFontSizePx,
      ),

    includeTitleSlide:
      getBoolean(
        pageTitle.isEnabled,
        DEFAULT_PRESENTATION_SETTINGS
          .includeTitleSlide,
      ),

    titlePageTitle:
      getString(
        pageTitleTitle.content,
        DEFAULT_PRESENTATION_SETTINGS
          .titlePageTitle,
      ),

    titlePageTitleFontSizePx:
      getNumber(
        pageTitleTitle.fontSize,
        DEFAULT_PRESENTATION_SETTINGS
          .titlePageTitleFontSizePx,
      ),

    titlePageSubtitle:
      getString(
        pageTitleSubTitle.content,
        DEFAULT_PRESENTATION_SETTINGS
          .titlePageSubtitle,
      ),

    titlePageSubtitleFontSizePx:
      getNumber(
        pageTitleSubTitle.fontSize,
        DEFAULT_PRESENTATION_SETTINGS
          .titlePageSubtitleFontSizePx,
      ),
  };

  return normalizePresentationSettings(
    settings,
  );
}

/**
 * 現在の設定をJSON文字列へ変換します。
 */
export function serializePresentationSettings(
  settings:
    PresentationSettings,
): string {
  return JSON.stringify(
    toPresentationSettingsJson(
      settings,
    ),
    null,
    2,
  );
}

/**
 * JSON文字列を解析し、
 * PresentationSettingsへ変換します。
 */
export function parsePresentationSettingsJson(
  jsonText: string,
): PresentationSettings {
  let parsedValue: unknown;

  try {
    parsedValue =
      JSON.parse(jsonText);
  } catch {
    throw new Error(
      "JSONの形式が正しくありません。",
    );
  }

  return fromPresentationSettingsJson(
    parsedValue,
  );
}

/**
 * 設定をJSONファイルとして保存します。
 */
export function downloadPresentationSettings(
  settings:
    PresentationSettings,
  fileName: string,
): void {
  const jsonText =
    serializePresentationSettings(
      settings,
    );

  const blob =
    new Blob(
      [jsonText],
      {
        type:
          "application/json;charset=utf-8",
      },
    );

  const objectUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  const normalizedFileName =
    normalizeFileName(
      fileName,
    );

  link.href =
    objectUrl;

  link.download =
    `${normalizedFileName}.settings.json`;

  document.body.appendChild(
    link,
  );

  link.click();
  link.remove();

  URL.revokeObjectURL(
    objectUrl,
  );
}