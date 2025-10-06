import React from "react";
import type { CSSProperties, FC, PropsWithChildren, ReactNode } from "react";
import { Atom } from ".";
import "../../global.css";
import { ChipEvents as Events, Sizes } from "../../internal/types";
import { EditableWithEvent } from "./event";

/**
 * TODO: Utilizar los iconos importados desde utils/icons (si no estan moverlos/copiarlos)
 *
 * NOTE: Si se necesita extender el componente, se puede utilizar los atomos con el cual se disenho el mismo.
 *
 * NOTE: FIGMA > https://www.figma.com/design/mgq5QjeRWWCMqQ1ib8emiY/%F0%9F%9B%A0-NOVA%3A-Web-Responsive-(WIP)?node-id=18301-85478&t=1KlzQrJ3RrCRcu57-1
 *
 * WARNING: Este componente queda incompleto dado que faltan consolidar algunas definiciones con ds (design system)
 */

function buildWidth(
  min: string,
  max: string,
): { minWidth: string; maxWidth: string } {
  return {
    minWidth: min,
    maxWidth: max,
  };
}

export const SIZE: Sizes = "s";

type VisualProps = {
  alt?: string;
  /** Agrega el component Avatar */
  avatar?: string;
  /** Muestra icon */
  icon?: ReactNode;
};

export type BaseProps = {
  /** Muestra estilos de error */
  error?: boolean;
  /** Muestra estilos de disabled e inhabilita la interaccion */
  disabled?: boolean;
  /** Tamanho del componente */
  size?: Sizes;
  style?: CSSProperties;
  id?: string;
  editable?: boolean;
  /** Aplica estilos necesarios */
  selected?: boolean;
};

// Classes >> error, disabled, size, selected
// Functionality >> onDelete, onChange
// onChange >> Manipula el evento Target (custom)

/** Chip component
 *
 * @example
 *  ```tsx
 *  <Chip textColor="var(--u-text)" bg="var(--u-success)">hey!</Tag>
 *  ```
 */
export const Base: FC<PropsWithChildren<BaseProps>> = ({
  children,
  disabled = false,
  error = false,
  size = SIZE,
  id,
  selected = false,
  style,
  editable = false,
}) => {
  return (
    <Atom.Base
      size={size}
      id={id}
      style={style}
      error={error}
      disabled={disabled}
      editable={editable}
      selected={selected}
    >
      {children}
    </Atom.Base>
  );
};

export type AssistProps = BaseProps & VisualProps;
/**
 * Choice/Assist Chips - no se cierran y de selección individual
 */
export const Assist: FC<PropsWithChildren<AssistProps>> = ({
  avatar,
  alt = "",
  icon,
  children,
  size = SIZE,
  disabled = false,
  id,
  error = false,
}) => {
  if (avatar && icon)
    throw new Error("No se puede mostrar un icono si Avatar no es undefined");

  /**
   * Text ancho mínimo fijo de 67px máximo 165px
   */
  let min = "67px";
  let max = "165px";

  /**
   * Text+Icon ancho mínimo fijo de 95px máximo 193px
   */
  if (icon) {
    min = "95px";
    max = "193px";
  }

  /**
   * Text+Image ancho mínimo fijo de 91px máximo 189px
   */
  if (avatar) {
    min = "91px";
    max = "189px";
  }

  const style = buildWidth(min, max);

  return (
    <Base error={error} id={id} disabled={disabled} size={size} style={style}>
      {icon && <Atom.Icon size={size}>{icon}</Atom.Icon>}
      {avatar && <Atom.Avatar src={avatar} size={size} alt={alt} />}
      <Atom.Text size={size}>{children}</Atom.Text>
    </Base>
  );
};

export type FilterProps = BaseProps &
  Pick<Events, "onChange"> & {
    /** Muestra CheckIcon */
    selected: boolean;
  };
/**
 * Filter Chips - no se cierran y de múltiple selección
 */
export const Filter: FC<PropsWithChildren<FilterProps>> = ({
  children,
  disabled = false,
  selected,
  size = SIZE,
  error = false,
}) => {
  return (
    <Base size={size} selected={selected} error={error} disabled={disabled}>
      <div>
        <Atom.Selected size={size} />
      </div>
      <Atom.Text size={size}>{children}</Atom.Text>
    </Base>
  );
};

export type InputProps = BaseProps & VisualProps & Events;
/**
 * Input Chips - pueden cerrarse y es posible editarlos
 */
export const Input: FC<PropsWithChildren<InputProps>> = ({
  children,
  size = SIZE,
  error = false,
  disabled = false,
  editable = false,
  avatar = "",
  alt = "",
  icon,
  id,
  onDelete,
  onChange,
}) => {
  if (avatar && icon)
    throw new Error("No se puede mostrar un icono si Avatar no es undefined");

  /**
   * Text ancho mínimo fijo de 67px máximo 165px
   */
  let min = "67px";
  let max = "165px";

  /**
   * Text+Icon ancho mínimo fijo de 95px máximo 193px
   */
  if (icon) {
    min = "95px";
    max = "193px";
  }

  /**
   * Text+Image ancho mínimo fijo de 91px máximo 189px
   */
  if (avatar) {
    min = "91px";
    max = "189px";
  }

  const style = buildWidth(min, max);

  return (
    <Base size={size} id={id} error={error} disabled={disabled} style={style}>
      {icon && (
        <Atom.Icon size={size} id={id}>
          {icon}
        </Atom.Icon>
      )}
      {avatar && <Atom.Avatar src={avatar} size={size} alt={alt} />}
      <EditableWithEvent id={id} onChange={onChange} editable={editable}>
        {children}
      </EditableWithEvent>
      {onDelete && (
        <Atom.Close
          size={size}
          onClick={onDelete}
          editable={editable}
          id={id}
          disabled={disabled}
          error={error}
        ></Atom.Close>
      )}
    </Base>
  );
};
