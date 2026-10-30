import { useId, useRef } from "react";
import { X } from "lucide-react";
import { ModalDialog } from "../ui/ModalDialog";
import { INSERT_DEFINITIONS, type InsertDefinition } from "./insertDefinitions";

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (item: InsertDefinition) => void;
  onInsertImage: () => void;
  imageBusy: boolean;
}

const CATEGORIES = [
  { id: "text", label: "テキスト" },
  { id: "decoration", label: "文字装飾" },
  { id: "layout", label: "レイアウト" },
  { id: "elements", label: "コンテンツ" },
] as const;

export function InsertSheet({
  open,
  onClose,
  onInsert,
  onInsertImage,
  imageBusy,
}: Props) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const sections = useRef<
    Partial<Record<InsertDefinition["category"], HTMLElement | null>>
  >({});

  function scrollToCategory(category: InsertDefinition["category"]) {
    const list = listRef.current;
    const section = sections.current[category];
    if (!list || !section) return;
    const padding = Number.parseFloat(getComputedStyle(list).paddingTop) || 0;
    const top =
      list.scrollTop +
      section.getBoundingClientRect().top -
      list.getBoundingClientRect().top -
      padding;
    list.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    // 次のTabでそのカテゴリの要素へ移れるようにする。
    section.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
  }

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      className="p-insert-sheet"
      labelledBy={`${id}-title`}
    >
      <header className="p-insert-sheet__header">
        <div>
          <h2 id={`${id}-title`}>要素を追加</h2>
          <p>クリックするとカーソル位置へ挿入されます</p>
        </div>
        <button
          type="button"
          className="c-icon-button"
          onClick={onClose}
          aria-label="閉じる"
          autoFocus
        >
          <X size={20} />
        </button>
      </header>
      <nav className="p-insert-sheet__categories" aria-label="要素のカテゴリ">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className="c-tab"
            aria-controls={`${id}-${category.id}`}
            onClick={() => scrollToCategory(category.id)}
          >
            {category.label}
          </button>
        ))}
      </nav>
      <div ref={listRef} className="p-insert-sheet__body">
        {CATEGORIES.map((category) => (
          <section
            key={category.id}
            id={`${id}-${category.id}`}
            className="p-insert-sheet__category"
            aria-labelledby={`${id}-${category.id}-title`}
            ref={(element) => {
              sections.current[category.id] = element;
            }}
          >
            <h3 id={`${id}-${category.id}-title`} tabIndex={-1}>
              {category.label}
            </h3>
            <div className="p-insert-sheet__grid">
              {category.id === "elements" && (
                <button
                  type="button"
                  className="p-insert-sheet__option"
                  onClick={onInsertImage}
                  disabled={imageBusy}
                >
                  <strong>画像</strong>
                  <span>端末のPNG・JPEG・WebPを挿入</span>
                </button>
              )}
              {INSERT_DEFINITIONS.filter(
                (item) => item.category === category.id,
              ).map((item) => (
                <button
                  type="button"
                  className="p-insert-sheet__option"
                  key={item.id}
                  onClick={() => onInsert(item)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ModalDialog>
  );
}
