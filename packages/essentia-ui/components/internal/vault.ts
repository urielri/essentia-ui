/* v8 ignore next 3 */

import { render, screen } from "@testing-library/react";
import { ReactElement } from "react";

/** Obtiene el componente por ROLE */
export function getComponent<T = HTMLElement>(
  reactComponent: ReactElement,
  identifier: string,
): T {
  render(reactComponent);
  const component = screen.getByRole(identifier);
  return component as T;
}
