import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Sizes } from "../types";

export type Props = {
  size?: Sizes;
  fill?: boolean;
  width?: CSSProperties["width"];
  action?: ReactNode;
};

export const useMemorizable = (
  isMemorizable?: boolean,
): { show: boolean; close: () => void } => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const value = localStorage.getItem("generalNotice");

    if (value && value === "true") {
      setShow(false);
    }
  }, []);

  const close = () => {
    if (isMemorizable) {
      localStorage.setItem("generalNotice", "true");
    }
    setShow(false);
  };

  return { show, close };
};
