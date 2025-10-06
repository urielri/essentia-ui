import React, { memo, ReactNode } from "react";
import style from "./style.module.css";

/* 

Componente Flag

FIGMA: https://www.figma.com/design/mgq5QjeRWWCMqQ1ib8emiY/%F0%9F%9B%A0-NOVA%3A-Web-Responsive-(WIP)?node-id=18639-89104&t=2JwQrIKK1HvU3LLD-0

*/
export interface FlagProps {
  children?: ReactNode;
  type: "primary" | "secondary" | "tertiary";
  state: "bold" | "soft";
}

const FlagComponent = ({ children, type, state }: FlagProps) => {
  return (
    <div className={`${style.flag} ${style[`flag-${type}-${state}`]}`}>
      {children}
    </div>
  );
};

const Flag = memo(FlagComponent);
export { Flag };
