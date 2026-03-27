# Telar — Deep Dive Técnico

## Introducción

Telar es una librería de manejo de estado reactivo para React. Su premisa central es que el estado de una aplicación no es una lista plana de variables sino una **red de dependencias**: algunos datos son fuente, otros se derivan de ellos, y cuando algo cambia, solo lo que realmente depende de eso debería actualizarse.

Esto se implementa como un **grafo acíclico dirigido (DAG)** donde cada nodo es una unidad de estado y las aristas representan relaciones de dependencia. La palabra *telar* describe exactamente esa estructura: un tejido donde cada nudo está conectado a otros a través de hilos, y cambiar un nudo propaga el efecto a través de los hilos hacia los nudos que dependen de él.

---

## El problema que resuelve

### Context API: re-renders globales

```tsx
const CartContext = createContext(null)

function App() {
  const [cart, setCart] = useState([])
  return (
    <CartContext.Provider value={{ cart, setCart }}>
      <Header />   {/* re-renderiza si cart cambia */}
      <Sidebar />  {/* re-renderiza si cart cambia */}
      <CartIcon /> {/* el único que necesita cart */}
    </CartContext.Provider>
  )
}
```

Cualquier componente que consuma el contexto se re-renderiza ante **cualquier** cambio en el valor del contexto, aunque el componente solo use una fracción de ese valor.

### Zustand: singleton en módulo

```typescript
const useStore = create((set) => ({ cart: [], user: null }))
```

El store es un singleton a nivel de módulo JavaScript. En SSR, ese singleton sobrevive entre requests: el estado del request de un usuario puede filtrarse al request del siguiente.

### Jotai/Recoil: hidratación manual

```typescript
// Hay que listar manualmente qué átomos hidratar
useHydrateAtoms([[cartAtom, serverCart], [userAtom, serverUser]])
```

El servidor y el cliente tienen que coordinarse manualmente. Si se agrega un nuevo átomo, hay que recordar agregarlo a la lista de hidratación.

### Telar: grafo reactivo con hidratación declarativa

```typescript
// El knot declara cómo obtener su valor del servidor
const userKnot = knot({
  key: 'user',
  default: null,
  server: async (ctx) => db.users.findOne(ctx.session.userId),
  sanitize: (user) => omit(user, ['passwordHash']),
})

// Server Component
const prefetch = createPrefetchContext()
await prefetch(userKnot)
return <TelarRoot initialValues={prefetch.flush()}><App /></TelarRoot>
```

El componente `UserProfile` que lee `userKnot` nunca ve `null` — tiene el valor del servidor desde el primer render.

---

## Las tres primitivas

### `knot` — estado base

Un knot es el **vértice fuente** del grafo. No tiene dependencias entrantes: nadie lo calcula, alguien lo escribe.

```typescript
const priceKnot = knot({ key: 'price', default: 0 })
const [price, setPrice] = useKnot(priceKnot)

setPrice(150)              // valor directo
setPrice(p => p * 1.1)    // función actualizadora
```

Propiedades clave:
- Su valor vive en `store.values`
- Escritura libre mediante `SetterOrUpdater<T>` — valor directo o función
- Cuando cambia, dispara una propagación BFS por el grafo

### `thread` — estado derivado

Un thread es un **vértice derivado**: su valor se calcula a partir de otros nodos. Es de solo lectura — no se puede escribir directamente.

```typescript
const totalThread = thread({
  key: 'total',
  get: ({ read }) => read(priceKnot) * read(quantityKnot),
})

const total = useThread(totalThread)
```

Propiedades clave:
- Evaluación **perezosa**: no se calcula hasta que alguien lo lee
- **Cacheado**: el resultado se almacena; mientras ninguna dep cambie, se devuelve el cache
- **Dependencias dinámicas**: las deps se descubren en tiempo de ejecución, no se declaran
- **Comparador opcional (`equal`)**: permite igualdad estructural para evitar re-renders con nuevas referencias

### `bind` — estado con reducers

Un bind es un knot con escritura controlada. El estado solo puede modificarse a través de acciones nombradas con semántica explícita.

