// hooks
import { useState } from "react";

// stylesheets
import "../styles/guide.css";

type GuidePageProps = {
  onBack: () => void;
};

type CodeExampleProps = {
  title: string;
  code: string;
};

type SyntaxItem = {
  title: string;
  description: string;
  code: string;
};

const BASIC_SLIDE_EXAMPLE = [
  "# スライドタイトル",
  "",
  "## 小見出し",
  "",
  "これは本文です。",
  "",
  "- 箇条書き1",
  "- 箇条書き2",
].join("\n");

const MULTIPLE_SLIDES_EXAMPLE = [
  "# 1枚目のスライド",
  "",
  "1枚目の本文です。",
  "",
  "# 2枚目のスライド",
  "",
  "2枚目の本文です。",
].join("\n");

const GRID_TWO_EXAMPLE = [
  "# 2列のスライド",
  "",
  "<!-- grid: 2 -->",
  "",
  "## 左側",
  "",
  "- 左側の項目1",
  "- 左側の項目2",
  "",
  "<!-- column -->",
  "",
  "## 右側",
  "",
  "右側の本文です。",
].join("\n");

const GRID_THREE_EXAMPLE = [
  "# 3つのポイント",
  "",
  "<!-- grid: 3 -->",
  "",
  "## ポイント1",
  "",
  "1列目の内容",
  "",
  "<!-- column -->",
  "",
  "## ポイント2",
  "",
  "2列目の内容",
  "",
  "<!-- column -->",
  "",
  "## ポイント3",
  "",
  "3列目の内容",
].join("\n");

const CODE_BLOCK_EXAMPLE = [
  "```ts",
  'const message = "Hello";',
  "console.log(message);",
  "```",
].join("\n");

const FULL_EXAMPLE = [
  "# Markdownからスライドを作る",
  "",
  "## テキストを入力するだけ",
  "",
  "Markdownを入力すると、",
  "自動的にスライドへ変換されます。",
  "",
  "- デザイン操作が少ない",
  "- 内容の編集に集中できる",
  "- PPTXとして保存できる",
  "",
  "# 2つの特徴",
  "",
  "<!-- grid: 2 -->",
  "",
  "## 入力",
  "",
  "Markdownで文章を書きます。",
  "",
  "**太字**や==アクセント==も使えます。",
  "",
  "<!-- column -->",
  "",
  "## 出力",
  "",
  "プレビューを確認して、",
  "PPTXファイルとして出力します。",
  "",
  "$$",
  "E = mc^2",
  "$$",
].join("\n");

const SYNTAX_ITEMS: SyntaxItem[] = [
  {
    title: "スライドタイトル",
    description: "見出し1を記述すると、新しいスライドが始まります。",
    code: "# スライドタイトル",
  },
  {
    title: "小見出し",
    description: "見出し2はスライド内の小見出しになります。",
    code: "## 小見出し",
  },
  {
    title: "コンテンツ見出し",
    description: "見出し3〜6は、本文より大きな見出しとして表示されます。",
    code: [
      "### 見出し3",
      "#### 見出し4",
      "##### 見出し5",
      "###### 見出し6",
    ].join("\n"),
  },
  {
    title: "太字・斜体",
    description: "文章の一部分を強調できます。",
    code: ["**太字にする文字**", "*斜体にする文字*"].join("\n"),
  },
  {
    title: "アクセントカラー",
    description: "二重のイコールで囲むと、設定したアクセントカラーになります。",
    code: "これは==重要な部分==です。",
  },
  {
    title: "リンク",
    description: "リンク文字とURLを指定できます。",
    code: "[OpenAI](https://openai.com)",
  },
  {
    title: "箇条書き",
    description: "ハイフンを使って箇条書きを作成します。",
    code: ["- 項目1", "- 項目2", "  - 子項目"].join("\n"),
  },
  {
    title: "番号付きリスト",
    description: "数字を使って手順や順序を表現します。",
    code: ["1. 手順1", "2. 手順2", "3. 手順3"].join("\n"),
  },
  {
    title: "引用",
    description: "行頭に大なり記号を付けると引用になります。",
    code: ["> 外側の引用", ">", ">> 内側の引用"].join("\n"),
  },
  {
    title: "インライン数式",
    description: "文章の途中へ数式を配置できます。",
    code: "質量とエネルギーの関係は $E = mc^2$ です。",
  },
  {
    title: "ブロック数式",
    description: "数式だけを大きく中央へ配置します。",
    code: ["$$", "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", "$$"].join("\n"),
  },
];

