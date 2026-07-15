import type { HTMLAttributes, ReactNode } from "react";
import { Children, cloneElement, isValidElement } from "react";

type SlotProps = {
  children?: ReactNode;
} & HTMLAttributes<HTMLElement>;

const Slot = (props: SlotProps) => {
  const { children, ...rest } = props;

  if (isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      ...rest,
      ...children.props,
      className: `${rest.className ?? ""} ${children.props.className ?? ""}`,
    });
  }

  if (Children.count(children) > 1) {
    Children.only(null);
  }

  return null;
};

export default Slot;
