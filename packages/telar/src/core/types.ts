// ─── Setter ──────────────────────────────────────────────────────────────────

/**
 * Argumento que acepta un setter de Telar.
 * Puede ser un valor directo o una función que recibe el estado previo
 * y retorna el nuevo — idéntico al argumento de `setState` en React.
 *
 * @example
 * setCount(5)                  // valor directo
 * setCount(prev => prev + 1)   // función actualizadora
 */
export type SetterOrUpdater<T> = T | ((prev: T) => T)

// ─── Read context ─────────────────────────────────────────────────────────────

/**
 * Contexto inyectado en la función `get` de un thread.
 * La función `read` permite leer el valor de cualquier nodo del grafo.
 * Cada llamada a `read` registra automáticamente una dependencia —
 * si el nodo leído cambia, el thread se invalida y recalcula.
 *
 * @example
 * const total = thread({
 *   key: 'total',
 *   get: ({ read }) => read(priceKnot) * read(qtyKnot),
 * })
 */
export type ReadContext = {
  read: <T>(node: AnyNode<T>) => T
}

// ─── Reducers ─────────────────────────────────────────────────────────────────

/**
 * Mapa de funciones puras que definen las transiciones permitidas sobre
 * un estado de tipo `T`. Cada reducer recibe el estado actual y
 * argumentos adicionales, y retorna el nuevo estado sin mutarlo.
 *
 * @example
 * const reducers: Reducers<Todo[]> = {
 *   add:    (state, item: Todo)  => [...state, item],
 *   remove: (state, id: string)  => state.filter(t => t.id !== id),
 *   clear:  ()                   => [],
 * }
 */
export type Reducers<T> = {
  [key: string]: (state: T, ...args: any[]) => T
}

/**
 * Objeto de acciones tipadas generado a partir de un mapa de `Reducers`.
 * Elimina el primer parámetro `state` (provisto por el store) y cambia
 * el tipo de retorno de `T` a `void`.
 *
 * @example
 * // Si el reducer es: add: (state: Todo[], item: Todo) => Todo[]
 * // El dispatch es:   add: (item: Todo) => void
 */
export type Dispatch<T, R extends Reducers<T>> = {
  [K in keyof R]: R[K] extends (state: T, ...args: infer A) => T
    ? (...args: A) => void
    : never
}

// ─── Definiciones de nodos (branded) ─────────────────────────────────────────

/**
 * Definición de un nodo de estado base.
 * Creado con la función `knot()`. No contiene el valor — el valor vive en el Store.
 *
 * El campo `_brand` es un discriminante de tipo literal que permite a TypeScript
 * diferenciar los tres tipos de nodo en tiempo de compilación.
 */
export type KnotDef<T> = {
  readonly _brand: 'knot'
  /** Identificador único del nodo en el store */
  readonly key: string
  /** Valor utilizado cuando el nodo nunca fue escrito en el store */
  readonly default: T
  /**
   * Si es `true`, el valor se cachea en `sessionStorage` bajo la clave `telar:<key>`.
   * Permite que `TelarRoot` hidrate este nodo síncronamente en el primer render,
   * eliminando el flash de defaults antes de que llegue el snapshot del Worker.
   *
   * **Solo para estado de UI no sensible** (temas, idioma, estado de paneles).
   * Los valores en `sessionStorage` son texto plano y pueden ser modificados
   * desde DevTools o por XSS — no usar para datos con lógica de negocio.
   */
  readonly uiCache?: boolean
}

/**
 * Definición de un nodo de estado derivado.
 * Creado con la función `thread()`. Su valor se calcula a partir de otros nodos
 * y se cachea hasta que alguna dependencia cambia. Es de solo lectura.
 *
 * La función `get` recibe un `ReadContext` con una función `read` que registra
 * dependencias automáticamente en tiempo de ejecución.
 */
