import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="l-app">
      <main className="p-home">
        <div className="p-home__hero">
          <p className="p-home__eyebrow">Markdown × PowerPoint</p>
          <h1>
            書くだけで、
            <br />
            スライドができる。
          </h1>
          <p>
            Markdownを書くだけでプレゼンテーションを作成。
            <br />
            リアルタイムに確認して、そのままPPTXで保存できます。
          </p>
          <div className="p-home__actions">
            <Link
              className="c-button c-button--primary c-button--large"
              to="/editor"
            >
              スライドをつくる
            </Link>
            <Link
              className="c-button c-button--subtle c-button--large"
              to="/guide"
            >
              使い方をみる
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
