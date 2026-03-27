import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, setNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type {
  KnotDef,
  ThreadDef,
  BindDef,
  AnyNode,
  Reducers,
  Dispatch,
  SetterOrUpdater,
} from '../core/types'

// ─── Overloads ────────────────────────────────────────────────────────────────

/**
 * Hook unificado que infiere el tipo de retorno según el tipo de nodo.
 *
 * Es equivalente a llamar `useKnot`, `useThread` o `useBind` directamente,
 * pero con una única importación. TypeScript estrecha el tipo de retorno
 * automáticamente a partir del tipo del argumento.
 *
 * Usar los hooks especializados cuando la intención es explícita;
 * usar `useTelar` cuando se prefiere la API unificada o se construyen
 * abstracciones genéricas sobre nodos.
 *
 * @example
 * const filterKnot  = knot({ key: 'filter', default: 'all' })
 * const totalThread = thread({ key: 'total', get: ({ read }) => read(cartKnot).length })
 * const cartBind    = bind({ key: 'cart', default: [], reducers: { add: ... } })
 *
 * // En componentes:
 * const [filter, setFilter] = useTelar(filterKnot)   // → [T, setter]
 * const total               = useTelar(totalThread)   // → T
 * const [cart, dispatch]    = useTelar(cartBind)      // → [T, dispatch]
 */
export function useTelar<T>(def: KnotDef<T>): [T, (next: SetterOrUpdater<T>) => void]
export function useTelar<T>(def: ThreadDef<T>): T
export function useTelar<T, R extends Reducers<T>>(def: BindDef<T, R>): [T, Dispatch<T, R>]

// ─── Implementación ───────────────────────────────────────────────────────────

export function useTelar<T>(def: AnyNode<T>): any {
  const store = useTelarStore()

  // Todos los hooks se llaman incondicionalmente — sin violación de Rules of Hooks
  const value = useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),
    () => getNodeValue(def, store),
    () => getDefaultValue(def),
  )

  const defaultValue = def._brand !== 'thread' ? def.default : (undefined as T)

  const setter = useCallback(
    (next: SetterOrUpdater<T>) => setNodeValue(def.key, next, store, defaultValue),
    [def.key, store, defaultValue],
  )

  const dispatch = useMemo(() => {
    if (def._brand !== 'bind') return null
    const result: any = {}
    for (const actionKey of Object.keys(def.reducers)) {
      result[actionKey] = (...args: any[]) => {
        setNodeValue<T>(
          def.key,
          (state) => (def as BindDef<T, any>).reducers[actionKey](state, ...args),
          store,
          (def as BindDef<T, any>).default,
        )
      }
    }
    return result
  }, [def, store])

  if (def._brand === 'thread') return value
  if (def._brand === 'bind') return [value, dispatch]
  return [value, setter]
}
