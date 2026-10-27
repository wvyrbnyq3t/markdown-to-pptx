import { useCallback, useRef, useState } from "react";

export interface EditorSnapshot {
  text: string;
  start: number;
  end: number;
}

type EditKind = "typing" | "command";
const MAX_UNDO = 150;
const TYPING_GROUP_MS = 600;

/**
 * 標準のtextarea履歴に依存しないUndo/Redo。
 * 一連の文字入力は600ms以内なら同一の履歴単位として扱う。
 */
export function useMarkdownHistory(initialText: string) {
  const [text, setText] = useState(initialText);
  const snapshotRef = useRef<EditorSnapshot>({ text: initialText, start: 0, end: 0 });
  const undoRef = useRef<EditorSnapshot[]>([]);
  const redoRef = useRef<EditorSnapshot[]>([]);
  const lastEditRef = useRef<{ time: number; kind: EditKind } | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const notifyHistoryChange = useCallback(() => setHistoryVersion((version) => version + 1), []);

  const edit = useCallback((next: EditorSnapshot, kind: EditKind = "command") => {
    const before = snapshotRef.current;
    if (next.text === before.text) {
      snapshotRef.current = next;
      return;
    }
    const now = Date.now();
    const previous = lastEditRef.current;
    const isSameTypingGroup = kind === "typing" && previous?.kind === "typing" && now - previous.time < TYPING_GROUP_MS;
    if (!isSameTypingGroup) {
      undoRef.current.push({ ...before });
      if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
    }
    redoRef.current = [];
    snapshotRef.current = next;
    setText(next.text);
    lastEditRef.current = { time: now, kind };
    notifyHistoryChange();
  }, [notifyHistoryChange]);

  const undo = useCallback((): EditorSnapshot | null => {
    const previous = undoRef.current.pop();
    if (!previous) return null;
    redoRef.current.push({ ...snapshotRef.current });
    snapshotRef.current = previous;
    setText(previous.text);
    lastEditRef.current = null;
    notifyHistoryChange();
    return previous;
  }, [notifyHistoryChange]);

  const redo = useCallback((): EditorSnapshot | null => {
    const next = redoRef.current.pop();
    if (!next) return null;
    undoRef.current.push({ ...snapshotRef.current });
    snapshotRef.current = next;
    setText(next.text);
    lastEditRef.current = null;
    notifyHistoryChange();
    return next;
  }, [notifyHistoryChange]);

  const reset = useCallback((nextText: string) => {
    snapshotRef.current = { text: nextText, start: 0, end: 0 };
    undoRef.current = [];
    redoRef.current = [];
    lastEditRef.current = null;
    setText(nextText);
    notifyHistoryChange();
  }, [notifyHistoryChange]);

  const updateSelection = useCallback((start: number, end: number) => {
    snapshotRef.current = { ...snapshotRef.current, start, end };
  }, []);

  // historyVersionによってスタック変更時にボタンのdisabledが再評価される。
  void historyVersion;
  return {
    text, edit, undo, redo, reset, updateSelection,
    canUndo: undoRef.current.length > 0,
    canRedo: redoRef.current.length > 0,
  };
}
