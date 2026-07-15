import { useRef, useState } from "react";

import type { MobileView } from "../hooks/usePresentationEditor";

import {
  insertMarkdownAtSelection,
  type MarkdownSelection,
} from "../utils/insertMarkdown";

import { MarkdownElementSheet } from "./markdown-insert/MarkdownElementSheet";

import type { MarkdownElementDefinition } from "./markdown-insert/markdownElementDefinitions";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectionRef = useRef<MarkdownSelection>({
    start: 0,
    end: 0,
  });

  const [isElementSheetOpen, setIsElementSheetOpen] = useState(false);

  const lineCount = markdown.split(/\r?\n/).length;

  const rememberSelection = (): void => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    selectionRef.current = {
      start: textarea.selectionStart,

      end: textarea.selectionEnd,
    };
  };

  const openElementSheet = (): void => {
    rememberSelection();
    setIsElementSheetOpen(true);
  };

  const restoreEditorSelection = (
    selectionStart: number,
    selectionEnd: number,
  ): void => {
    /*
     * onMarkdownChangeでtextareaが再描画された後に、
     * フォーカスと選択範囲を戻します。
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
          return;
        }

        textarea.focus();

        textarea.setSelectionRange(selectionStart, selectionEnd);

        selectionRef.current = {
          start: selectionStart,
          end: selectionEnd,
        };
      });
    });
  };

  const handleElementSelect = (definition: MarkdownElementDefinition): void => {
    const selection = selectionRef.current;

    const normalizedStart = Math.min(
      Math.max(selection.start, 0),
      markdown.length,
    );

    const normalizedEnd = Math.min(
      Math.max(selection.end, normalizedStart),
      markdown.length,
    );

    const selectedText = markdown.slice(normalizedStart, normalizedEnd);

    const insertion = definition.createInsertion(selectedText);

    const result = insertMarkdownAtSelection(
      markdown,
      {
        start: normalizedStart,
        end: normalizedEnd,
      },
      insertion,
    );

    onMarkdownChange(result.value);

    setIsElementSheetOpen(false);

    restoreEditorSelection(result.selectionStart, result.selectionEnd);
  };

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

          <p>「要素を追加」から簡単に入力できます。</p>
        </div>

        <label className="file-name-field">
          <input
            type="text"
            value={fileName}
            onChange={(event) => {
              onFileNameChange(event.target.value);
            }}
            aria-label="出力ファイル名"
          />

          <span aria-hidden="true">.pptx</span>
        </label>
      </div>

      <div className="markdown-editor-shell">
        <textarea
          ref={textareaRef}
          className="markdown-editor"
          value={markdown}
          onChange={(event) => {
            onMarkdownChange(event.target.value);

            selectionRef.current = {
              start: event.currentTarget.selectionStart,

              end: event.currentTarget.selectionEnd,
            };
          }}
          onSelect={rememberSelection}
          onClick={rememberSelection}
          onKeyUp={rememberSelection}
          onFocus={rememberSelection}
          spellCheck={false}
          aria-label="Markdown入力欄"
        />

        <button
          type="button"
          className="markdown-insert-trigger"
          aria-haspopup="dialog"
          aria-expanded={isElementSheetOpen}
          onPointerDown={rememberSelection}
          onClick={openElementSheet}
        >
          <span className="markdown-insert-trigger-icon" aria-hidden="true">
            ＋
          </span>
        </button>
      </div>

      <div className="editor-status">
        <span>
          {markdown.length.toLocaleString()}
          文字
        </span>

        <span>{lineCount.toLocaleString()}行</span>
      </div>

      <MarkdownElementSheet
        isOpen={isElementSheetOpen}
        onClose={() => {
          setIsElementSheetOpen(false);
        }}
        onSelect={handleElementSelect}
      />
    </section>
  );
}
