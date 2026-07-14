import type { MobileView } from "../hooks/usePresentationEditor";

type MarkdownEditorPanelProps = {
  markdown: string;
  fileName: string;
  mobileView: MobileView;
  onMarkdownChange: (value: string) => void;
  onFileNameChange: (value: string) => void;
};

export function MarkdownEditorPanel({
  markdown,
  fileName,
  mobileView,
  onMarkdownChange,
  onFileNameChange,
}: MarkdownEditorPanelProps) {
  const lineCount = markdown.split(/\r?\n/).length;

  return (
    <section
      id="markdown-panel"
      role="tabpanel"
      aria-labelledby="editor-tab"
      className={[
        "editor-section",
        "mobile-view-panel",
        mobileView === "editor" ? "mobile-active" : "mobile-hidden",
      ].join(" ")}
    >
      <div className="section-header">
        <div>
          <h2>Markdown</h2>
          <p>「# 見出し」で新しいスライドを作成します。</p>
        </div>

        <label className="file-name-field">
          <input
            type="text"
            value={fileName}
            onChange={(event) => onFileNameChange(event.target.value)}
            aria-label="出力ファイル名"
          />
          <span aria-hidden="true">.pptx</span>
        </label>
      </div>

      <textarea
        className="markdown-editor"
        value={markdown}
        onChange={(event) => onMarkdownChange(event.target.value)}
        spellCheck={false}
        aria-label="Markdown入力欄"
      />

      <div className="editor-status">
        <span>{markdown.length.toLocaleString()}文字</span>
        <span>{lineCount.toLocaleString()}行</span>
      </div>
    </section>
  );
}
