import type { ReactNode } from "react";
import "../css/toast.css"

type ToastContainerProps = {
  children: ReactNode;
};

export function ToastContainer({ children }: ToastContainerProps) {
  return (
    <div className="toast-container" aria-label="通知">
      {children}
    </div>
  );
}
