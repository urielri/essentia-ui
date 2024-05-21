import {
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type PropsWithChildren,
  type FC,
  DetailsHTMLAttributes,
  useLayoutEffect,
} from "react";
import {
  ATOMS,
  type AtomsKeys,
  type Size,
  DEFAULT_SIZE,
  setDefaultValues,
} from "./internal";

type RootProps = DetailsHTMLAttributes<HTMLDivElement>;

export const Root: FC<PropsWithChildren<RootProps>> = ({
  children,
  ...rest
}) => {
  return (
    <div id={ATOMS.root} data-testid="root" {...rest}>
      {children}
    </div>
  );
};

type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {};

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
  children,
  ...rest
}) => {
  return (
    <button id={ATOMS.button} data-testid="button" {...rest}>
      {children}
    </button>
  );
};
1;

type IconProps = {
  children?: JSX.Element;
};

export const Icon: FC<IconProps> = ({ children = null }) => {
  return (
    <div id={ATOMS.icon} data-testid="icon">
      {children}
    </div>
  );
};

type TextProps = {
  children?: string;
};

export const Text: FC<TextProps> = ({ children = null }) => {
  return (
    <span id={ATOMS.text} data-testid="text">
      {children}
    </span>
  );
};

type SizesProps = {
  isDefault?: boolean;
  size?: Size;
  exclude?: AtomsKeys[];
  values?: Record<AtomsKeys, string>;
};

export const Sizes: FC<SizesProps> = ({
  isDefault = true,
  size = DEFAULT_SIZE,
  exclude = undefined,
  values = undefined,
}) => {
  useLayoutEffect(() => {
    /** Setea valores por defecto */
    if (isDefault) setDefaultValues(`size-${size}`, exclude);
  }, []);

  return null;
};
