import { Context, useCallback, useContext } from "react";
import { ContextType, SetterOrUpdater, TypeFunctionExpression } from "./types";

/**
 * @typedef {StandardContext}
 */
type StandardContext<T> = Context<ContextType<T>>;

/**
 * Custom hook que actualiza el valor del contexto
 * @param {Object} context -- Un objecto instanciado por createContext()
 * @returns {StandardContext} una funcion setter con el valor actual del contexto por parametro
 */
export const useSetContext = <T = {}>(
  context: StandardContext<T>,
): SetterOrUpdater<T> => {
  const { setter } = useContext(context);
  return useCallback(
    (newValue: TypeFunctionExpression<T> | T) => {
      setter(newValue);
    },
    [setter],
  );
};

/**
 * Custom hook que brinda SOLO el valor actual (readonly) del contexto.
 * @param {Object} context -- Un objecto instanciado por createContext()
 * @returns valor actual del contexto
 */
export const useValueContext = <T = {}>(context: StandardContext<T>): T => {
  const { state } = useContext(context);
  return state;
};

/**
 * Custom Hook para poder administrar el estado del contexto
 * @param {Object} context -- Un objecto instanciado por createContext()
 * @returns valor actual (readonly) del contexto y una funcion setter.
 *
 */
export const useStateContext = <T = {}>(
  context: StandardContext<T>,
): [state: T, set: SetterOrUpdater<T>] => {
  return [useValueContext(context), useSetContext(context)];
};
