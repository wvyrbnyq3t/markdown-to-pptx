import { LogoSettingsFields } from "./LogoSettingsFields";
import { useRef } from "react";
import { Download, Upload, X } from "lucide-react";
import type { PresentationSettings } from "../../types/settings";
import { DEFAULT_SETTINGS } from "../../types/settings";
import { downloadText, readTextFile } from "../../lib/files";
import { parseSettingsJson, serializeSettings } from "../../lib/settingsFile";

interface Props {
  open: boolean;
  settings: PresentationSettings;
  onChange: (next: PresentationSettings) => void;
  onClose: () => void;
  onNotify: (message: string, type?: "error" | "success" | "info") => void;
}

type FontKey = keyof PresentationSettings["fontSize"];
type ColorKey = keyof PresentationSettings["color"];

const FONT_LABELS: Record<FontKey, string> = {
  title: "スライドタイトル",
  subTitle: "サブタイトル",
  text: "本文",
  code: "コード",
  formula: "数式",
};
const COLOR_LABELS: Record<ColorKey, string> = {
  primary: "メインカラー",
  secondary: "サブカラー",
  text: "本文カラー",
  accent: "アクセント",
  tableHeader: "表ヘッダー",
};

export function SettingsDialog({
  open,
  settings,
  onChange,
  onClose,
  onNotify,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  function updateFont(key: FontKey, value: number) {
    onChange({ ...settings, fontSize: { ...settings.fontSize, [key]: value } });
  }
  function updateColor(key: ColorKey, value: string) {
    onChange({ ...settings, color: { ...settings.color, [key]: value } });
  }
  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      onChange(parseSettingsJson(await readTextFile(file)));
      onNotify("設定をJSONから読み込みました。", "success");
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "設定を読み込めませんでした。",
        "error",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  return (
    <div
      className="c-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="p-settings"
      >
        <header className="p-settings__header">
          <div>
            <h2 id="settings-title">スライド設定</h2>
            <p>変更はプレビューに自動反映されます</p>
          </div>
          <button
            type="button"
            className="c-icon-button"
            aria-label="閉じる"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="p-settings__body">
          <section className="p-settings__section">
            <h3>レイアウト</h3>
            <div className="p-settings__fields">
              <label className="c-field">
                <span>スライドの余白（px）</span>
                <input
                  type="text"
                  min={0}
                  max={200}
                  value={settings.margin}
                  onChange={(e) => {
                    if (!/^\d*$/.test(e.target.value)) return;
                    onChange({ ...settings, margin: Number(e.target.value) });
                  }}
                />
              </label>
              <label className="c-field">
                <span>要素の間隔（px）</span>
                <input
                  type="text"
                  min={0}
                  max={80}
                  value={settings.gap}
                  onChange={(e) => {
                    if (!/^\d*$/.test(e.target.value)) return;
                    onChange({ ...settings, gap: Number(e.target.value) });
                  }}
                />
              </label>
            </div>
          </section>
          <section className="p-settings__section">
            <h3>文字サイズ（px）</h3>
            <div className="p-settings__fields">
              {(Object.keys(FONT_LABELS) as FontKey[]).map((key) => (
                <label className="c-field" key={key}>
                  <span>{FONT_LABELS[key]}</span>
                  <input
                    type="text"
                    min={10}
                    max={180}
                    value={settings.fontSize[key]}
                    onChange={(e) => {
                      if (!/^\d*$/.test(e.target.value)) return;
                      updateFont(key, Number(e.target.value));
                    }}
                  />
                </label>
              ))}
            </div>
          </section>
          <section className="p-settings__section">
            <h3>カラー</h3>
            <div className="p-settings__fields">
              {(Object.keys(COLOR_LABELS) as ColorKey[]).map((key) => (
                <label key={key} className="c-field">
                  <span>{COLOR_LABELS[key]}</span>
                  <span className="c-field__color">
                    <input
                      type="color"
                      value={settings.color[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                    />
                    <span>{settings.color[key]}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
          <section className="p-settings__section">
            <h3>タイトルスライド</h3>
            <label className="c-check">
              <input
                type="checkbox"
                checked={settings.pageTitle.isEnabled}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    pageTitle: {
                      ...settings.pageTitle,
                      isEnabled: e.target.checked,
                    },
                  })
                }
              />
              タイトルスライドを表示
            </label>
            <div className="p-settings__fields">
              <label className="c-field">
                <span>タイトル</span>
                <input
                  type="text"
                  value={settings.pageTitle.title.content}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      pageTitle: {
                        ...settings.pageTitle,
                        title: {
                          ...settings.pageTitle.title,
                          content: e.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
              <label className="c-field">
                <span>文字サイズ（px）</span>
                <input
                  type="text"
                  min={20}
                  max={180}
                  value={settings.pageTitle.title.fontSize}
                  onChange={(e) => {
                    if (!/^\d*$/.test(e.target.value)) return;
                    onChange({
                      ...settings,
                      pageTitle: {
                        ...settings.pageTitle,
                        title: {
                          ...settings.pageTitle.title,
                          fontSize: Number(e.target.value),
                        },
                      },
                    });
                  }}
                />
              </label>
              <label className="c-field">
                <span>サブタイトル</span>
                <input
                  type="text"
                  value={settings.pageTitle.subTitle.content}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      pageTitle: {
                        ...settings.pageTitle,
                        subTitle: {
                          ...settings.pageTitle.subTitle,
                          content: e.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
              <label className="c-field">
                <span>文字サイズ（px）</span>
                <input
                  type="text"
                  min={12}
                  max={140}
                  value={settings.pageTitle.subTitle.fontSize}
                  onChange={(e) => {
                    if (!/^\d*$/.test(e.target.value)) return;
                    onChange({
                      ...settings,
                      pageTitle: {
                        ...settings.pageTitle,
                        subTitle: {
                          ...settings.pageTitle.subTitle,
                          fontSize: Number(e.target.value),
                        },
                      },
                    });
                  }}
                />
              </label>
            </div>
          </section>
          <LogoSettingsFields
            value={settings.logo}
            onChange={(logo) => onChange({ ...settings, logo })}
            onError={(message) => onNotify(message, "error")}
          />
          <section className="p-settings__section">
            <h3>ページ番号</h3>
            <label className="c-check">
              <input
                type="checkbox"
                checked={settings.pageNumber.isEnabled}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    pageNumber: {
                      ...settings.pageNumber,
                      isEnabled: e.target.checked,
                    },
                  })
                }
              />
              ページ番号を表示
            </label>
            <div className="p-settings__fields">
              <label className="c-field">
                <span>文字サイズ（px）</span>
                <input
                  type="text"
                  min={8}
                  max={48}
                  value={settings.pageNumber.fontSize}
                  onChange={(e) => {
                    if (!/^\d*$/.test(e.target.value)) return;
                    onChange({
                      ...settings,
                      pageNumber: {
                        ...settings.pageNumber,
                        fontSize: Number(e.target.value),
                      },
                    });
                  }}
                />
              </label>
            </div>
          </section>
        </div>
        <footer className="p-settings__footer">
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="u-visually-hidden"
            onChange={(e) => void handleImport(e.target.files?.[0])}
          />
          <button
            className="c-button c-button--subtle"
            onClick={() => {
              onChange(structuredClone(DEFAULT_SETTINGS));
              onNotify("設定を初期化しました。", "success");
            }}
          >
            初期化
          </button>
          <button
            className="c-button c-button--subtle"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={16} />
            JSON読み込み
          </button>
          <button
            className="c-button c-button--subtle"
            onClick={() => {
              downloadText(
                "slide-settings.json",
                serializeSettings(settings),
                "application/json;charset=utf-8",
              );
              onNotify("JSONを保存しました。", "success");
            }}
          >
            <Download size={16} />
            設定をJSONで保存
          </button>
          <button className="c-button c-button--primary" onClick={onClose}>
            完了
          </button>
        </footer>
      </section>
    </div>
  );
}
