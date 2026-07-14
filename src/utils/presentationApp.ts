import type { CSSProperties } from "react";

import {
  DEFAULT_PRESENTATION_SETTINGS,
  type PresentationSettings,
} from "../types/presentation";

export type SlideStyle = CSSProperties & Record<`--${string}`, string>;

export function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function normalizeHexColor(value: string, fallback: string): string {
  const normalized = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `#${normalized.toUpperCase()}`;
  }

  return fallback.toUpperCase();
}

export function normalizeFileName(fileName: string): string {
  const normalized = fileName
    .trim()
    .replace(/\.pptx$/i, "")
    .replace(/[\\/:*?"<>|]/g, "_");

  return normalized || "presentation";
}

export function createSlideStyle(
  settings: PresentationSettings,
): SlideStyle {
  const primaryColor = normalizeHexColor(
    settings.primaryColor,
    DEFAULT_PRESENTATION_SETTINGS.primaryColor,
  );
  const secondaryColor = normalizeHexColor(
    settings.secondaryColor,
    DEFAULT_PRESENTATION_SETTINGS.secondaryColor,
  );
  const textColor = normalizeHexColor(
    settings.textColor,
    DEFAULT_PRESENTATION_SETTINGS.textColor,
  );
  const accentColor = normalizeHexColor(
    settings.accentColor,
    DEFAULT_PRESENTATION_SETTINGS.accentColor,
  );

  return {
    "--slide-margin": `${settings.marginPx}px`,
    "--slide-content-gap": `${settings.contentGapPx}px`,
    "--slide-primary-color": primaryColor,
    "--slide-secondary-color": secondaryColor,
    "--slide-text-color": textColor,
    "--slide-accent-color": accentColor,
    "--slide-title-font-size": `${settings.titleFontSizePx}px`,
    "--slide-subtitle-font-size": `${settings.subtitleFontSizePx}px`,
    "--slide-body-font-size": `${settings.bodyFontSizePx}px`,
    "--slide-content-heading-font-size": `${settings.bodyFontSizePx * 1.25}px`,
    "--slide-code-font-size": `${settings.codeFontSizePx}px`,
    "--slide-math-font-size": `${settings.mathFontSizePx}px`,
    "--slide-page-number-font-size": `${settings.pageNumberFontSizePx}px`,
    "--title-page-title-font-size": `${settings.titlePageTitleFontSizePx}px`,
    "--title-page-subtitle-font-size": `${settings.titlePageSubtitleFontSizePx}px`,
  };
}

export function normalizePresentationSettings(
  settings: PresentationSettings,
): PresentationSettings {
  return {
    ...settings,
    marginPx: clamp(settings.marginPx, 0, 240),
    contentGapPx: clamp(settings.contentGapPx, 0, 256),
    primaryColor: normalizeHexColor(
      settings.primaryColor,
      DEFAULT_PRESENTATION_SETTINGS.primaryColor,
    ),
    secondaryColor: normalizeHexColor(
      settings.secondaryColor,
      DEFAULT_PRESENTATION_SETTINGS.secondaryColor,
    ),
    textColor: normalizeHexColor(
      settings.textColor,
      DEFAULT_PRESENTATION_SETTINGS.textColor,
    ),
    accentColor: normalizeHexColor(
      settings.accentColor,
      DEFAULT_PRESENTATION_SETTINGS.accentColor,
    ),
    titleFontSizePx: clamp(settings.titleFontSizePx, 24, 120),
    subtitleFontSizePx: clamp(settings.subtitleFontSizePx, 20, 96),
    bodyFontSizePx: clamp(settings.bodyFontSizePx, 16, 72),
    codeFontSizePx: clamp(settings.codeFontSizePx, 14, 56),
    mathFontSizePx: clamp(settings.mathFontSizePx, 20, 100),
    pageNumberFontSizePx: clamp(settings.pageNumberFontSizePx, 12, 48),
    titlePageTitleFontSizePx: clamp(
      settings.titlePageTitleFontSizePx,
      40,
      180,
    ),
    titlePageSubtitleFontSizePx: clamp(
      settings.titlePageSubtitleFontSizePx,
      18,
      80,
    ),
    titlePageTitle:
      settings.titlePageTitle.trim() || "無題のプレゼンテーション",
    titlePageSubtitle: settings.titlePageSubtitle.trim(),
  };
}

export function saveMarkdown(markdown: string, fileName: string): void {
  const baseFileName =
    fileName.trim().replace(/\.pptx$/i, "").replace(/\.md$/i, "") ||
    "presentation";

  const blob = new Blob([markdown], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${baseFileName}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
