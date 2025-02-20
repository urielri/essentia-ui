import "../global.css";
import { FC, HTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;
export const Root: FC<Props> = ({ children, ...rest }) => {
  return (
    <div {...rest} className="root grid">
      {children}
    </div>
  );
};

export const ContentGrid: FC<Props> = ({ children, ...rest }) => {
  return (
    <div {...rest} className="content-grid">
      {children}
    </div>
  );
};

export const FullWidth: FC<Props> = ({ children, ...rest }) => {
  return (
    <div {...rest} className="full-width">
      {children}
    </div>
  );
};
