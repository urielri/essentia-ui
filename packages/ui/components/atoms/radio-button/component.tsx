"use client";
import { FC, PropsWithChildren, ReactNode } from "react";
import styles from "./styles.module.css";

type GenericProps = {
  className?: string;
};

export const RadioButton: FC<PropsWithChildren<GenericProps>> = ({
  children,
  className = styles["radio-section"],
}) => {
  return <div className={className}>{children}</div>;
};

type TextLabel = {
  className?: string;
};
export const RadioLabel: FC<PropsWithChildren<TextLabel>> = ({
  children,
  className = styles["label-text"],
}) => {
  return (
    <div className={styles["label"]}>
      <span className={className}>{children}</span>
    </div>
  );
};

type InputType = {
  children?: ReactNode;
  disabled?: boolean;
  checked: boolean;
  value?: string;
  name?: string;
  onChange?: (e?: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
};

export const RadioInput: FC<PropsWithChildren<InputType>> = ({
  disabled = false,
  name = "option",
  checked = false,
  value ="deafult value",
  onChange,
  className = styles["radio"],
}) => {

  const handleOnChange = (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div data-testid="radio">
      <label
        className={
          disabled
            ? styles["radio-container-disabled"]
            : styles["radio-container"]
        }
      >
        <input
          className={disabled ? styles["radio-disabled"] : className}
          type="radio"
          name={name}
          disabled={disabled}
          checked={checked}
          value={value}
          onChange={handleOnChange}
        />
      </label>
    </div>
  );
};
