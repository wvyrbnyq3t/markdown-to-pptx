import type { HTMLAttributes } from "react";

type SeparatedListProps = {
  order?: boolean;
} & (
  | ({ order: true } & HTMLAttributes<HTMLOListElement>)
  | ({ order?: false } & HTMLAttributes<HTMLUListElement>)
);

const SeparatedList = ({ className, order, ...props }: SeparatedListProps) => {
  const classNames = ["c-separated-list", className].filter(Boolean).join(" ");

  if (order) {
    return <ol className={classNames} {...props} />;
  }
  return <ul className={classNames} {...props} />;
};

const SeparatedListItem = ({
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) => {
  const classNames = ["c-separated-list__item", className]
    .filter(Boolean)
    .join(" ");
  return <li className={classNames} {...props} />;
};

export { SeparatedList, SeparatedListItem };
