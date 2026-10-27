import katex from "katex";
import type { TextRun } from "../../types/slide";

function safeLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, "https://example.com");
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) ? url : undefined;
  } catch { return undefined; }
}

interface Props { runs: TextRun[]; }

export function InlineRuns({ runs }: Props) {
  return <>{runs.map((run, index) => {
    const content = run.math
      ? <span className="c-slide__inline-math" dangerouslySetInnerHTML={{ __html: katex.renderToString(run.text, { throwOnError: false, trust: false }) }} />
      : <span className={[
          run.bold ? "u-text-bold" : "",
          run.italic ? "u-text-italic" : "",
          run.strike ? "u-text-strike" : "",
          run.code ? "c-slide__inline-code" : "",
          run.color === "accent" ? "u-slide-accent" : "",
        ].filter(Boolean).join(" ")}>{run.text}</span>;
    const href = safeLink(run.link);
    return href
      ? <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="c-slide__link">{content}</a>
      : <span key={index}>{content}</span>;
  })}</>;
}
