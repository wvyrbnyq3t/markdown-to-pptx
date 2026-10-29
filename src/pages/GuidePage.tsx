import { useState } from "react";
import { Link } from "react-router-dom";
import { GUIDE_EXAMPLES } from "../features/guide/examples";
import { parseMarkdown } from "../features/markdown/parseMarkdown";
import { DEFAULT_SETTINGS } from "../types/settings";
import { SlideContent } from "../components/preview/SlideContent";
import { SlideThumbnail } from "../components/preview/PreviewPanel";

const settings = {
  ...DEFAULT_SETTINGS,
  pageTitle: { ...DEFAULT_SETTINGS.pageTitle, isEnabled: false },
};
function GuideExample({
  example,
}: {
  example: (typeof GUIDE_EXAMPLES)[number];
}) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(example.code);
      setStatus("コピーしました");
    } catch {
      setStatus("コピーできませんでした。入力例を選択してコピーしてください。");
    }
  }
  return (
    <section id={example.id} className="p-guide__section">
      <h2>{example.title}</h2>
      <p>{example.effect}</p>
      <div className="p-guide__comparison">
        <div>
          <div className="p-guide__label">
            <h3>こう書く</h3>
            <button
              type="button"
              className="c-button c-button--subtle"
              onClick={() => void copy()}
            >
              入力例をコピー
            </button>
          </div>
          <pre>
            <code>{example.code}</code>
          </pre>
          <p role="status">{status}</p>
        </div>
        <div>
          <h3 className="p-guide__label">こう反映される</h3>
          <div className="p-guide__results">
            {parseMarkdown(example.code).map((slide, index) => (
              <div className="p-guide__result" key={slide.id}>
                <SlideThumbnail label={`${example.title}の表示例 ${index + 1}`}>
                  <SlideContent
                    slide={slide}
                    settings={settings}
                    slideNumber={index + 1}
                  />
                </SlideThumbnail>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="p-guide__hint">{example.note}</p>
    </section>
  );
}
export function GuidePage() {
  return (
    <div className="l-app">
      <header className="l-header">
        <div className="l-header__actions">
          <Link to="/editor" className="c-button c-button--primary">
            作ってみる
          </Link>
        </div>
      </header>
      <main className="p-guide">
        <div className="p-guide__intro">
          <h1>使い方</h1>
        </div>
        <nav aria-label="使い方の目次" className="p-guide__navigation">
          {GUIDE_EXAMPLES.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.title}
            </a>
          ))}
          <a href="#images">画像</a>
          <a href="#logo">ロゴ</a>
          <a href="#present">発表・保存</a>
        </nav>
        <div className="p-guide__examples">
          {GUIDE_EXAMPLES.map((example) => (
            <GuideExample key={example.id} example={example} />
          ))}
          <section id="images" className="p-guide__section">
            <h2>画像を入れる</h2>
            <p>
              画像ボタンから選択するか、画像ファイルをエディタへドロップ・貼り付けすると、次の形式の記法が自動挿入されます。
            </p>
            <pre>
              <code>{"![画像の説明](asset:自動発行された画像ID)"}</code>
            </pre>
            <p className="p-guide__hint">
              画像IDは手入力しません。この例のIDは説明用で、そのまま貼り付けても画像は表示されません。
            </p>
            <p>
              挿入位置に画像が表示されます。直前に{" "}
              <code>{"<!-- align: center -->"}</code>{" "}
              を書くと中央、rightなら右に配置されます。PNG・JPEG・WebP、1枚10MBまで対応しています。
            </p>
            <p>
              画像はこのブラウザ内に保存されます。別端末へ移す場合は「画像込みZIP」を保存してください。Markdownだけでは画像を引き継げません。
            </p>
          </section>
          <section id="logo" className="p-guide__section">
            <h2>ロゴを入れる</h2>
            <p>「スライド設定 → ロゴ」から指定します。</p>
            <ol>
              <li>「タイトルページ以外にロゴを表示」をオンにする。</li>
              <li>PNGファイルを選択する（512KB以内）。</li>
              <li>右上・左上と横幅（16〜320px）を指定する。</li>
            </ol>
            <p className="p-guide__hint">
              表紙を除く全スライドに表示され、端からの距離はスライド余白と同じになります。縦横比を保ち、高さ200pxを超える場合は縮小します。タイトルと重ならないよう領域を確保するため、本文の開始位置が下がることがあります。
            </p>
            <p>
              ロゴはプレビュー・発表モード・PPTXに反映され、設定JSONにも画像ごと保存されます。
            </p>
          </section>
          <section id="present" className="p-guide__section">
            <h2>確認して、発表・保存する</h2>
            <p>
              プレビューで収まりを確認してから「発表」で開始します。→・Spaceで次、←で前、Escで終了できます。スマートフォンでは左右スワイプでも切り替えられます。
            </p>
            <ul>
              <li>
                <strong>PPTX：</strong>PowerPointで利用するとき。
              </li>
              <li>
                <strong>画像込みZIP：</strong>
                本文・設定・画像をまとめて保存し、別端末で編集を再開するとき。
              </li>
              <li>
                <strong>Markdown：</strong>
                本文の記法を保存するとき。画像の実体やデザイン設定は含みません。
              </li>
              <li>
                <strong>設定JSON：</strong>
                色・余白・文字サイズ・ロゴなどの設定を持ち運ぶとき。
              </li>
            </ul>
            <p className="p-guide__hint">
              内容が収まらない場合、自動改ページはされません。#
              でページを分けるか、文字サイズ・余白・内容量を調整してください。PPTXはフォントや描画の違いで見た目が変わるため、出力後も確認してください。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
