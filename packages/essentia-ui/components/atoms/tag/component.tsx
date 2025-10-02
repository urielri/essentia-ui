import React, { FC, type PropsWithChildren, type JSX } from "react";
import style from "./style.module.css";
import { Icon } from "#components/internal/particles";
import { ICONS } from "#components/icons";

/* 

Componente Tag

FIGMA: https://www.figma.com/design/mgq5QjeRWWCMqQ1ib8emiY/%F0%9F%9B%A0-NOVA%3A-Web-Responsive-(WIP)?node-id=18102-82834&m=dev

*/
export interface TagProps {
  type:
    | "primary"
    | "secondary"
    | "tertiary"
    | "warning"
    | "success"
    | "error"
    | "neutral";
  emphasis: "bold" | "soft";
  svgIcon?: JSX.Element;
  showIcon?: boolean;
  className?: string;
  dataTestId?: string;
  action?: () => void;
}

export const Tag: FC<PropsWithChildren<TagProps>> = ({
  children,
  type,
  emphasis,
  svgIcon = ICONS.get("information"),
  showIcon = false,
  className = "",
  dataTestId = "tag",
  action = () => {},
}) => {
  return (
    <div
      className={`${style.tag} ${
        style[`tag-${type}-${emphasis}`]
      } ${className}`}
      data-testid={dataTestId}
      onClick={() => action()}
    >
      {showIcon && <Icon className="icon-m">{svgIcon}</Icon>}
      {children}
    </div>
  );
};
