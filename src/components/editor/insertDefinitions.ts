export interface InsertDefinition {
  id: string;
  category: "text" | "decoration" | "layout" | "elements";
  label: string;
  description: string;
  template: string;
  placeholder?: string;
}

/** {{selection}}は選択文字列、未選択時はplaceholderに置き換える。 */
export const INSERT_DEFINITIONS: InsertDefinition[] = [
  {
    id: "image-width",
    category: "layout",
    label: "画像の幅",
    description: "次の画像の幅を指定（px・%）",
    template: "\n<!-- image-width: 50% -->\n\n",
  },
  {
    id: "image-height",
    category: "layout",
    label: "画像の高さ",
    description: "次の画像の高さを指定（px・%）",
    template: "\n<!-- image-height: 240px -->\n\n",
  },
  {
    id: "slide",
    category: "layout",
    label: "新規スライド",
    description: "見出し1でスライドを追加",
    template: "\n# {{selection}}\n",
    placeholder: "新しいスライド",
  },
  {
    id: "subtitle",
    category: "text",
    label: "サブタイトル",
    description: "見出し2",
    template: "\n## {{selection}}\n",
    placeholder: "サブタイトル",
  },
  {
    id: "heading",
    category: "text",
    label: "見出し",
    description: "見出し3",
    template: "\n### {{selection}}\n",
    placeholder: "見出し",
  },
  {
    id: "paragraph",
    category: "text",
    label: "本文",
    description: "通常の文章",
    template: "\n{{selection}}\n",
    placeholder: "ここに本文を入力",
  },
  {
    id: "bold",
    category: "decoration",
    label: "太字",
    description: "強調",
    template: "**{{selection}}**",
    placeholder: "強調したい文字",
  },
  {
    id: "italic",
    category: "decoration",
    label: "斜体",
    description: "斜体の文章",
    template: "*{{selection}}*",
    placeholder: "斜体にする文字",
  },
  {
    id: "strike",
    category: "decoration",
    label: "取り消し線",
    description: "取り消し線",
    template: "~~{{selection}}~~",
    placeholder: "取り消す文字",
  },
  {
    id: "list",
    category: "text",
    label: "箇条書き",
    description: "箇条書きリスト",
    template: "\n- {{selection}}\n- 項目2\n",
    placeholder: "項目1",
  },
  {
    id: "number",
    category: "text",
    label: "番号付きリスト",
    description: "番号付きリスト",
    template: "\n1. {{selection}}\n2. 項目2\n",
    placeholder: "項目1",
  },
  {
    id: "quote",
    category: "text",
    label: "引用",
    description: "引用ブロック",
    template: "\n> {{selection}}\n",
    placeholder: "引用文",
  },
  {
    id: "inline-code",
    category: "decoration",
    label: "インラインコード",
    description: "短いコード",
    template: "`{{selection}}`",
    placeholder: "code",
  },
  {
    id: "code",
    category: "elements",
    label: "コードブロック",
    description: "複数行のコード",
    template: "\n```typescript\n{{selection}}\n```\n",
    placeholder: "const answer = 42;",
  },
  {
    id: "math",
    category: "elements",
    label: "数式",
    description: "LaTeX数式",
    template: "\n$$\n{{selection}}\n$$\n",
    placeholder: "E = mc^2",
  },
  {
    id: "table",
    category: "elements",
    label: "表",
    description: "Markdownテーブル",
    template: "\n| 項目 | 値 |\n|:---|---:|\n| {{selection}} | 100 |\n",
    placeholder: "サンプル",
  },
  {
    id: "link",
    category: "decoration",
    label: "リンク",
    description: "URLへのリンク",
    template: "[{{selection}}](https://example.com)",
    placeholder: "リンクテキスト",
  },
  {
    id: "icon",
    category: "elements",
    label: "アイコン",
    description: "文章内にMaterial Iconを挿入",
    template: ":icon:{{selection}}:",
    placeholder: "star",
  },
  {
    id: "block-icon",
    category: "elements",
    label: "アイコン（ブロック）",
    description: "独立したMaterial Iconを挿入",
    template: "\n<!-- icon: star -->\n",
  },
  {
    id: "card",
    category: "elements",
    label: "カード",
    description: "文章を枠で囲む",
    template: "\n<!-- card:start -->\n{{selection}}\n<!-- card:end -->\n",
    placeholder: "カードの内容",
  },
  {
    id: "grid",
    category: "layout",
    label: "2列レイアウト",
    description: "カラムを2列に設定",
    template: "\n<!-- grid: 2 -->\n",
  },
  {
    id: "column",
    category: "layout",
    label: "次のカラム",
    description: "次のカラムへ移動",
    template: "\n<!-- column -->\n",
  },
  {
    id: "space",
    category: "layout",
    label: "余白",
    description: "任意の縦余白を挿入",
    template: "\n<!-- spacing: 24 -->\n",
  },
  {
    id: "align-left",
    category: "layout",
    label: "左寄せ",
    description: "直後の文章を左寄せ",
    template: "\n<!-- align: left -->\n\n{{selection}}\n",
    placeholder: "左寄せの文章",
  },
  {
    id: "align-center",
    category: "layout",
    label: "中央寄せ",
    description: "直後の文章を中央寄せ",
    template: "\n<!-- align: center -->\n\n{{selection}}\n",
    placeholder: "中央寄せの文章",
  },
  {
    id: "align-right",
    category: "layout",
    label: "右寄せ",
    description: "直後の文章を右寄せ",
    template: "\n<!-- align: right -->\n\n{{selection}}\n",
    placeholder: "右寄せの文章",
  },
];

export function createInsertion(
  definition: InsertDefinition,
  selected: string,
) {
  const replacement = selected || definition.placeholder || "";
  const marker = "{{selection}}";
  const position = definition.template.indexOf(marker);
  const text = definition.template.replace(marker, replacement);
  return {
    text,
    selectionStart: position >= 0 ? position : text.length,
    selectionEnd: position >= 0 ? position + replacement.length : text.length,
  };
}
