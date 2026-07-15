import type { ChangeEvent, RefObject } from "react";

import type { PresentationSettings } from "../types/presentation";
import type { SlideData } from "../types/slide";
import type { SlideStyle } from "../utils/presentationApp";
import { PresentationModeLauncher } from "./PresentationMode";
import {
  DownloadIcon,
  // FolderOpenIcon,
  LoadingIcon,
  // MarkdownSaveIcon,
  SettingsIcon,
} from "./ui/Icons";

import { useUserAuth } from "../features/auth/hooks/useUserAuth";
import { signInWithGoogle } from "../features/auth/api/authApi";
import { Avatar, AvatarImage } from "./Avatar";

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
  // fileInputRef,
  slides,
  settings,
  slideStyle,
  // markdownIsEmpty,
  isExporting,
  canExport,
  // onFileChange,
  // onSaveMarkdown,
  onOpenSettings,
  onExport,
}: AppHeaderProps) {
  const { authUser, isAuthLoading } = useUserAuth();

  return (
    <header className="app-header">
      {!authUser || isAuthLoading ? (
        <button
          type="button"
          className="primary-button"
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch (error) {
              console.error("Googleサインインに失敗しました:", error);
            }
          }}
        >
          Googleでサインイン
        </button>
      ) : (
        <Avatar size="sm">
          <AvatarImage src={authUser?.photoURL || ""} />
        </Avatar>
      )}
      <div className="header-actions">
        <PresentationModeLauncher
          slides={slides}
          settings={settings}
          slideStyle={slideStyle}
        />

        {/* <button
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
          <span>Markdownを保存</span>
        </button> */}

        <button
          type="button"
          className="secondary-button settings-button"
          onClick={onOpenSettings}
        >
          <SettingsIcon />
          <span>スライド設定</span>
        </button>

        <button
          type="button"
          className="primary-button export-button"
          onClick={onExport}
          disabled={isExporting || !canExport}
        >
          {isExporting ? <LoadingIcon /> : <DownloadIcon />}
          <span>{isExporting ? "生成中..." : "PPTXを出力"}</span>
        </button>
      </div>
    </header>
  );
}
