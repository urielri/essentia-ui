import { useMemo, useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, setNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type { BindDef, Reducers, Dispatch } from '../core/types'

export function useBind<T, R extends Reducers<T>>(
  def: BindDef<T, R>,
): [T, Dispatch<T, R>] {
  const store = useTelarStore()

  const value = useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),
    () => getNodeValue(def, store),
    () => getDefaultValue(def),
  )

  const dispatch = useMemo(() => {
    const result = {} as Dispatch<T, R>
    for (const actionKey of Object.keys(def.reducers) as (keyof R & string)[]) {
      ;(result as any)[actionKey] = (...args: any[]) => {
        setNodeValue<T>(
          def.key,
          (state) => def.reducers[actionKey](state, ...args),
          store,
          def.default,
        )
      }
    }
    return result
  }, [def, store])

  return [value, dispatch]
}
