/** Especificacion de parametro */
export type TypeFunctionExpression<T> = ((T: T) => T) | T;

/** funcion para setear estado del contexto, recibe <T> o <(T) => T> (TypeFunctionExpression) */
export type SetterOrUpdater<T> = (T: TypeFunctionExpression<T>) => void;

/** Especifica estructura de contexto, para lectura y escritura */
export type ContextType<T> = {
  state: T;
  setter: SetterOrUpdater<T>;
};
