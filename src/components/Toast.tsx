import { useEffect, useState } from "react";

import "../css/toast.css";

export type ToastType = "error" | "success" | "info";

type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
};

export function Toast({
  message,
  type = "error",
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);

    const timerId = window.setTimeout(() => {
      setIsVisible(false);

      /*
       * 退場アニメーションが終わってから
       * 親側の状態を解除します。
       */
      window.setTimeout(() => {
        onClose?.();
      }, 200);
    }, duration);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [message, duration, onClose]);

  const handleClose = (): void => {
    setIsVisible(false);

    window.setTimeout(() => {
      onClose?.();
    }, 200);
  };

  return (
    <div
      className={[
        "toast",
        `toast-${type}`,
        isVisible ? "is-visible" : "is-hidden",
      ].join(" ")}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <span className="toast-icon" aria-hidden="true">
        {getToastIcon(type)}
      </span>

      <p className="toast-message">{message}</p>

      <button
        type="button"
        className="toast-close"
        aria-label="通知を閉じる"
        onClick={handleClose}
      >
        <span aria-hidden="true">×</span>
      </button>

      <span
        className="toast-progress"
        style={{
          animationDuration: `${duration}ms`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function getToastIcon(type: ToastType): string {
  switch (type) {
    case "success":
      return "✓";

    case "info":
      return "i";

    case "error":
    default:
      return "!";
  }
}
