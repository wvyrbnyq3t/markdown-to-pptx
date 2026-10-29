import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import { ImagePlus, Plus, Redo2, Undo2 } from "lucide-react";
import type { EditorSnapshot } from "../../features/editor/useMarkdownHistory";

interface Props {
  markdown: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  canUndo: boolean;
  canRedo: boolean;
  onChange: (snapshot: EditorSnapshot, kind?: "typing" | "command") => void;
  onSelectionChange: (start: number, end: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSheet: () => void;
  onOpenImagePicker: () => void;
  onImageFiles: (files: File[]) => void;
  imageBusy: boolean;
}

export function MarkdownEditorPanel({
  markdown,
  textareaRef,
  canUndo,
  canRedo,
  onChange,
  onSelectionChange,
  onUndo,
  onRedo,
  onOpenSheet,
  onOpenImagePicker,
  onImageFiles,
  imageBusy,
}: Props) {
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const input = event.currentTarget;
    onChange({
      text: input.value,
      start: input.selectionStart,
      end: input.selectionEnd,
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier && key === "z") {
      event.preventDefault();
      if (event.shiftKey) onRedo();
      else onUndo();
      return;
    }
    if (modifier && key === "y") {
      event.preventDefault();
      onRedo();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indent = "   ";

    if (event.shiftKey) {
      // Shift+Tab：選択行またはカーソル行の先頭から最大3スペース削除。
      const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
      const prefix = markdown.slice(lineStart).match(/^ {1,3}/)?.[0] ?? "";
      if (!prefix) return;
      onChange(
        {
          text:
            markdown.slice(0, lineStart) +
            markdown.slice(lineStart + prefix.length),
          start: Math.max(lineStart, start - prefix.length),
          end: Math.max(lineStart, end - prefix.length),
        },
        "command",
      );
      return;
    }

    if (start !== end && markdown.slice(start, end).includes("\n")) {
      const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
      const block = markdown.slice(lineStart, end);
      const indented = indent + block.replace(/\n/g, `\n${indent}`);
      const count = block.split("\n").length;
      onChange(
        {
          text: markdown.slice(0, lineStart) + indented + markdown.slice(end),
          start: start + 3,
          end: end + count * 3,
        },
        "command",
      );
      return;
    }
    // Tabは選択文字列を置換して半角スペース3つを挿入する。
    onChange(
      {
        text: markdown.slice(0, start) + indent + markdown.slice(end),
        start: start + 3,
        end: start + 3,
      },
      "command",
    );
  }

  return (
    <section className="p-editor__markdown" aria-label="Markdownエディタ">
      <div className="p-editor__pane-header">
        <div className="p-editor__pane-actions">
          <div>
            <button
              type="button"
              className="c-icon-button"
              aria-label="元に戻す"
              title="元に戻す (Ctrl/⌘+Z)"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 size={18} />
            </button>
            <button
              type="button"
              className="c-icon-button"
              aria-label="やり直す"
              title="やり直す (Ctrl/⌘+Shift+Z)"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 size={18} />
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-1)",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="c-button c-button--small c-button--subtle"
              onClick={onOpenImagePicker}
              disabled={imageBusy}
              aria-label="画像を挿入"
            >
              <ImagePlus size={16} />
              {imageBusy ? "読込中…" : "画像を挿入"}
            </button>
            <button
              type="button"
              className="c-button c-button--small c-button--subtle"
              onClick={onOpenSheet}
            >
              <Plus size={16} />
              要素を挿入
            </button>
          </div>
        </div>
      </div>
      <textarea
        className="p-editor__textarea"
        ref={textareaRef}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-label="スライド用Markdown"
        value={markdown}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={(event) => {
          if (event.dataTransfer.files.length === 0) return;
          event.preventDefault();
          onImageFiles(Array.from(event.dataTransfer.files));
        }}
        onPaste={(event) => {
          const images = Array.from(event.clipboardData.files).filter((file) =>
            file.type.startsWith("image/"),
          );
          if (images.length === 0) return;
          event.preventDefault();
          onImageFiles(images);
        }}
        onSelect={(event) =>
          onSelectionChange(
            event.currentTarget.selectionStart,
            event.currentTarget.selectionEnd,
          )
        }
        placeholder="「#」を入力して新しいスライドを追加"
      />
      <div className="p-editor__editor-footer">
        <span>{markdown.split("\n").length} 行</span>
        <span>{markdown.length.toLocaleString("ja-JP")} 文字</span>
        <span>Tab：半角スペース3つ</span>
      </div>
    </section>
  );
}
