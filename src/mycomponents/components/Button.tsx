import type { HTMLAttributes, ComponentProps } from "react";
import Slot from "./Slot";

type ButtonProps = {
  asChild?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
  variant: "filled" | "outlined" | "text" | "ghost" | "danger" | "link";
} & (
  | ({ asChild: true } & HTMLAttributes<HTMLElement>)
  | ({ asChild?: false } & ComponentProps<"button">)
);

const Button = ({
  asChild,
  children,
  className,
  icon,
  iconPosition,
  size,
  variant,
  ...props
}: ButtonProps) => {
  const classNames = [
    "c-button",
    `c-button--${variant}`,
    size ? `c-button--${size}` : "",
    iconPosition ? `c-button--icon-${iconPosition}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
  };

  if (asChild) {
    return (
      <Slot className={classNames} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      type="button"
      className={classNames}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="c-button__icon">{icon}</span>}
      <span className="c-button__label">{children}</span>
    </button>
  );
};

type IconButtonProps = {
  asChild?: boolean;
  icon?: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant: "filled" | "outlined" | "text" | "ghost" | "danger" | "link";
  withLabel?: boolean;
} & (
  | ({ asChild: true } & HTMLAttributes<HTMLElement>)
  | ({ asChild?: false } & ComponentProps<"button">)
);

const IconButton = ({
  asChild,
  className,
  icon,
  label,
  size,
  variant,
  ...props
}: IconButtonProps) => {
  const classNames = [
    "c-icon-button",
    `c-icon-button--${variant}`,
    size ? `c-icon-button--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild) {
    return (
      <Slot className={classNames} {...props}>
        {props.children}
      </Slot>
    );
  }
  return (
    <button type="button" className={classNames} {...props}>
      <span className="c-icon-button__icon">{icon || props.children}</span>
      {label && <span className="c-icon-button__label">{label}</span>}
    </button>
  );
};

export { Button, IconButton };
