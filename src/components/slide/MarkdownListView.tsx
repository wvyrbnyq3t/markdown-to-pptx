import type { ReactNode } from "react";

import type { InlineContent, MarkdownList } from "../../types/slide";

type MarkdownListViewProps = {
  list: MarkdownList;
  keyPrefix: string;
  renderRuns: (runs: InlineContent[], keyPrefix: string) => ReactNode;
};

type MarkdownListNodeProps = MarkdownListViewProps & {
  depth: number;
};

function MarkdownListNode({
  list,
  keyPrefix,
  renderRuns,
  depth,
}: MarkdownListNodeProps) {
  const displayDepth = Math.min(depth, 5);
  const className = [
    "preview-list",
    list.ordered ? "preview-numbered-list" : "preview-bullet-list",
    `preview-list-depth-${displayDepth}`,
  ].join(" ");

  const items = list.items.map((item, itemIndex) => {
    const itemKey = `${keyPrefix}-item-${itemIndex}`;

    return (
      <li key={itemKey}>
        {item.runs.length > 0 && (
          <div className="preview-list-item-content">
            {renderRuns(item.runs, itemKey)}
          </div>
        )}

        {item.children.map((childList, childIndex) => (
          <MarkdownListNode
            key={`${itemKey}-child-${childIndex}`}
            list={childList}
            keyPrefix={`${itemKey}-child-${childIndex}`}
            renderRuns={renderRuns}
            depth={depth + 1}
          />
        ))}
      </li>
    );
  });

  return list.ordered ? (
    <ol className={className} start={list.start}>
      {items}
    </ol>
  ) : (
    <ul className={className}>{items}</ul>
  );
}

export function MarkdownListView(props: MarkdownListViewProps) {
  return <MarkdownListNode {...props} depth={0} />;
}
