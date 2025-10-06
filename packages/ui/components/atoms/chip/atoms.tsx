/* v8 ignore start*/
import React from "react";
import { ChipEvents as Events, Sizes } from "#components/internal/types";
import { ICONS } from "#components/icons";
import Image from "next/image";
import type { CSSProperties, FC, MouseEvent, PropsWithChildren } from "react";
import "../../global.css";
import {
  Icon as IconParticle,
  Root,
  Text as TextParticle,
} from "../../internal/particles";
import s from "./s.module.css";

type GenericProps = {
  size: Sizes;
  id?: string;
};

type BaseProps = GenericProps & {
  error: boolean;
  disabled: boolean;
  editable: boolean;
  style?: CSSProperties;
  selected?: boolean;
};

/**
 * NOTE: Si editable es true, se agrega una clase que maneja el :focus, de esta manera se puede agregar los states (selected, seleted:hover) del figma
 * WARNING: Falta los states (selected, selected:hover, selected:focus)
 */

function buildClassName(
  size: Sizes,
  disabled: boolean,
  error: boolean,
  editable: boolean,
  selected: boolean,
): string {
  let className = `${s.chip} ${s[size]}`;

  /** Si disabled es true, aplicamos estilos disabled */
  if (disabled) {
    className = `${className} ${s.disabled}`;
    return className;
  }

  /** Si error es true, aplicamos estilos error */
  if (error) {
    className = `${className} ${s.error}`;
    return className;
  }

  /** Si selected es true, se aplican los estilos correspondientes cuando se utiliza Filter */
  if (selected) className = `${className} ${s.selected}`;

  return className;
}
export const Base: FC<PropsWithChildren<BaseProps>> = ({
  children,
  error,
  id,
  disabled,
  size,
  style,
  editable,
  selected = false,
}) => {
  return (
    <Root
      role="chip"
      className={buildClassName(size, disabled, error, editable, selected)}
      style={style}
      tabIndex={2}
      id={id}
    >
      {children}
    </Root>
  );
};

type CloseProps = BaseProps & Pick<Events, "onClick">;
export const Close: FC<CloseProps> = ({
  onClick: onClickProps,
  size,
  id,
  editable,
}) => {
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    onClickProps &&
      onClickProps({
        ...event,
        target: {
          ...event.target,
          selected: false,
          editable,
          value: event.currentTarget.parentNode?.textContent || "",
          id: id,
        },
      });
  };
  return (
    <IconParticle
      onClick={onClick}
      className={`icon-${size} ${s.visual} ${s.close}`}
    >
      <div className={s.i}>{ICONS.get("close")}</div>
    </IconParticle>
  );
};

type AvatarProps = GenericProps & {
  src: string;
  alt: string;
};
export const Avatar: FC<AvatarProps> = ({ src, alt, size }) => {
  return (
    <IconParticle className={`icont-${size} ${s.visual}`}>
      <Image src={src} alt={alt} width={24} height={24} />
    </IconParticle>
  );
};

type SelectedProps = GenericProps;
export const Selected: FC<SelectedProps> = ({ size }) => {
  return (
    <IconParticle className={`icon-${size} ${s.visual}`}>
      {ICONS.get("check")}
    </IconParticle>
  );
};

type EditableProps = GenericProps &
  Pick<Events, "onChange"> & {
    editable: boolean;
  };
export const Editable: FC<PropsWithChildren<EditableProps>> = ({
  size,
  editable,
  children,
  onChange,
}) => {
  return (
    <TextParticle
      contentEditable={editable}
      tabIndex={-1}
      size={size}
      onBlur={onChange}
    >
      {children}
    </TextParticle>
  );
};

export const Text: FC<PropsWithChildren<GenericProps>> = ({
  children,
  size,
}) => {
  return <TextParticle size={size}>{children}</TextParticle>;
};

export const Icon: FC<PropsWithChildren<GenericProps>> = ({
  children,
  size,
}) => {
  return (
    <IconParticle className={`icon-${size} ${s.visual} ${s.justIcon}`}>
      {children}
    </IconParticle>
  );
};
