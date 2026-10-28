import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject, TouchEvent } from "react";
import { ArrowLeft, ArrowRight, Maximize, Minimize, X } from "lucide-react";
import { CoverSlide, SlideContent } from "../preview/SlideContent";
import { nextSlideIndex, previousSlideIndex, clampSlideIndex } from "../../features/presentation/navigation";
import { SLIDE_HEIGHT, SLIDE_WIDTH, type SlideData } from "../../types/slide";
import type { PresentationSettings } from "../../types/settings";

interface PresentationModeProps {
  slides: SlideData[];
  settings: PresentationSettings;
  initialIndex: number;
  onClose: () => void;
}

/** 1280×720 のスライドを、縦横比を保って表示領域へ収める。 */
function useSlideScale(containerRef: RefObject<HTMLDivElement | null>): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = (width: number, height: number) => {
      setScale(Math.max(0.01, Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT)));
    };

    updateScale(container.clientWidth, container.clientHeight);

    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateScale(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
}

/** プレビューと同じスライド描画コンポーネントを利用する発表画面。 */
export function PresentationMode({ slides, settings, initialIndex, onClose }: PresentationModeProps) {
  const total = slides.length + (settings.pageTitle.isEnabled ? 1 : 0);
  const [index, setIndex] = useState(() => clampSlideIndex(initialIndex, total));
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const enteredFullscreenRef = useRef(Boolean(document.fullscreenElement));
  const scale = useSlideScale(stageRef);

  const close = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    onClose();
  }, [onClose]);

  const previous = useCallback(() => setIndex((value) => previousSlideIndex(value, total)), [total]);
  const next = useCallback(() => setIndex((value) => nextSlideIndex(value, total)), [total]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(fullscreen);
      if (fullscreen) {
        enteredFullscreenRef.current = true;
      } else if (enteredFullscreenRef.current) {
        // ブラウザのEscなどで全画面が解除されたら発表モードも閉じる。
        onClose();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onClose]);

  useEffect(() => {
    setIndex((value) => clampSlideIndex(value, total));
  }, [total]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case "ArrowRight":
      case "PageDown":
        event.preventDefault();
        next();
        break;
      case " ":
        // ボタンにフォーカスがあるときは、標準のボタン操作を優先する。
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "PageUp":
      case "Backspace":
        event.preventDefault();
        previous();
        break;
      case "Home":
        event.preventDefault();
        setIndex(0);
        break;
      case "End":
        event.preventDefault();
        setIndex(clampSlideIndex(total - 1, total));
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab": {
        // 発表画面以外へフォーカスが移らないようにする。
        const controls = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        if (controls.length === 0) break;
        const focusedIndex = controls.indexOf(document.activeElement as HTMLButtonElement);
        if (event.shiftKey && (focusedIndex <= 0)) {
          event.preventDefault();
          controls[controls.length - 1].focus();
        } else if (!event.shiftKey && focusedIndex === controls.length - 1) {
          event.preventDefault();
          controls[0].focus();
        }
        break;
      }
    }
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 1) touchStartXRef.current = event.touches[0].clientX;
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null || event.changedTouches.length !== 1) return;
    const movedX = event.changedTouches[0].clientX - startX;
    if (Math.abs(movedX) < 65) return;
    if (movedX < 0) next();
    else previous();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        // このボタンでは画面だけ縮小し、発表モードは継続する。
        enteredFullscreenRef.current = false;
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // API非対応・拒否時もオーバーレイ表示は利用できる。
    }
  }

  const hasCover = settings.pageTitle.isEnabled;
  const isCover = hasCover && index === 0;
  const slideIndex = index - (hasCover ? 1 : 0);
  const currentSlide = isCover ? null : slides[slideIndex];
  const currentTitle = isCover ? "表紙" : currentSlide?.title ?? "スライド";

  return (
    <section
      className="p-presentation"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="発表モード"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className="p-presentation__stage" ref={stageRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {total > 0 && (
          <div
            className="p-presentation__slide-frame"
            style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale }}
          >
            <div className="p-presentation__slide-scaled" style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${scale})` }}>
              {isCover ? <CoverSlide settings={settings} /> : currentSlide ? (
                <SlideContent slide={currentSlide} settings={settings} slideNumber={index + 1} />
              ) : null}
            </div>
          </div>
        )}
        {total === 0 && <p className="p-presentation__empty">表示できるスライドがありません。</p>}
      </div>
      <div className="p-presentation__toolbar" role="toolbar" aria-label="発表操作">
        <div className="p-presentation__slide-info">
          <strong className="p-presentation__slide-title" title={currentTitle}>{currentTitle}</strong>
          <span className="p-presentation__slide-count" aria-live="polite">{total === 0 ? 0 : index + 1} / {total}</span>
        </div>
        <div className="p-presentation__controls">
          <button className="p-presentation__button" aria-label="前のスライド" title="前へ（← / PageUp）" onClick={previous} disabled={index <= 0 || total === 0}><ArrowLeft size={20} /></button>
          <button className="p-presentation__button" aria-label="次のスライド" title="次へ（→ / Space / PageDown）" onClick={next} disabled={index >= total - 1}><ArrowRight size={20} /></button>
          <button className="p-presentation__button" aria-label={isFullscreen ? "全画面表示を解除" : "全画面表示"} title="全画面表示を切替" onClick={() => void toggleFullscreen()}>
            {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
          </button>
          <button className="p-presentation__button p-presentation__button--exit" aria-label="発表モードを終了" title="終了（Esc）" onClick={close}><X size={20} /><span>終了</span></button>
        </div>
      </div>
    </section>
  );
}
