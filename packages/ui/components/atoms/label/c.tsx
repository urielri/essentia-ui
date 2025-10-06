"use client";

import type {
  DetailsHTMLAttributes,
  FC,
  PropsWithChildren,
  ReactNode,
} from "react";
import { Flex, Icon, Text } from "../../internal/particles/";

import { ICONS } from "../../icons";
import s from "./s.module.css";

type Props = DetailsHTMLAttributes<HTMLLabelElement>;
/** Label component
 * @param htmlFor  -optional
 * @param acceskey  -optional
 * @param title -optional
 * @param error -optional
 * @example
 *  ```tsx
 *  <Label htmlFor="childId" title="Title prop" error="Some error" accessKey="x">hey!</Tag>
 *  ```
 */
export const Base: FC<PropsWithChildren<Props>> = ({ children, ...rest }) => (
  <label {...rest} role="label" className={s.label}>
    {children}
  </label>
);

export const Supporting: FC<PropsWithChildren> = ({ children }) => (
  <Flex
    style={{ gap: "calc(var(--size) / 1.5)", alignItems: "center" }}
    className={s.error}
  >
    <Icon className="icon-s">{ICONS.get("error")}</Icon>
    <small>{children}</small>
  </Flex>
);

type TitleProps = {
  important?: boolean;
  info?: ReactNode;
};
export const Title: FC<PropsWithChildren<TitleProps>> = ({
  children,
  important,
  info,
}) => {
  return (
    <Text className={`${s.title}`}>
      {children}
      {important && <strong className={s.important}> *</strong>}
      {info && info}
    </Text>
  );
};
