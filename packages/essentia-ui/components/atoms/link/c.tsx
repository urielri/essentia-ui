"use client";

import NextLink from "next/link";
import { buildChildren, buildClassName } from "../button/c";
import type { DetailsHTMLAttributes, FC, PropsWithChildren } from "react";
import { ButtonProps } from "../../internal/types";
import { type Url } from "url";
import s from "../button/s.module.css";
type Props = DetailsHTMLAttributes<Omit<HTMLAnchorElement, "href">> &
  ButtonProps & {
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
    href: Url | string;
    disabled?: boolean;
  };
/**
 *
 * Link component extends from Link Next component
 * Se extiende del componente de next y se aplican los estilos correspondientes.
 * Para testear, usar el role = 'link'
 *
 */
export const Link: FC<PropsWithChildren<Props>> = ({
  priority = "primary",
  size = "m",
  prefix,
  suffix,
  style,
  width,
  height,
  shape = null,
  className = "",
  disabled = false,
  svgOnly = false,
  href,
  replace = false,
  scroll = true,
  onClick: onClickProp,
  prefetch,
  children,
  ...rest
}) => {
  let onClick = onClickProp;

  /**
   * Si disabled es true, evitamos la redireccion con preventDefault
   */
  if (disabled) onClick = (e) => e.preventDefault();

  return (
    <NextLink
      {...rest}
      className={buildClassName(
        s.link,
        disabled,
        className,
        size,
        shape,
        priority,
        "default",
        false,
      )}
      href={href}
      {...{ style: { ...style, width, height } }}
      replace={replace}
      scroll={scroll}
      role="link"
      onClick={onClick}
      prefetch={prefetch}
    >
      {buildChildren(children, svgOnly, prefix, suffix, false, shape, size)}
    </NextLink>
  );
};
