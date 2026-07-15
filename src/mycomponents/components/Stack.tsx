import type { HTMLAttributes } from "react";

type StackProps = {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
} & HTMLAttributes<HTMLDivElement>;

const Stack = ({ className, gap, ...props }: StackProps) => {
  const classNames = ["l-stack", gap ? `u-gap--${gap}` : "", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames} {...props} />;
};

export { Stack };
