import type { ContextType, TypeFunctionExpression } from "./types";

import { createContext, type Context, type Provider } from "react";

/** Funcion encargada de setter el estado del contexto */
export const setter = <P>(newValue: TypeFunctionExpression<P>): void => {
  newValue;
};

/** Construye objeto para instanciar contexto (createContext) */
export function buildContext<P>(initialValue: P): ContextType<P> {
  return {
    state: initialValue,
    setter: setter<P>,
  };
}

/**
 * Simplifica el proceso de creacion de contexto.
 * @param {Object} initialValue
 *
 * @returns {[ContextType, Provider]} Retorna un arreglo con el contexto y el provider
 *
 * @example
 * ```ts
 * const [context, Provider] = context(initialValue)
 * ```
 */
export function context<T = {}>(
  initialValue: T,
): [Context<ContextType<T>>, Provider<ContextType<T>>] {
  const newContext = createContext<ContextType<T>>(
    buildContext<T>(initialValue),
  );
  return [newContext, newContext.Provider];
}
