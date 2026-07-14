import type { HTMLAttributes } from "react";

type IconProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
} & HTMLAttributes<HTMLSpanElement>;

const Icon = ({ className, size, ...props }: IconProps) => {
  const classNames = ["c-icon", size ? `c-icon--${size}` : "", className]
    .filter(Boolean)
    .join(" ");

  return <span className={classNames} {...props} />;
};

export { Icon };
