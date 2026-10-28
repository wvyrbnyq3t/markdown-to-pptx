import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PresentationSettings } from "../../types/settings";
import type { SlideData } from "../../types/slide";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "../../types/slide";
import { CoverSlide, SlideContent } from "./SlideContent";

interface Props {
  slides: SlideData[];
  settings: PresentationSettings;
  activeSlideIndex: number;
}

function SlideThumbnail({ children, label }: { children: ReactNode; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setScale(Math.max(0.1, Math.min(1, entry.contentRect.width / SLIDE_WIDTH)));
    });
    resize.observe(element);
    return () => resize.disconnect();
  }, []);
  return <div className="c-slide-preview" ref={containerRef} aria-label={label}>
    <div className="c-slide-preview__size" style={{ height: SLIDE_HEIGHT * scale }}>
      <div className="c-slide-preview__scaled" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  </div>;
}

export function PreviewPanel({ slides, settings, activeSlideIndex }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const offset = settings.pageTitle.isEnabled ? 1 : 0;

  useEffect(() => {
    const scroll = scrollRef.current;
    const target = scroll?.querySelector<HTMLElement>(`[data-slide-index="${activeSlideIndex + offset}"]`);
    if (!scroll || !target) return;
    // プレビューのスクロール領域内だけ移動させる。
    const desiredTop = target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - scroll.clientHeight / 2 + target.clientHeight / 2;
    scroll.scrollTo({ top: Math.max(0, desiredTop), behavior: "smooth" });
  }, [activeSlideIndex, offset]);

  return <section className="p-editor__preview" aria-label="スライドプレビュー">
    <div className="p-editor__pane-header"><strong>プレビュー</strong><span>{slides.length + offset} 枚</span></div>
    <div ref={scrollRef} className="p-editor__preview-scroll">
      {settings.pageTitle.isEnabled && <div className="p-editor__slide-item" data-slide-index={0}>
        <div className="p-editor__slide-caption">表紙</div>
        <SlideThumbnail label="タイトルスライド"><CoverSlide settings={settings} /></SlideThumbnail>
      </div>}
      {slides.map((slide, index) => <div key={slide.id} className="p-editor__slide-item" data-slide-index={index + offset}>
        <div className="p-editor__slide-caption">{index + offset + 1}. {slide.title}</div>
        <SlideThumbnail label={slide.title}><SlideContent slide={slide} settings={settings} slideNumber={index + offset + 1} /></SlideThumbnail>
      </div>)}
    </div>
  </section>;
}