function CodeExample({ title, code }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (error) {
      console.warn("コードのコピーに失敗しました。", error);
    }
  };

  return (
    <div className="guide-code-example">
      <div className="guide-code-header">
        <span>{title}</span>

        <button
          type="button"
          className="guide-copy-button"
          onClick={handleCopy}
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>

      <pre className="guide-code-block">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function scrollToSection(sectionId: string): void {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function GuidePage({ onBack }: GuidePageProps) {
  return (
    <div className="guide-page">
      <header className="guide-header">
        <div className="guide-header-inner">
          <button type="button" className="guide-back-button" onClick={onBack}>
            <span aria-hidden="true">←</span>

            <span>エディターへ戻る</span>
          </button>

          <span className="guide-header-title">使い方ガイド</span>
        </div>
      </header>

      <main className="guide-main">
        <section className="guide-hero">
          <span className="guide-eyebrow">Markdown PPTX Generator</span>

          <h1>
            テキストを入力して、
            <br />
            スライドを作成する
          </h1>

          <p>
            Markdownの基本的な入力方法から、 2列・3列のグリッドレイアウト、
            PPTXの出力方法まで確認できます。
          </p>

          <button
            type="button"
            className="primary-button guide-start-button"
            onClick={onBack}
          >
            スライドを作り始める
          </button>
        </section>

        <nav className="guide-navigation" aria-label="ガイドの目次">
          <button type="button" onClick={() => scrollToSection("guide-basic")}>
            基本的な流れ
          </button>

          <button type="button" onClick={() => scrollToSection("guide-syntax")}>
            Markdown記法
          </button>

          <button type="button" onClick={() => scrollToSection("guide-grid")}>
            グリッド
          </button>

          <button type="button" onClick={() => scrollToSection("guide-export")}>
            PPTX出力
          </button>

          <button type="button" onClick={() => scrollToSection("guide-sample")}>
            完成例
          </button>
        </nav>

        <div className="guide-content">
          <section id="guide-basic" className="guide-section">
            <div className="guide-section-heading">
              <span className="guide-section-number">01</span>

              <div>
                <h2>基本的な使い方</h2>

                <p>Markdownを入力すると、 プレビューが自動的に更新されます。</p>
              </div>
            </div>

            <div className="guide-step-grid">
              <article className="guide-step-card">
                <span className="guide-step-number">1</span>

                <h3>Markdownを入力</h3>

                <p>エディターへタイトルや本文を Markdown形式で入力します。</p>
              </article>

              <article className="guide-step-card">
                <span className="guide-step-number">2</span>

                <h3>プレビューを確認</h3>

                <p>入力内容が自動的に スライドへ変換されます。</p>
              </article>

              <article className="guide-step-card">
                <span className="guide-step-number">3</span>

                <h3>デザインを調整</h3>

                <p>色、余白、文字サイズを スライド設定から変更します。</p>
              </article>

              <article className="guide-step-card">
                <span className="guide-step-number">4</span>

                <h3>PPTXを出力</h3>

                <p>完成したスライドを PowerPoint形式で保存します。</p>
              </article>
            </div>

            <CodeExample title="最初のスライド" code={BASIC_SLIDE_EXAMPLE} />
          </section>

          <section className="guide-section">
            <div className="guide-section-heading">
              <span className="guide-section-number">02</span>

              <div>
                <h2>スライドを増やす</h2>

                <p>見出し1を追加するたびに、 新しいスライドが作成されます。</p>
              </div>
            </div>

            <div className="guide-note">
              <strong>ポイント</strong>

              <p>
                行頭に
                <code>#</code>
                を1つ記述した見出しが、 スライドのタイトルと区切りになります。
              </p>
            </div>

            <CodeExample
              title="複数のスライド"
              code={MULTIPLE_SLIDES_EXAMPLE}
            />
          </section>

          <section id="guide-syntax" className="guide-section">
            <div className="guide-section-heading">
              <span className="guide-section-number">03</span>

              <div>
                <h2>対応しているMarkdown記法</h2>

                <p>スライド内で使用できる 主な記法です。</p>
              </div>
            </div>

            <div className="guide-syntax-grid">
              {SYNTAX_ITEMS.map((item) => (
                <article key={item.title} className="guide-syntax-card">
                  <h3>{item.title}</h3>

                  <p>{item.description}</p>

                  <pre>
                    <code>{item.code}</code>
                  </pre>
                </article>
              ))}
            </div>

            <CodeExample title="コードブロック" code={CODE_BLOCK_EXAMPLE} />
          </section>

          <section id="guide-grid" className="guide-section">
            <div className="guide-section-heading">
              <span className="guide-section-number">04</span>

              <div>
                <h2>2列・3列のグリッド</h2>

                <p>スライドのコンテンツ領域を 横方向に分割できます。</p>
              </div>
            </div>

            <div className="guide-grid-description">
              <article>
                <span>2 columns</span>

                <h3>2列レイアウト</h3>

                <p>
                  比較、メリットとデメリット、 説明と画像などに向いています。
                </p>
              </article>

              <article>
                <span>3 columns</span>

                <h3>3列レイアウト</h3>

                <p>3つの特徴や手順を 並べる場合に向いています。</p>
              </article>
            </div>

            <CodeExample title="2列レイアウト" code={GRID_TWO_EXAMPLE} />

            <CodeExample title="3列レイアウト" code={GRID_THREE_EXAMPLE} />

            <div className="guide-warning">
              <strong>グリッド使用時の注意</strong>

              <ul>
                <li>
                  列数は
                  <code>&lt;!-- grid: 2 --&gt;</code>
                  または
                  <code>&lt;!-- grid: 3 --&gt;</code>
                  で指定します。
                </li>

                <li>
                  <code>&lt;!-- column --&gt;</code>
                  を記述すると次の列へ移動します。
                </li>

                <li>
                  2列・3列では横幅が狭くなるため、
                  文章量を少なくするのがおすすめです。
                </li>
              </ul>
            </div>
          </section>

          <section id="guide-export" className="guide-section">
            <div className="guide-section-heading">
              <span className="guide-section-number">05</span>

              <div>
                <h2>デザイン設定とPPTX出力</h2>

                <p>
                  スライドのデザインを調整してから、
                  PowerPointファイルを生成します。
                </p>
              </div>
            </div>

            <div className="guide-feature-grid">
              <article>
                <h3>スライド設定</h3>

                <ul>
                  <li>メインカラー</li>
                  <li>背景色</li>
                  <li>本文色</li>
                  <li>アクセントカラー</li>
                  <li>各文字のフォントサイズ</li>
                  <li>スライド余白</li>
                </ul>
              </article>

              <article>
                <h3>プレゼンテーション</h3>

                <ul>
                  <li>全画面でスライドを確認</li>
                  <li>左右キーでページ移動</li>
                  <li>Escapeキーで終了</li>
                </ul>
              </article>

              <article>
                <h3>PPTXを出力</h3>

                <ul>
                  <li>ヘッダーの 「PPTXを出力」を選択</li>
                  <li>処理完了後に自動保存</li>
                  <li>PowerPointで編集可能</li>
                </ul>
              </article>
            </div>
          </section>

          <section id="guide-sample" className="guide-section">
            <div className="guide-section-heading">
              <span className="guide-section-number">06</span>

              <div>
                <h2>Markdownの完成例</h2>

                <p>
                  コピーしてエディターへ貼り付けると、 複数スライドを試せます。
                </p>
              </div>
            </div>

            <CodeExample title="サンプルMarkdown" code={FULL_EXAMPLE} />
          </section>

          <section className="guide-footer-card">
            <h2>スライドを作ってみましょう</h2>

            <p>Markdownを入力すると、 自動的にプレビューへ反映されます。</p>

            <button type="button" className="primary-button" onClick={onBack}>
              エディターへ戻る
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
