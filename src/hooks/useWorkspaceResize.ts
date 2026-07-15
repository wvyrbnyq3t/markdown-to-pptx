import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const STORAGE_KEY = "pon:workspace-editor-ratio:v1";

const DEFAULT_EDITOR_RATIO = 46.5;
const MIN_EDITOR_WIDTH_PX = 320;
const MIN_PREVIEW_WIDTH_PX = 480;
const DESKTOP_MEDIA_QUERY = "(min-width: 961px)";

type WorkspaceStyle = CSSProperties & {
  "--editor-pane-ratio": string;
};

type ResizeBounds = {
  minimumRatio: number;
  maximumRatio: number;
  contentLeft: number;
  contentWidth: number;
  resizerWidth: number;
};

type UseWorkspaceResizeResult = {
  workspaceRef: RefObject<HTMLElement | null>;

  editorRatio: number;
  isResizing: boolean;
  workspaceStyle: WorkspaceStyle;

  handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  resetWorkspaceRatio: () => void;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function loadStoredEditorRatio(): number {
  if (typeof window === "undefined") {
    return DEFAULT_EDITOR_RATIO;
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return DEFAULT_EDITOR_RATIO;
    }

    const parsedValue = Number.parseFloat(storedValue);

    if (!Number.isFinite(parsedValue)) {
      return DEFAULT_EDITOR_RATIO;
    }

    return clamp(parsedValue, 0, 100);
  } catch {
    return DEFAULT_EDITOR_RATIO;
  }
}

function isDesktopViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

export function useWorkspaceResize(): UseWorkspaceResizeResult {
  const workspaceRef = useRef<HTMLElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const [editorRatio, setEditorRatio] = useState(loadStoredEditorRatio);
  const [isResizing, setIsResizing] = useState(false);

  const getResizeBounds = useCallback((): ResizeBounds | null => {
    const workspace = workspaceRef.current;

    if (!workspace) {
      return null;
    }

    const rect = workspace.getBoundingClientRect();
    const style = window.getComputedStyle(workspace);
    const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(style.paddingRight) || 0;
    const resizerWidth =
      Number.parseFloat(style.getPropertyValue("--workspace-resizer-width")) ||
      16;

    const contentWidth = rect.width - paddingLeft - paddingRight;

    if (contentWidth <= 0) {
      return null;
    }

    const minimumRatio = (MIN_EDITOR_WIDTH_PX / contentWidth) * 100;
    const maximumEditorWidth =
      contentWidth - resizerWidth - MIN_PREVIEW_WIDTH_PX;
    const maximumRatio = (maximumEditorWidth / contentWidth) * 100;

    return {
      minimumRatio: Math.max(0, minimumRatio),
      maximumRatio: Math.max(minimumRatio, Math.min(100, maximumRatio)),
      contentLeft: rect.left + paddingLeft,
      contentWidth,
      resizerWidth,
    };
  }, []);

  const updateRatioFromClientX = useCallback(
    (clientX: number, snapToTenPercent = false): void => {
      const bounds = getResizeBounds();

      if (!bounds) {
        return;
      }

      const editorWidth = clientX - bounds.contentLeft;
      let requestedRatio = (editorWidth / bounds.contentWidth) * 100;

      if (snapToTenPercent) {
        requestedRatio = Math.round(requestedRatio / 10) * 10;
      }

      const nextRatio = clamp(
        requestedRatio,
        bounds.minimumRatio,
        bounds.maximumRatio,
      );

      setEditorRatio(nextRatio);
    },
    [getResizeBounds],
  );

  const clampCurrentRatio = useCallback((): void => {
    const bounds = getResizeBounds();

    if (!bounds) {
      return;
    }

    setEditorRatio((currentRatio) => {
      return clamp(currentRatio, bounds.minimumRatio, bounds.maximumRatio);
    });
  }, [getResizeBounds]);

  const finishResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      activePointerIdRef.current = null;
      setIsResizing(false);
    },
    [],
  );

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.button !== 0 || !isDesktopViewport()) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
    updateRatioFromClientX(event.clientX, event.ctrlKey || event.metaKey);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateRatioFromClientX(
      event.clientX,
      event.ctrlKey || event.metaKey,
    );
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (!isDesktopViewport()) {
      return;
    }

    const bounds = getResizeBounds();

    if (!bounds) {
      return;
    }

    const step = event.shiftKey ? 5 : 1;

    let nextRatio: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextRatio = editorRatio - step;
        break;
      case "ArrowRight":
        nextRatio = editorRatio + step;
        break;
      case "Home":
        nextRatio = bounds.minimumRatio;
        break;
      case "End":
        nextRatio = bounds.maximumRatio;
        break;
      default:
        return;
    }

    event.preventDefault();
    setEditorRatio(clamp(nextRatio, bounds.minimumRatio, bounds.maximumRatio));
  };

  const resetWorkspaceRatio = (): void => {
    const bounds = getResizeBounds();

    if (!bounds) {
      setEditorRatio(DEFAULT_EDITOR_RATIO);
      return;
    }

    setEditorRatio(
      clamp(DEFAULT_EDITOR_RATIO, bounds.minimumRatio, bounds.maximumRatio),
    );
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(editorRatio));
    } catch {
      // localStorageが使えない環境では保存しません。
    }
  }, [editorRatio]);

  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (isDesktopViewport()) {
        clampCurrentRatio();
      }
    });

    resizeObserver.observe(workspace);

    return () => {
      resizeObserver.disconnect();
    };
  }, [clampCurrentRatio]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  return {
    workspaceRef,
    editorRatio,
    isResizing,
    workspaceStyle: {
      "--editor-pane-ratio": `${editorRatio}%`,
    },
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishResize,
    handlePointerCancel: finishResize,
    handleKeyDown,
    resetWorkspaceRatio,
  };
}
