import { useMemo } from 'react'
import { useTelarStore } from './context'
import { setNodeValue } from '../core/store'
import type { BindDef, Reducers, Dispatch } from '../core/types'

/**
 * Retorna solo el dispatch de un bind, sin suscribirse al valor.
 *
 * A diferencia de useBind, este hook no crea ninguna suscripción al store.
 * El componente nunca se re-renderiza cuando el estado del bind cambia —
 * solo puede disparar acciones.
 *
 * Usar cuando el componente escribe pero no necesita leer el estado.
 */
export function useDispatch<T, R extends Reducers<T>>(
  def: BindDef<T, R>,
): Dispatch<T, R> {
  const store = useTelarStore()

  return useMemo(() => {
    const result = {} as Dispatch<T, R>
    for (const actionKey of Object.keys(def.reducers) as (keyof R & string)[]) {
      ;(result as any)[actionKey] = (...args: any[]) => {
        setNodeValue<T>(
          def.key,
          (state) => def.reducers[actionKey]!(state, ...args),
          store,
          def.default,
        )
      }
    }
    return result
  }, [def, store])
}
