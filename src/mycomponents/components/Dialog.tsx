// components
import Slot from "./Slot";

// hooks
import { createContext, useContext, useEffect, useRef, useState } from "react";

// styleDialog
import "../css/Dialog.css";

// types
import type {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from "react";

type DialogContextType = {
  DialogRef: RefObject<HTMLDialogElement | null>;
  openDialog: () => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

const useDialogContext = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>");
  return ctx;
};

type DialogProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Dialog = ({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: DialogProps) => {
  const DialogRef = useRef<HTMLDialogElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);

  useEffect(() => {
    const Dialog = DialogRef.current;
    if (!Dialog) return;

    if (currentOpen && !Dialog.open) {
      Dialog.showModal();
      Dialog.scrollTop = 0;
    }
    if (!currentOpen && Dialog.open) Dialog.close();
  }, [currentOpen]);

  useEffect(() => {
    const Dialog = DialogRef.current;
    if (!Dialog) return;

    const handleClose = () => setOpen(false);
    Dialog.addEventListener("close", handleClose);

    return () => {
      Dialog.removeEventListener("close", handleClose);
    };
  }, []);

  return (
    <DialogContext.Provider value={{ DialogRef, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ onClick, ...props }: HTMLAttributes<HTMLElement>) => {
  const { openDialog } = useDialogContext();

  return (
    <Slot
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        onClick?.(e);
        openDialog();
      }}
      {...props}
    />
  );
};

const DialogContent = ({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"dialog">) => {
  const { DialogRef } = useDialogContext();
  const classNames = ["l-dialog", className].filter(Boolean).join(" ");

  return (
    <dialog ref={DialogRef} className={classNames} {...props}>
      {children}
    </dialog>
  );
};

const DialogClose = ({
  onClick,
  ...props
}: HTMLAttributes<HTMLButtonElement>) => {
  const { closeDialog } = useDialogContext();

  return (
    <Slot
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        onClick?.(e);
        closeDialog();
      }}
      {...props}
    />
  );
};

export { Dialog, DialogTrigger, DialogContent, DialogClose };
