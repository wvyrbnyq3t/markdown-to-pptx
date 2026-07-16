import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { INITIAL_MARKDOWN } from "../constants/initialMarkdown";

import { parseMarkdown } from "../features/markdown/parseMarkdown";
import { generatePptx } from "../features/pptx/generatePptx";

import {
  DEFAULT_PRESENTATION_SETTINGS,
  type PresentationSettings,
} from "../types/presentation";
import {
  createSlideStyle,
  normalizeFileName,
  normalizePresentationSettings,
  saveMarkdown,
} from "../utils/presentationApp";
import {
  downloadPresentationSettings,
  parsePresentationSettingsJson,
} from "../utils/presentationSettingsFile";
import {
  loadPresentationSettings,
  savePresentationSettings,
} from "../utils/presentationStorage";

export type MobileView = "editor" | "preview";

export type UpdateSetting = <K extends keyof PresentationSettings>(
  key: K,
  value: PresentationSettings[K],
) => void;

export function usePresentationEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);

  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [fileName, setFileName] = useState("presentation");
  const [settings, setSettings] = useState<PresentationSettings>(() =>
    loadPresentationSettings(),
  );
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    savePresentationSettings(settings);
  }, [settings]);

  const parseResult = useMemo(() => {
    try {
      return {
        slides: parseMarkdown(markdown),
        error: "",
      };
    } catch (error) {
      return {
        slides: [],
        error:
          error instanceof Error
            ? error.message
            : "Markdownの解析に失敗しました。",
      };
    }
  }, [markdown]);

  const slides = parseResult.slides;
  const totalSlideCount = slides.length + (settings.includeTitleSlide ? 1 : 0);
  const slideStyle = useMemo(() => createSlideStyle(settings), [settings]);
  const errorMessage = parseResult.error || actionError;

  const updateSetting: UpdateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleMarkdownChange = (value: string): void => {
    // valueのテキストサイズ bytes でconsole.logで出力
    setMarkdown(value);
    setActionError("");
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!/\.(md|markdown)$/i.test(file.name)) {
      setActionError(".mdまたは.markdown形式のファイルを選択してください。");
      event.target.value = "";
      return;
    }

    try {
      setMarkdown(await file.text());
      setFileName(file.name.replace(/\.(md|markdown)$/i, ""));
      setMobileView("editor");
      setActionError("");
    } catch {
      setActionError("Markdownファイルの読み込みに失敗しました。");
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveSettings = (): void => {
    try {
      downloadPresentationSettings(settings, fileName);

      setActionError("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "スライド設定の保存に失敗しました。",
      );
    }
  };
  const handleSettingsFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!/\.json$/i.test(file.name)) {
      setActionError(".json形式の設定ファイルを選択してください。");

      input.value = "";
      return;
    }

    try {
      const jsonText = await file.text();
      const importedSettings = parsePresentationSettingsJson(jsonText);

      setSettings(importedSettings);
      setActionError("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "スライド設定の読み込みに失敗しました。",
      );
    } finally {
      input.value = "";
    }
  };

  const handleSaveMarkdown = (): void => {
    saveMarkdown(markdown, fileName);
  };

  const handleExport = async (): Promise<void> => {
    if (slides.length === 0 && !settings.includeTitleSlide) {
      setActionError("出力できるスライドがありません。");
      return;
    }

    setIsExporting(true);
    setActionError("");

    try {
      await generatePptx(
        slides,
        `${normalizeFileName(fileName)}.pptx`,
        normalizePresentationSettings(settings),
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "PPTXの生成に失敗しました。",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const resetSettings = (): void => {
    const defaultSettings: PresentationSettings = {
      ...DEFAULT_PRESENTATION_SETTINGS,
    };

    setSettings(defaultSettings);
  };

 return {
  fileInputRef,
  settingsFileInputRef,

  markdown,
  fileName,
  settings,
  slides,
  slideStyle,
  totalSlideCount,
  mobileView,
  isSettingsOpen,
  isExporting,
  errorMessage,

  setFileName,
  setMobileView,
  setIsSettingsOpen,

  handleMarkdownChange,
  handleFileChange,
  handleSaveMarkdown,
  handleExport,

  handleSaveSettings,
  handleSettingsFileChange,

  updateSetting,
  resetSettings,
};
}