```typescript
const cartBind = bind({
  key: 'cart',
  default: [],
  reducers: {
    add:    (state, item)  => [...state, item],
    remove: (state, id)    => state.filter(i => i.id !== id),
    clear:  ()             => [],
  },
})

const [cart, dispatch] = useBind(cartBind)
dispatch.add({ id: 1, name: 'Producto', price: 100 })
```

Propiedades clave:
- Internamente funciona igual que un knot (valor en `store.values`)
- Los reducers son **funciones puras**: reciben estado actual y args, retornan estado nuevo
- `dispatch` está completamente tipado: TypeScript infiere los argumentos de cada acción
- `useDispatch(bind)` retorna solo el dispatch sin suscribirse — el componente nunca re-renderiza por cambios en el bind

---

## El Store — estructura interna

```typescript
type Store = {
  values:    Map<string, unknown>           // valores de knots y binds
  epochs:    Map<string, number>            // versión por nodo
  graph:     Graph                          // grafo de dependencias
  listeners: Map<string, Set<() => void>>   // suscriptores React por nodo
  cache:     Map<string, CacheEntry>        // valores calculados de threads
  dirty:     Set<string>                    // threads que necesitan re-evaluación
}

type CacheEntry = {
  value:     unknown
  depEpochs: Map<string, number>  // epoch de cada dep al momento de evaluar
}
```

Cada `<TelarRoot>` crea un store independiente con `useRef`. No hay singletons globales. Dos instancias de `<TelarRoot>` usando los mismos knots no comparten estado.

---

## El Grafo de Dependencias

### Estructura

El grafo usa dos mapas complementarios que se apuntan mutuamente:

```typescript
type Graph = {
  nodeDeps:          Map<string, Set<string>>  // thread → sus deps
  nodeSubscriptions: Map<string, Set<string>>  // nodo   → threads que lo leen
}
```

| Mapa | Pregunta que responde |
|---|---|
| `nodeDeps` | "¿De qué nodos depende el thread `X`?" |
| `nodeSubscriptions` | "¿Qué threads se ven afectados si el nodo `Y` cambia?" |

Mantener ambas vistas en paralelo es un trade-off deliberado: ocupa más memoria pero permite tanto reconstruir aristas en O(deps) como propagar cambios en O(nodos\_afectados + aristas).

### Construcción — tracking automático

Las aristas del grafo **no se declaran**: se descubren en tiempo de ejecución durante la evaluación de cada thread.

Cuando `evaluateThread` ejecuta `node.get(...)`, no pasa el objeto real del store. Pasa una versión instrumentada llamada `trackingRead`:

```typescript
const discoveredDeps = new Set<string>()

const trackingRead = <U>(dep: AnyNode<U>): U => {
  discoveredDeps.add(dep.key)          // registra la dependencia
  return getNodeValue(dep, store)       // lee el valor
}

const value = node.get({ read: trackingRead })
// → tras ejecutar, discoveredDeps tiene exactamente las deps leídas
```

Después de la evaluación, `rebuildGraphEdges` actualiza el grafo:

```typescript
function rebuildGraphEdges(graph, nodeKey, newDeps) {
  const oldDeps = graph.nodeDeps.get(nodeKey) ?? new Set()

  // 1. Eliminar aristas viejas
  for (const dep of oldDeps) {
    graph.nodeSubscriptions.get(dep)?.delete(nodeKey)
  }

  // 2. Registrar aristas nuevas
  graph.nodeDeps.set(nodeKey, newDeps)
  for (const dep of newDeps) {
    if (!graph.nodeSubscriptions.has(dep)) {
      graph.nodeSubscriptions.set(dep, new Set())
    }
    graph.nodeSubscriptions.get(dep).add(nodeKey)
  }
}
```

### Dependencias dinámicas

Las aristas se reconstruyen en cada evaluación. Esto permite dependencias condicionales:

```typescript
const resultThread = thread({
  key: 'result',
  get: ({ read }) => {
    const mode = read(modeKnot)
    return mode === 'a' ? read(knotA) : read(knotB)
  },
})
```

**Ciclo con `mode = 'a'`:**

```
nodeDeps('result')           = { 'mode', 'knotA' }
nodeSubscriptions('mode')    = { 'result' }
nodeSubscriptions('knotA')   = { 'result' }
nodeSubscriptions('knotB')   = {}           ← no está registrado
```

