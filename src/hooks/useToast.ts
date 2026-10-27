import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastMessage["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, type }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), 5000));
  }, [dismiss]);

  useEffect(() => () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer);
    timers.current.clear();
  }, []);

  return { toasts, notify, dismiss };
}
