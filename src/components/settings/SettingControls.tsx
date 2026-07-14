import { useEffect, useState } from "react";

import { clamp, normalizeHexColor } from "../../utils/presentationApp";

type NumberSettingProps = {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function NumberSetting({
  label,
  value,
  unit,
  min,
  max,
  disabled = false,
  onChange,
}: NumberSettingProps) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitValue = (): void => {
    const parsedValue = Number(draftValue.trim());

    if (draftValue.trim() === "" || !Number.isFinite(parsedValue)) {
      setDraftValue(String(value));
      return;
    }

    const normalizedValue = clamp(parsedValue, min, max);
    setDraftValue(String(normalizedValue));
    onChange(normalizedValue);
  };

  return (
    <label
      className={`number-setting${disabled ? " setting-disabled" : ""}`}
    >
      <span className="setting-label">{label}</span>
      <span className="number-input-wrapper">
        <input
          type="text"
          inputMode="decimal"
          value={draftValue}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          aria-label={label}
          onChange={(event) => setDraftValue(event.target.value)}
          onBlur={commitValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              setDraftValue(String(value));
              event.currentTarget.blur();
            }
          }}
        />
        <span aria-hidden="true">{unit}</span>
      </span>
    </label>
  );
}

type TextSettingProps = {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function TextSetting({
  label,
  value,
  disabled = false,
  onChange,
}: TextSettingProps) {
  return (
    <label className={`text-setting${disabled ? " setting-disabled" : ""}`}>
      <span className="setting-label">{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type BooleanSettingProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function BooleanSetting({
  label,
  checked,
  onChange,
}: BooleanSettingProps) {
  return (
    <label className="boolean-setting">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="boolean-switch" aria-hidden="true">
        <span className="boolean-switch-knob" />
      </span>
      <span className="boolean-setting-label">{label}</span>
    </label>
  );
}

type ColorSettingProps = {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
};

export function ColorSetting({
  label,
  value,
  fallback,
  onChange,
}: ColorSettingProps) {
  const [draftColor, setDraftColor] = useState(value);

  useEffect(() => {
    setDraftColor(value);
  }, [value]);

  const currentValidColor = normalizeHexColor(value, fallback);
  const colorPickerValue = /^#[0-9a-fA-F]{6}$/.test(draftColor.trim())
    ? draftColor.trim().toUpperCase()
    : currentValidColor;

  const commitColor = (): void => {
    const trimmedColor = draftColor.trim();

    if (/^#?[0-9a-fA-F]{6}$/.test(trimmedColor)) {
      const normalizedColor = normalizeHexColor(trimmedColor, currentValidColor);
      setDraftColor(normalizedColor);
      onChange(normalizedColor);
      return;
    }

    setDraftColor(currentValidColor);
    onChange(currentValidColor);
  };

  return (
    <label className="color-setting">
      <span className="setting-label">{label}</span>
      <span className="color-input-wrapper">
        <input
          type="color"
          value={colorPickerValue}
          aria-label={`${label}を選択`}
          onChange={(event) => {
            const selectedColor = event.target.value.toUpperCase();
            setDraftColor(selectedColor);
            onChange(selectedColor);
          }}
        />
        <input
          type="text"
          value={draftColor}
          autoComplete="off"
          spellCheck={false}
          aria-label={`${label}の16進数`}
          placeholder="#2563EB"
          onChange={(event) => setDraftColor(event.target.value)}
          onBlur={commitColor}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              setDraftColor(currentValidColor);
              event.currentTarget.blur();
            }
          }}
        />
      </span>
    </label>
  );
}
