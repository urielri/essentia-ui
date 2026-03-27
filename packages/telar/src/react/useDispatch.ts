import { useMemo } from 'react'
import { useTelarStore } from './context'
import { setNodeValue } from '../core/store'
import type { BindDef, Reducers, Dispatch } from '../core/types'

/**
 * Retorna solo el dispatch de un bind, sin suscribirse al valor.
 *
 * A diferencia de `useBind`, este hook no registra ninguna suscripción en
 * el store. El componente **nunca se re-renderiza** cuando el estado del bind
 * cambia — independientemente de cuántas veces se disparen acciones.
 *
 * Usar cuando el componente solo necesita escribir, no leer.
 * Ejemplos típicos: botones de acción, formularios de entrada, handlers de eventos.
 *
 * Debe usarse dentro de un árbol envuelto con `<TelarRoot>`.
 *
 * @param def - Definición del bind creada con `bind()`.
 * @returns   Objeto dispatch con un método por cada reducer del bind.
 *
 * @example
 * // Este componente puede disparar acciones sobre todosBind
 * // sin re-renderizarse cuando la lista de todos cambia.
 * function AddTodoInput() {
 *   const dispatch = useDispatch(todosBind)
 *   const [text, setText] = useState('')
 *
 *   const handleAdd = () => {
 *     dispatch.add({ id: crypto.randomUUID(), text, completed: false })
 *     setText('')
 *   }
 *
 *   return (
 *     <input
 *       value={text}
 *       onChange={e => setText(e.target.value)}
 *       onKeyDown={e => e.key === 'Enter' && handleAdd()}
 *     />
 *   )
 * }
 *
 * @example
 * // Cada TodoItem puede hacer toggle/delete sin suscribirse a la lista completa
 * function TodoItem({ todo }: { todo: Todo }) {
 *   const dispatch = useDispatch(todosBind)
 *   return (
 *     <li>
 *       <input type="checkbox" onChange={() => dispatch.toggle(todo.id)} />
 *       <button onClick={() => dispatch.remove(todo.id)}>✕</button>
 *     </li>
 *   )
 * }
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
