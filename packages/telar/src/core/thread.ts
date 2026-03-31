import type { ThreadDef, ReadContext } from './types'

/**
 * Crea un nodo de estado derivado (thread).
 *
 * Un thread calcula su valor a partir de otros nodos del grafo usando la
 * función `get`. Es de **solo lectura** — nunca se escribe directamente.
 *
 * Las dependencias se descubren automáticamente en tiempo de ejecución:
 * cada `read(dep)` dentro de `get` registra `dep` como dependencia. Cuando
 * alguna dependencia cambia, el cache del thread se invalida y será
 * recalculado en la próxima lectura.
 *
 * Los threads soportan dependencias condicionales: si `read` se llama dentro
 * de un `if`, el grafo se actualiza dinámicamente con las deps reales de
 * cada evaluación.
 *
 * Los threads deben definirse a nivel de módulo (fuera de los componentes).
 *
 * @param options.key - Identificador único en el store.
 * @param options.get - Función pura que calcula el valor. Recibe `{ read }`
 *                      para leer otros nodos y registrar dependencias.
 *
 * @example
 * const filteredTodosThread = thread({
 *   key: 'filteredTodos',
 *   get: ({ read }) => {
 *     const todos  = read(todosKnot)
 *     const filter = read(filterKnot)
 *     if (filter === 'active')    return todos.filter(t => !t.completed)
 *     if (filter === 'completed') return todos.filter(t =>  t.completed)
 *     return todos
 *   },
 * })
 *
 * // Los threads pueden depender de otros threads
 * const statsThread = thread({
 *   key: 'stats',
 *   get: ({ read }) => {
 *     const filtered = read(filteredTodosThread)
 *     return { count: filtered.length }
 *   },
 * })
 *
 * // En un componente:
 * const filtered = useThread(filteredTodosThread)
 */
export function thread<T>(options: {
  key:     string
  get:     (ctx: ReadContext) => T
  equal?:  (a: T, b: T) => boolean
  /**
   * Condición de apertura. Si retorna `false`, la re-evaluación se cancela
   * y el thread congela su último valor cacheado. Solo las dependencias
   * del gate se mantienen activas mientras esté cerrado.
   *
   * @example
   * const result = thread({
   *   key:     'result',
   *   default: 0,
   *   gate:    ({ read }) => read(enabledKnot),
   *   get:     ({ read }) => heavyCompute(read(aKnot), read(bKnot)),
   * })
   */
  gate?:    (ctx: ReadContext) => boolean
  /** Valor inicial cuando gate bloquea la primera evaluación (sin cache). */
  default?: T
}): ThreadDef<T> {
  return {
    _brand:  'thread',
    key:     options.key,
    get:     options.get,
    ...(options.equal   !== undefined && { equal:   options.equal }),
    ...(options.gate    !== undefined && { gate:    options.gate }),
    ...(options.default !== undefined && { default: options.default }),
  }
}
