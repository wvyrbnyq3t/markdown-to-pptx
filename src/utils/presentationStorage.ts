import {
  DEFAULT_PRESENTATION_SETTINGS,
  type PresentationSettings,
} from "../types/presentation";

/**
 * localStorageへ保存するときのキー。
 *
 * 将来、保存形式を大きく変更する場合は、
 * v2などへ変更できます。
 */
const PRESENTATION_SETTINGS_STORAGE_KEY =
  "markdown-to-pptx:presentation-settings:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 保存データに不足している設定がある場合は、
 * DEFAULT_PRESENTATION_SETTINGSで補完します。
 *
 * アプリへ新しい設定項目を追加した場合でも、
 * 古いlocalStorageをそのまま利用できます。
 */
function restorePresentationSettings(
  storedValue: unknown,
): PresentationSettings {
  const restoredSettings: PresentationSettings = {
    ...DEFAULT_PRESENTATION_SETTINGS,
  };

  if (!isRecord(storedValue)) {
    return restoredSettings;
  }

  const settingKeys = Object.keys(DEFAULT_PRESENTATION_SETTINGS) as Array<
    keyof PresentationSettings
  >;

  for (const key of settingKeys) {
    const storedSetting = storedValue[key];
    const defaultSetting = DEFAULT_PRESENTATION_SETTINGS[key];

    /*
     * number、string、booleanの型が
     * 初期設定と一致する値だけを復元します。
     */
    if (typeof storedSetting === typeof defaultSetting) {
      Object.assign(restoredSettings, {
        [key]: storedSetting,
      });
    }
  }

  return restoredSettings;
}

/**
 * localStorageから設定を読み込みます。
 */
export function loadPresentationSettings(): PresentationSettings {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_PRESENTATION_SETTINGS,
    };
  }

  try {
    const storedJson = window.localStorage.getItem(
      PRESENTATION_SETTINGS_STORAGE_KEY,
    );

    if (!storedJson) {
      return {
        ...DEFAULT_PRESENTATION_SETTINGS,
      };
    }

    const storedValue: unknown = JSON.parse(storedJson);

    return restorePresentationSettings(storedValue);
  } catch (error) {
    console.warn("スライド設定の読み込みに失敗しました。", error);

    return {
      ...DEFAULT_PRESENTATION_SETTINGS,
    };
  }
}

/**
 * 現在の設定をlocalStorageへ保存します。
 */
export function savePresentationSettings(settings: PresentationSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PRESENTATION_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.warn("スライド設定の保存に失敗しました。", error);
  }
}

/**
 * localStorageに保存されている設定を削除します。
 */
export function removePresentationSettings(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(PRESENTATION_SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.warn("保存されたスライド設定の削除に失敗しました。", error);
  }
}
