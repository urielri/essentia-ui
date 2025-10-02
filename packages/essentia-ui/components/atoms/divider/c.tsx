import { DetailsHTMLAttributes, FC } from "react";
import s from "./s.module.css";
export const Divider: FC<DetailsHTMLAttributes<HTMLDivElement>> = ({
  ...rest
}) => {
  return <div {...rest} className={s.divider}></div>;
};
