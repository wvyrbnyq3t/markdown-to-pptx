import { DEFAULT_SETTINGS, type PresentationSettings } from "../types/settings";
import { normalizeSettings } from "./settingsFile";

const MARKDOWN_KEY = "pon-slide:markdown:v1";
const SETTINGS_KEY = "pon-slide:settings:v1";

export const EXAMPLE_MARKDOWN = `# ポンっ！へようこそ

## Markdownでスライドを作ろう

Markdownを書くだけでPowerPointが完成します。

- 見出しや本文を記述
- 表や数式にも対応
- 右側でリアルタイムに確認

# スライドのレイアウト

<!-- grid: 2 -->

## 左側のカラム

**太字**、*斜体*、~~取り消し線~~ を使えます。

<!-- column -->

## 右側のカラム

<!-- align: center -->

中央寄せの文章です。

<!-- spacing: 16 -->

> 余白や文字の配置も指定できます。

# 表と数式

| 項目 | 値 |
|:---|---:|
| 編集方式 | Markdown |
| 出力形式 | PPTX |

$$
E = mc^2
$$

# おわりに

<!-- card:start -->
**ポンっ！** で、伝わるスライドを手早く作ろう。
<!-- card:end -->
`;

export function loadMarkdown(): string {
  try { return localStorage.getItem(MARKDOWN_KEY) ?? EXAMPLE_MARKDOWN; }
  catch { return EXAMPLE_MARKDOWN; }
}

export function saveMarkdown(markdown: string): void {
  try { localStorage.setItem(MARKDOWN_KEY, markdown); } catch { /* 保存不能なブラウザでは編集を継続 */ }
}

export function loadSettings(): PresentationSettings {
  try {
    const value = localStorage.getItem(SETTINGS_KEY);
    return value ? normalizeSettings(JSON.parse(value)) : structuredClone(DEFAULT_SETTINGS);
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings: PresentationSettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  catch { /* 保存不能なブラウザでは編集を継続 */ }
}
