import { useCallback, useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, setNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type { KnotDef, SetterOrUpdater } from '../core/types'

/**
 * Lee y escribe un knot del store más cercano.
 *
 * Retorna una tupla `[value, setter]` análoga a `useState`, pero el valor
 * es compartido entre todos los componentes que usen el mismo knot dentro
 * del mismo `<TelarRoot>`.
 *
 * El setter acepta un valor directo o una función actualizadora que recibe
 * el estado previo. Si el nuevo valor es idéntico al actual (`Object.is`),
 * no se notifica a ningún componente.
 *
 * El componente se re-renderiza únicamente cuando el valor del knot cambia.
 * No se re-renderiza por cambios en otros nodos del store.
 *
 * Debe usarse dentro de un árbol envuelto con `<TelarRoot>`.
 *
 * @param def - Definición del knot creada con `knot()`.
 * @returns   Tupla `[value, setter]`.
 *
 * @example
 * const filterKnot = knot<'all' | 'active'>({ key: 'filter', default: 'all' })
 *
 * function FilterBar() {
 *   const [filter, setFilter] = useKnot(filterKnot)
 *
 *   return (
 *     <button onClick={() => setFilter('active')}>
 *       {filter}
 *     </button>
 *   )
 * }
 */
export function useKnot<T>(
  def: KnotDef<T>,
): [T, (next: SetterOrUpdater<T>) => void] {
  const store = useTelarStore()

  const value = useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),
    () => getNodeValue(def, store),
    () => getDefaultValue(def),
  )

  const setter = useCallback(
    (next: SetterOrUpdater<T>) => setNodeValue(def.key, next, store, def.default),
    [def.key, store, def.default],
  )

  return [value, setter]
}
