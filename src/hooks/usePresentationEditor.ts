import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

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

export type MobileView = "editor" | "preview";

export type UpdateSetting = <K extends keyof PresentationSettings>(
  key: K,
  value: PresentationSettings[K],
) => void;

export function usePresentationEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [fileName, setFileName] = useState("presentation");
  const [settings, setSettings] = useState<PresentationSettings>({
    ...DEFAULT_PRESENTATION_SETTINGS,
  });
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionError, setActionError] = useState("");

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
  const totalSlideCount =
    slides.length + (settings.includeTitleSlide ? 1 : 0);
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
    setSettings({ ...DEFAULT_PRESENTATION_SETTINGS });
  };

  return {
    fileInputRef,
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
    updateSetting,
    resetSettings,
  };
}
