import {
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type DetailsHTMLAttributes,
  type FC,
  type PropsWithChildren,
  useLayoutEffect,
} from "react";
import {
  DEFAULT_SIZE,
  PARTICLES,
  type ParticlesKeys,
  setValues,
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
export const Icon: FC<PropsWithChildren> = ({ children = null }) => {
  if (typeof children === "string")
    throw new Error("Children cannot be string");
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
  }, []);

  return null;
};
