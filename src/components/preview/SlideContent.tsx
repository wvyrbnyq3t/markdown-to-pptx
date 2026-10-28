import { logoLayout } from "../../features/logo/logo";
import type { CSSProperties } from "react";
import katex from "katex";
import type { PresentationSettings } from "../../types/settings";
import type { SlideData, SlideElement } from "../../types/slide";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "../../types/slide";
import { splitSlideColumns } from "../../features/markdown/parseMarkdown";
import { InlineRuns } from "./InlineRuns";
import { ICON_SYMBOLS } from "../../lib/iconSymbols";
import { contrastTextColor } from "../../lib/color";
import { SlideImage } from "./SlideImage";

function elementView(element: SlideElement, key: number, columnWidth: number) {
  const alignStyle =
    "align" in element ? { textAlign: element.align ?? "left" } : undefined;
  switch (element.type) {
    case "subtitle":
      return (
        <h3 key={key} className="c-slide__subtitle" style={alignStyle}>
          {element.text}
        </h3>
      );
    case "heading":
      return (
        <h4
          key={key}
          className={`c-slide__heading c-slide__heading--${element.level}`}
          style={alignStyle}
        >
          {element.text}
        </h4>
      );
    case "paragraph":
      return (
        <p key={key} className="c-slide__paragraph" style={alignStyle}>
          <InlineRuns runs={element.runs} />
        </p>
      );
    case "list":
      return (
        <div key={key} className="c-slide__list">
          {element.lines.map((line, index) => (
            <div
              key={index}
              className="c-slide__list-line"
              style={{ paddingLeft: `${line.depth * 1.2}em` }}
            >
              <span className="c-slide__list-marker">
                {line.ordered ? `${line.number ?? index + 1}.` : "•"}
              </span>
              <span>
                <InlineRuns runs={line.runs} />
              </span>
            </div>
          ))}
        </div>
      );
    case "quote":
      return (
        <blockquote key={key} className="c-slide__quote" style={alignStyle}>
          <InlineRuns runs={element.runs} />
        </blockquote>
      );
    case "code":
      return (
        <pre key={key} className="c-slide__code">
          <code>{element.code}</code>
        </pre>
      );
    case "image":
      return (
        <SlideImage
          key={key}
          assetId={element.assetId}
          alt={element.alt}
          align={element.align}
          columnWidth={columnWidth}
        />
      );
    case "math":
      return (
        <div
          key={key}
          className="c-slide__math"
          style={alignStyle}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(element.latex, {
              displayMode: true,
              throwOnError: false,
              trust: false,
            }),
          }}
        />
      );
    case "table":
      return (
        <table key={key} className="c-slide__table">
          <thead>
            <tr>
              {element.table.headers.map((header, i) => (
                <th
                  key={i}
                  style={{ textAlign: element.table.alignments[i] ?? "left" }}
                >
                  <InlineRuns runs={header.runs} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {element.table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{ textAlign: element.table.alignments[j] ?? "left" }}
                  >
                    <InlineRuns runs={cell.runs} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "icon":
      return (
        <div
          key={key}
          className="c-slide__icon"
          style={alignStyle}
          aria-label={`アイコン: ${element.name}`}
        >
          {ICON_SYMBOLS[element.name] ?? "◆"}
        </div>
      );
    case "card":
      return (
        <div key={key} className="c-slide__card" style={alignStyle}>
          <InlineRuns runs={element.runs} />
        </div>
      );
    case "spacing":
      return (
        <div
          key={key}
          aria-hidden="true"
          style={{ height: `${element.amount}px`, flexShrink: 0 }}
        />
      );
    case "columnBreak":
      return null;
  }
}

export function buildSlideCssVars(
  settings: PresentationSettings,
): CSSProperties {
  return {
    "--slide-primary": settings.color.primary,
    "--slide-secondary": settings.color.secondary,
    "--slide-text": settings.color.text,
    "--slide-accent": settings.color.accent,
    "--slide-table-header": settings.color.tableHeader,
    "--slide-table-header-foreground": contrastTextColor(
      settings.color.tableHeader,
    ),
    "--slide-title-size": `${settings.fontSize.title}px`,
    "--slide-subtitle-size": `${settings.fontSize.subTitle}px`,
    "--slide-text-size": `${settings.fontSize.text}px`,
    "--slide-code-size": `${settings.fontSize.code}px`,
    "--slide-formula-size": `${settings.fontSize.formula}px`,
    "--slide-margin": `${settings.margin}px`,
    "--slide-gap": `${settings.gap}px`,
  } as CSSProperties;
}

interface SlideContentProps {
  slide: SlideData;
  settings: PresentationSettings;
  slideNumber: number;
}

export function SlideContent({
  slide,
  settings,
  slideNumber,
}: SlideContentProps) {
  const logo = logoLayout(settings);
  const columns = splitSlideColumns(slide);
  const columnWidth =
    (SLIDE_WIDTH -
      settings.margin * 2 -
      settings.gap * 3 * (columns.length - 1)) /
    columns.length;
  const style: CSSProperties = {
    ...buildSlideCssVars(settings),
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
  };
  return (
    <article
      className="c-slide"
      style={style}
      aria-label={`スライド ${slideNumber}: ${slide.title}`}
    >
      <div
        className="c-slide__header"
        style={logo ? { minHeight: logo.height } : undefined}
      >
        {logo && (
          <img
            className="c-slide__logo"
            src={settings.logo.dataUrl}
            alt="ロゴ"
            style={{
              left: logo.x,
              top: logo.y,
              width: logo.width,
              height: logo.height,
            }}
          />
        )}
        <h2
          className="c-slide__title"
          style={
            logo
              ? {
                  marginLeft: logo.titleX - settings.margin,
                  width: logo.titleWidth,
                }
              : undefined
          }
        >
          {slide.title}
        </h2>
      </div>
      <div
        className="c-slide__columns"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((elements, columnIndex) => (
          <div key={columnIndex} className="c-slide__column">
            {elements.map((element, index) =>
              elementView(element, index, columnWidth),
            )}
          </div>
        ))}
      </div>
      {settings.pageNumber.isEnabled && (
        <span
          className="c-slide__page-number"
          style={{ fontSize: settings.pageNumber.fontSize }}
        >
          {slideNumber}
        </span>
      )}
    </article>
  );
}

export function CoverSlide({ settings }: { settings: PresentationSettings }) {
  return (
    <article
      className="c-slide c-slide--cover"
      style={{
        ...buildSlideCssVars(settings),
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
      }}
    >
      <h1
        className="c-slide__cover-title"
        style={{ fontSize: settings.pageTitle.title.fontSize }}
      >
        {settings.pageTitle.title.content}
      </h1>
      {settings.pageTitle.subTitle.content && (
        <p
          className="c-slide__cover-subtitle"
          style={{ fontSize: settings.pageTitle.subTitle.fontSize }}
        >
          {settings.pageTitle.subTitle.content}
        </p>
      )}
    </article>
  );
}
