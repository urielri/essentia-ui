/* v8 ignore start */

"use client";

import React, { FC, FocusEvent, PropsWithChildren } from "react";
import { Atom } from ".";
import { InputProps, SIZE } from "./c";

export const EditableWithEvent: FC<PropsWithChildren<InputProps>> = ({
  children,
  editable = false,
  onChange: onChangeProps,
  id = "",
  size = SIZE,
}) => {
  const onChange = (event: FocusEvent<HTMLSpanElement>) => {
    onChangeProps &&
      onChangeProps({
        ...event,
        target: {
          ...event.target,
          selected: false,
          editable: true,
          value: event.target.textContent || "",
          id: id,
        },
      });
  };
  return (
    <Atom.Editable onChange={onChange} editable={editable} size={size}>
      {children}
    </Atom.Editable>
  );
};
