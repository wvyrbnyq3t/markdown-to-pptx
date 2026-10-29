import { pngDimensions } from "../features/logo/logo";
import { DEFAULT_SETTINGS, type PresentationSettings } from "../types/settings";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberInRange(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : fallback;
}

function color(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned.toUpperCase() : fallback;
}

function content(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.slice(0, 300) : fallback;
}

/** インポートされたJSONを検証し、欠落項目のみ既定値で補います。 */
export function normalizeSettings(raw: unknown): PresentationSettings {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("設定JSONの最上位はオブジェクトにしてください。");
  }
  const root = record(raw);
  const logo = record(root.logo);
  const fonts = record(root.fontSize);
  const colors = record(root.color);
  const pageNumber = record(root.pageNumber);
  const pageTitle = record(root.pageTitle);
  const title = record(pageTitle.title);
  const subTitle = record(pageTitle.subTitle);
  const defaults = DEFAULT_SETTINGS;

  return {
    logo: {
      isEnabled: typeof logo.isEnabled === "boolean" ? logo.isEnabled : false,
      position: logo.position === "left" ? "left" : "right",
      size: numberInRange(logo.size, defaults.logo.size, 16, 320),
      dataUrl: pngDimensions(logo.dataUrl) ? (logo.dataUrl as string) : "",
      fileName: content(logo.fileName, ""),
    },
    margin: numberInRange(root.margin, defaults.margin, 0, 200),
    gap: numberInRange(root.gap, defaults.gap, 0, 80),
    fontSize: {
      title: numberInRange(fonts.title, defaults.fontSize.title, 12, 180),
      subTitle: numberInRange(
        fonts.subTitle,
        defaults.fontSize.subTitle,
        12,
        140,
      ),
      text: numberInRange(fonts.text, defaults.fontSize.text, 12, 100),
      code: numberInRange(fonts.code, defaults.fontSize.code, 10, 100),
      formula: numberInRange(fonts.formula, defaults.fontSize.formula, 12, 140),
    },
    color: {
      background: color(colors.background, defaults.color.background),
      primary: color(colors.primary, defaults.color.primary),
      secondary: color(colors.secondary, defaults.color.secondary),
      text: color(colors.text, defaults.color.text),
      accent: color(colors.accent, defaults.color.accent),
      tableHeader: color(colors.tableHeader, defaults.color.tableHeader),
    },
    pageNumber: {
      isEnabled:
        typeof pageNumber.isEnabled === "boolean"
          ? pageNumber.isEnabled
          : defaults.pageNumber.isEnabled,
      fontSize: numberInRange(
        pageNumber.fontSize,
        defaults.pageNumber.fontSize,
        8,
        48,
      ),
    },
    pageTitle: {
      isEnabled:
        typeof pageTitle.isEnabled === "boolean"
          ? pageTitle.isEnabled
          : defaults.pageTitle.isEnabled,
      title: {
        content: content(title.content, defaults.pageTitle.title.content),
        fontSize: numberInRange(
          title.fontSize,
          defaults.pageTitle.title.fontSize,
          20,
          180,
        ),
      },
      subTitle: {
        content: content(subTitle.content, defaults.pageTitle.subTitle.content),
        fontSize: numberInRange(
          subTitle.fontSize,
          defaults.pageTitle.subTitle.fontSize,
          12,
          140,
        ),
      },
    },
  };
}

export function parseSettingsJson(json: string): PresentationSettings {
  try {
    return normalizeSettings(JSON.parse(json));
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error("JSONの形式が正しくありません。");
    throw error;
  }
}

export function serializeSettings(settings: PresentationSettings): string {
  return JSON.stringify(settings, null, 2);
}
