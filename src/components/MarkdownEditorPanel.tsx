import { useRef, useState } from "react";

import type { MobileView } from "../hooks/usePresentationEditor";

import {
  insertMarkdownAtSelection,
  type MarkdownSelection,
} from "../utils/insertMarkdown";
import { getMarkdownSlideIndexAtPosition } from "../utils/markdownSlidePosition";

import { MarkdownElementSheet } from "./markdown-insert/MarkdownElementSheet";

import type { MarkdownElementDefinition } from "./markdown-insert/markdownElementDefinitions";

type MarkdownEditorPanelProps = {
  markdown: string;
  fileName: string;
  mobileView: MobileView;

  onMarkdownChange: (value: string) => void;
  onFileNameChange: (value: string) => void;
  onCursorSlideChange?: (slideIndex: number) => void;
};

type MarkdownEditorState = {
  selection: MarkdownSelection;
  scrollTop: number;
  scrollLeft: number;
};

export function MarkdownEditorPanel({
  markdown,
  fileName,
  mobileView,
  onMarkdownChange,
  onFileNameChange,
  onCursorSlideChange,
}: MarkdownEditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * カーソル位置とスクロール位置をまとめて保持します。
   */
  const editorStateRef = useRef<MarkdownEditorState>({
    selection: {
      start: 0,
      end: 0,
    },
    scrollTop: 0,
    scrollLeft: 0,
  });

  const [isElementSheetOpen, setIsElementSheetOpen] = useState(false);

  // カーソル位置を特定する
  const lastCursorSlideIndexRef = useRef(-1);
  const notifyCursorSlide = (
    textarea: HTMLTextAreaElement,
    currentMarkdown = textarea.value,
  ): void => {
    const slideIndex = getMarkdownSlideIndexAtPosition(
      currentMarkdown,
      textarea.selectionStart,
    );

    if (slideIndex === lastCursorSlideIndexRef.current) {
      return;
    }

    lastCursorSlideIndexRef.current = slideIndex;

    onCursorSlideChange?.(slideIndex);
  };

  /**
   * 現在のカーソル位置と
   * スクロール位置を保存します。
   */
  const rememberEditorState = (): void => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    editorStateRef.current = {
      selection: {
        start: textarea.selectionStart,

        end: textarea.selectionEnd,
      },

      scrollTop: textarea.scrollTop,

      scrollLeft: textarea.scrollLeft,
    };
  };

  const openElementSheet = (): void => {
    /*
     * ダイアログへフォーカスが移る前に、
     * textareaの状態を保存します。
     */
    rememberEditorState();

    setIsElementSheetOpen(true);
  };

  /**
   * Markdown更新後に、カーソル位置と
   * スクロール位置を復元します。
   */
  const restoreEditorState = (
    selectionStart: number,
    selectionEnd: number,
    scrollTop: number,
    scrollLeft: number,
  ): void => {
    /*
     * Reactによるvalue更新と
     * ダイアログの終了を待ちます。
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
          return;
        }

        /*
         * ページ全体がtextareaまで
         * スクロールされることを防ぎます。
         */
        textarea.focus({
          preventScroll: true,
        });

        textarea.setSelectionRange(selectionStart, selectionEnd);

        /*
         * setSelectionRangeによって
         * textarea内部がスクロールする場合があるため、
         * カーソル設定後に復元します。
         */
        textarea.scrollTop = scrollTop;
        textarea.scrollLeft = scrollLeft;
        editorStateRef.current = {
          selection: {
            start: selectionStart,
            end: selectionEnd,
          },
          scrollTop,
          scrollLeft,
        };

        /*
         * 一部ブラウザではフォーカス処理の後に
         * 再度スクロール位置が変わることがあるため、
         * 次のフレームでも復元します。
         */
        requestAnimationFrame(() => {
          const currentTextarea = textareaRef.current;

          if (!currentTextarea) {
            return;
          }

          currentTextarea.scrollTop = scrollTop;
          currentTextarea.scrollLeft = scrollLeft;
        });
      });
    });
  };

  const handleElementSelect = (definition: MarkdownElementDefinition): void => {
    const { selection, scrollTop, scrollLeft } = editorStateRef.current;
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
    restoreEditorState(
      result.selectionStart,
      result.selectionEnd,
      scrollTop,
      scrollLeft,
    );
  };

  const handleEditorKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea = event.currentTarget;
    const currentMarkdown = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    const spaces = "   ";

    /*
     * 選択範囲がない場合は、
     * カーソル位置へスペース3つを挿入します。
     */
    if (selectionStart === selectionEnd) {
      const nextMarkdown = [
        currentMarkdown.slice(0, selectionStart),
        spaces,
        currentMarkdown.slice(selectionEnd),
      ].join("");
      const nextCursorPosition = selectionStart + spaces.length;

      textarea.value = nextMarkdown;

      onMarkdownChange(nextMarkdown);
      restoreEditorState(
        nextCursorPosition,
        nextCursorPosition,
        scrollTop,
        scrollLeft,
      );

      return;
    }

    /*
     * 複数行が選択されている場合は、
     * 選択された各行の先頭へ
     * スペース3つを追加します。
     */
    const firstLineStart =
      currentMarkdown.lastIndexOf("\n", selectionStart - 1) + 1;
    const selectedBlock = currentMarkdown.slice(firstLineStart, selectionEnd);
    const indentedBlock = selectedBlock.replace(/^/gm, spaces);
    const nextMarkdown = [
      currentMarkdown.slice(0, firstLineStart),
      indentedBlock,
      currentMarkdown.slice(selectionEnd),
    ].join("");

    const selectedLineCount = selectedBlock.split("\n").length;
    const nextSelectionStart = selectionStart + spaces.length;
    const nextSelectionEnd = selectionEnd + spaces.length * selectedLineCount;

    textarea.value = nextMarkdown;

    onMarkdownChange(nextMarkdown);
    restoreEditorState(
      nextSelectionStart,
      nextSelectionEnd,
      scrollTop,
      scrollLeft,
    );
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
          <h2>マークダウン</h2>
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

            editorStateRef.current = {
              selection: {
                start: event.currentTarget.selectionStart,

                end: event.currentTarget.selectionEnd,
              },

              scrollTop: event.currentTarget.scrollTop,

              scrollLeft: event.currentTarget.scrollLeft,
            };
            notifyCursorSlide(event.currentTarget, event.currentTarget.value);
          }}
          onSelect={(e) => {
            rememberEditorState;
            notifyCursorSlide(e.currentTarget);
          }}
          onClick={(e) => {
            rememberEditorState;
            notifyCursorSlide(e.currentTarget);
          }}
          onKeyUp={(e) => {
            rememberEditorState;
            notifyCursorSlide(e.currentTarget);
          }}
          onKeyDown={handleEditorKeyDown}
          onFocus={(e) => {
            rememberEditorState;
            notifyCursorSlide(e.currentTarget);
          }}
          onScroll={rememberEditorState}
          spellCheck={false}
          aria-label="Markdown入力欄"
        />

        <button
          type="button"
          className="markdown-insert-trigger"
          aria-haspopup="dialog"
          aria-expanded={isElementSheetOpen}
          /*
           * clickより先に実行されるため、
           * textareaからフォーカスが外れる前の
           * 状態を保存できます。
           */
          onPointerDown={rememberEditorState}
          onClick={openElementSheet}
        >
          <span className="markdown-insert-trigger-icon" aria-hidden="true">
            ＋
          </span>
        </button>
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
