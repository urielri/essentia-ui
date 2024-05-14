import {
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  PropsWithChildren,
  type FC,
} from "react";

type Root = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {};

export const Root: FC<PropsWithChildren<Root>> = ({ children, ...rest }) => {
  return (
    <button data-testid="root" {...rest}>
      {children}
    </button>
  );
};
