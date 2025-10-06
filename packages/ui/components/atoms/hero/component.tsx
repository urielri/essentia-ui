"use client";

import React, { memo, PropsWithChildren } from "react";
import style from "./style.module.css";
import { TITLES } from "./constants";
import { usePathname } from "next/navigation";

/**
 * Hero Component de AG,
 * muestra el titulo de pagina segun la url definido en ./constants.ts,
 * en caso de tener pasarle un children el titulo no se muestra
 */
const HeroComponent = ({ children }: PropsWithChildren) => {
  const path = usePathname();
  const title = TITLES.get(path) ?? "";
  return (
    <div className={`full-width ${style.container}`}>
      {children ?? <h1 className={style.title}>{title}</h1>}
    </div>
  );
};

const Hero = memo(HeroComponent);
export { Hero };
