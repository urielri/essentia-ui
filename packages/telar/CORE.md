# Telar — Documentación técnica del núcleo (`core/`)

El directorio `src/core/` es la capa pura de Telar: no importa React, no tiene efectos secundarios del navegador y puede ejecutarse en cualquier entorno JavaScript (Node, Deno, navegador, worker). Todo lo que depende de React vive en `src/react/` y `src/server/`, que delegan la lógica de estado en estas funciones.

---

## Índice

1. [Modelo conceptual](#1-modelo-conceptual)
2. [`types.ts` — Contratos de tipo](#2-typests--contratos-de-tipo)
3. [`knot.ts` — Estado primitivo](#3-knotts--estado-primitivo)
4. [`thread.ts` — Estado derivado](#4-threadts--estado-derivado)
5. [`bind.ts` — Estado con reducers](#5-bindts--estado-con-reducers)
6. [`graph.ts` — Grafo de dependencias](#6-graphts--grafo-de-dependencias)
7. [`store.ts` — Motor reactivo](#7-storets--motor-reactivo)
8. [`worker/` — Persistencia MPA](#8-worker--persistencia-mpa)
9. [Flujo completo de una escritura](#9-flujo-completo-de-una-escritura)
10. [Invariantes del sistema](#10-invariantes-del-sistema)

---

## 1. Modelo conceptual

Telar modela el estado como un **grafo acíclico dirigido (DAG)**. Cada nodo del grafo representa una unidad de estado:

```
filterKnot ──┐
             ├──► filteredTodosThread
todosBind  ──┤
             └──► statsThread
```

- Las aristas van siempre de nodos **fuente** (knot, bind) hacia nodos **derivados** (thread).
- Cuando un nodo fuente cambia, la propagación recorre el grafo en anchura (BFS) para localizar todos los nodos afectados.
- Los threads son **perezosos y cacheados**: no se recalculan hasta que alguien los lee, y el resultado se guarda hasta que una dependencia cambia.

---

## 2. `types.ts` — Contratos de tipo

Este archivo define la forma de todos los objetos que circulan por el sistema. No contiene lógica ejecutable.

### `SetterOrUpdater<T>`

```typescript
type SetterOrUpdater<T> = T | ((prev: T) => T)
```

Permite que una escritura reciba tanto un valor directo como una función actualizadora que recibe el estado anterior. Equivalente al argumento de `setState` en React.

**Por qué importa:** evita que el llamador deba conocer el valor actual antes de escribir. El store resuelve la lectura del valor previo internamente.

---

### `ReadContext`

```typescript
type ReadContext = {
  read: <T>(node: AnyNode<T>) => T
}
```

Es el único argumento que recibe la función `get` de un thread. Al llamar `read(dep)`, el sistema puede interceptar esa llamada para registrar la dependencia.

**Por qué importa:** este diseño permite que el grafo de dependencias se construya de forma **automática en tiempo de ejecución**, sin que el autor del thread declare explícitamente sus deps. Es análogo al mecanismo de `track` en Vue Reactivity o al `proxy` en MobX, pero sin Proxy: aquí el tracking es explícito a través de un `read` inyectado.

---

### `Reducers<T>` y `Dispatch<T, R>`

```typescript
type Reducers<T> = {
  [key: string]: (state: T, ...args: any[]) => T
}

type Dispatch<T, R extends Reducers<T>> = {
  [K in keyof R]: R[K] extends (state: T, ...args: infer A) => T
    ? (...args: A) => void
    : never
}
```

`Reducers<T>` describe un mapa de funciones puras que reciben el estado actual y argumentos adicionales, y retornan el nuevo estado.

`Dispatch<T, R>` transforma ese mapa en un objeto de **acciones tipadas**: elimina el primer parámetro `state` (que lo provee el sistema) y cambia el tipo de retorno de `T` a `void` (la acción no retorna nada; la mutación ocurre internamente).

**Ejemplo:** si `add: (state: Todo[], todo: Todo) => Todo[]`, su dispatch correspondiente es `add: (todo: Todo) => void`.

---

### `KnotDef<T>`, `ThreadDef<T>`, `BindDef<T, R>`

```typescript
type KnotDef<T> = {
  readonly _brand:    'knot'
  readonly key:       string
  readonly default:   T
  readonly uiCache?:  boolean
}

type ThreadDef<T> = {
  readonly _brand:    'thread'
  readonly key:       string
  readonly get:       (ctx: ReadContext) => T
  readonly equal?:    (a: T, b: T) => boolean
  readonly gate?:     (ctx: ReadContext) => boolean
  readonly default?:  T
}

type BindDef<T, R extends Reducers<T>> = {
  readonly _brand:    'bind'
  readonly key:       string
  readonly default:   T
  readonly reducers:  R
  readonly uiCache?:  boolean
}
```

Estas estructuras son **definiciones**, no instancias de estado. Describen un nodo del grafo pero no contienen valores. El estado real vive en el `Store`.

El campo `_brand` es un **discriminante de tipo literal** (branded type). Permite a TypeScript diferenciar los tres tipos en tiempo de compilación sin necesidad de `instanceof` ni duck typing. Cuando `useTelar` recibe un `AnyNode`, puede hacer `if (def._brand === 'thread')` y TypeScript estrecha el tipo automáticamente.

El campo `equal` en `ThreadDef` es un comparador de igualdad opcional. Cuando se provee, se llama con el valor anterior y el nuevo después de cada re-evaluación. Si retorna `true`, el thread preserva la referencia antigua en cache — lo que garantiza que `useSyncExternalStore` no dispare un re-render aunque la función `get` retorne un objeto nuevo con los mismos valores.

El campo `gate` en `ThreadDef` es una condición de apertura opcional. Si se provee y retorna `false`, la re-evaluación de `get` se cancela y el thread congela su último valor cacheado. Solo las dependencias del `gate` quedan activas en el grafo mientras esté cerrado. El campo `default` en `ThreadDef` es el valor retornado cuando el `gate` bloquea la primera evaluación (sin cache previo).

El campo `uiCache` en `KnotDef` y `BindDef` habilita la hidratación síncrona desde `sessionStorage` antes del primer render. Solo debe usarse para estado de UI no sensible (temas, idioma, estado de paneles). Ver sección 8 — Ciclo de vida completo.

```typescript
// Sin equal: re-renderiza aunque los números sean iguales (nueva referencia)
const statsThread = thread({
  key: 'stats',
  get: ({ read }) => ({ total: read(todosKnot).length }),
})

// Con equal: no re-renderiza si total y done son iguales
const statsThread = thread({
  key: 'stats',
  get: ({ read }) => ({ total: read(todosKnot).length, done: ... }),
  equal: (a, b) => a.total === b.total && a.done === b.done,
})
```

---

### `Graph`

```typescript
type Graph = {
  nodeDeps: Map<string, Set<string>>
  nodeSubscriptions: Map<string, Set<string>>
}
```

Representa el grafo de dependencias con dos vistas complementarias:

| Campo | Dirección | Pregunta que responde |
|---|---|---|
| `nodeDeps` | thread → [sus deps] | "¿De qué nodos depende este thread?" |
| `nodeSubscriptions` | nodo → [threads que lo leen] | "¿Qué threads se ven afectados si este nodo cambia?" |

Mantener ambas vistas en paralelo permite tanto reconstruir aristas eficientemente (`rebuildGraphEdges`) como propagar cambios eficientemente (`getDirtyNodes`).

---

### `CacheEntry` y `Store`

```typescript
type CacheEntry = {
  value: unknown
  depEpochs: Map<string, number>
}

type Store = {
  values: Map<string, unknown>
  epochs: Map<string, number>
  graph: Graph
  listeners: Map<string, Set<() => void>>
  cache: Map<string, CacheEntry>
  dirty: Set<string>
  onWrite?: (key: string, value: unknown) => void
}
```

Estructura central del sistema. Cada `TelarRoot` crea un store independiente.

| Campo | Propósito |
|---|---|
| `values` | Valores actuales de knots y binds, indexados por `key` |
| `epochs` | Número de versión por nodo. Se incrementa en cada escritura (knots/binds) y cuando un thread produce un valor diferente al cacheado |
| `graph` | Grafo de dependencias entre nodos |
| `listeners` | Callbacks de componentes React suscritos a cada nodo |
| `cache` | Valores calculados de threads con sus `depEpochs` al momento de la evaluación |
| `dirty` | Conjunto de thread keys que necesitan re-evaluación. Se llena en escritura (BFS) y se vacía en evaluación |
| `onWrite?` | Hook opcional llamado tras cada escritura de knot/bind con `(key, value)`. Usado por `TelarRoot` para conectar el Worker de persistencia. Si no se provee, se ignora |

`CacheEntry.depEpochs` captura el epoch de cada dep directa (knot/bind) en el momento de la última evaluación del thread. Permite en el futuro validar el cache sin re-evaluar cuando todos los epochs coinciden. Hoy, la validez se determina por `dirty`: si el thread no está en `dirty`, el cache es válido.

`epochs` para threads se incrementa solo cuando el valor realmente cambia (respetando `equal`). Esto permite que threads downstream detecten si un thread intermedio produjo un cambio o no, sin necesidad de re-evaluarlo.

---

## 3. `knot.ts` — Estado primitivo

```typescript
export function knot<T>(options: { key: string; default: T; uiCache?: boolean }): KnotDef<T> {
  return {
    _brand:  'knot',
    key:     options.key,
    default: options.default,
    ...(options.uiCache !== undefined && { uiCache: options.uiCache }),
  }
}
```

### Concepto

`knot` es el tipo de nodo más simple: representa una **unidad atómica de estado mutable**. Su único trabajo es producir una definición tipada con un identificador único y un valor por defecto.

No contiene el estado en sí. Es análogo a declarar una variable sin asignarle un valor: describe el contrato (`key`, tipo `T`, `default`), pero el valor vive en el `Store`.

### Por qué "knot"

En un telar, un nudo (*knot*) es el punto donde un hilo se ancla. Es fijo, concreto, el origen desde el que se teje el patrón. En el sistema de Telar, el knot es el punto de origen del estado: otros nodos derivan de él, pero él no deriva de nadie.

### Consideraciones de diseño

- **Inmutabilidad de la definición:** todos los campos son `readonly`. Una vez creado, el knot no puede modificarse. Esto garantiza que la definición sea estable como referencia en toda la aplicación.
- **Sin estado propio:** el knot no almacena el valor. Si el mismo knot se usa en dos `TelarRoot` distintos, cada árbol tendrá su propia instancia del valor en su store.
- **`uiCache`:** si es `true`, `TelarRoot` lee el valor desde `sessionStorage('telar:<key>')` síncronamente antes del primer render y lo pasa como `initialValues`. Elimina el flash de defaults para estado de UI. Solo para valores no sensibles — los datos en `sessionStorage` son texto plano y pueden manipularse desde DevTools.

---

## 4. `thread.ts` — Estado derivado

```typescript
export function thread<T>(options: {
  key:      string
  get:      (ctx: ReadContext) => T
  equal?:   (a: T, b: T) => boolean
  gate?:    (ctx: ReadContext) => boolean
  default?: T
}): ThreadDef<T>
```

### Concepto

`thread` representa un **nodo derivado**: su valor se calcula a partir de otros nodos y no puede escribirse directamente. Equivale conceptualmente a un `computed` en Vue, un `selector` en Recoil, o una columna calculada en una tabla de base de datos.

La función `get` recibe un `ReadContext` con una función `read`. Al llamar `read(dep)` dentro de `get`, el sistema registra esa dependencia en el grafo. La próxima vez que `dep` cambie, el cache del thread se invalida automáticamente.

### Por qué "thread"

En el tejido, un hilo (*thread*) conecta nudo con nudo formando el patrón. En el sistema, un thread conecta knots (y otros threads) produciendo valores derivados. Es la estructura que teje el grafo.

### Consideraciones de diseño

- **Evaluación perezosa:** el thread no se evalúa al ser definido ni al montar el componente. Se evalúa la primera vez que alguien llama `getNodeValue(thread, store)`.
- **Dependencias dinámicas:** las dependencias se descubren en cada evaluación, no se declaran estáticamente. Esto permite threads condicionales:
  ```typescript
  get: ({ read }) =>
    read(modeKnot) === 'a' ? read(knotA) : read(knotB)
  ```
  Si el modo cambia de `'a'` a `'b'`, el grafo se reconstruye: el thread se desuscribe de `knotA` y se suscribe a `knotB`.
- **Solo lectura:** no hay setters en `ThreadDef`. Es imposible escribir directamente en un thread.
- **Igualdad estructural opcional:** si se provee `equal`, el thread puede retornar nuevos objetos en `get` sin causar re-renders cuando los valores son estructuralmente idénticos. El comparador recibe `(prev, next)` y si retorna `true`, se devuelve la referencia anterior.
- **Gate (evaluación condicional):** si se provee `gate`, se evalúa antes que `get`. Si retorna `false`, la re-evaluación se cancela y el thread congela su último valor cacheado — solo las dependencias del `gate` quedan activas en el grafo. Cuando el gate se abre (`true`), el thread re-evalúa normalmente y re-registra todas sus deps. Si el gate bloquea la primera evaluación (sin cache), se retorna `default` si fue provisto.
  ```typescript
  const pricesThread = thread({
    key:     'prices',
    default: [],
    gate:    ({ read }) => read(onlineKnot),
    get:     ({ read }) => computePrices(read(cartKnot), read(ratesKnot)),
  })
  // Cuando onlineKnot = false: cartKnot y ratesKnot no son dependencias activas.
  // Cuando onlineKnot = true:  las tres son dependencias, evaluación normal.
  ```

---

## 5. `bind.ts` — Estado con reducers

```typescript
export function bind<T, R extends Reducers<T>>(options: {
  key:       string
  default:   T
  reducers:  R
  uiCache?:  boolean
}): BindDef<T, R> {
  return {
    _brand:   'bind',
    key:      options.key,
    default:  options.default,
    reducers: options.reducers,
    ...(options.uiCache !== undefined && { uiCache: options.uiCache }),
  }
}
```

### Concepto

`bind` es un knot con **semántica de acciones tipadas**. El estado se modifica exclusivamente a través de reducers declarados en la definición. Cada reducer es una función pura `(state, ...args) => newState`.

La diferencia con `knot` no es de infraestructura (ambos almacenan su valor en `store.values`) sino de **contrato**: un bind declara explícitamente qué transformaciones son válidas sobre su estado. El hook `useBind` convierte esos reducers en un objeto `dispatch` que puede ser llamado sin conocer el estado actual.

### Por qué "bind"

*Bind* refiere al encuadernado: la técnica que une las hebras en los bordes del tejido para que no se deshilachen. En el sistema, bind *ata* el estado a un conjunto fijo de transformaciones permitidas — establece un borde que contiene y da forma al estado.

### Consideraciones de diseño

- **Reducers puros:** no deben producir efectos secundarios. Reciben el estado actual y retornan el nuevo estado, igual que en Redux o `useReducer` de React.
- **Inferencia de tipos en `Dispatch`:** TypeScript infiere el tipo de los argumentos de cada reducer y genera automáticamente el tipo del dispatch correspondiente. No es necesario declarar los tipos manualmente.
- **Compartición del grafo:** un thread puede leer un bind igual que lee un knot. `getNodeValue` trata ambos de forma idéntica — la diferencia está en cómo se escribe, no en cómo se lee.
- **`uiCache`:** idéntico a `KnotDef.uiCache`. Habilita lectura síncrona desde `sessionStorage` antes del primer render para eliminar flash de defaults en estado de UI.

---

## 6. `graph.ts` — Grafo de dependencias

Este módulo contiene las dos únicas operaciones sobre el grafo: construir aristas y atravesar el grafo.

### `getDirtyNodes`

```typescript
export function getDirtyNodes(changedKey: string, graph: Graph): Set<string>
```

**Concepto:** dado el key de un nodo que acaba de cambiar, retorna el conjunto de todos los threads que dependen de él, directa o transitivamente.

**Algoritmo:** BFS (búsqueda en anchura) sobre `graph.nodeSubscriptions`.

```
Inicio: queue = [changedKey]

Iteración 1: sacar 'todos'
  subscribers('todos') = { 'filteredTodos', 'stats', 'todoState' }
  → dirty = { 'filteredTodos', 'stats', 'todoState' }
  → queue = [ 'filteredTodos', 'stats', 'todoState' ]

Iteración 2: sacar 'filteredTodos'
  subscribers('filteredTodos') = {}  → nada

... (idem para 'stats' y 'todoState')

Resultado: { 'filteredTodos', 'stats', 'todoState' }
```

El grafo es acíclico (DAG) por diseño: no se puede escribir en un thread, por lo tanto nunca puede haber un ciclo donde un thread actualice un knot que a su vez lo invalide. El BFS termina garantizadamente.

**Complejidad:** O(n + e) donde n = nodos afectados, e = aristas recorridas.

**Detalle de implementación:** el nodo `changedKey` mismo **no** se incluye en el resultado. El llamador (`setNodeValue`) lo notifica por separado porque el nodo fuente siempre debe notificarse, independientemente de si tiene threads downstream.

---

### `rebuildGraphEdges`

```typescript
export function rebuildGraphEdges(
  graph: Graph,
  nodeKey: string,
  newDeps: Set<string>,
): void
```

**Concepto:** actualiza las aristas del grafo para un thread dado, reemplazando sus dependencias antiguas por las nuevas.

**Por qué es necesario:** las dependencias de un thread son dinámicas — pueden cambiar entre evaluaciones (e.g., threads condicionales). Tras cada evaluación, el sistema llama a `rebuildGraphEdges` con las dependencias que fueron realmente leídas en esa ejecución.

**Algoritmo:**

1. Recupera `oldDeps = graph.nodeDeps.get(nodeKey)`.
2. Por cada dep en `oldDeps`, elimina `nodeKey` de `graph.nodeSubscriptions.get(dep)`.
3. Sobreescribe `graph.nodeDeps.set(nodeKey, newDeps)`.
4. Por cada dep en `newDeps`, añade `nodeKey` a `graph.nodeSubscriptions.get(dep)`.

**Visualización (thread condicional):**

```
Antes (mode = 'a'):
  nodeDeps('result')           = { 'mode', 'valA' }
  nodeSubscriptions('mode')   = { 'result' }
  nodeSubscriptions('valA')   = { 'result' }
  nodeSubscriptions('valB')   = {}

Después de cambiar mode a 'b' y re-evaluar:
  nodeDeps('result')           = { 'mode', 'valB' }
  nodeSubscriptions('mode')   = { 'result' }
  nodeSubscriptions('valA')   = {}          ← desuscrito
  nodeSubscriptions('valB')   = { 'result' } ← suscrito
```

El thread ya no recibirá notificaciones de `valA`, evitando invalidaciones innecesarias.

---

## 7. `store.ts` — Motor reactivo

Es el módulo central del sistema. Implementa las cuatro operaciones fundamentales del store.

### `createStore`

```typescript
export function createStore(): Store
```

Crea un store vacío con todas sus estructuras inicializadas. No recibe parámetros.

Los valores de knots y binds **no** se precagan en el store al momento de la creación. El store comienza vacío; los valores por defecto se resuelven en tiempo de lectura mediante `getNodeValue`.

---

### `getNodeValue`

```typescript
export function getNodeValue<T>(node: AnyNode<T>, store: Store): T
```

**Concepto:** punto de entrada unificado para leer cualquier tipo de nodo.

**Comportamiento:**

- Si `node._brand === 'thread'`: delega en `evaluateThread`.
- Si `node._brand === 'knot'` o `'bind'`: busca en `store.values`. Si el key no fue escrito aún, retorna `node.default`.

La rama `knot`/`bind` es O(1) (lookup en Map). La rama `thread` puede implicar una evaluación completa si el cache es inválido.

---

### `evaluateThread` (función interna)

```typescript
function evaluateThread<T>(node: ThreadDef<T>, store: Store): T
```

**Concepto:** evalúa el thread con tracking de dependencias, gestiona el cache y aplica el comparador de igualdad.

**Flujo:**

```
1. ¿thread NOT en store.dirty Y cache existe?
   └─ Sí → retornar valor cacheado (O(1))
   └─ No → continuar

2. prevEntry = store.cache.get(node.key)  // guarda valor anterior para equal

3. Crear discoveredDeps = new Set()

4. Crear trackingRead:
   función que, al ser llamada con dep,
   a) agrega dep.key a discoveredDeps
   b) llama getNodeValue(dep, store) recursivamente

5. [GATE] Si node.gate está definido:
   open = node.gate({ read: trackingRead })  // acumula deps del gate en discoveredDeps
   Si open === false:
     frozenValue = prevEntry?.value ?? node.default
     Capturar depEpochs solo para las deps del gate (discoveredDeps actual)
     store.dirty.delete(node.key)
     rebuildGraphEdges(graph, node.key, discoveredDeps)  // solo deps del gate
     store.cache.set(node.key, { value: frozenValue, depEpochs })
     Retornar frozenValue  ← salida temprana, get no se ejecuta
   Si open === true:
     Continuar — discoveredDeps ya tiene las deps del gate,
     get acumulará las suyas en el mismo Set

6. newValue = node.get({ read: trackingRead })
   → ejecuta la función del usuario
   → cada read() dentro registra una dep (adicional a las del gate si lo hay)

7. Aplicar equal:
   Si prevEntry existe Y node.equal Y node.equal(prevEntry.value, newValue)
   → finalValue = prevEntry.value  (preservar referencia anterior)
   Si no
   → finalValue = newValue

8. Capturar depEpochs:
   Por cada dep en discoveredDeps:
     Si store.epochs tiene esa dep → depEpochs.set(dep, epoch)

9. Actualizar epoch del thread (solo si el valor cambió):
   !Object.is(prevEntry?.value, finalValue)
   → store.epochs.set(node.key, epoch + 1)

10. store.dirty.delete(node.key)
    rebuildGraphEdges(graph, node.key, discoveredDeps)  // deps gate + deps get
    store.cache.set(node.key, { value: finalValue, depEpochs })

11. Retornar finalValue
```

**Por qué `dirty` reemplaza `cache.delete`:** en lugar de borrar el cache en escritura, `setNodeValue` marca el thread como `dirty`. Esto permite que `evaluateThread` acceda al valor anterior (`prevEntry`) para la comparación con `equal`. Si se borrara el cache, no habría valor previo con el que comparar.

**Por qué el cache es válido:** `setNodeValue` agrega a `dirty` todos los threads afectados **antes** de notificar. Cuando un componente re-renderiza y llama `getNodeValue`, el thread está en `dirty` y se re-evalúa.

**Epochs de threads:** cuando un thread produce el mismo valor que el anterior (vía `equal`), su epoch no se incrementa. Esto permite que threads downstream que dependen de este thread detecten que no hubo cambio real, aunque el knot subyacente sí haya cambiado.

**Threads encadenados:** `trackingRead` llama `getNodeValue`, que a su vez puede llamar `evaluateThread` para threads que dependen de otros threads. La recursión termina porque el grafo es acíclico. Si el thread intermedio está en `dirty`, se re-evalúa y se limpia de `dirty` antes de retornar al thread upstream.

---

### `getDefaultValue`

```typescript
export function getDefaultValue<T>(node: AnyNode<T>): T
```

**Concepto:** evalúa el valor de un nodo usando solo sus defaults, sin acceder al store.

Útil para construir valores iniciales vacíos, tests unitarios o cualquier contexto donde no haya un store activo.

**Para threads:** ejecuta `node.get` con un `read` que recursivamente llama `getDefaultValue` en las dependencias. No construye el grafo. El resultado se cachea en un `WeakMap` externo al store, keyed por la definición del nodo.

**Para knot/bind:** retorna directamente `node.default`.

---

### `setNodeValue`

```typescript
export function setNodeValue<T>(
  key: string,
  next: SetterOrUpdater<T>,
  store: Store,
  defaultValue: T,
): void
```

**Concepto:** escribe un nuevo valor en el store y propaga el cambio a todos los nodos afectados.

**Flujo completo:**

```
1. Resolver valor actual:
   current = store.values.has(key) ? store.values.get(key) : defaultValue

2. Calcular nuevo valor:
   Si next es función → newValue = next(current)
   Si next es valor   → newValue = next

3. Guardia de igualdad referencial:
   Object.is(current, newValue) → retornar sin hacer nada

4. Persistir:
   store.values.set(key, newValue)

5. Hook de persistencia externa:
   store.onWrite?.(key, newValue)
   // Si hay un Worker conectado, envía el valor para persistir en IndexedDB

6. Incrementar epoch del nodo escrito:
   store.epochs.set(key, epoch + 1)

7. BFS de marcado dirty:
   dirtyThreads = getDirtyNodes(key, graph)
   Por cada dirtyKey: store.dirty.add(dirtyKey)
   // No se borra el cache — se preserva prevEntry para la comparación con equal

8. Notificación:
   notifyKey(key, store)
   Por cada dirtyKey: notifyKey(dirtyKey, store)
```

**Detalle del paso 1 (`defaultValue`):** el store no precarga los defaults. Si un knot nunca fue escrito, `store.values.get(key)` retorna `undefined`. Sin el parámetro `defaultValue`, un updater funcional como `prev => prev + 1` recibiría `undefined` y el resultado sería `NaN`. El parámetro `defaultValue` resuelve esto de forma explícita.

**Detalle del paso 3 (igualdad referencial):** usa `Object.is` en lugar de `===` para manejar correctamente `NaN` (`Object.is(NaN, NaN) === true`, mientras que `NaN === NaN === false`). Si el valor no cambió, no se invalida el cache ni se notifica a ningún componente.

**Detalle del paso 5 (epoch):** el epoch se incrementa incondicionalmente al confirmar el cambio. Sirve como identificador de versión para que threads downstream puedan detectar un cambio potencial sin re-evaluarse.

**Detalle del paso 6–7 (orden de operaciones):** los threads se marcan `dirty` **antes** de notificar. Cuando un componente responde a la notificación y llama `getNodeValue`, el thread está en `dirty` y se re-evalúa con los datos correctos. El cache NO se borra — `evaluateThread` accede al valor previo para comparar con `equal`.

---

### `subscribeToNode`

```typescript
export function subscribeToNode(
  key: string,
  listener: () => void,
  store: Store,
): () => void
```

**Concepto:** registra un callback que será invocado cuando el nodo con `key` cambie. Retorna una función de limpieza (unsubscribe).

Este es el contrato exacto que espera el primer argumento de `useSyncExternalStore`. Los hooks de Telar pasan directamente esta función:

```typescript
useSyncExternalStore(
  (notify) => subscribeToNode(def.key, notify, store),
  () => getNodeValue(def, store),
  () => getNodeValue(def, store),  // getServerSnapshot usa el store real (incluye initialValues)
)
```

**Gestión de memoria:** al llamar la función de cleanup, el listener se elimina del Set del key correspondiente. El cache, el dirty set y las aristas del grafo se preservan — esto permite que si el componente vuelve a montar, el thread reutilice el cache existente sin re-evaluarse desde cero.

La limpieza completa de aristas del grafo y cache al desmontar el último suscriptor es una optimización planificada para V2. En V1 se omite deliberadamente: en React 18 con `useSyncExternalStore`, el cleanup se ejecuta durante el ciclo mount/unmount/remount de Strict Mode, y eliminar las aristas en ese momento puede provocar inconsistencias en los snapshots durante la reconciliación concurrente.

---

### `hydrateStore`

```typescript
export function hydrateStore(snapshot: Record<string, unknown>, store: Store): void
```

**Concepto:** carga un snapshot clave/valor en el store y notifica a los componentes suscritos a cada nodo. A diferencia de la hidratación de `initialValues` (que ocurre en el render y no notifica), `hydrateStore` se usa cuando el store ya está montado y los componentes ya tienen suscriptores activos.

**Cuándo se usa:** `TelarRoot` llama a `hydrateStore` al recibir el mensaje `snapshot` del Worker, después de que React ya montó el árbol. Esto garantiza que los componentes reciban los valores persistidos y se re-rendericen si difieren de los defaults.

**Implementación:** itera el snapshot y llama `setNodeValue` por cada entrada. Como `next` es un valor directo (no función), `defaultValue` no se usa en el cálculo — solo se pasa `undefined` internamente.

---

### `notifyKey` (función interna)

```typescript
function notifyKey(key: string, store: Store): void
```

Itera el `Set` de listeners para un key dado y llama a cada uno. Es O(n) donde n es el número de componentes suscritos al nodo.

`setNodeValue` la llama dos veces: una para el nodo fuente y una por cada thread afectado. Esto permite que componentes suscritos directamente a un thread (por ejemplo, `useThread(statsThread)`) reciban la notificación aunque no estén suscritos al knot fuente.

---

## 8. `worker/` — Persistencia MPA

El directorio `src/worker/` implementa la capa de persistencia opcional del store. Permite que el estado sobreviva a navegaciones (MPA), recargas de página y cierres/reaperturas del browser, sin depender de ningún servidor.

### Arquitectura

```
Main Thread (React)                  Dedicated Worker
-------------------                  ----------------
store local (reactivo)               IndexedDB
       |                                   |
       | postMessage('get-snapshot') ─────►|
       |◄──── postMessage('snapshot') ─────| lee IDB → envía todos los valores
       |                                   |
  hydrateStore(snapshot, store)            |
  → componentes re-renderizan             |
       |                                   |
       | dispatch.setColor('red')          |
       | → setNodeValue                    |
       |   → store.onWrite(key, value)     |
       | postMessage('persist', key, val) ►| escribe en IDB
```

**Dedicated Worker (no SharedWorker):** cada tab del browser tiene su propia instancia del Worker y su propia base de datos IndexedDB. Dos tabs nunca comparten estado — cada una es completamente independiente.

### `worker-messages.ts` — Protocolo

```typescript
type NodeValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'

type NodeConstraints = {
  maxLength?:     number     // strings y arrays
  min?:           number     // números
  max?:           number     // números
  allowedValues?: unknown[]  // enum exacto
}

type NodeMeta = {
  key:          string
  valueType:    NodeValueType
  constraints?: NodeConstraints
}

type MainToWorker =
  | {
      type:           'init'
      nodes:          NodeMeta[]
      persistence?:   'session' | 'permanent'   // default: 'session'
      sessionId?:     string                     // requerido si persistence === 'session'
      version?:       string
      maxValueBytes?: number
      maxEntries?:    number
    }
  | { type: 'get-snapshot' }
  | { type: 'persist'; key: string; value: unknown }
  | { type: 'clear'; keys?: string[] }

type WorkerToMain =
  | { type: 'snapshot'; data: Record<string, unknown> }
```

- `init` se envía antes de `get-snapshot` y configura las cuatro capas de seguridad del Worker. El campo `version` activa la invalidación automática por esquema. `persistence` + `sessionId` controlan el ciclo de vida de los datos.
- `clear` invalida el store voluntariamente: sin `keys` borra todo, con `keys` borra solo esas entradas.

### `crypto.ts` — Cifrado AES-GCM

El Worker usa la **Web Crypto API** (disponible en Workers) para cifrar todos los valores antes de escribirlos en IndexedDB.

**Propiedades de la clave:**
- AES-256-GCM — AEAD: confidencialidad + integridad en una sola operación
- `non-extractable` — los bytes raw nunca son accesibles, ni por código propio ni por DevTools
- Almacenada en una IDB separada (`telar-keystore`) via structured clone — persiste entre sesiones
- Generada automáticamente en la primera visita

**Por operación:**
- IV aleatorio de 12 bytes — único por escritura, nunca reutilizado
- AES-GCM incluye un authentication tag — cualquier modificación del blob produce un error detectable en descifrado

**Qué protege y qué no:**

| Vector | Protegido |
|--------|-----------|
| Lectura directa de IDB en DevTools | Sí — solo ciphertext visible |
| Lectura de archivos del disco (ataque offline) | Sí — sin el browser no hay clave |
| Forjar un ciphertext sin la CryptoKey | Sí — computacionalmente imposible |
| Tampering del blob (bit flip, truncar) | Sí — authentication tag falla → entrada descartada |
| XSS con ejecución JS en mismo origen | No — puede usar la CryptoKey desde IDB |

### `store.worker.ts` — Worker

Es una capa de I/O sobre IndexedDB con cuatro capas de defensa superpuestas. No tiene lógica reactiva — no corre un store de Telar.

**Capa 1 — Sanitización de keys y límites:**
- Rechaza keys peligrosas: `__proto__`, `constructor`, `prototype`, prefijo `__`
- Rechaza keys fuera de la lista blanca (recibida en `init`)
- Límite de longitud de key: 256 chars
- Límite de tamaño de valor: 50 KB por defecto (configurable en `init`)
- Límite de entradas totales: 500 por defecto (configurable en `init`)
- El snapshot se construye con `Object.create(null)` — inmune a prototype pollution

**Capa 2 — Cifrado AES-GCM:**
- Cada valor se cifra antes de escribir en IDB
- Al leer, se descifra — si el blob fue modificado, el authentication tag falla → `catch → continue` → entrada descartada silenciosamente

**Capa 3 — Validación de tipos:**
- El schema de tipo de cada nodo se recibe en `init` (construido por `TelarRoot` desde el `default` del nodo)
- Al leer de IDB, el valor descifrado se verifica contra el tipo esperado — tipo incorrecto → entrada descartada

**Capa 3b — Constraints de valor:**
- Restricciones opcionales por nodo, recibidas en `init` junto al schema de tipo
- Aplicadas después de la validación de tipo — un valor puede tener el tipo correcto pero violar las reglas de negocio
- `maxLength` para strings/arrays, `min`/`max` para números, `allowedValues` para enums
- Mitiga el caso en que XSS cifra un valor con el tipo correcto pero contenido malicioso

**Capa 4 — Write throttle:**
- Las escrituras se agrupan con debounce de 300ms — múltiples cambios rápidos (e.g., `onChange` de un input) generan una sola escritura en IDB
- El batch se copia antes del flush — escrituras durante el flush van al próximo batch, no se pierden

### `index.ts` — `createTelarWorker()` / `invalidatePersistedStore()`

```typescript
export function createTelarWorker(): Worker {
  return new Worker(new URL('./store.worker.ts', import.meta.url), { type: 'module' })
}

export function invalidatePersistedStore(
  worker:        Worker,
  keys?:         string[],
  uiCacheNodes?: readonly { key: string }[],
): void {
  worker.postMessage({ type: 'clear', keys } satisfies MainToWorker)
  if (uiCacheNodes) {
    for (const node of uiCacheNodes) {
      try { sessionStorage.removeItem('telar:' + node.key) } catch {}
    }
  }
}
```

- `createTelarWorker()` — factory que instancia el Worker con soporte de módulos ES. El patrón `new URL('./store.worker.ts', import.meta.url)` es reconocido por bundlers modernos (Vite, webpack 5, esbuild) para empaquetar el Worker en un chunk separado.
- `invalidatePersistedStore(worker, keys?, uiCacheNodes?)` — invalida el store voluntariamente. Envía un mensaje `clear` al Worker (IDB) y, si se proveen `uiCacheNodes`, borra también las entradas de `sessionStorage` correspondientes. Sin `keys`, borra todo el IDB; con `keys`, borra solo esas entradas. El store en memoria del main thread no se toca.

### Ciclo de vida completo

```
1. App monta
   → TelarRoot recibe props worker, persistedNodes, nodeConstraints, storeVersion, persistence
   → Antes del primer render (síncrono):
       leer nodos con uiCache=true desde sessionStorage → store.values (hidratación sin flash)
       si storeVersion difiere de sessionStorage('telar:store-version') → limpiar uiCache entries
       si initialValues presentes → cargar en store.values (con guard !has para no sobreescribir
         valores ya escritos por el usuario); se repite en cada render para cubrir Next.js
         Streaming RSC, donde el async Server Component puede entregar initialValues en un
         segundo render posterior al placeholder de Suspense
   → useEffect:
       worker.postMessage({ type: 'init', nodes: [...NodeMeta con constraints], version })
       worker.postMessage({ type: 'get-snapshot' })

2. Worker procesa init
   → configura allowedKeys, nodeSchemas, maxValueBytes, maxEntries, persistence, sessionId
   → si version !== storedVersion: idbClear + setStoredVersion (invalidación automática por esquema)

3. Worker procesa get-snapshot
   → lee IDB, descifra cada entrada (Capa 2)
   → modo session: descarta entradas con sessionId distinto + las borra de IDB (limpieza de huérfanas)
   → descarta entradas con key inválida (Capa 1)
   → descarta entradas con tipo incorrecto (Capa 3)
   → descarta entradas que violan constraints (Capa 3b)
   → responde con snapshot limpio

4. TelarRoot recibe snapshot
   → hydrateStore(snapshot, store)
   → componentes con valores distintos al default re-renderizan

5. Usuario interactúa
   → setNodeValue escribe en store local → UI actualiza inmediatamente
   → store.onWrite(key, value) → worker.postMessage({ type: 'persist', key, value })
   → Worker valida key (Capa 1), verifica tamaño (Capa 1), encola (Capa 4)
   → flush: cifra (Capa 2) + escribe en IDB (modo session: tagea la entrada con sessionId)
   → si el nodo tiene uiCache=true: escribe también en sessionStorage('telar:<key>') en texto plano

6. Usuario navega a otra página (MPA)
   → React desmonta, store destruido en memoria
   → Worker sigue vivo (Dedicated Worker persiste mientras el tab esté abierto)
   → IDB tiene los valores cifrados del paso 5

7. Nueva página monta → ciclo 1-5 se repite → estado restaurado
```

**Nota sobre la instancia del Worker:** para que el Worker persista entre navegaciones MPA en una SPA o una app con routing client-side, la instancia del Worker debe crearse fuera del ciclo de render (a nivel de módulo o en el punto de entrada). Si se crea dentro de un componente, se destruye y recrea en cada navegación — pero el estado igualmente se restaura desde IndexedDB en el paso 3.

---

## 9. Flujo completo de una escritura

Para ilustrar cómo interactúan todos los módulos, se describe el flujo completo cuando se llama `dispatch.add(newTodo)` en `TodoInput`:

```
useBind internamente llama:
  setNodeValue('todos', state => [...state, newTodo], store, [])

store.ts — setNodeValue:
  1. current = store.values.get('todos') ?? []
  2. newValue = [...current, newTodo]
  3. Object.is(current, newValue) → false (nuevo array)
  4. store.values.set('todos', newValue)
  5. store.epochs.set('todos', epoch + 1)

  6. getDirtyNodes('todos', graph):
     BFS sobre nodeSubscriptions:
       'todos' → { 'filteredTodos', 'stats', 'todoState' }
     dirty = Set { 'filteredTodos', 'stats', 'todoState' }

     store.dirty.add('filteredTodos')
     store.dirty.add('stats')
     store.dirty.add('todoState')
     // cache NO se borra — prevEntry queda disponible para equal

  7. notifyKey('todos', store)         → sin listeners (TodoInput usa useDispatch)
     notifyKey('filteredTodos', store) → notifica a TodoList
     notifyKey('stats', store)         → notifica a TodoStats
     notifyKey('todoState', store)     → notifica a TelarDevTools

React re-renderiza:
  TodoList llama getNodeValue(filteredTodosThread, store)
    → 'filteredTodos' está en dirty → re-evalúa
    → prevEntry = cache.get('filteredTodos')  // valor anterior disponible
    → lee todosBind (nuevo) y filterKnot (sin cambio)
    → newValue = lista filtrada nueva
    → si filteredTodosThread.equal definido → compara prevEntry.value con newValue
    → cachea { value: finalValue, depEpochs }, dirty.delete('filteredTodos')
    → retorna finalValue

  TodoStats llama getNodeValue(statsThread, store)
    → 'stats' está en dirty → re-evalúa
    → si statsThread.equal definido y { total, done } son iguales:
      → preserva referencia anterior → React no re-renderiza
    → si cambiaron: retorna nuevo objeto → React re-renderiza
```

`TodoInput` y `TodoFilter` no se re-renderizan: no tienen listeners activos sobre `'todos'`, `'filteredTodos'`, `'stats'` ni `'todoState'`.

---

## 10. Invariantes del sistema

Propiedades que el sistema garantiza en todo momento:

| Invariante | Mecanismo |
|---|---|
| Un thread nunca retorna un valor obsoleto | Se marca `dirty` antes de notificar; `evaluateThread` re-evalúa si `dirty` |
| Las dependencias de un thread reflejan la última evaluación | `rebuildGraphEdges` se llama tras cada evaluación |
| Dos `TelarRoot` nunca comparten estado | Cada `TelarRoot` crea su propio `Store` vía `createStore()` |
| Un valor idéntico no genera re-renders | `Object.is` antes de escribir; `equal` en threads para igualdad estructural |
| El grafo nunca tiene ciclos | Los threads son read-only; nunca pueden escribir en un knot |
| Los defaults nunca producen `undefined` en updaters | `setNodeValue` recibe `defaultValue` explícito |
| `getServerSnapshot` renderiza con `initialValues` del store | Tanto client snapshot como server snapshot usan `getNodeValue(def, store)` |
| Los listeners de componentes desmontados no reciben notificaciones | `subscribeToNode` cleanup elimina el listener del Set |
| Un thread con `equal` no re-renderiza si el valor es estructuralmente igual | `evaluateThread` preserva la referencia anterior cuando `equal` retorna `true` |
| El epoch de un thread solo sube cuando el valor realmente cambia | `evaluateThread` incrementa epoch solo si `!Object.is(prevEntry.value, finalValue)` |
| Un thread con `gate=false` nunca ejecuta `get` ni registra sus deps | `evaluateThread` retorna el valor congelado antes de llamar `node.get` |
| Con `gate=false`, cambios en deps de `get` no notifican al thread | Solo las deps del `gate` se registran en el grafo cuando el gate está cerrado |
| Un nodo con `uiCache=true` nunca flashea en el primer render (si fue escrito antes) | `TelarRoot` lee `sessionStorage` síncronamente antes del primer render |
