import type { KeyboardEventHandler, PointerEventHandler } from "react";

type WorkspaceResizerProps = {
  editorRatio: number;
  isResizing: boolean;

  onPointerDown: PointerEventHandler<HTMLDivElement>;

  onPointerMove: PointerEventHandler<HTMLDivElement>;

  onPointerUp: PointerEventHandler<HTMLDivElement>;

  onPointerCancel: PointerEventHandler<HTMLDivElement>;

  onKeyDown: KeyboardEventHandler<HTMLDivElement>;

  onReset: () => void;
};

export function WorkspaceResizer({
  editorRatio,
  isResizing,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  onReset,
}: WorkspaceResizerProps) {
  const roundedEditorRatio = Math.round(editorRatio);

  return (
    <div
      className={["workspace-resizer", isResizing ? "is-resizing" : ""]
        .filter(Boolean)
        .join(" ")}
      role="separator"
      aria-label={"エディターとプレビューの幅を変更"}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={roundedEditorRatio}
      aria-valuetext={`エディター約${roundedEditorRatio}%`}
      tabIndex={0}
      title={"ドラッグで幅を変更。ダブルクリックで初期化。"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      onDoubleClick={onReset}
    >
      <span className="workspace-resizer-line" aria-hidden="true" />

      <span className="workspace-resizer-grip" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