**Ciclo con `mode = 'b'`** (después de cambiar `mode`):

```
nodeDeps('result')           = { 'mode', 'knotB' }
nodeSubscriptions('mode')    = { 'result' }
nodeSubscriptions('knotA')   = {}           ← desuscrito automáticamente
nodeSubscriptions('knotB')   = { 'result' } ← suscrito automáticamente
```

`resultThread` ya no recibirá notificaciones cuando `knotA` cambie. Sin intervención manual.

---

## Propagación de cambios — el algoritmo

### 1. Escritura

```typescript
setNodeValue('todos', state => [...state, newTodo], store, [])
```

La función hace cinco cosas en orden:

```
1. Leer valor actual
   current = store.values.get('todos') ?? defaultValue

2. Calcular nuevo valor
   newValue = next(current)

3. Guardia de igualdad (Object.is)
   Si igual → salir sin hacer nada

4. Persistir
   store.values.set('todos', newValue)
   store.epochs.set('todos', epoch + 1)

5. Marcar dirty + notificar
   dirtyThreads = getDirtyNodes('todos', graph)  ← BFS
   store.dirty.add('filteredTodos')
   store.dirty.add('stats')
   notifyKey('todos', store)
   notifyKey('filteredTodos', store)
   notifyKey('stats', store)
```

### 2. BFS de propagación

`getDirtyNodes` recorre `nodeSubscriptions` en anchura desde el nodo cambiado:

```
Estado del grafo:
  nodeSubscriptions('todos')         = { 'filteredTodos', 'stats' }
  nodeSubscriptions('filteredTodos') = { 'summaryThread' }
  nodeSubscriptions('stats')         = {}

BFS desde 'todos':
  queue = ['todos']

  Paso 1: sacar 'todos'
    → subscribers: { 'filteredTodos', 'stats' }
    → dirty = { 'filteredTodos', 'stats' }
    → queue = ['filteredTodos', 'stats']

  Paso 2: sacar 'filteredTodos'
    → subscribers: { 'summaryThread' }
    → dirty = { 'filteredTodos', 'stats', 'summaryThread' }
    → queue = ['stats', 'summaryThread']

  Paso 3: sacar 'stats'
    → subscribers: {} → nada

  Paso 4: sacar 'summaryThread'
    → subscribers: {} → nada

  Resultado: { 'filteredTodos', 'stats', 'summaryThread' }
```

El BFS garantiza que **todos** los threads afectados, directa o transitivamente, queden marcados dirty con una sola pasada. El grafo es acíclico por diseño (los threads no pueden escribir), así que el BFS siempre termina.

### 3. El dirty set — por qué reemplaza cache.delete

En la implementación anterior, el cache se **borraba** al marcar dirty. Ahora se **preserva** y solo se marca con `store.dirty`.

¿Por qué? Para que el comparador `equal` pueda funcionar.

```
Escritura:
  dirty.add('statsThread')      // marca para re-evaluar
  cache aún tiene { value: { total: 5, done: 2 } }

React llama getSnapshot para statsThread:
  evaluateThread:
    1. 'statsThread' está en dirty → debe re-evaluar
    2. prevEntry = cache.get('statsThread')  ← { total: 5, done: 2 }
    3. Ejecuta get() → newValue = { total: 5, done: 2 }  (mismos números, nuevo objeto)
    4. equal(prevEntry.value, newValue) → true
    5. finalValue = prevEntry.value  (referencia anterior preservada)
    6. dirty.delete('statsThread')
    7. cache.set('statsThread', { value: finalValue, ... })
    8. Retorna finalValue

useSyncExternalStore:
  snapshot === prevSnapshot (misma referencia) → React no re-renderiza
```

Sin el dirty set (solo borrando cache), el paso 2 retornaría `undefined` y no habría valor previo con el que comparar.

### 4. Notificación

React usa `useSyncExternalStore`. Cuando `notifyKey` llama al callback registrado por React, React no re-renderiza inmediatamente — programa una verificación de snapshot. Luego llama a `getSnapshot` (= `getNodeValue`). Si el snapshot retorna la misma referencia que antes, React cancela el re-render.

