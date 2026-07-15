import { useEffect, useRef, type ReactNode } from "react";

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
};

export function PreviewPanel({
  slides,
  settings,
  slideStyle,
  totalSlideCount,
  mobileView,
}: PreviewPanelProps) {
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

      <div className="preview-scroll-area">
        {totalSlideCount === 0 ? (
          <div className="empty-preview">
            <p>表示できるスライドがありません。</p>
            <span>
              Markdownを入力するか、タイトルページを有効にしてください。
            </span>
          </div>
        ) : (
          <div className="slide-list">
            {settings.includeTitleSlide && (
              <SlidePreviewItem label="タイトルページ" style={slideStyle}>
                <TitleSlide settings={settings} />
              </SlidePreviewItem>
            )}

            {slides.map((slide, index) => (
              <SlidePreviewItem
                key={slide.id}
                label={`スライド ${index + 1}`}
                style={slideStyle}
              >
                <ContentSlide
                  slide={slide}
                  pageNumber={index + 1}
                  settings={settings}
                />
              </SlidePreviewItem>
            ))}
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
};

function SlidePreviewItem({ label, style, children }: SlidePreviewItemProps) {
  return (
    <div className="slide-preview-item">
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

    return () => observer.disconnect();
  }, []);

  return (
    <article ref={previewRef} className="slide-preview">
      <div className="slide-canvas" style={style}>
        {children}
      </div>
    </article>
  );
}
