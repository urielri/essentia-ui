import { useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type { ThreadDef } from '../core/types'

/**
 * Lee el valor calculado de un thread.
 *
 * Retorna el valor derivado del thread y se suscribe a sus cambios.
 * Es de **solo lectura** — los threads no pueden escribirse directamente.
 *
 * El componente se re-renderiza únicamente cuando el valor del thread cambia.
 * El thread recalcula su valor cuando alguna de sus dependencias cambia;
 * si el resultado es idéntico al anterior (`Object.is`), no hay re-render.
 *
 * Internamente el valor está cacheado: si ninguna dependencia cambió desde
 * la última evaluación, se retorna el resultado cacheado sin re-ejecutar `get`.
 *
 * Debe usarse dentro de un árbol envuelto con `<TelarRoot>`.
 *
 * @param def - Definición del thread creada con `thread()`.
 * @returns   El valor calculado, de solo lectura.
 *
 * @example
 * const filteredTodosThread = thread({
 *   key: 'filteredTodos',
 *   get: ({ read }) => read(todosKnot).filter(t => !t.completed),
 * })
 *
 * function PendingList() {
 *   const todos = useThread(filteredTodosThread)
 *   return <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>
 * }
 */
export function useThread<T>(def: ThreadDef<T>): T {
  const store = useTelarStore()

  return useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),
    () => getNodeValue(def, store),
    () => getDefaultValue(def),
  )
}
