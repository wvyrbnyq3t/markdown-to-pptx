import type { HTMLAttributes } from "react";

const Page = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const classNames = ["l-page", className].filter(Boolean).join(" ");

  return <div className={classNames} {...props} />;
};

type PageHeaderProps = {
  position: "fixed" | "sticky";
} & HTMLAttributes<HTMLDivElement>;

const PageHeader = ({ className, position, ...props }: PageHeaderProps) => {
  const classNames = ["l-page-header", `l-page-header--${position}`, className]
    .filter(Boolean)
    .join(" ");

  return <header className={classNames} {...props} />;
};

const PageTitle = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const classNames = ["l-page-title", className].filter(Boolean).join(" ");

  return <h1 className={classNames} {...props} />;
};

const PageContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const classNames = ["l-page-content", className].filter(Boolean).join(" ");

  return <main className={classNames} {...props} />;
};

const PageFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const classNames = ["l-page-footer", className].filter(Boolean).join(" ");
  return <footer className={classNames} {...props} />;
};

export { Page, PageHeader, PageTitle, PageContent, PageFooter };
