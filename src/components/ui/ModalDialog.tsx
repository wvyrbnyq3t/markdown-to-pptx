import { useLayoutEffect, useRef } from "react";
import type { PointerEvent, ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  className: string;
  labelledBy: string;
  children: ReactNode;
}

/** Reactの状態をネイティブdialogと同期。フォーカス管理はshowModalに任せる。 */
export function ModalDialog({
  open,
  onClose,
  className,
  labelledBy,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPressed = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useLayoutEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  function isBackdrop(event: PointerEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const rect = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }

  return (
    <dialog
      ref={ref}
      className={`c-dialog ${className}`}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={(event) => {
        // closeイベントが届く前に再度開かれた場合は、新しい表示を閉じない。
        if (!event.currentTarget.open && open) onClose();
      }}
      onPointerDown={(event) => {
        backdropPressed.current = event.button === 0 && isBackdrop(event);
      }}
      onPointerUp={(event) => {
        const dismiss = backdropPressed.current && isBackdrop(event);
        backdropPressed.current = false;
        if (dismiss) onClose();
      }}
      onPointerCancel={() => {
        backdropPressed.current = false;
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
