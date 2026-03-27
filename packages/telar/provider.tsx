"use client";

import { ContextType, TypeFunctionExpression } from "./types";
import React, {
  type PropsWithChildren,
  type Context,
  useState,
  useCallback,
  useMemo,
  type Provider as ProviderType,
} from "react";

type Props<T, P> = {
  context: Context<T>;
  initialValue: P;
};

/**
 * @type {Object} Props
 * @property {Object} context - ContextType<Type>
 * @property {Object} initialValue - first context value
 */

/**
 * ## Provider context
 * @param {Props} props
 *
 * @example
 * ```tsx
 * <Provider initialValue={initialContextValue} context={contextValue}>{children}</Provider>
 * ```
 */
function Provider<T, P>({
  context,
  initialValue,
  children,
}: PropsWithChildren<Props<T, P>>) {
  const ProviderComponent = context.Provider as ProviderType<ContextType<P>>;
  const [state, setState] = useState<P>(initialValue);
  const setter = useCallback((newValue: TypeFunctionExpression<P>) => {
    setState(newValue);
  }, []);

  const ctx = useMemo(
    () => ({
      state,
      setter,
    }),
    [state, setter],
  );

  return <ProviderComponent value={ctx}>{children}</ProviderComponent>;
}
export default Provider;
