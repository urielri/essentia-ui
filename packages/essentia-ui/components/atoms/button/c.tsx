import type {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  PropsWithChildren,
  ReactNode,
} from "react";
import { memo } from "react";

import Spinner from "#components/atoms/spinner/c";
import { Icon, Text } from "#components/internal/particles";
import type {
  ButtonProps,
  Priority,
  Shape,
  Sizes,
  State,
} from "../../internal/types";
import s from "./s.module.css";

/**
 * PERF: Fully optimized :)
 * WARNING: Puede haber probabilidad de que hayan estilos que no se visualicen, esto es porque se puede estar usando
 * una version del navegador que no admita css nesting (chrome <= 111) [ver aqui](https://caniuse.com/css-nesting)
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
  size: Sizes,
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
  size: Sizes,
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

/**
 * Button Component
 *
 */
const Button: FC<PropsWithChildren<Props>> = ({
  children,
  size = "m",
  width,
  height,
  loading = false,
  style,
  prefix,
  suffix,
  svgOnly = false,
  shape = null,
  className = "",
  disabled: disabledProp,
  priority = "primary",
  state = "default",
  ...rest
}) => {
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

  return (
    <button
      {...rest}
      role="button"
      disabled={disabled}
      className={buildClassName(
        s.button,
        disabled || false,
        className,
        size,
        shape,
        priority,
        state,
        loading,
      )}
      {...{ style: { ...style, width, height } }}
    >
      {buildChildren(children, svgOnly, prefix, suffix, loading, shape, size)}
    </button>
  );
};

export default memo(Button);
