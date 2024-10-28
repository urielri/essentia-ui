import "../global.css";
import { FC, PropsWithChildren } from "react";

export const Root: FC<PropsWithChildren> = ({ children }) => {
  return <div className="root grid">{children}</div>;
};

export const ContentGrid: FC<PropsWithChildren> = ({ children }) => {
  return <div className="content-grid">{children}</div>;
};