```
notifyKey → callback de React → React llama getSnapshot → evaluateThread
  → equal preserva referencia → Object.is(prev, next) === true → sin re-render
```

Esto significa que incluso cuando Telar notifica un thread, React puede decidir no re-renderizar si el valor no cambió estructuralmente.

---

## Epoch Versioning

### Qué es un epoch

Cada nodo del store tiene un número de versión en `store.epochs`. Empieza en 0 (implícito — ausente en el Map) y se incrementa cada vez que el valor del nodo cambia.

Para **knots y binds**: el epoch sube al confirmar la escritura en `setNodeValue`.

Para **threads**: el epoch sube cuando `evaluateThread` produce un valor diferente al cacheado (usando `Object.is` sobre `finalValue`). Si `equal` preservó la referencia anterior, el epoch **no** sube aunque el knot subyacente haya cambiado.

### Para qué sirve

**1. Identificador de versión para threads downstream**

```
knot C (epoch: 3) → thread B (epoch: 7) → thread A
```

Cuando A evalúa y llama `read(B)`, `evaluateThread(B)` puede estar dirty. Después de re-evaluar B:
- Si B produjo un valor nuevo → epoch[B] = 8
- Si B preservó referencia (via equal) → epoch[B] = 7

A puede almacenar `depEpochs['B'] = 7` en su cache. Si más adelante se pregunta si A es válido: `store.epochs.get('B') === 7` → sin cambio en B → A sigue válido. Sin re-evaluar B.

**2. Base para devtools y time-travel**

El epoch permite identificar con precisión cuándo cambió cada nodo y en qué orden. Un panel de DevTools podría mostrar el historial de cambios con número de versión.

### depEpochs en CacheEntry

```typescript
type CacheEntry = {
  value: unknown
  depEpochs: Map<string, number>  // dep key → epoch al momento de evaluar
}
```

Cuando `evaluateThread` termina, guarda los epochs actuales de todas las deps directas. Esto crea un snapshot del "estado del mundo" cuando se calculó el valor. En el futuro, comparar estos epochs con los actuales puede reemplazar el dirty set para threads con solo deps de tipo knot/bind.

---

## Ciclo de vida de suscripciones

### Montaje

Cuando un componente monta y llama `useThread(statsThread)`:

```
useSyncExternalStore(
  (notify) => subscribeToNode('stats', notify, store),  ← subscribe
  () => getNodeValue(statsThread, store),                ← getSnapshot
  () => getDefaultValue(statsThread),                   ← getServerSnapshot
)
```

`subscribeToNode` agrega el callback de React al `Set` de listeners del key `'stats'`. En la primera llamada a `getSnapshot`, `evaluateThread` detecta que no hay cache → ejecuta `get()` → construye las aristas del grafo.

### Desmontaje

Cuando el componente desmonta, React llama al cleanup retornado por `subscribeToNode`:

```typescript
return () => {
  const set = store.listeners.get(key)
  set?.delete(listener)

  if (set?.size === 0) {
    // Último suscriptor: limpiar todo
    store.listeners.delete(key)
    store.cache.delete(key)
    store.dirty.delete(key)

    // Eliminar aristas del grafo
    const deps = store.graph.nodeDeps.get(key)
    if (deps) {
      for (const dep of deps) {
        store.graph.nodeSubscriptions.get(dep)?.delete(key)
      }
      store.graph.nodeDeps.delete(key)
    }
  }
}
```

Después del cleanup, el thread es invisible para el sistema: si un knot del que dependía cambia, el BFS no lo alcanza (no hay aristas). Ni se marca dirty, ni se notifica. El thread no existe en el grafo hasta que un nuevo componente lo monte.

### Por qué los knots no se limpian

Un knot persiste en `store.values` aunque ningún componente lo lea. Esto es correcto: el knot es **fuente de verdad**, no un valor derivado. Si un componente que lee un knot se desmonta y luego vuelve a montar, debe encontrar el valor que había quedado, no el default. El knot representa estado durable de la aplicación.

---

## Threads encadenados — evaluación recursiva

