const SNIPPETS = [
  {
    title: "スライドと見出し",
    code: "# スライドタイトル\n\n## サブタイトル\n\n### 見出し\n\n通常の本文",
  },
  {
    title: "文字装飾",
    code: "**太字**\n*斜体*\n~~取り消し線~~\n`インラインコード`\n[リンク](https://example.com)",
  },
  { title: "箇条書き", code: "- 項目1\n- 項目2\n  - 子項目\n\n1. 最初\n2. 次" },
  {
    title: "表",
    code: "| 名前 | 数値 |\n|:---|---:|\n| A | 100 |\n| B | 200 |",
  },
  {
    title: "数式",
    code: "$$\nE = mc^2\n$$\n\n本文内には $a+b=c$ も使えます。",
  },
  {
    title: "複数カラム",
    code: "<!-- grid: 2 -->\n\n左のカラム\n\n<!-- column -->\n\n右のカラム",
  },
  {
    title: "テキスト配置",
    code: "<!-- align: center -->\n\n中央寄せ\n\n<!-- align: right -->\n\n右寄せ",
  },
  {
    title: "余白・アイコン・カード",
    code: "<!-- spacing: 24 -->\n\n<!-- icon: star -->\n\n<!-- card:start -->\nカードの内容\n<!-- card:end -->",
  },
  {
    title: "コードブロックと引用",
    code: "```typescript\nconst value = 42;\n```\n\n> 引用文",
  },
];

export function GuidePage() {
  return (
    <div className="l-app">
      <main className="p-guide">
        <div className="p-guide__intro">
          <h1>Markdownの書き方</h1>
          <p>独自記法も含めて、エディタで使える要素をまとめました。</p>
        </div>
        <div className="p-guide__grid">
          {SNIPPETS.map((item) => (
            <section className="p-guide__section" key={item.title}>
              <h2>{item.title}</h2>
              <pre>
                <code>{item.code}</code>
              </pre>
            </section>
          ))}
        </div>
        <p className="p-guide__note">
          ※
          スライドを切り替えるには見出し1（#）を使用してください。要素がスライドの高さを超えた場合は、プレビューを確認して改ページを追加してください。
        </p>
      </main>
    </div>
  );
}
