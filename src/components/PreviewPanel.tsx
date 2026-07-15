import { useEffect, useRef, type ReactNode, type RefCallback } from "react";

import type { MobileView } from "../hooks/usePresentationEditor";

import type { PresentationSettings } from "../types/presentation";

import type { SlideData } from "../types/slide";

import type { SlideStyle } from "../utils/presentationApp";

import { ContentSlide, TitleSlide } from "./slide/SlideContent";

type PreviewPanelProps = {
  slides: SlideData[];
  settings: PresentationSettings;
  slideStyle: SlideStyle;
  totalSlideCount: number;
  mobileView: MobileView;

  /**
   * タイトルページを含めた、
   * プレビュー上のスライド番号です。
   */
  activeSlideIndex?: number;
};

export function PreviewPanel({
  slides,
  settings,
  slideStyle,
  totalSlideCount,
  mobileView,
  activeSlideIndex = 0,
}: PreviewPanelProps) {
  const previewScrollAreaRef = useRef<HTMLDivElement>(null);

  const slideItemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const scrollArea = previewScrollAreaRef.current;

    const maximumIndex = Math.max(0, totalSlideCount - 1);

    const normalizedIndex = Math.min(
      Math.max(activeSlideIndex, 0),
      maximumIndex,
    );

    const targetSlide = slideItemRefs.current[normalizedIndex];

    if (!scrollArea || !targetSlide) {
      return;
    }

    /*
     * Markdown更新によるスライド再描画を
     * 待ってからスクロールします。
     */
    const frameId = requestAnimationFrame(() => {
      const scrollAreaRect = scrollArea.getBoundingClientRect();

      const targetSlideRect = targetSlide.getBoundingClientRect();

      const targetTop =
        scrollArea.scrollTop + targetSlideRect.top - scrollAreaRect.top - 8;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      scrollArea.scrollTo({
        top: Math.max(0, targetTop),

        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    activeSlideIndex,
    slides.length,
    settings.includeTitleSlide,
    totalSlideCount,
  ]);

  const createSlideItemRef = (index: number): RefCallback<HTMLDivElement> => {
    return (element): void => {
      slideItemRefs.current[index] = element;
    };
  };

  return (
    <section
      id="preview-panel"
      role="tabpanel"
      aria-labelledby="preview-tab"
      className={[
        "preview-section",
        "mobile-view-panel",

        mobileView === "preview" ? "mobile-active" : "mobile-hidden",
      ].join(" ")}
    >
      <div className="section-header">
        <div>
          <h2>プレビュー</h2>
        </div>
      </div>

      <div ref={previewScrollAreaRef} className="preview-scroll-area">
        {totalSlideCount === 0 ? (
          <div className="empty-preview">
            <p>表示できるスライドがありません。</p>

            <span>
              Markdownを入力するか、 タイトルページを有効にしてください。
            </span>
          </div>
        ) : (
          <div className="slide-list">
            {settings.includeTitleSlide && (
              <SlidePreviewItem
                itemRef={createSlideItemRef(0)}
                isActive={activeSlideIndex === 0}
                label="タイトルページ"
                style={slideStyle}
              >
                <TitleSlide settings={settings} />
              </SlidePreviewItem>
            )}

            {slides.map((slide, index) => {
              const previewIndex = index + (settings.includeTitleSlide ? 1 : 0);

              return (
                <SlidePreviewItem
                  key={slide.id}
                  itemRef={createSlideItemRef(previewIndex)}
                  isActive={activeSlideIndex === previewIndex}
                  label={`スライド ${index + 1}`}
                  style={slideStyle}
                >
                  <ContentSlide
                    slide={slide}
                    pageNumber={index + 1}
                    settings={settings}
                  />
                </SlidePreviewItem>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

type SlidePreviewItemProps = {
  label: string;
  style: SlideStyle;
  children: ReactNode;
  isActive?: boolean;

  itemRef?: RefCallback<HTMLDivElement>;
};

function SlidePreviewItem({
  label,
  style,
  children,
  isActive = false,
  itemRef,
}: SlidePreviewItemProps) {
  return (
    <div
      ref={itemRef}
      className={["slide-preview-item", isActive ? "is-editor-active" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-current={isActive ? "true" : undefined}
    >
      <div className="slide-information">
        <span>{label}</span>
      </div>

      <SlideCanvas style={style}>{children}</SlideCanvas>
    </div>
  );
}

function SlideCanvas({
  style,
  children,
}: Pick<SlidePreviewItemProps, "style" | "children">) {
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const preview = previewRef.current;

    if (!preview) {
      return;
    }

    const updateScale = (): void => {
      preview.style.setProperty(
        "--preview-scale",
        String(preview.clientWidth / 1920),
      );
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);

    observer.observe(preview);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <article ref={previewRef} className="slide-preview">
      <div className="slide-canvas" style={style}>
        {children}
      </div>
    </article>
  );
}
