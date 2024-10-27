"use client";

import { type DetailsHTMLAttributes, type FC, PropsWithChildren } from "react";
import {
  Button as ButtonParticle,
  Icon as IconParticle,
  Root,
  Sizes,
  Text,
} from "../../core/particles";
import { ParticlesKeys } from "../../core/particles/rules";

type Base<HTML = HTMLDivElement, Extension = {}> = PropsWithChildren<
  HTML & Extension
>;

/**
 * Properties
 *
 * type
 * svgOnly?
 * shape?
 * children
 * size?
 * loading?
 * shadow?
 * prefix?
 * suffix?
 * DetailsHTMLAttributes (aria-*, data-*, events)
 *
 */

type HTMLButton = Omit<HTMLButtonElement, "prefix">; //Omit prefix property HTML

type Props = {
  suffix?: JSX.Element;
  prefix?: JSX.Element;
  svgOnly?: boolean;
};

export const Button: FC<
  Base<Omit<DetailsHTMLAttributes<HTMLButton>, "prefix">, Props>
> = ({ suffix, prefix, svgOnly = false, children, ...rest }) => {
  let exclude: ParticlesKeys[] = [];

  if (svgOnly) exclude.push("text");
  if (svgOnly && typeof children === "string")
    throw new Error("Children cannot be string if svgOnly's true");
  if (!suffix && !prefix) exclude.push("icon");

  return (
    <Root role="b">
      {prefix && <IconParticle>{prefix}</IconParticle>}
      <ButtonParticle {...rest}>
        {svgOnly ? (
          <IconParticle>{children}</IconParticle>
        ) : (
          <Text>{children as string}</Text>
        )}
      </ButtonParticle>
      {suffix && <IconParticle>{suffix}</IconParticle>}
      <Sizes exclude={exclude} />
    </Root>
  );
};
