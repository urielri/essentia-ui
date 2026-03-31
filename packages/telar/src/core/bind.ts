import type { BindDef, Reducers } from './types'

/**
 * Crea un nodo de estado con reducers (bind).
 *
 * Un bind es como un knot pero con transiciones nombradas: el estado
 * solo puede modificarse a través de las acciones declaradas en `reducers`.
 * No existe un setter libre. Esto hace que cada cambio tenga un nombre
 * semántico y sea fácil de rastrear.
 *
 * TypeScript infiere automáticamente el tipo del objeto `dispatch` a partir
 * de los reducers: elimina el primer parámetro `state` y cambia el retorno
 * a `void`.
 *
 * Los binds deben definirse a nivel de módulo (fuera de los componentes).
 *
 * @param options.key      - Identificador único en el store.
 * @param options.default  - Valor inicial cuando el nodo nunca fue escrito.
 * @param options.reducers - Mapa de funciones puras `(state, ...args) => newState`.
 *                           Cada función define una acción del dispatch.
 *
 * @example
 * const cartBind = bind({
 *   key: 'cart',
 *   default: [] as CartItem[],
 *   reducers: {
 *     add:    (state, item: CartItem) => [...state, item],
 *     remove: (state, id: string)    => state.filter(i => i.id !== id),
 *     clear:  ()                     => [],
 *   },
 * })
 *
 * // En un componente que lee y escribe:
 * const [cart, dispatch] = useBind(cartBind)
 * dispatch.add({ id: '1', name: 'Producto', price: 100 })
 * dispatch.remove('1')
 * dispatch.clear()
 *
 * // En un componente que solo escribe (sin suscripción al valor):
 * const dispatch = useDispatch(cartBind)
 * dispatch.add(newItem)
 */
export function bind<T, R extends Reducers<T>>(options: {
  key: string
  default: T
  reducers: R
  uiCache?: boolean
}): BindDef<T, R> {
  return {
    _brand: 'bind',
    key:      options.key,
    default:  options.default,
    reducers: options.reducers,
    ...(options.uiCache !== undefined && { uiCache: options.uiCache }),
  }
}
