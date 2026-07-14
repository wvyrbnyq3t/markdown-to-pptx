import type { MobileView } from "../hooks/usePresentationEditor";
import { EditorIcon, PreviewIcon } from "./ui/Icons";

type MobileViewTabsProps = {
  currentView: MobileView;
  totalSlideCount: number;
  onChange: (view: MobileView) => void;
};

export function MobileViewTabs({
  currentView,
  totalSlideCount,
  onChange,
}: MobileViewTabsProps) {
  return (
    <div
      className="mobile-view-tabs"
      role="tablist"
      aria-label="編集画面とプレビューの切り替え"
    >
      <button
        id="editor-tab"
        type="button"
        role="tab"
        aria-selected={currentView === "editor"}
        aria-controls="markdown-panel"
        className={`mobile-view-tab${
          currentView === "editor" ? " active" : ""
        }`}
        onClick={() => onChange("editor")}
      >
        <EditorIcon />
        Markdown
      </button>

      <button
        id="preview-tab"
        type="button"
        role="tab"
        aria-selected={currentView === "preview"}
        aria-controls="preview-panel"
        className={`mobile-view-tab${
          currentView === "preview" ? " active" : ""
        }`}
        onClick={() => onChange("preview")}
      >
        <PreviewIcon />
        プレビュー
        <span className="mobile-slide-count">{totalSlideCount}</span>
      </button>
    </div>
  );
}
