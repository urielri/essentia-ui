import { useMemo, useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, setNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type { BindDef, Reducers, Dispatch } from '../core/types'

/**
 * Lee el estado de un bind y retorna sus acciones como un objeto dispatch tipado.
 *
 * Retorna una tupla `[value, dispatch]`. El objeto `dispatch` tiene un método
 * por cada reducer declarado en el bind. TypeScript infiere los tipos de los
 * argumentos automáticamente — no es necesario declararlos manualmente.
 *
 * El componente se re-renderiza cuando el estado del bind cambia.
 * Si el componente solo necesita escribir (no leer), usar `useDispatch`
 * en su lugar para evitar re-renders innecesarios.
 *
 * Debe usarse dentro de un árbol envuelto con `<TelarRoot>`.
 *
 * @param def - Definición del bind creada con `bind()`.
 * @returns   Tupla `[value, dispatch]`.
 *
 * @example
 * const todosBind = bind({
 *   key: 'todos',
 *   default: [] as Todo[],
 *   reducers: {
 *     add:    (state, todo: Todo)  => [...state, todo],
 *     toggle: (state, id: string)  => state.map(t =>
 *                                       t.id === id ? { ...t, completed: !t.completed } : t),
 *     remove: (state, id: string)  => state.filter(t => t.id !== id),
 *   },
 * })
 *
 * function TodoManager() {
 *   const [todos, dispatch] = useBind(todosBind)
 *
 *   return (
 *     <>
 *       {todos.map(t => (
 *         <li key={t.id}>
 *           {t.text}
 *           <button onClick={() => dispatch.toggle(t.id)}>toggle</button>
 *           <button onClick={() => dispatch.remove(t.id)}>eliminar</button>
 *         </li>
 *       ))}
 *       <button onClick={() => dispatch.add({ id: uuid(), text: 'Nueva', completed: false })}>
 *         agregar
 *       </button>
 *     </>
 *   )
 * }
 */
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
          (state) => def.reducers[actionKey]!(state, ...args),
          store,
          def.default,
        )
      }
    }
    return result
  }, [def, store])

  return [value, dispatch]
}
