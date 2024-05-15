import { it } from "node:test";
import {
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type PropsWithChildren,
  type FC,
  DetailsHTMLAttributes,
  useLayoutEffect,
} from "react";

const atoms = {
  button: "button",
  root: "root",
  icon: "icon",
  text: "text",
} as const;
type AtomsKeys = keyof typeof atoms;

type RootProps = DetailsHTMLAttributes<HTMLDivElement>;

export const Root: FC<PropsWithChildren<RootProps>> = ({
  children,
  ...rest
}) => {
  return (
    <div data-testid="root" {...rest}>
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
    <button data-testid="button" {...rest}>
      {children}
    </button>
  );
};

type IconProps = {
  children?: JSX.Element;
};

export const Icon: FC<IconProps> = ({ children = null }) => {
  return <div data-testid="icon">{children}</div>;
};

type TextProps = {
  children?: string;
};

export const Text: FC<TextProps> = ({ children = null }) => {
  return <span data-testid="text">{children}</span>;
};

type Size = "xs" | "s" | "m" | "l" | "xl";
type SizesProps = {
  default?: boolean;
  size: Size;
  exclude?: AtomsKeys[];
};

function getAtom(key: string): HTMLElement {
  const element = document.getElementById(key);
  if (!element) throw new Error("Element not found");
  return element;
}

function getAtoms(keys: string[]): HTMLElement[] {
  const listElements: HTMLElement[] = [];
  for (let [key, value] of keys) {
    if (!value) throw new Error("Value is invalid");
    const iteration = getAtom(value);
    if (!iteration) throw new Error("Cannot get element " + key);
    listElements.push(iteration);
  }
  return listElements;
}

export const Sizes: FC<SizesProps> = () => {
  useLayoutEffect(() => {}, []);
  return null;
};