export type ThreadDef<T> = {
  readonly _brand: 'thread'
  /** Identificador único del nodo en el store */
  readonly key: string
  /**
   * Función pura que calcula el valor derivado.
   * Cada `read(dep)` dentro registra `dep` como dependencia del thread.
   */
  readonly get: (ctx: ReadContext) => T
  /**
   * Comparador de igualdad custom para el valor calculado.
   *
   * Cuando se provee, se llama con el valor anterior (`a`) y el nuevo (`b`)
   * luego de cada re-evaluación. Si retorna `true`, el thread preserva la
   * referencia anterior en cache — evitando re-renders cuando el valor es
   * estructuralmente idéntico aunque sea una nueva referencia de objeto.
   *
   * Por defecto se usa `Object.is` (identidad referencial).
   *
   * @example
   * const statsThread = thread({
   *   key: 'stats',
   *   get: ({ read }) => ({ total: read(todosKnot).length }),
   *   equal: (a, b) => a.total === b.total,
   * })
   */
  readonly equal?: (a: T, b: T) => boolean
  /**
   * Condición de apertura del thread. Si se provee y retorna `false`,
   * la re-evaluación se cancela y el thread congela su último valor cacheado.
   * Solo las dependencias del `gate` se mantienen activas — cambios en los
   * nodos leídos por `get` son ignorados mientras el gate esté cerrado.
   *
   * Cuando el gate se abre (`true`), el thread se re-evalúa normalmente y
   * registra de nuevo todas sus dependencias.
   *
   * Si el gate bloquea la primera evaluación (sin cache previo), se retorna
   * el `default` del thread. Si no se provee `default`, retorna `undefined`.
   *
   * @example
   * const pricesThread = thread({
   *   key: 'prices',
   *   default: [],
   *   gate: ({ read }) => read(onlineKnot),
   *   get:  ({ read }) => computePrices(read(cartKnot), read(ratesKnot)),
   * })
   */
  readonly gate?: (ctx: ReadContext) => boolean
  /**
   * Valor retornado cuando `gate` bloquea la primera evaluación (sin cache).
   * No tiene efecto en threads sin `gate`.
   */
  readonly default?: T
}

/**
 * Definición de un nodo de estado con reducers.
 * Creado con la función `bind()`. Funciona como un knot pero solo acepta
 * modificaciones a través de las acciones declaradas en `reducers`.
 */
export type BindDef<T, R extends Reducers<T>> = {
  readonly _brand: 'bind'
  /** Identificador único del nodo en el store */
  readonly key: string
  /** Valor utilizado cuando el nodo nunca fue escrito en el store */
  readonly default: T
  /** Mapa de reducers que definen las transformaciones permitidas */
  readonly reducers: R
  /**
   * Si es `true`, el valor se cachea en `sessionStorage` bajo la clave `telar:<key>`.
   * Ver documentación en `KnotDef.uiCache`.
   */
  readonly uiCache?: boolean
}

/**
 * Unión de todos los tipos de nodo. Usada en funciones que aceptan
 * cualquier tipo de nodo del grafo (getNodeValue, subscribeToNode, etc.).
 */
export type AnyNode<T> = KnotDef<T> | ThreadDef<T> | BindDef<T, Reducers<T>>

// ─── Grafo ────────────────────────────────────────────────────────────────────

/**
 * Grafo de dependencias entre nodos.
 * Se mantienen dos vistas complementarias para eficiencia:
 * - `nodeDeps`: qué nodos lee un thread (para reconstruir aristas)
 * - `nodeSubscriptions`: qué threads dependen de un nodo (para propagar cambios)
 */
export type Graph = {
  /** thread key → conjunto de keys de los nodos que ese thread lee */
  nodeDeps: Map<string, Set<string>>
  /** nodo key → conjunto de keys de los threads que leen ese nodo */
  nodeSubscriptions: Map<string, Set<string>>
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Entrada del cache de un thread.
 *
 * - `value`:     último valor calculado del thread
 * - `depEpochs`: epoch de cada dep directa (knot/bind) al momento de la evaluación.
 *                Permite detectar si el cache sigue válido sin re-evaluar.
 */
export type CacheEntry = {
  value: unknown
  /** dep key → epoch en el momento de la última evaluación de este thread */
  depEpochs: Map<string, number>
}

/**
 * Store reactivo. Cada `<TelarRoot>` crea una instancia independiente.
 *
 * - `values`:    valores actuales de knots y binds
 * - `epochs`:    número de versión por nodo; se incrementa en cada escritura
 *                (knots/binds) o cuando un thread produce un valor diferente.
 *                Permite a threads downstream detectar cambios sin re-evaluar.
 * - `graph`:     grafo de dependencias entre nodos
 * - `listeners`: callbacks de componentes React suscritos a cada nodo
 * - `cache`:     valores calculados de threads con sus depEpochs
 * - `dirty`:     threads que necesitan re-evaluación en la próxima lectura.
 *                Se llena en escritura (vía BFS) y se vacía en evaluación.
 */
export type Store = {
  values: Map<string, unknown>
  epochs: Map<string, number>
  graph: Graph
  /** node key → conjunto de callbacks de componentes suscritos */
  listeners: Map<string, Set<() => void>>
  /** thread key → entrada del cache con valor y epochs de deps */
  cache: Map<string, CacheEntry>
  /** thread keys que necesitan re-evaluación */
  dirty: Set<string>
  /**
   * Hook de escritura opcional. Se llama cada vez que un knot o bind
   * recibe un nuevo valor. Usado por TelarRoot para persistir cambios
   * al Worker (y de ahí a IndexedDB).
   */
  onWrite?: (key: string, value: unknown) => void
}
