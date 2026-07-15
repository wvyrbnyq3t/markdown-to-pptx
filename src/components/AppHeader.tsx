import type { ChangeEvent, RefObject } from "react";
import { useState } from "react";

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
  MenuIcon,
} from "./ui/Icons";

import { HeaderMenuDialog } from "./HeaderMenuDialog";

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

export function AppHeader({
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <header className="app-header">
      <button
        type="button"
        className="header-menu-button"
        aria-label="メニューを開く"
        aria-haspopup="dialog"
        aria-expanded={isMenuOpen}
        onClick={() => {
          setIsMenuOpen(true);
        }}
      >
        <MenuIcon />
      </button>

      <HeaderMenuDialog
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
        }}
      />
      <div className="header-actions">
        <PresentationModeLauncher
          slides={slides}
          settings={settings}
          slideStyle={slideStyle}
        />
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
          className="secondary-button settings-button"
          onClick={onOpenSettings}
        >
          <SettingsIcon />
          <span>設定</span>
        </button>
        <button
          type="button"
          className="secondary-button export-markdown-button"
          onClick={onSaveMarkdown}
          disabled={markdownIsEmpty}
        >
          <MarkdownSaveIcon />
          <span>Markdownで保存</span>
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
