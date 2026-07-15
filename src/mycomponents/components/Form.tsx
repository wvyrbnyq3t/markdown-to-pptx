// stylesheet
import "../css/Form.css";

// types
import type { ComponentProps } from "react";

type FormSpinnerProps = {
  max?: number;
  min?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
} & ComponentProps<"input">;

const FormSpinner = ({
  className,
  id,
  max,
  min,
  name,
  step,
  value,
  onValueChange,
  ...props
}: FormSpinnerProps) => {
  const classNames = ["c-form-spinner", className].filter(Boolean).join(" ");

  const handleIncrement = (): void => {
    if (max !== undefined && value >= max) {
      return;
    }
    onValueChange(value + (step || 1));
  };
  const handleDecrement = (): void => {
    if (min !== undefined && value <= min) {
      return;
    }
    onValueChange(value - (step || 1));
  };

  return (
    <div className={classNames}>
      <button
        type="button"
        aria-disabled={min !== undefined && value <= min ? true : undefined}
        className="c-form-spinner__button c-form-spinner__button--minus"
        onClick={handleDecrement}
      >
        remove
      </button>
      <input
        type="number"
        name={name}
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
          onValueChange(Number(e.target.value))
        }
        className="c-form-spinner__input"
        readOnly
        {...props}
      />
      <button
        type="button"
        aria-disabled={max !== undefined && value >= max ? true : undefined}
        className="c-form-spinner__button c-form-spinner__button--plus"
        onClick={handleIncrement}
      >
        add
      </button>
    </div>
  );
};

export { FormSpinner };
