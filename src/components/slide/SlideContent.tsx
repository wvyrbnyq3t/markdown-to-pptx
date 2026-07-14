import katex from "katex";

import type { PresentationSettings } from "../../types/presentation";
import type { SlideData } from "../../types/slide";
import { MarkdownListView } from "./MarkdownListView";
import { renderInlineRuns } from "./InlineContentRenderer";

type TitleSlideProps = {
  settings: PresentationSettings;
};

export function TitleSlide({ settings }: TitleSlideProps) {
  return (
    <div className="title-slide-inner">
      <div className="title-slide-content">
        <h2 className="title-slide-title">
          {settings.titlePageTitle || "無題のプレゼンテーション"}
        </h2>

        <div className="title-slide-accent" />

        {settings.titlePageSubtitle && (
          <p className="title-slide-subtitle">{settings.titlePageSubtitle}</p>
        )}
      </div>
    </div>
  );
}

type ContentSlideProps = {
  slide: SlideData;
  pageNumber: number;
  settings: PresentationSettings;
};

export function ContentSlide({
  slide,
  pageNumber,
  settings,
}: ContentSlideProps) {
  return (
    <div className="slide-inner">
      <header className="slide-header">
        <h3>{slide.title || "無題のスライド"}</h3>
      </header>

      <div className="slide-body">
        {slide.elements.map((element, elementIndex) => {
          const key = `${slide.id}-${elementIndex}`;

          switch (element.type) {
            case "subtitle":
              return (
                <h4 key={key} className="preview-subtitle">
                  {element.text}
                </h4>
              );

            case "contentHeading":
              return (
                <div
                  key={key}
                  className="preview-content-heading"
                  role="heading"
                  aria-level={element.level}
                >
                  {element.text}
                </div>
              );

            case "paragraph":
              return (
                <p key={key} className="preview-paragraph">
                  {renderInlineRuns(element.runs, key)}
                </p>
              );

            case "list":
              return (
                <div key={key} className="preview-list-root">
                  <MarkdownListView
                    list={element.list}
                    keyPrefix={key}
                    renderRuns={renderInlineRuns}
                  />
                </div>
              );

            case "quote":
              return (
                <div key={key} className="preview-quote-group">
                  {element.lines.map((line, lineIndex) => {
                    const depth = Math.min(Math.max(line.depth, 1), 2);

                    return (
                      <blockquote
                        key={`${key}-${lineIndex}`}
                        className={`preview-quote preview-quote-depth-${depth}`}
                      >
                        <p>
                          {renderInlineRuns(line.runs, `${key}-${lineIndex}`)}
                        </p>
                      </blockquote>
                    );
                  })}
                </div>
              );

            case "code":
              return (
                <div key={key} className="preview-code-wrapper">
                  {element.language && (
                    <div className="preview-code-language">
                      {element.language}
                    </div>
                  )}
                  <pre className="preview-code">
                    <code>{element.code}</code>
                  </pre>
                </div>
              );

            case "math":
              return (
                <div
                  key={key}
                  className="preview-math-block"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(element.latex, {
                      displayMode: true,
                      throwOnError: false,
                      strict: false,
                      output: "htmlAndMathml",
                    }),
                  }}
                />
              );

            case "image":
              return (
                <figure key={key} className="preview-image-wrapper">
                  <img src={element.src} alt={element.alt} />
                  {element.alt && <figcaption>{element.alt}</figcaption>}
                </figure>
              );

            default:
              return null;
          }
        })}
      </div>

      {settings.showPageNumber && (
        <footer className="slide-page-number">{pageNumber}</footer>
      )}
    </div>
  );
}
