"use client";

import type {
  CSSProperties,
  DetailedHTMLProps,
  DetailsHTMLAttributes,
  FC,
  HTMLAttributes,
  PropsWithChildren,
} from "react";
import { Sizes } from "../types";
import s from "./s.module.css";

/**
 *
 * ### Particulas
 *
 * Nota: La documentacion esta en proceso y soy medio tosco para redactar, voy a ir afinando con los commits.
 *
 * La base para empezar a desarollar componentes.
 * Evitar modificar estas particulas, y de hacerlo revisar los tests y sus componentes que utilizan estos.
 *
 */

type Props<T = {}, E = HTMLDivElement> = Omit<
  DetailsHTMLAttributes<E>,
  "data-testid"
> &
  PropsWithChildren<
    T & {
      className?: string;
    }
  >;

type RootProps = {
  width?: CSSProperties["width"];
};

/**
 * Contenedor padre con definiciones esenciales
 * Se extiende, pero no se puede modificar sus propiedades base.
 */
export const Root: FC<Props<RootProps>> = ({
  children,
  className = "",
  width = "fit-content",
  ...rest
}) => {
  return (
    <div
      {...rest}
      className={`${s.root} ${className}`}
      style={{ ...rest.style, width }}
      data-testid="root"
    >
      {children}
    </div>
  );
};

type FlexProps = {
  style?: CSSProperties;
};

/**
 * Contenedor para organizar los objetos
 * Extensible.
 */
export const Flex: FC<Props<FlexProps>> = ({
  children,
  className = "",
  style = {},
}) => {
  return (
    <div className={`${s.flex} ${className}`} style={style} data-testid="flex">
      {children}
    </div>
  );
};

/**
 * Especifico para textos, proporciona estilos base.
 * Extensible.
 */
export const Text: FC<Props<{ size?: Sizes }, HTMLSpanElement>> = ({
  children,
  className = "",
  size = "m",
  ...rest
}) => {
  return (
    <span
      {...rest}
      className={`${s.text} text-${size} ${className}`}
      data-testid="text"
    >
      {children}
    </span>
  );
};

/**
 * Contenedor para mostrar iconos.
 * Solo deberia ser necesario cambiar las dimensiones.
 */
export const Icon: FC<Props> = ({ children, className = "", ...rest }) => {
  return (
    <div className={`${s.icon} ${className}`} data-testid="icon" {...rest}>
      {children}
    </div>
  );
};

/**
 * Contenedor para manejar las acciones (normalmente botones)
 * Extensible.
 */
export const Action: FC<Props> = ({ children, ...rest }) => {
  return (
    <div {...rest} className={s.action} data-testid="action">
      {children}
    </div>
  );
};

type BrickProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  space?: Sizes;
};

export const Col: FC<PropsWithChildren<BrickProps>> = ({
  children,
  space = "m",
  className = "",
  ...rest
}) => {
  return (
    <div className={`${s.col} ${className}`} data-rows={space} {...rest}>
      {children}
    </div>
  );
};

export const Row: FC<PropsWithChildren<BrickProps>> = ({
  children,
  className = "",
  space = "m",
  ...rest
}) => {
  return (
    <div className={`${s.row} ${className}`} data-rows={space} {...rest}>
      {children}
    </div>
  );
};
