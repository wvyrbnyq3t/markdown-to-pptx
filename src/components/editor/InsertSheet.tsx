import { useState } from "react";
import { X } from "lucide-react";
import { INSERT_DEFINITIONS, type InsertDefinition } from "./insertDefinitions";

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (item: InsertDefinition) => void;
}

const CATEGORIES = [
  { id: "text", label: "テキスト" },
  { id: "decoration", label: "文字装飾" },
  { id: "layout", label: "レイアウト" },
  { id: "elements", label: "コンテンツ" },
] as const;

export function InsertSheet({ open, onClose, onInsert }: Props) {
  const [category, setCategory] = useState<InsertDefinition["category"]>("text");
  if (!open) return null;
  return <div className="c-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="p-insert-sheet" role="dialog" aria-modal="true" aria-label="Markdown要素を挿入">
      <header className="p-insert-sheet__header"><div><strong>要素を挿入</strong><p>クリックするとカーソル位置へ挿入されます</p></div><button className="c-icon-button" onClick={onClose} aria-label="閉じる"><X size={20} /></button></header>
      <div className="p-insert-sheet__tabs" role="tablist">
        {CATEGORIES.map((item) => <button key={item.id} role="tab" aria-selected={category === item.id} className={`c-tab ${category === item.id ? "c-tab--active" : ""}`} onClick={() => setCategory(item.id)}>{item.label}</button>)}
      </div>
      <div className="p-insert-sheet__grid">
        {INSERT_DEFINITIONS.filter((item) => item.category === category).map((item) => <button className="p-insert-sheet__option" key={item.id} onClick={() => onInsert(item)}><strong>{item.label}</strong><span>{item.description}</span></button>)}
      </div>
    </section>
  </div>;
}
