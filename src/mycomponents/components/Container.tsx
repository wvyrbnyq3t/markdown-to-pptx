import type { HTMLAttributes } from "react";

type ContainerProps = {
  pdng?: "xs" | "sm" | "md" | "lg" | "xl";
  pdngInline?: "xs" | "sm" | "md" | "lg" | "xl";
  pdngBlock?: "xs" | "sm" | "md" | "lg" | "xl";
} & HTMLAttributes<HTMLDivElement>;

const Container = ({
  className,
  pdng,
  pdngInline,
  pdngBlock,
  ...props
}: ContainerProps) => {
  const classNames = [
    "l-container",
    pdng && `u-pdng--${pdng}`,
    pdngInline && `u-pdng-inline--${pdngInline}`,
    pdngBlock && `u-pdng-block--${pdngBlock}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames} {...props} />;
};

type ContainerTitleProps = {
  level: "1" | "2" | "3" | "4" | "5" | "6";
} & HTMLAttributes<HTMLHeadingElement>;

const ContainerTitle = ({
  className,
  level,
  ...props
}: ContainerTitleProps) => {
  const classNames = ["c-container__title", className]
    .filter(Boolean)
    .join(" ");
  const Tag = `h${level}` as const;

  return <Tag className={classNames} {...props} />;
};

type FlexContainerProps = {
  align?: "start" | "center" | "end" | "stretch";
  justify?:
    | "start"
    | "center"
    | "end"
    | "between"
    | "around"
    | "evenly"
    | "stretch";
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
} & HTMLAttributes<HTMLDivElement>;

const FlexContainer = ({
  align,
  className,
  justify,
  gap,
  ...props
}: FlexContainerProps) => {
  const classNames = [
    "l-flex-container",
    align && `u-alignItems--${align}`,
    justify && `u-justifyContent--${justify}`,
    gap && `u-gap--${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames} {...props} />;
};

type GridContainerProps = {
  columns?: number;
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
} & HTMLAttributes<HTMLDivElement>;

const GridContainer = ({
  className,
  columns,
  gap,
  style,
  ...props
}: GridContainerProps) => {
  const classNames = ["l-grid-container", gap && `u-gap--${gap}`, className]
    .filter(Boolean)
    .join(" ");
  const gridStyle = {
    "--grid-columns": columns ? columns : undefined,
    ...style,
  };

  return <div className={classNames} style={gridStyle} {...props} />;
};

export { Container, ContainerTitle, FlexContainer, GridContainer };
