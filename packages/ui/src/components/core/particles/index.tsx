import {
  useLayoutEffect,
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type DetailsHTMLAttributes,
  type FC,
  type PropsWithChildren,
} from "react";
import {
  PARTICLES,
  DEFAULT_SIZE,
  setValues,
  type ParticlesKeys,
  type Size,
} from "./rules";

type RootProps = DetailsHTMLAttributes<HTMLDivElement>;

export const Root: FC<PropsWithChildren<RootProps>> = ({
  children,
  ...rest
}) => {
  return (
    <div id={PARTICLES.root} data-testid="root" {...rest}>
      {children}
    </div>
  );
};

type ButtonProps<T = {}> = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> &
  T;

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
  children,
  ...rest
}) => {
  return (
    <button id={PARTICLES.button} data-testid="button" {...rest}>
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
    <div id={PARTICLES.icon} data-testid="icon">
      {children}
    </div>
  );
};

type TextProps = {
  children?: string;
};

export const Text: FC<TextProps> = ({ children = null }) => {
  return (
    <span id={PARTICLES.text} data-testid="text">
      {children}
    </span>
  );
};

type SizesProps = {
  size?: Size;
  exclude?: ParticlesKeys[];
};

export const Sizes: FC<SizesProps> = ({
  size = DEFAULT_SIZE,
  exclude = undefined,
}) => {
  useLayoutEffect(() => {
    /** Setea valores por defecto */
    setValues(`size-${size}`, exclude);
    // if(!isDefualt) setVal
  }, []);

  return null;
};
