import { useEffect, useRef, useState, type MouseEvent } from "react";

import {
  MARKDOWN_ELEMENT_CATEGORIES,
  MARKDOWN_ELEMENTS,
  type MarkdownElementCategoryId,
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

  const contentRef = useRef<HTMLDivElement>(null);

  const firstItemRef = useRef<HTMLButtonElement>(null);

  const categorySectionRefs = useRef<
    Partial<Record<MarkdownElementCategoryId, HTMLElement | null>>
  >({});

  const categoryButtonRefs = useRef<
    Partial<Record<MarkdownElementCategoryId, HTMLButtonElement | null>>
  >({});

  const [activeCategoryId, setActiveCategoryId] =
    useState<MarkdownElementCategoryId>("slide");

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();

      setActiveCategoryId("slide");

      requestAnimationFrame(() => {
        contentRef.current?.scrollTo({
          top: 0,
        });

        firstItemRef.current?.focus();
      });

      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const activeButton = categoryButtonRefs.current[activeCategoryId];

    activeButton?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategoryId]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const scrollToCategory = (categoryId: MarkdownElementCategoryId): void => {
    const content = contentRef.current;

    const section = categorySectionRefs.current[categoryId];

    if (!content || !section) {
      return;
    }

    const contentRect = content.getBoundingClientRect();

    const sectionRect = section.getBoundingClientRect();

    const scrollTop = content.scrollTop + sectionRect.top - contentRect.top;

    setActiveCategoryId(categoryId);

    content.scrollTo({
      top: scrollTop,
      behavior: "smooth",
    });
  };

  const handleContentScroll = (): void => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const isNearBottom =
      content.scrollTop + content.clientHeight >= content.scrollHeight - 8;

    if (isNearBottom) {
      const lastCategory =
        MARKDOWN_ELEMENT_CATEGORIES[MARKDOWN_ELEMENT_CATEGORIES.length - 1];

      if (lastCategory) {
        setActiveCategoryId(lastCategory.id);
      }

      return;
    }

    const contentRect = content.getBoundingClientRect();

    /*
     * コンテンツ上端から少し下を、
     * 現在表示中のカテゴリー判定位置にします。
     */
    const detectionLine = contentRect.top + 48;

    let nextCategoryId: MarkdownElementCategoryId =
      MARKDOWN_ELEMENT_CATEGORIES[0]?.id ?? "slide";

    for (const category of MARKDOWN_ELEMENT_CATEGORIES) {
      const section = categorySectionRefs.current[category.id];

      if (!section) {
        continue;
      }

      const sectionRect = section.getBoundingClientRect();

      if (sectionRect.top <= detectionLine) {
        nextCategoryId = category.id;

        continue;
      }

      break;
    }

    setActiveCategoryId(nextCategoryId);
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
        <div className="markdown-element-sheet-top">
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
          <nav
            className="markdown-element-category-tabs"
            aria-label="要素カテゴリー"
          >
            <div className="markdown-element-category-tabs-inner">
              {MARKDOWN_ELEMENT_CATEGORIES.map((category) => {
                const isActive = activeCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    ref={(element) => {
                      categoryButtonRefs.current[category.id] = element;
                    }}
                    type="button"
                    className={[
                      "markdown-element-category-tab",
                      isActive ? "is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={isActive}
                    onClick={() => {
                      scrollToCategory(category.id);
                    }}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
        <div
          ref={contentRef}
          className="markdown-element-sheet-content"
          onScroll={handleContentScroll}
        >
          <div className="markdown-element-categories">
            {MARKDOWN_ELEMENT_CATEGORIES.map((category, categoryIndex) => {
              const categoryElements = MARKDOWN_ELEMENTS.filter((element) => {
                return element.categoryId === category.id;
              });
              return (
                <section
                  key={category.id}
                  ref={(element) => {
                    categorySectionRefs.current[category.id] = element;
                  }}
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
