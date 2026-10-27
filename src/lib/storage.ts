import { DEFAULT_SETTINGS, type PresentationSettings } from "../types/settings";
import { normalizeSettings } from "./settingsFile";

const MARKDOWN_KEY = "pon-slide:markdown:v1";
const SETTINGS_KEY = "pon-slide:settings:v1";

export const EXAMPLE_MARKDOWN = `
# Hello, World!
`;

export function loadMarkdown(): string {
  try {
    return localStorage.getItem(MARKDOWN_KEY) ?? EXAMPLE_MARKDOWN;
  } catch {
    return EXAMPLE_MARKDOWN;
  }
}

export function saveMarkdown(markdown: string): void {
  try {
    localStorage.setItem(MARKDOWN_KEY, markdown);
  } catch {
    /* 保存不能なブラウザでは編集を継続 */
  }
}

export function loadSettings(): PresentationSettings {
  try {
    const value = localStorage.getItem(SETTINGS_KEY);
    return value
      ? normalizeSettings(JSON.parse(value))
      : structuredClone(DEFAULT_SETTINGS);
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings: PresentationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* 保存不能なブラウザでは編集を継続 */
  }
}
