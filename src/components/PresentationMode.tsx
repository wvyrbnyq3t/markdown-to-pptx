import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import type { PresentationSettings } from "../types/presentation";
import type { SlideData } from "../types/slide";
import type { SlideStyle } from "../utils/presentationApp";
import { ContentSlide, TitleSlide } from "./slide/SlideContent";
import { CloseIcon, PlayIcon } from "./ui/Icons";

import "../css/PresentationMode.css";

type PresentationModeLauncherProps = {
  slides: SlideData[];
  settings: PresentationSettings;
  slideStyle: SlideStyle;
};

type PresentationPage =
  | { type: "title"; key: string }
  | {
      type: "slide";
      key: string;
      slide: SlideData;
      pageNumber: number;
    };

export function PresentationModeLauncher({
  slides,
  settings,
  slideStyle,
}: PresentationModeLauncherProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wasFullscreenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pages = useMemo<PresentationPage[]>(() => {
    const result: PresentationPage[] = [];

    if (settings.includeTitleSlide) {
      result.push({ type: "title", key: "presentation-title-page" });
    }

    slides.forEach((slide, index) => {
      result.push({
        type: "slide",
        key: slide.id,
        slide,
        pageNumber: index + 1,
      });
    });

    return result;
  }, [slides, settings.includeTitleSlide]);

  const currentPage = pages[currentIndex];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((index) => Math.min(pages.length - 1, index + 1));
  }, [pages.length]);

  const closePresentation = useCallback(async () => {
    setIsOpen(false);
    wasFullscreenRef.current = false;

    if (rootRef.current && document.fullscreenElement === rootRef.current) {
      try {
        await document.exitFullscreen();
      } catch {
        // CSSオーバーレイは閉じるため、Fullscreen APIの失敗は無視する。
      }
    }
  }, []);

  const openPresentation = async (): Promise<void> => {
    if (pages.length === 0) {
      return;
    }

    setCurrentIndex(0);
    setIsOpen(true);
    wasFullscreenRef.current = false;

    if (!rootRef.current?.requestFullscreen) {
      return;
    }

    try {
      await rootRef.current.requestFullscreen();
      wasFullscreenRef.current = true;
    } catch {
      // Fullscreen APIが拒否されてもCSSオーバーレイで表示する。
    }
  };

  useEffect(() => {
    if (pages.length === 0) {
      setCurrentIndex(0);

      if (isOpen) {
        void closePresentation();
      }

      return;
    }

    setCurrentIndex((index) => Math.min(index, pages.length - 1));
  }, [pages.length, isOpen, closePresentation]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        ["ArrowRight", "ArrowDown", "PageDown", "Enter", " "].includes(
          event.key,
        )
      ) {
        event.preventDefault();
        goToNext();
      } else if (
        ["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(event.key)
      ) {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "Home") {
        event.preventDefault();
        setCurrentIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setCurrentIndex(Math.max(0, pages.length - 1));
      } else if (event.key === "Escape") {
        event.preventDefault();
        void closePresentation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pages.length, goToNext, goToPrevious, closePresentation]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleFullscreenChange = (): void => {
      if (rootRef.current && document.fullscreenElement === rootRef.current) {
        wasFullscreenRef.current = true;
      } else if (
        wasFullscreenRef.current &&
        document.fullscreenElement === null
      ) {
        wasFullscreenRef.current = false;
        setIsOpen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isOpen]);

  const handleStageClick = (event: MouseEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickRatio = (event.clientX - rect.left) / rect.width;

    if (clickRatio < 0.3) {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  const progress =
    pages.length > 0 ? ((currentIndex + 1) / pages.length) * 100 : 0;

  return (
    <>
      <button
        type="button"
        className="secondary-button presentation-launch-button"
        disabled={pages.length === 0}
        onClick={() => void openPresentation()}
      >
        <PlayIcon />
        <span>発表を始める</span>
      </button>

      <div
        ref={rootRef}
        className={`presentation-mode-root${isOpen ? " is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        {isOpen && currentPage && (
          <div className="presentation-mode-stage" onClick={handleStageClick}>
            <FullscreenSlideCanvas style={slideStyle}>
              {currentPage.type === "title" ? (
                <TitleSlide settings={settings} />
              ) : (
                <ContentSlide
                  slide={currentPage.slide}
                  pageNumber={currentPage.pageNumber}
                  settings={settings}
                />
              )}
            </FullscreenSlideCanvas>

            <div
              className="presentation-mode-top-controls"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="presentation-mode-close"
                onClick={() => void closePresentation()}
                aria-label="プレゼンテーションを終了"
              >
                <CloseIcon className="presentation-control-icon" />
              </button>
            </div>

            <div className="presentation-mode-progress">
              <div
                className="presentation-mode-progress-value"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

type FullscreenSlideCanvasProps = {
  style: SlideStyle;
  children: ReactNode;
};

function FullscreenSlideCanvas({
  style,
  children,
}: FullscreenSlideCanvasProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return;
    }

    const updateScale = (): void => {
      const scale = Math.min(
        frame.clientWidth / 1920,
        frame.clientHeight / 1080,
      );
      frame.style.setProperty("--presentation-scale", String(scale));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="presentation-mode-slide-frame">
      <div className="presentation-mode-slide-canvas" style={style}>
        {children}
      </div>
    </div>
  );
}
