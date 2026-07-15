export type MarkdownSlideRange = {
  index: number;
  start: number;
  end: number;
};

type MarkdownFence = {
  character: "`" | "~";
  length: number;
};

function getFenceMarker(line: string): string | null {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})/);

  return match?.[1] ?? null;
}

function isHeadingOne(line: string): boolean {
  return /^ {0,3}#(?:[ \t]+|$)/.test(line);
}

function getSlideStartPositions(markdown: string): number[] {
  const positions: number[] = [];

  let offset = 0;
  let fence: MarkdownFence | null = null;

  const lines = markdown.match(/.*(?:\r\n|\n|\r|$)/g);

  if (!lines) {
    return positions;
  }

  for (const rawLine of lines) {
    if (rawLine.length === 0) {
      continue;
    }

    const line = rawLine.replace(/(?:\r\n|\n|\r)$/, "");

    const fenceMarker = getFenceMarker(line);

    if (fenceMarker) {
      const character = fenceMarker[0] as "`" | "~";

      if (!fence) {
        fence = {
          character,
          length: fenceMarker.length,
        };
      } else if (
        fence.character === character &&
        fenceMarker.length >= fence.length
      ) {
        fence = null;
      }

      offset += rawLine.length;
      continue;
    }

    if (fence === null && isHeadingOne(line)) {
      positions.push(offset);
    }

    offset += rawLine.length;
  }

  return positions;
}

export function getMarkdownSlideRanges(markdown: string): MarkdownSlideRange[] {
  const headingPositions = getSlideStartPositions(markdown);

  if (headingPositions.length === 0) {
    return [
      {
        index: 0,
        start: 0,
        end: markdown.length,
      },
    ];
  }

  const firstHeadingPosition = headingPositions[0] ?? 0;

  const hasContentBeforeFirstHeading =
    markdown.slice(0, firstHeadingPosition).trim().length > 0;

  const slideStartPositions = hasContentBeforeFirstHeading
    ? [0, ...headingPositions]
    : headingPositions;

  return slideStartPositions.map((start, index) => {
    const end = slideStartPositions[index + 1] ?? markdown.length;

    return {
      index,
      start,
      end,
    };
  });
}

export function getMarkdownSlideIndexAtPosition(
  markdown: string,
  cursorPosition: number,
): number {
  const ranges = getMarkdownSlideRanges(markdown);

  if (ranges.length === 0) {
    return 0;
  }

  const normalizedPosition = Math.min(
    Math.max(cursorPosition, 0),
    markdown.length,
  );

  let minimumIndex = 0;
  let maximumIndex = ranges.length - 1;

  while (minimumIndex <= maximumIndex) {
    const middleIndex = Math.floor((minimumIndex + maximumIndex) / 2);

    const range = ranges[middleIndex];

    if (!range) {
      break;
    }

    if (normalizedPosition < range.start) {
      maximumIndex = middleIndex - 1;

      continue;
    }

    if (normalizedPosition >= range.end && middleIndex < ranges.length - 1) {
      minimumIndex = middleIndex + 1;

      continue;
    }

    return range.index;
  }

  return Math.max(0, ranges.length - 1);
}
