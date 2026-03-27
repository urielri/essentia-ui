import type { KnotDef } from './types'

/**
 * Crea un nodo de estado base (knot).
 *
 * Un knot es la unidad atómica del grafo de Telar. Almacena un único valor
 * de tipo `T`, acepta escritura libre y puede ser leído por threads.
 * La definición retornada no contiene el valor — el valor vive en el Store
 * del árbol React más cercano.
 *
 * Los knots deben definirse a nivel de módulo (fuera de los componentes)
 * para que su referencia sea estable entre renders.
 *
 * @param options.key     - Identificador único en el store. Debe ser único
 *                          dentro de un mismo `<TelarRoot>`.
 * @param options.default - Valor retornado cuando el knot nunca fue escrito.
 *
 * @example
 * const filterKnot = knot<'all' | 'active' | 'completed'>({
 *   key: 'filter',
 *   default: 'all',
 * })
 *
 * // En un componente:
 * const [filter, setFilter] = useKnot(filterKnot)
 * setFilter('active')
 * setFilter(prev => prev === 'all' ? 'active' : prev)
 */
export function knot<T>(options: { key: string; default: T }): KnotDef<T> {
  return {
    _brand: 'knot',
    key: options.key,
    default: options.default,
  }
}