Cuando un thread depende de otro thread, la evaluación es recursiva pero determinista:

```
statsThread depende de filteredTodosThread
filteredTodosThread depende de todosBind y filterKnot
```

Al cambiar `todosBind`:

```
setNodeValue('todos', ...)

BFS:
  nodeSubscriptions('todos') = { 'filteredTodos', 'stats' }
  nodeSubscriptions('filteredTodos') = { 'stats' }
  dirty = { 'filteredTodos', 'stats' }
  → pero 'stats' ya estaba; no se duplica
```

Cuando React evalúa `statsThread`:

```
evaluateThread('stats'):
  1. 'stats' en dirty → re-evaluar
  2. trackingRead('filteredTodos'):
     → evaluateThread('filteredTodos'):
       1. 'filteredTodos' en dirty → re-evaluar
       2. trackingRead('todosBind') → valor nuevo
       3. trackingRead('filterKnot') → sin cambio
       4. Calcula nueva lista
       5. dirty.delete('filteredTodos')
       6. cache.set('filteredTodos', ...)
       7. Retorna nueva lista
  3. Con la nueva lista, calcula stats
  4. dirty.delete('stats')
  5. cache.set('stats', ...)
  6. Retorna stats
```

La recursión garantiza orden correcto sin necesidad de ordenamiento topológico explícito: cada thread evalúa sus deps antes de calcular su propio valor.

---

## Integración con React

### useSyncExternalStore

Todos los hooks de Telar que leen estado usan `useSyncExternalStore` de React 18. Esta API garantiza:
- Consistencia entre el servidor y el cliente en SSR
- Que el snapshot sea el mismo en todo el árbol durante un render (sin "tearing")
- Que si el snapshot no cambia entre renders, React no re-renderiza

```typescript
export function useThread<T>(def: ThreadDef<T>): T {
  const store = useTelarStore()
  return useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),  // subscribe
    () => getNodeValue(def, store),                        // getSnapshot
    () => getDefaultValue(def),                            // getServerSnapshot
  )
}
```

### getServerSnapshot — por qué necesita cache de WeakMap

Durante SSR y la hidratación del cliente, React llama a `getServerSnapshot` múltiples veces para verificar consistencia. Para un thread que retorna `{ total: 5 }`, si cada llamada crea un objeto nuevo, React los compara con `Object.is` → siempre diferentes → detecta que el store "sigue cambiando" → loop infinito.

La solución: un `WeakMap` que cachea el resultado de `getDefaultValue` para cada definición de nodo:

```typescript
const defaultCache = new WeakMap<object, unknown>()

export function getDefaultValue<T>(node: AnyNode<T>): T {
  if (node._brand === 'thread') {
    if (defaultCache.has(node)) return defaultCache.get(node) as T
    const read = <U>(dep: AnyNode<U>): U => getDefaultValue(dep)
    const value = node.get({ read })
    defaultCache.set(node, value)
    return value
  }
  return node.default
}
```

La definición del thread (el objeto `ThreadDef`) es una referencia estable (se define a nivel de módulo, una sola vez). El `WeakMap` la usa como key → misma definición → misma referencia de retorno → React no detecta cambios → sin loop.

### useDispatch — escritura sin suscripción

Un componente que solo necesita disparar acciones no debería re-renderizarse cuando el estado cambia. `useDispatch` resuelve esto omitiendo completamente `useSyncExternalStore`:

```typescript
export function useDispatch<T, R extends Reducers<T>>(def: BindDef<T, R>): Dispatch<T, R> {
  const store = useTelarStore()
  return useMemo(() => {
    const result = {} as Dispatch<T, R>
    for (const actionKey of Object.keys(def.reducers)) {
      result[actionKey] = (...args) => setNodeValue(def.key, state => def.reducers[actionKey](state, ...args), store, def.default)
    }
    return result
  }, [def, store])
}
```

Sin `useSyncExternalStore` → sin suscripción → sin listener en `store.listeners` → notifyKey nunca lo llama → el componente nunca re-renderiza por cambios en el bind.

---

## SSR e Hidratación

### createPrefetchContext

