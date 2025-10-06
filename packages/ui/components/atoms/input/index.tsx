import type {
  CSSProperties,
  ChangeEvent,
  DetailedHTMLProps,
  FC,
  InputHTMLAttributes,
  ReactElement,
  JSX,
  ReactNode,
} from "react";
import { memo } from "react";

import s from "./s.module.css";

type Colors = "primary" | "secondary" | "disabled" | "text";
export type Size = "s" | "m" | "l" | "auto";
type I = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  icon?: JSX.Element | ReactElement | ReactNode;
  visualization?: "default" | "simple" | "bordered" | "customizable";
  colors?: { [K in Colors]?: string };
  sizes?: Size;
  styleContainer?: Partial<HTMLDivElement["style"]>;
  view?: string;
};

const Component: FC<I> = ({ ...props }) => {
  const {
    colors,
    view,
    visualization = "default",
    icon,
    sizes = "m",
    name,
    value,
    id,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    minLength,
    disabled,
    autoComplete = "off",
    maxLength,
    onError,
    width,
    height,
    onKeyDown,
    pattern,
    type = "text",
    styleContainer = null,
    ...rest
  } = props;
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      if (maxLength && type === "number") {
        e.target.value.length <= maxLength && onChange(e);
      } else {
        onChange(e);
      }
    }
  };
  const size = { width, height };
  const sC =
    ({
      ...size,
      ...styleContainer,
    } as CSSProperties) || {};
  return (
    <div
      className={`${s.input} ${
        visualization !== "customizable" && s[visualization]
      } ${s[sizes]}`}
      style={sC}
    >
      {icon && <div>{icon}</div>}
      <input
        {...{
          name,
          type,
          value,
          id,
          onBlur,
          onFocus,
          placeholder,
          minLength,
          maxLength,
          disabled,
          autoComplete,
          onError,
          width,
          pattern,
          onKeyDown,
          height,
          ...rest,
        }}
        onChange={change}
        onWheel={(e) => e.currentTarget.blur()}
      />
      {view && (
        <div className={s.view}>
          <span>{view}</span>
        </div>
      )}
    </div>
  );
};

const Input = memo(Component);
export { Input };
