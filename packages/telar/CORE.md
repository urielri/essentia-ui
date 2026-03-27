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
8. [Flujo completo de una escritura](#8-flujo-completo-de-una-escritura)
9. [Invariantes del sistema](#9-invariantes-del-sistema)

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
  readonly _brand: 'knot'
  readonly key: string
  readonly default: T
}

type ThreadDef<T> = {
  readonly _brand: 'thread'
  readonly key: string
  readonly get: (ctx: ReadContext) => T
}

type BindDef<T, R extends Reducers<T>> = {
  readonly _brand: 'bind'
  readonly key: string
  readonly default: T
  readonly reducers: R
}
```

Estas estructuras son **definiciones**, no instancias de estado. Describen un nodo del grafo pero no contienen valores. El estado real vive en el `Store`.

El campo `_brand` es un **discriminante de tipo literal** (branded type). Permite a TypeScript diferenciar los tres tipos en tiempo de compilación sin necesidad de `instanceof` ni duck typing. Cuando `useTelar` recibe un `AnyNode`, puede hacer `if (def._brand === 'thread')` y TypeScript estrecha el tipo automáticamente.

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

### `Store`

```typescript
type Store = {
  values: Map<string, unknown>
  graph: Graph
  listeners: Map<string, Set<() => void>>
  cache: Map<string, unknown>
}
```

Estructura central del sistema. Cada `TelarRoot` crea un store independiente.

| Campo | Propósito |
|---|---|
| `values` | Valores actuales de knots y binds, indexados por `key` |
| `graph` | Grafo de dependencias entre nodos |
| `listeners` | Callbacks de componentes React suscritos a cada nodo |
| `cache` | Valores calculados de threads. Se invalida selectivamente al escribir |

---

## 3. `knot.ts` — Estado primitivo

```typescript
export function knot<T>(options: { key: string; default: T }): KnotDef<T> {
  return {
    _brand: 'knot',
    key: options.key,
    default: options.default,
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

---

## 4. `thread.ts` — Estado derivado

```typescript
export function thread<T>(options: {
  key: string
  get: (ctx: ReadContext) => T
}): ThreadDef<T> {
  return {
    _brand: 'thread',
    key: options.key,
    get: options.get,
  }
}
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
- **Solo lectura:** `ThreadDef` no tiene campo `default` ni setters. Es imposible escribir directamente en un thread.

---

## 5. `bind.ts` — Estado con reducers

```typescript
export function bind<T, R extends Reducers<T>>(options: {
  key: string
  default: T
  reducers: R
}): BindDef<T, R> {
  return {
    _brand: 'bind',
    key: options.key,
    default: options.default,
    reducers: options.reducers,
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

**Concepto:** evalúa el thread con tracking de dependencias y gestiona el cache.

**Flujo:**

```
1. ¿store.cache tiene node.key?
   └─ Sí → retornar valor cacheado (O(1))
   └─ No → continuar

2. Crear discoveredDeps = new Set()

3. Crear trackingRead:
   función que, al ser llamada con dep,
   a) agrega dep.key a discoveredDeps
   b) llama getNodeValue(dep, store) recursivamente

4. Llamar node.get({ read: trackingRead })
   → ejecuta la función del usuario
   → cada read() dentro registra una dep

5. rebuildGraphEdges(graph, node.key, discoveredDeps)
   → actualiza el grafo con las deps reales

6. store.cache.set(node.key, value)
   → guarda resultado

7. Retornar value
```

**Por qué el cache es válido:** `setNodeValue` siempre borra el cache de los threads afectados **antes** de notificar a los componentes. Cuando un componente re-renderiza y llama `getNodeValue`, el cache ya fue invalidado si correspondía.

**Threads encadenados:** `trackingRead` llama `getNodeValue`, que a su vez puede llamar `evaluateThread` para threads que dependen de otros threads. La recursión termina porque el grafo es acíclico. El cache de threads intermedios también se reconstruye correctamente.

---

### `getDefaultValue`

```typescript
export function getDefaultValue<T>(node: AnyNode<T>): T
```

**Concepto:** evalúa el valor de un nodo usando solo sus defaults, sin acceder al store.

Usado como `getServerSnapshot` en `useSyncExternalStore` de React. React llama a este snapshot durante el Server-Side Rendering (SSR), donde no existe un store activo.

**Para threads:** ejecuta `node.get` con un `read` que recursivamente llama `getDefaultValue` en las dependencias. No construye el grafo. El resultado se cachea en un `WeakMap` externo al store, keyed por la definición del nodo.

**Para knot/bind:** retorna directamente `node.default`.

**Por qué el cache en WeakMap:** React llama a `getServerSnapshot` repetidamente durante la hidratación para verificar consistencia entre servidor y cliente. Si un thread retorna un objeto o array nuevo en cada llamada (referencias distintas aunque los datos sean iguales), React detecta que el store "sigue cambiando" y entra en un loop infinito. El `WeakMap` garantiza que la misma referencia se retorne en todas las llamadas para el mismo nodo. Como los defaults son estáticos (definidos a nivel de módulo), el cache nunca queda obsoleto.

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

5. BFS de invalidación:
   dirty = getDirtyNodes(key, graph)
   Por cada dirtyKey: store.cache.delete(dirtyKey)

6. Notificación:
   notifyKey(key, store)
   Por cada dirtyKey: notifyKey(dirtyKey, store)
```

**Detalle del paso 1 (`defaultValue`):** el store no precarga los defaults. Si un knot nunca fue escrito, `store.values.get(key)` retorna `undefined`. Sin el parámetro `defaultValue`, un updater funcional como `prev => prev + 1` recibiría `undefined` y el resultado sería `NaN`. El parámetro `defaultValue` resuelve esto de forma explícita.

**Detalle del paso 3 (igualdad referencial):** usa `Object.is` en lugar de `===` para manejar correctamente `NaN` (`Object.is(NaN, NaN) === true`, mientras que `NaN === NaN === false`). Si el valor no cambió, no se invalida el cache ni se notifica a ningún componente.

**Detalle del paso 5–6 (orden de operaciones):** el cache se invalida **antes** de notificar. Esto garantiza que cuando un componente React responde a la notificación y llama `getNodeValue`, encuentra el cache ya inválido y recalcula el valor correcto.

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
  () => getDefaultValue(def),
)
```

**Gestión de memoria:** si no existe aún un `Set` para el key, se crea. Al llamar la función de limpieza, el listener se elimina del Set. Si el componente se desmonta sin que se llame al unsubscribe (caso de error), el listener permanece en el store hasta que el store sea descartado.

---

### `notifyKey` (función interna)

```typescript
function notifyKey(key: string, store: Store): void
```

Itera el `Set` de listeners para un key dado y llama a cada uno. Es O(n) donde n es el número de componentes suscritos al nodo.

`setNodeValue` la llama dos veces: una para el nodo fuente y una por cada thread afectado. Esto permite que componentes suscritos directamente a un thread (por ejemplo, `useThread(statsThread)`) reciban la notificación aunque no estén suscritos al knot fuente.

---

## 8. Flujo completo de una escritura

Para ilustrar cómo interactúan todos los módulos, se describe el flujo completo cuando se llama `dispatch.add(newTodo)` en `TodoInput`:

```
useBind internamente llama:
  setNodeValue('todos', state => [...state, newTodo], store, [])

store.ts — setNodeValue:
  1. current = store.values.get('todos') ?? []
  2. newValue = [...current, newTodo]
  3. Object.is(current, newValue) → false (nuevo array)
  4. store.values.set('todos', newValue)

  5. getDirtyNodes('todos', graph):
     BFS sobre nodeSubscriptions:
       'todos' → { 'filteredTodos', 'stats', 'todoState' }
       'filteredTodos' → {} (sin downstream)
       'stats' → {}
       'todoState' → {}
     dirty = Set { 'filteredTodos', 'stats', 'todoState' }

  6. cache.delete('filteredTodos')
     cache.delete('stats')
     cache.delete('todoState')

  7. notifyKey('todos', store)        → sin listeners (TodoInput no lee todos)
     notifyKey('filteredTodos', store) → notifica a TodoList
     notifyKey('stats', store)        → notifica a TodoStats
     notifyKey('todoState', store)    → notifica a TelarDevTools

React re-renderiza:
  TodoList llama getNodeValue(filteredTodosThread, store)
    → cache inválido → evaluateThread()
    → lee todosBind (valor nuevo) y filterKnot (sin cambio)
    → recalcula lista filtrada
    → cachea y retorna

  TodoStats llama getNodeValue(statsThread, store)
    → cache inválido → evaluateThread()
    → calcula nuevos totales
    → cachea y retorna
```

`TodoInput` y `TodoFilter` no se re-renderizan: no tienen listeners activos sobre `'todos'`, `'filteredTodos'`, `'stats'` ni `'todoState'`.

---

## 9. Invariantes del sistema

Propiedades que el sistema garantiza en todo momento:

| Invariante | Mecanismo |
|---|---|
| Un thread nunca tiene un valor de cache obsoleto | El cache se invalida antes de notificar |
| Las dependencias de un thread reflejan la última evaluación | `rebuildGraphEdges` se llama tras cada evaluación |
| Dos `TelarRoot` nunca comparten estado | Cada `TelarRoot` crea su propio `Store` vía `createStore()` |
| Un valor idéntico no genera re-renders | `Object.is` antes de escribir |
| El grafo nunca tiene ciclos | Los threads son read-only; nunca pueden escribir en un knot |
| Los defaults nunca producen `undefined` en updaters | `setNodeValue` recibe `defaultValue` explícito |
| `getServerSnapshot` no produce loop de hidratación | `getDefaultValue` cachea resultados de threads en un `WeakMap` |
