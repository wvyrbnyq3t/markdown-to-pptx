import type { ComponentProps, HTMLAttributes } from "react";

const Accordion = ({
  className,
  ...props
}: ComponentProps<"details">): React.JSX.Element => {
  const classNames = ["c-accordion", className].filter(Boolean).join(" ");

  return <details className={classNames} {...props} />;
};

const AccordionTitle = ({
  className,
  ...props
}: ComponentProps<"summary">): React.JSX.Element => {
  const classNames = ["c-accordion__title", className]
    .filter(Boolean)
    .join(" ");

  return <summary className={classNames} {...props} />;
};

const AccordionContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): React.JSX.Element => {
  const classNames = ["c-accordion__content", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames} {...props} />;
};

export { Accordion, AccordionTitle, AccordionContent };
