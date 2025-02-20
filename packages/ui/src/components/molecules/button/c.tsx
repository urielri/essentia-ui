"use client";

import type {
  FC,
  PropsWithChildren,
  DetailedHTMLProps,
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from "react";
import {
  Button as ButtonParticle,
  Icon,
  Icon as IconParticle,
  Root,
  Sizes,
  Text,
} from "../../core/particles";
import { ParticlesKeys } from "../../core/particles/rules";
import { Priority, Shape, Size, State } from "../../../types";
import s from "./s.module.css";

export type ButtonProps = {
  size?: Size;
  loading?: boolean;
  width?: CSSProperties["width"] | number;
  height?: CSSProperties["height"] | number;
  shape?: Shape;
  svgOnly?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  style?: Omit<CSSProperties, "height" | "width">;
};

type Base<HTML = HTMLDivElement, Extension = {}> = PropsWithChildren<
  HTML & Extension
>;

/**
 * Properties
 *
 * type
 * svgOnly?
 * shape?
 * children
 * size?
 * loading?
 * shadow?
 * prefix?
 * suffix?
 * DetailsHTMLAttributes (aria-*, data-*, events)
 *
 */

type ButtonHTML = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export type Props = Omit<ButtonHTML, "style" | "prefix"> &
  ButtonProps & {
    state?: State;
  };

/**
 * Construye className
 * @param {string} componentClassName
 * @param {boolean} disabled
 * @param {string} customClassName
 * @param {Sizes} size
 * @param {Shape | null} shape
 * @param {Priority} priority
 * @param {State} state
 * @param {boolean} loading
 */
export function buildClassName(
  componentClassName: string,
  disabled: boolean,
  customClassName: string,
  size: Size,
  shape: Shape | null,
  priority: Priority,
  state: State,
  loading: boolean,
): string {
  let className = `${componentClassName} ${s[size]}`;
  /**
   * Si hay customClassName, se agrega
   * No se agrega los estilos de disabled,
   * ni  el tipo de visualizacion
   */
  if (customClassName !== "") {
    className = `${className} ${customClassName}`;
    return className;
  }

  /**
   * Si loading es true, se agrega el estilo disabled ya que el boton no puede tener interaccion
   * y se agrega el estilo correspondiente al state prop
   */
  if (loading) {
    const concat = `${priority}-${state}`;
    className = `${className} ${s[concat]} ${s.disabled} ${s.loading}`;
    return className;
  }

  /**
   * Si shape es true, el boton va a ser redondo.
   */
  if (shape) className = `${className} ${s[shape]}`;

  /**
   * Si disabled es true, se agrega el estilo disabled.
   */
  if (disabled) {
    const priorityDisabled = s[`${priority}-disabled`];
    className = `${className} ${s.disabled} ${priorityDisabled}`;
    return className;
  }

  /**
   * Aplicamos la estilo de visualizacion si disabled es false y no hay customClassName
   */
  const concat = `${priority}-${state}`;
  className = `${className} ${s[concat]}`;
  return className;
}

/**
 * Construye la prop children
 * @param {ReactNode} children
 * @param {boolean} svgOnly
 * @param {ReactNode | undefined} prefix
 * @param {ReactNode | undefined} suffix
 * @param {boolean} loading
 * @param {Shape | undefined} shape
 * @param {Sizes} size
 */
export function buildChildren(
  children: ReactNode,
  svgOnly: boolean,
  prefix: ReactNode,
  suffix: ReactNode,
  loading: boolean,
  shape: Shape | null,
  size: Size,
): ReactNode {
  let component = children;

  /**
   * Si children es solo texto, se agrega la particula Text
   */
  if (typeof children === "string")
    component = <Text className={size}>{children}</Text>;

  /**
   * SvgOnly prop depende de shape prop, si shape no existe,
   * se arrojara un error
   */
  if (svgOnly) {
    if (!shape) throw new Error("Button: Must expose the shape property");
    return component;
  }

  /**
   * Retorna solo el spinner
   */
  if (loading)
    component = (
      <>
        <Icon className={s[`icon-${size}`]}>
          <Spinner />
        </Icon>
        {component}
      </>
    );

  /**
   * Se agrega el icono a la izquierda
   */
  if (prefix)
    component = (
      <>
        <Icon className={s[`icon-${size}`]}>{prefix}</Icon>
        {component}
      </>
    );

  /**
   * Se agrega el icono a la derecha
   */
  if (suffix)
    component = (
      <>
        {component}
        <Icon className={size}>{suffix}</Icon>
      </>
    );
  return component;
}

export const Button: FC<PropsWithChildren<Props>> = ({
  suffix,
  prefix,
  svgOnly = false,
  children,
  loading,
  disabled: disabledProp,
  shape,
  size,
  ...rest
}) => {
  let exclude: ParticlesKeys[] = [];

  /**
   * Si loading es true y disabled false,
   * automaticamente disabled va a ser true
   */
  let disabled = disabledProp;
  if (loading) disabled = true;

  if (shape && loading)
    throw new Error("Loading debe ser falso si shape no es null");
  if (shape && !svgOnly)
    throw new Error("svgOnly debe ser true si shape no es null");
  if (shape && svgOnly && typeof children === "string")
    throw new Error("Children debe ser Element si shape no es null");

  if (svgOnly) exclude.push("text");
  if (svgOnly && typeof children === "string")
    throw new Error("Children cannot be string if svgOnly's true");
  if (!suffix && !prefix) exclude.push("icon");

  return (
    <Root role="b">
      {prefix && <IconParticle>{prefix}</IconParticle>}
      <ButtonParticle {...rest} style={{ background: "red" }}>
        {svgOnly ? (
          <IconParticle>{children}</IconParticle>
        ) : (
          <Text>{children as string}</Text>
        )}
      </ButtonParticle>
      {suffix && <IconParticle>{suffix}</IconParticle>}
      <Sizes exclude={exclude} />
    </Root>
  );
};

const Spinner: FC = () => {
  return <span className={s.spn}></span>;
};
