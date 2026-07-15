import type { ComponentProps, HTMLAttributes } from "react";
import { Icon } from "./Icon";

type AvatarProps = {
  size: "xs" | "sm" | "md" | "lg" | "xl";
} & HTMLAttributes<HTMLSpanElement>;

const Avatar = ({
  className,
  size,
  ...props
}: AvatarProps): React.JSX.Element => {
  const classNames = ["c-avatar", `c-avatar--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classNames} {...props} />;
};

type AvatarIconProps = {
  icon: string;
} & HTMLAttributes<HTMLSpanElement>;

const AvatarIcon = ({
  className,
  icon,
  ...props
}: AvatarIconProps): React.JSX.Element => {
  const classNames = ["c-avatar__icon", className].filter(Boolean).join(" ");

  return <Icon icon={icon} className={classNames} {...props} />;
};

const AvatarImage = ({
  className,
  ...props
}: ComponentProps<"img">): React.JSX.Element => {
  const classNames = ["c-avatar__image", className].filter(Boolean).join(" ");

  return <img className={classNames} {...props} />;
};

export { Avatar, AvatarIcon, AvatarImage };
