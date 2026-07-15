import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

import type { UpdateSetting } from "../../hooks/usePresentationEditor";
import {
  DEFAULT_PRESENTATION_SETTINGS,
  type PresentationSettings,
} from "../../types/presentation";
import { CloseIcon } from "../ui/Icons";
import {
  BooleanSetting,
  ColorSetting,
  NumberSetting,
  TextSetting,
} from "./SettingControls";

type SettingsDialogProps = {
  isOpen: boolean;
  settings: PresentationSettings;
  onChange: UpdateSetting;
  onReset: () => void;
  onClose: () => void;
};

export function SettingsDialog({
  isOpen,
  settings,
  onChange,
  onReset,
  onClose,
}: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const animationFrameId = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-dialog-backdrop" onMouseDown={handleBackdropClick}>
      <div
        ref={dialogRef}
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        tabIndex={-1}
      >
        <header className="settings-dialog-header">
          <div>
            <h2 id="settings-dialog-title">スライド設定</h2>
            <p>すべて1920×1080px基準のpx単位です。</p>
          </div>
          <button
            type="button"
            className="dialog-close-button"
            onClick={onClose}
            aria-label="スライド設定を閉じる"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="settings-dialog-content">
          <SettingsSection title="基本設定">
            <NumberSetting
              label="周辺の余白"
              value={settings.marginPx}
              unit="px"
              min={0}
              max={240}
              onChange={(value) => onChange("marginPx", value)}
            />
            <NumberSetting
              label="要素間の余白"
              value={settings.contentGapPx}
              unit="px"
              min={0}
              max={256}
              onChange={(value) => onChange("contentGapPx", value)}
            />
            <NumberSetting
              label="タイトルサイズ"
              value={settings.titleFontSizePx}
              unit="px"
              min={24}
              max={120}
              onChange={(value) => onChange("titleFontSizePx", value)}
            />
            <NumberSetting
              label="小見出しサイズ"
              value={settings.subtitleFontSizePx}
              unit="px"
              min={20}
              max={96}
              onChange={(value) => onChange("subtitleFontSizePx", value)}
            />
            <NumberSetting
              label="本文サイズ"
              value={settings.bodyFontSizePx}
              unit="px"
              min={16}
              max={72}
              onChange={(value) => onChange("bodyFontSizePx", value)}
            />
            <NumberSetting
              label="コードサイズ"
              value={settings.codeFontSizePx}
              unit="px"
              min={14}
              max={56}
              onChange={(value) => onChange("codeFontSizePx", value)}
            />
            <NumberSetting
              label="数式サイズ"
              value={settings.mathFontSizePx}
              unit="px"
              min={20}
              max={100}
              onChange={(value) => onChange("mathFontSizePx", value)}
            />
          </SettingsSection>

          <SettingsSection title="カラー設定">
            <ColorSetting
              label="プライマリカラー"
              value={settings.primaryColor}
              fallback={DEFAULT_PRESENTATION_SETTINGS.primaryColor}
              onChange={(value) => onChange("primaryColor", value)}
            />
            <ColorSetting
              label="セカンダリーカラー"
              value={settings.secondaryColor}
              fallback={DEFAULT_PRESENTATION_SETTINGS.secondaryColor}
              onChange={(value) => onChange("secondaryColor", value)}
            />
            <ColorSetting
              label="テキストカラー"
              value={settings.textColor}
              fallback={DEFAULT_PRESENTATION_SETTINGS.textColor}
              onChange={(value) => onChange("textColor", value)}
            />
            <ColorSetting
              label="アクセントカラー"
              value={settings.accentColor}
              fallback={DEFAULT_PRESENTATION_SETTINGS.accentColor}
              onChange={(value) => onChange("accentColor", value)}
            />
            <ColorSetting
              label="表のヘッダー色"
              value={settings.tableHeaderColor}
              fallback={DEFAULT_PRESENTATION_SETTINGS.tableHeaderColor}
              onChange={(value) => onChange("tableHeaderColor", value)}
            />
          </SettingsSection>

          <SettingsSection title="ページ番号">
            <BooleanSetting
              label="ページ番号を表示"
              checked={settings.showPageNumber}
              onChange={(value) => onChange("showPageNumber", value)}
            />
            <NumberSetting
              label="ページ番号サイズ"
              value={settings.pageNumberFontSizePx}
              unit="px"
              min={12}
              max={48}
              disabled={!settings.showPageNumber}
              onChange={(value) => onChange("pageNumberFontSizePx", value)}
            />
          </SettingsSection>

          <SettingsSection title="タイトルページ" wide>
            <BooleanSetting
              label="タイトルページを追加"
              checked={settings.includeTitleSlide}
              onChange={(value) => onChange("includeTitleSlide", value)}
            />
            <TextSetting
              label="タイトル"
              value={settings.titlePageTitle}
              disabled={!settings.includeTitleSlide}
              onChange={(value) => onChange("titlePageTitle", value)}
            />
            <TextSetting
              label="サブタイトル"
              value={settings.titlePageSubtitle}
              disabled={!settings.includeTitleSlide}
              onChange={(value) => onChange("titlePageSubtitle", value)}
            />
            <NumberSetting
              label="タイトルサイズ"
              value={settings.titlePageTitleFontSizePx}
              unit="px"
              min={40}
              max={180}
              disabled={!settings.includeTitleSlide}
              onChange={(value) => onChange("titlePageTitleFontSizePx", value)}
            />
            <NumberSetting
              label="サブタイトルサイズ"
              value={settings.titlePageSubtitleFontSizePx}
              unit="px"
              min={18}
              max={80}
              disabled={!settings.includeTitleSlide}
              onChange={(value) =>
                onChange("titlePageSubtitleFontSizePx", value)
              }
            />
          </SettingsSection>
        </div>

        <footer className="settings-dialog-footer">
          <button
            type="button"
            className="reset-settings-button"
            onClick={onReset}
          >
            初期設定に戻す
          </button>
          <button type="button" className="primary-button" onClick={onClose}>
            保存する
          </button>
        </footer>
      </div>
    </div>
  );
}

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  wide?: boolean;
};

function SettingsSection({
  title,
  children,
  wide = false,
}: SettingsSectionProps) {
  return (
    <section className="settings-subsection">
      <h3 className="settings-subsection-title">{title}</h3>
      <div className={wide ? "title-page-settings" : "settings-grid"}>
        {children}
      </div>
    </section>
  );
}