```typescript
const prefetch = createPrefetchContext(ctx)

await prefetch(userKnot)   // ejecuta userKnot.server(ctx), aplica sanitize
await prefetch(cartKnot)   // ídem

return { initialValues: prefetch.flush() }
// → { 'user': { id: 1, name: 'Ana' }, 'cart': [...] }
```

Cada `prefetch(knot)` ejecuta la función `server` del knot (definida en la misma definición que el client usa) y aplica `sanitize` para eliminar campos sensibles antes de serializar.

`flush()` retorna un objeto plano serializable — puede pasarse como prop desde Server Component o desde `getServerSideProps`.

### TelarRoot con initialValues

```typescript
export function TelarRoot({ children, initialValues }) {
  const storeRef = useRef(null)
  if (storeRef.current === null) {
    const store = createStore()
    if (initialValues) {
      for (const [key, value] of Object.entries(initialValues)) {
        store.values.set(key, value)   // precarga antes del primer render
      }
    }
    storeRef.current = store
  }
  return <TelarContext.Provider value={storeRef.current}>{children}</TelarContext.Provider>
}
```

Los valores se escriben directamente en `store.values` antes de que React monte el árbol de hijos. Cuando un componente client lee `userKnot`, `getNodeValue` encuentra el valor en `store.values` — nunca ve `null`.

---

## Store Isolation — por qué importa en SSR

En Node.js, un servidor HTTP atiende múltiples requests concurrentemente en el mismo proceso. Un store singleton (como Zustand) significa que el estado de un request puede afectar al siguiente.

Con Telar, el store vive en el árbol React:

```typescript
// Request A
const storeA = createStore()
storeA.values.set('user', userA)

// Request B (concurrente)
const storeB = createStore()
storeB.values.set('user', userB)

// Cada render React usa su propio store — sin interferencia
<TelarRoot store={storeA}><App /></TelarRoot>  // request A
<TelarRoot store={storeB}><App /></TelarRoot>  // request B
```

Dos renders nunca comparten un store. El estado es privado al árbol React que lo contiene.

---

## Invariantes del sistema

| Invariante | Mecanismo |
|---|---|
| El grafo es siempre acíclico | Los threads no pueden escribir — no hay camino de vuelta a un knot |
| Un thread nunca retorna un valor obsoleto | Se marca dirty antes de notificar; evaluateThread re-evalúa si dirty |
| Las deps de un thread reflejan la última evaluación | rebuildGraphEdges se llama tras cada evaluación |
| Dos TelarRoot nunca comparten estado | Cada uno crea su propio Store vía createStore() |
| Un valor idéntico no genera re-renders | Object.is antes de escribir; equal en threads |
| Los defaults no producen undefined en updaters | setNodeValue recibe defaultValue explícito |
| getServerSnapshot no produce loop de hidratación | getDefaultValue cachea en WeakMap por definición de nodo |
| Los threads sin consumidores no acumulan memoria | subscribeToNode limpia cache, dirty y aristas al último desmontaje |
| El epoch de un thread solo sube cuando el valor cambia | evaluateThread incrementa epoch solo si !Object.is(prev, final) |

---

## Comparación con alternativas

| | Context API | Zustand | Jotai | **Telar** |
|---|---|---|---|---|
| Re-renders granulares | No — todos los consumers | Sí (selector) | Sí (por átomo) | Sí (por nodo) |
| Estado derivado | useMemo manual | useMemo manual | Átomos derivados | `thread` |
| Store en módulo (singleton) | No | Sí | No | No |
| Reducers con tipo | No | En store | No | En cada `bind` |
| Hidratación SSR | Manual | Manual | `useHydrateAtoms` | Declarativa (`createPrefetchContext`) |
| Integración RSC | No | No | No | Sí |
| Deps declaradas | N/A | N/A | Sí | No (autodiscovery) |
| Cleanup al desmontar | N/A | N/A | Sí (WeakMap) | Sí (cleanup en subscribeToNode) |

La diferencia más significativa con Jotai es filosófica: Jotai identifica átomos por referencia de objeto (WeakMap) y hace recomputación topológica eager. Telar identifica nodos por string key (serializable para SSR) y hace evaluación lazy con tracking automático. Ambos enfoques resuelven el mismo problema con trade-offs diferentes.
