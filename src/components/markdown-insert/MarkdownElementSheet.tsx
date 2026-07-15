import { useEffect, useRef, type MouseEvent } from "react";

import {
  MARKDOWN_ELEMENT_CATEGORIES,
  MARKDOWN_ELEMENTS,
  type MarkdownElementDefinition,
} from "./markdownElementDefinitions";

type MarkdownElementSheetProps = {
  isOpen: boolean;

  onClose: () => void;

  onSelect: (definition: MarkdownElementDefinition) => void;
};

export function MarkdownElementSheet({
  isOpen,
  onClose,
  onSelect,
}: MarkdownElementSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();

      requestAnimationFrame(() => {
        firstItemRef.current?.focus();
      });

      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>): void => {
    /*
     * ダイアログ本体ではなく、
     * 背景がクリックされた場合だけ閉じます。
     */
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="markdown-element-sheet"
      aria-labelledby={"markdown-element-sheet-title"}
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="markdown-element-sheet-panel">
        <div className="markdown-element-sheet-handle" aria-hidden="true" />

        <header className="markdown-element-sheet-header">
          <div>
            <h2 id="markdown-element-sheet-title">追加する要素</h2>

            <p>挿入したい要素を選んでください。</p>
          </div>

          <button
            type="button"
            className="markdown-element-sheet-close"
            aria-label="要素一覧を閉じる"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="markdown-element-sheet-content">
          <div className="markdown-element-categories">
            {MARKDOWN_ELEMENT_CATEGORIES.map((category, categoryIndex) => {
              const categoryElements = MARKDOWN_ELEMENTS.filter((element) => {
                return element.categoryId === category.id;
              });

              return (
                <section
                  key={category.id}
                  className="markdown-element-category"
                  aria-labelledby={`markdown-category-${category.id}`}
                >
                  <div className="markdown-element-category-header">
                    <h3 id={`markdown-category-${category.id}`}>
                      {category.label}
                    </h3>

                    <p>{category.description}</p>
                  </div>

                  <div className="markdown-element-list">
                    {categoryElements.map((element, elementIndex) => {
                      const isFirstItem =
                        categoryIndex === 0 && elementIndex === 0;

                      return (
                        <button
                          key={element.id}
                          ref={isFirstItem ? firstItemRef : undefined}
                          type="button"
                          className="markdown-element-item"
                          onClick={() => {
                            onSelect(element);
                          }}
                        >
                          <span
                            className="markdown-element-item-symbol"
                            aria-hidden="true"
                          >
                            {element.symbol}
                          </span>

                          <span className="markdown-element-item-body">
                            <strong>{element.label}</strong>

                            <span className="markdown-element-item-description">
                              {element.description}
                            </span>

                            <code>{element.syntax}</code>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </dialog>
  );
}
