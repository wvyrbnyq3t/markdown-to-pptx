type SpinnerProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  duration?: number; // 1回転にかかる時間（ms）
} & React.SVGProps<SVGSVGElement>;

const Spinner = ({ className, duration, size, style, ...props }: SpinnerProps) => {
  const classNames = ["c-spinner", size ? `c-spinner--${size}` : null, className]
    .filter(Boolean)
    .join(" ");
  const convertSizeToPixels = (size: SpinnerProps["size"]): number => {
    switch (size) {
      case "xs":
        return 8;
      case "sm":
        return 16;
      case "md":
        return 24;
      case "lg":
        return 32;
      case "xl":
        return 40;
      default:
        return 24;
    }
  };
  const styles = {
    "--duration": duration ? `${duration}ms` : undefined,
    "--sz-spinner": size ? `${convertSizeToPixels(size)}px` : undefined,
    ...style,
  };

  return (
    <div className={classNames} style={styles}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={convertSizeToPixels(size)}
        height={convertSizeToPixels(size)}
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

export default Spinner;
