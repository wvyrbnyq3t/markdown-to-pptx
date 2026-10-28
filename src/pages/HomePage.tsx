import { Link } from "react-router-dom";
import { ArrowRight, Download, Eye, FileCode2, LayoutTemplate } from "lucide-react";

export function HomePage() {
  return <div className="l-app">
    <header className="l-header"><Link to="/" className="c-brand">ポンっ！</Link><nav className="l-header__actions"><Link to="/guide" className="c-button c-button--subtle">使い方</Link><Link to="/editor" className="c-button c-button--primary">編集を始める<ArrowRight size={17} /></Link></nav></header>
    <main className="p-home">
      <div className="p-home__hero"><p className="p-home__eyebrow">Markdown × PowerPoint</p><h1>書くだけで、<br />スライドができる。</h1><p>Markdownを書くだけでプレゼンテーションを作成。<br />リアルタイムに確認して、そのままPPTXで保存できます。</p><div className="p-home__actions"><Link className="c-button c-button--primary c-button--large" to="/editor">エディタを開く<ArrowRight size={18} /></Link><Link className="c-button c-button--subtle c-button--large" to="/guide">記法を見る</Link></div></div>
      <div className="p-home__features">
        <div><FileCode2 /><h2>Markdownで編集</h2><p>見出しやリストをテキストで素早く記述。</p></div>
        <div><Eye /><h2>リアルタイムプレビュー</h2><p>入力と同時にスライドへ反映。</p></div>
        <div><LayoutTemplate /><h2>自由なレイアウト</h2><p>複数カラム・配置・色・余白を変更。</p></div>
        <div><Download /><h2>PPTX形式で保存</h2><p>PowerPointとしてダウンロードできます。</p></div>
      </div>
    </main>
  </div>;
}
