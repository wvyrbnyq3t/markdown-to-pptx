import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MarkdownSaveIcon() {
  return (
    <BaseIcon className="button-icon">
      <path d="M4 3h12l4 4v14H4Z" />
      <path d="M8 3v6h8V4" />
      <path d="M8 17v-4" />
      <path d="m8 13 2 2 2-2" />
      <path d="M15 14h2" />
      <path d="M16 13v4" />
    </BaseIcon>
  );
}

export function FolderOpenIcon() {
  return (
    <BaseIcon className="button-icon">
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1" />
      <path d="M3 9h18l-2 9a2 2 0 0 1-2 1H5a2 2 0 0 1-2-2Z" />
    </BaseIcon>
  );
}

export function DownloadIcon() {
  return (
    <BaseIcon className="button-icon">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </BaseIcon>
  );
}

export function LoadingIcon() {
  return (
    <BaseIcon className="button-icon loading-icon">
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </BaseIcon>
  );
}

export function SettingsIcon() {
  return (
    <BaseIcon className="button-icon settings-button-icon">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1.1 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.34.72.6 1 .3.26.68.4 1.1.4H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51.6Z" />
    </BaseIcon>
  );
}

export function EditorIcon() {
  return (
    <BaseIcon className="tab-icon">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </BaseIcon>
  );
}

export function PreviewIcon() {
  return (
    <BaseIcon className="tab-icon">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </BaseIcon>
  );
}

export function CloseIcon({ className = "close-icon" }: { className?: string }) {
  return (
    <BaseIcon className={className}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </BaseIcon>
  );
}

export function PlayIcon() {
  return (
    <BaseIcon className="presentation-button-icon">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m10 8 6 4-6 4Z" />
    </BaseIcon>
  );
}

export function MenuIcon() {
  return (
    <BaseIcon
      className="header-menu-icon"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </BaseIcon>
  );
}