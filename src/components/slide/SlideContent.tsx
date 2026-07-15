import katex from "katex";
import type { CSSProperties, ReactNode } from "react";

import type { SlideData, SlideElement } from "../../types/slide";
import type { PresentationSettings } from "../../types/presentation";

import {
  getSlideGridGapPx,
  normalizeSlideGridColumns,
  splitSlideElementsIntoColumns,
} from "../../utils/slideGrid";

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

function getTableCellAlignment(
  alignment: "left" | "center" | "right" | null | undefined,
): CSSProperties["textAlign"] {
  if (alignment === "center" || alignment === "right") {
    return alignment;
  }

  return "left";
}

type ContentSlideProps = {
  slide: SlideData;
  pageNumber: number;
  settings: PresentationSettings;
};

function renderSlideElement(element: SlideElement, key: string): ReactNode {
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
                className={`preview-quote ` + `preview-quote-depth-${depth}`}
              >
                <p>{renderInlineRuns(line.runs, `${key}-${lineIndex}`)}</p>
              </blockquote>
            );
          })}
        </div>
      );

    case "code":
      return (
        <div key={key} className="preview-code-wrapper">
          {element.language && (
            <div className="preview-code-language">{element.language}</div>
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

    case "columnBreak":
      return null;

    case "table": {
      const [headerRow, ...bodyRows] = element.table.rows;

      if (!headerRow) {
        return null;
      }

      return (
        <div key={key} className="preview-table-wrapper">
          <table className="preview-table">
            <thead>
              <tr>
                {headerRow.cells.map((cell, cellIndex) => (
                  <th
                    key={`${key}-header-${cellIndex}`}
                    style={{
                      textAlign: getTableCellAlignment(
                        element.table.alignments[cellIndex],
                      ),
                    }}
                  >
                    {renderInlineRuns(cell.runs, `${key}-header-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={`${key}-row-${rowIndex}`}>
                  {headerRow.cells.map((_, cellIndex) => {
                    const cell = row.cells[cellIndex];

                    return (
                      <td
                        key={`${key}-row-${rowIndex}-cell-${cellIndex}`}
                        style={{
                          textAlign: getTableCellAlignment(
                            element.table.alignments[cellIndex],
                          ),
                        }}
                      >
                        {cell
                          ? renderInlineRuns(
                              cell.runs,
                              `${key}-row-${rowIndex}-cell-${cellIndex}`,
                            )
                          : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return null;
  }
}

export function ContentSlide({
  slide,
  pageNumber,
  settings,
}: ContentSlideProps) {
  const gridColumns = normalizeSlideGridColumns(slide.gridColumns);

  const gridGapPx = getSlideGridGapPx(gridColumns);

  const columns = splitSlideElementsIntoColumns(slide.elements, gridColumns);

  return (
    <div className="slide-inner">
      <header className="slide-header">
        <h3>{slide.title || "無題のスライド"}</h3>
      </header>

      <div
        className={"slide-body slide-grid"}
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,

          columnGap: `${gridGapPx}px`,
        }}
      >
        {columns.map((columnElements, columnIndex) => (
          <div
            key={`${slide.id}-column-${columnIndex}`}
            className="slide-grid-column"
          >
            {columnElements.map((element, elementIndex) =>
              renderSlideElement(
                element,
                `${slide.id}-${columnIndex}-${elementIndex}`,
              ),
            )}
          </div>
        ))}
      </div>

      {settings.showPageNumber && (
        <footer className="slide-page-number">{pageNumber}</footer>
      )}
    </div>
  );
}
