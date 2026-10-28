import { useEffect, useRef, useState } from "react";
import type { LogoSettings } from "../../features/logo/logo";
import { readLogoFile } from "../../features/logo/logo";

interface Props {
  value: LogoSettings;
  onChange: (value: LogoSettings) => void;
  onError: (message: string) => void;
}

export function LogoSettingsFields({ value, onChange, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  async function selectFile(file: File | undefined) {
    if (!file) return;
    const id = ++request.current;
    setLoading(true);
    try {
      const image = await readLogoFile(file);
      if (request.current === id)
        latest.current.onChange({ ...latest.current.value, ...image });
    } catch (error) {
      if (request.current === id)
        onError(
          error instanceof Error
            ? error.message
            : "ロゴを読み込めませんでした。",
        );
    } finally {
      if (request.current === id) setLoading(false);
    }
  }

  return (
    <section className="p-settings__section">
      <h3>ロゴ</h3>
      <label className="c-check">
        <input
          type="checkbox"
          checked={value.isEnabled}
          onChange={(event) =>
            onChange({ ...value, isEnabled: event.target.checked })
          }
        />
        タイトルページ以外にロゴを表示
      </label>
      <div className="p-settings__fields">
        <label className="c-field">
          <span>位置</span>
          <select
            className="c-field__select"
            value={value.position}
            onChange={(event) =>
              onChange({
                ...value,
                position: event.target.value === "left" ? "left" : "right",
              })
            }
          >
            <option value="right">右上</option>
            <option value="left">左上</option>
          </select>
        </label>
        <label className="c-field">
          <span>横幅（px）</span>
          <input
            type="number"
            min={16}
            max={320}
            value={value.size}
            onChange={(event) => {
              const size = event.target.valueAsNumber;
              if (Number.isFinite(size))
                onChange({ ...value, size: Math.min(320, Math.max(16, size)) });
            }}
          />
        </label>
        <label className="c-field">
          <span>ロゴ画像（PNG・512KB以内）</span>
          <input
            type="file"
            accept="image/png,.png"
            disabled={loading}
            onChange={(event) => {
              void selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <p>
        端からの距離はスライドの余白と同じです。縦横比を保ち、高さは最大200pxに収めます。
      </p>
      {loading && <p role="status">ロゴを読み込み中…</p>}
      {value.dataUrl ? (
        <div className="p-settings__logo-preview">
          <img src={value.dataUrl} alt="選択中のロゴ" />
          <span>{value.fileName}</span>
          <button
            type="button"
            className="c-button c-button--subtle"
            disabled={loading}
            onClick={() => onChange({ ...value, dataUrl: "", fileName: "" })}
          >
            画像を削除
          </button>
        </div>
      ) : (
        <p>PNGファイルを選択してください。</p>
      )}
    </section>
  );
}
