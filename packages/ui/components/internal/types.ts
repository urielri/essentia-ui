/* v8 ignore next 3 */

import {
  CSSProperties,
  FocusEventHandler,
  MouseEventHandler,
  ReactNode,
  MouseEvent,
} from "react";

export type Sizes = "s" | "m" | "l";

/** BUTTON TYPES */
export type Shape = "square" | "circle";
export type State = "default" | "success" | "delete";
export type Priority = "primary" | "secondary" | "tertiary";
export type ButtonProps = {
  size?: Sizes;
  loading?: boolean;
  width?: CSSProperties["width"] | number;
  height?: CSSProperties["height"] | number;
  shape?: Shape;
  svgOnly?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  priority?: Priority;
  style?: Omit<CSSProperties, "height" | "width">;
};

/** CHIP TYPES */

export type ChipTarget = {
  selected?: boolean;
  value?: string;
  id?: string;
  editable?: boolean;
};

export type HTMLElementWithTarget<E = HTMLDivElement> = E & ChipTarget;
export type MouseEventChip<E> = MouseEvent<E> & { target: ChipTarget };
export type ChipEvents = {
  /** Evento para interactuar con el texto  */
  onChange?: FocusEventHandler<HTMLElementWithTarget<HTMLSpanElement>>;
  /** Si se provee de la prop onDelete, se va a mostrar el icono de Close */
  //onDelete?: MouseEventHandler<HTMLElementWithTarget>;
  onDelete?: (event: MouseEventChip<HTMLElementWithTarget>) => void;
  /** Evento para interactuar con el click (util para el close action)*/
  //onClick?: MouseEventHandler<HTMLElementWithTarget>;
  onClick?: (event: MouseEventChip<HTMLElementWithTarget>) => void;
};
