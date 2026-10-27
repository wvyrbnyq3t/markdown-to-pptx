import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";
import type { ToastMessage } from "../../hooks/useToast";

interface Props { toasts: ToastMessage[]; onDismiss: (id: string) => void; }
export function ToastViewport({ toasts, onDismiss }: Props) {
  return <div className="c-toast-viewport" aria-live="polite" aria-atomic="false">
    {toasts.map((toast) => <div role={toast.type === "error" ? "alert" : "status"} key={toast.id} className={`c-toast c-toast--${toast.type}`}>
      {toast.type === "error" ? <AlertCircle size={19} /> : toast.type === "success" ? <CheckCircle2 size={19} /> : <Info size={19} />}
      <span>{toast.message}</span>
      <button type="button" className="c-icon-button" onClick={() => onDismiss(toast.id)} aria-label="通知を閉じる"><X size={16} /></button>
    </div>)}
  </div>;
}
