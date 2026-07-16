import type { ChangeEvent, RefObject } from "react";

import type { PresentationSettings } from "../types/presentation";
import type { SlideData } from "../types/slide";
import type { SlideStyle } from "../utils/presentationApp";
import { PresentationModeLauncher } from "./PresentationMode";
import {
  DownloadIcon,
  FolderOpenIcon,
  LoadingIcon,
  MarkdownSaveIcon,
  SettingsIcon,
} from "./ui/Icons";

type AppHeaderProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  slides: SlideData[];
  settings: PresentationSettings;
  slideStyle: SlideStyle;
  markdownIsEmpty: boolean;
  isExporting: boolean;
  canExport: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onSaveMarkdown: () => void;
  onOpenSettings: () => void;
  onExport: () => void | Promise<void>;
};

export function EditorHeader({
  fileInputRef,
  slides,
  settings,
  slideStyle,
  markdownIsEmpty,
  isExporting,
  canExport,
  onFileChange,
  onSaveMarkdown,
  onOpenSettings,
  onExport,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-actions">
        <PresentationModeLauncher
          slides={slides}
          settings={settings}
          slideStyle={slideStyle}
        />
        <button
          type="button"
          className="secondary-button settings-button"
          onClick={onOpenSettings}
        >
          <SettingsIcon />
          <span>設定</span>
        </button>
        <button
          type="button"
          className="secondary-button import-markdown-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpenIcon />
          <span>Markdownを開く</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={onFileChange}
          hidden
        />
        <button
          type="button"
          className="secondary-button export-markdown-button"
          onClick={onSaveMarkdown}
          disabled={markdownIsEmpty}
        >
          <MarkdownSaveIcon />
          <span>Markdownで出力</span>
        </button>
        <button
          type="button"
          className="primary-button export-button"
          onClick={onExport}
          disabled={isExporting || !canExport}
        >
          {isExporting ? <LoadingIcon /> : <DownloadIcon />}
          <span>{isExporting ? "生成中..." : "PPTXで出力"}</span>
        </button>
      </div>
    </header>
  );
}
