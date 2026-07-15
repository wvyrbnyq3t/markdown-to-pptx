// components
import Slot from "./Slot";

// hooks
import { createContext, useContext, useEffect, useRef, useState } from "react";

// stylesheet
import "../css/Sheet.css";

// types
import type {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from "react";

type SheetContextType = {
  sheetRef: RefObject<HTMLDialogElement | null>;
  openSheet: () => void;
  closeSheet: () => void;
};

const SheetContext = createContext<SheetContextType | null>(null);

const useSheetContext = () => {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within <Sheet>");
  return ctx;
};

type SheetProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Sheet = ({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: SheetProps) => {
  const sheetRef = useRef<HTMLDialogElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const openSheet = () => setOpen(true);
  const closeSheet = () => setOpen(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    if (currentOpen && !sheet.open) {
      sheet.showModal();
      sheet.scrollTop = 0;
    }
    if (!currentOpen && sheet.open) sheet.close();
  }, [currentOpen]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleClose = () => setOpen(false);
    sheet.addEventListener("close", handleClose);

    return () => {
      sheet.removeEventListener("close", handleClose);
    };
  }, []);

  return (
    <SheetContext.Provider value={{ sheetRef, openSheet, closeSheet }}>
      {children}
    </SheetContext.Provider>
  );
};

const SheetTrigger = ({ onClick, ...props }: HTMLAttributes<HTMLElement>) => {
  const { openSheet } = useSheetContext();

  return (
    <Slot
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        onClick?.(e);
        openSheet();
      }}
      {...props}
    />
  );
};

type SheetPanelProps = {
  direction: "top" | "bottom" | "left" | "right";
  size: "sm" | "md" | "lg" | "full";
} & ComponentPropsWithoutRef<"dialog">;

const SheetPanel = ({
  children,
  className,
  direction,
  size,
  ...props
}: SheetPanelProps) => {
  const { sheetRef } = useSheetContext();
  const classNames = [
    "l-sheet",
    `l-sheet--${size}`,
    `l-sheet--${direction}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <dialog ref={sheetRef} className={classNames} {...props}>
      {children}
    </dialog>
  );
};

type SheetHeaderProps = {
  position?: "fixed" | "sticky";
} & ComponentPropsWithoutRef<"header">;

const SheetHeader = ({ className, position, ...props }: SheetHeaderProps) => {
  const classNames = [
    "l-sheet-header",
    position && `l-sheet-header--${position}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <header className={classNames} {...props} />;
};

const SheetContent = ({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) => {
  const classNames = ["l-sheet-content", className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

const SheetFooter = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"footer">) => {
  const classNames = ["l-sheet-footer", className].filter(Boolean).join(" ");

  return <footer className={classNames} {...props} />;
};

const SheetClose = ({
  onClick,
  ...props
}: HTMLAttributes<HTMLButtonElement>) => {
  const { closeSheet } = useSheetContext();

  return (
    <Slot
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        onClick?.(e);
        closeSheet();
      }}
      {...props}
    />
  );
};

export {
  Sheet,
  SheetTrigger,
  SheetPanel,
  SheetHeader,
  SheetContent,
  SheetFooter,
  SheetClose,
};
