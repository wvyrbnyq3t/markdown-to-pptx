import type { CSSProperties, SVGProps } from "react";

type SpinnerProps = {
  duration?: number; // 1回転にかかる時間（ms）
  size?: string;
} & SVGProps<SVGSVGElement>;

import "@/styles/object/component/_controls.css";

const Spinner = ({
  duration,
  size,
  className,
  style,
  ...props
}: SpinnerProps) => {
  const classNames = ["c-spinner", className].filter(Boolean).join(" ");
  const spinnerStyle = {
    "--spinner-duration": duration ? `${duration}ms` : undefined,
    ...style,
  } as CSSProperties;

  return (
    <div className={classNames} style={spinnerStyle}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={size}
        width={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="status"
        aria-label="Loading"
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
    </div>
  );
};

export { Spinner };
