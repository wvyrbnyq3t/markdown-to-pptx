import { useId, useState } from "react";
import { normalizeHexColor } from "../../lib/color";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** 入力中の文字列と確定済みの色を分け、不完全な値を設定へ渡さない。 */
export function ColorField({ label, value, onChange }: Props) {
  const id = useId();
  const [draft, setDraft] = useState({ source: value, text: value });
  const [error, setError] = useState(false);
  const text = draft.source === value ? draft.text : value;
  const invalid = error && draft.source === value;

  function commit() {
    const normalized = normalizeHexColor(text);
    if (!normalized) {
      setError(true);
      return;
    }
    setError(false);
    setDraft({ source: normalized, text: normalized });
    onChange(normalized);
  }
  return (
    <div className="c-field">
      <label htmlFor={id}>{label}</label>
      <div className="c-field__color">
        <input
          type="color"
          aria-label={`${label}をカラーピッカーで選択`}
          value={value}
          onChange={(event) => {
            const next = event.target.value.toUpperCase();
            setDraft({ source: next, text: next });
            setError(false);
            onChange(next);
          }}
        />
        <input
          id={id}
          className="c-field__hex"
          type="text"
          value={text}
          placeholder="#2563EB"
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
          onChange={(event) => {
            setDraft({ source: value, text: event.target.value });
            setError(false);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setDraft({ source: value, text: value });
              setError(false);
            }
          }}
        />
      </div>
      <span
        id={`${id}-help`}
        className={invalid ? "c-field__error" : "c-field__hint"}
        role={invalid ? "alert" : undefined}
      >
        {invalid &&
          "3桁または6桁の16進数で入力してください。色は変更されていません。"}
      </span>
    </div>
  );
}
