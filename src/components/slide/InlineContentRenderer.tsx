import { Fragment, type ReactNode } from "react";

import { renderKatexHtml } from "../../features/math/renderMath";
import type { InlineContent } from "../../types/slide";

function isSafeLinkUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url.trim());
}

export function renderInlineRuns(
  runs: InlineContent[],
  keyPrefix: string,
): ReactNode[] {
  return runs.map((run, index) => {
    const key = `${keyPrefix}-${index}`;
    let content: ReactNode =
      run.type === "math" ? (
        <span
          className="preview-inline-math"
          dangerouslySetInnerHTML={{
            __html: renderKatexHtml(run.latex, false),
          }}
        />
      ) : (
        run.text
      );

    if (run.accent) {
      content = <span className="preview-inline-accent">{content}</span>;
    }

    if (run.italic) {
      content = <em className="preview-inline-emphasis">{content}</em>;
    }

    if (run.bold) {
      content = <strong className="preview-inline-strong">{content}</strong>;
    }

    if (run.link && isSafeLinkUrl(run.link)) {
      content = (
        <a
          className="preview-inline-link"
          href={run.link}
          title={run.linkTitle}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(event) => event.stopPropagation()}
        >
          {content}
        </a>
      );
    }

    return <Fragment key={key}>{content}</Fragment>;
  });
}
