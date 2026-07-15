import type { HTMLAttributes } from "react";

type CardProps = {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  horizontal?: boolean;
  pdng?: "xs" | "sm" | "md" | "lg" | "xl";
  pdngInline?: "xs" | "sm" | "md" | "lg" | "xl";
  pdngBlock?: "xs" | "sm" | "md" | "lg" | "xl";
} & HTMLAttributes<HTMLDivElement>;

const Card = ({
  className,
  horizontal,
  gap,
  pdng,
  pdngInline,
  pdngBlock,
  ...props
}: CardProps) => {
  const classNames = [
    "c-card",
    horizontal && "c-card--horizontal",
    gap && `u-gap--${gap}`,
    pdng && `u-pdng--${pdng}`,
    pdngInline && `u-pdng-inline--${pdngInline}`,
    pdngBlock && `u-pdng-block--${pdngBlock}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames} {...props} />;
};

const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const classNames = ["c-card__header", className].filter(Boolean).join(" ");

  return <div className={classNames} {...props} />;
};

const CardContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const classNames = ["c-card__content", className].filter(Boolean).join(" ");

  return <div className={classNames} {...props} />;
};

const CardFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const classNames = ["c-card__footer", className].filter(Boolean).join(" ");

  return <div className={classNames} {...props} />;
};

export type { CardProps };
export { Card, CardContent, CardFooter, CardHeader };
