import { useEffect, useRef } from "react";

import { CloseIcon } from "./ui/Icons";

type HeaderMenuDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

type MenuLink = {
  label: string;
  description: string;
  href: string;
};

const MENU_LINKS: MenuLink[] = [
  {
    label: "使い方",
    description: "基本的なスライドの作成方法を確認します。",
    href: "/markdown-to-pptx/#/guide",
  },
];

export function HeaderMenuDialog({ isOpen, onClose }: HeaderMenuDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();

      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });

      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleDialogClick = (
    event: React.MouseEvent<HTMLDialogElement>,
  ): void => {
    /*
     * メニュー本体ではなく、
     * 背景をクリックした場合だけ閉じます。
     */
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="header-menu-dialog"
      aria-labelledby="header-menu-title"
      onClick={handleDialogClick}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="header-menu-panel">
        <header className="header-menu-panel-header">
          <div>
            <p className="header-menu-app-name">ポンっ！</p>

            <h2 id="header-menu-title">メニュー</h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="header-menu-close-button"
            aria-label="メニューを閉じる"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <nav className="header-menu-navigation" aria-label="アプリメニュー">
          {MENU_LINKS.map(({ label, description, href }) => (
            <a
              key={label}
              className="header-menu-link"
              href={href}
              rel="noreferrer"
              onClick={onClose}
            >
              <span className="header-menu-link-content">
                <strong>{label}</strong>

                <span>{description}</span>
              </span>

              <span className="header-menu-link-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </nav>
      </div>
    </dialog>
  );
}
