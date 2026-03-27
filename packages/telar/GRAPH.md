# Telar — Diagrama del Grafo

## 1. Estructura básica del grafo

```
┌─────────────────────────────────────────────────────────┐
│                        STORE                            │
│                                                         │
│  store.values                    store.graph            │
│  ┌──────────────────┐            ┌──────────────────┐   │
│  │ 'todos'  → [...]  │            │   nodeDeps       │   │
│  │ 'filter' → 'all'  │            │   nodeSubscr.    │   │
│  └──────────────────┘            └──────────────────┘   │
│                                                         │
│  store.cache                     store.dirty            │
│  ┌──────────────────┐            ┌──────────────────┐   │
│  │ 'filtered' → {...}│            │ { 'filtered',   │   │
│  │ 'stats'    → {...}│            │   'stats' }     │   │
│  └──────────────────┘            └──────────────────┘   │
│                                                         │
│  store.epochs                    store.listeners        │
│  ┌──────────────────┐            ┌──────────────────┐   │
│  │ 'todos'  → 3     │            │ 'filtered' → {f} │   │
│  │ 'filter' → 1     │            │ 'stats'    → {f} │   │
│  │ 'filtered'→ 5    │            └──────────────────┘   │
│  │ 'stats'  → 4     │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Nodos y aristas

```
                    FUENTES                    DERIVADOS

  ┌─────────────┐              ┌──────────────────────────┐
  │  todosBind  │──────────────▶  filteredTodosThread     │
  │  (bind)     │          ┌───▶  key: 'filteredTodos'    │
  │  key:'todos'│          │   └──────────────────────────┘
  └─────────────┘          │                │
         │                 │                │ depende de
         │                 │                ▼
         │            ┌────┴─────────────────────────────┐
         └────────────▶  statsThread                     │
                      │  key: 'stats'                    │
  ┌─────────────┐     │  reads: filteredTodosThread      │
  │  filterKnot │─────▶                                  │
  │  (knot)     │     └──────────────────────────────────┘
  │  key:'filter│
  └─────────────┘

  Lectura de cada thread:
    filteredTodosThread.get:
      read(todosBind)    ← dep registrada
      read(filterKnot)   ← dep registrada

    statsThread.get:
      read(filteredTodosThread)  ← dep registrada
```

---

## 3. Contenido de store.graph para el ejemplo anterior

```
nodeDeps (thread → sus deps directas):
  'filteredTodos' → { 'todos', 'filter' }
  'stats'         → { 'filteredTodos' }

nodeSubscriptions (nodo → threads que lo leen):
  'todos'          → { 'filteredTodos' }
  'filter'         → { 'filteredTodos' }
  'filteredTodos'  → { 'stats' }
  'stats'          → {}               ← nadie depende de stats
```

---

## 4. BFS cuando cambia todosBind

```
EVENTO: dispatch.add(newTodo) → setNodeValue('todos', ...)

Paso 1: Escribir
  store.values.set('todos', newArray)
  store.epochs.set('todos', 4)           ← incrementa

Paso 2: BFS desde 'todos'
                    'todos'
                       │
          ┌────────────┘
          │
          ▼ nodeSubscriptions('todos') = { 'filteredTodos' }
    'filteredTodos'                         dirty = { 'filteredTodos' }
          │
          ▼ nodeSubscriptions('filteredTodos') = { 'stats' }
       'stats'                                  dirty = { 'filteredTodos', 'stats' }
          │
          ▼ nodeSubscriptions('stats') = {}
         FIN

  store.dirty = { 'filteredTodos', 'stats' }
  NOTA: el cache NO se borra — prevEntry se preserva para equal

Paso 3: Notificar
  notifyKey('todos')          → sin listeners (TodoInput usa useDispatch)
  notifyKey('filteredTodos')  → llama callback de TodoList
  notifyKey('stats')          → llama callback de TodoStats
```

---

## 5. Evaluación de un thread dirty

```
React llama getSnapshot para TodoList:
  getNodeValue(filteredTodosThread, store)
    └── evaluateThread('filteredTodos', store)

  ┌─────────────────────────────────────────────────────┐
  │                  evaluateThread                     │
  │                                                     │
  │  1. dirty.has('filteredTodos')? → SÍ                │
  │     → no tomar cache, re-evaluar                    │
  │                                                     │
  │  2. prevEntry = cache.get('filteredTodos')          │
  │     → { value: [todo1, todo2], depEpochs: {...} }   │
  │                                                     │
  │  3. discoveredDeps = new Set()                      │
  │     trackingRead('todosBind'):                      │
  │       discoveredDeps.add('todos')                   │
  │       getNodeValue(todosBind) → [todo1, todo2, todo3]│
  │     trackingRead('filterKnot'):                     │
  │       discoveredDeps.add('filter')                  │
  │       getNodeValue(filterKnot) → 'all'             │
  │                                                     │
  │  4. newValue = [todo1, todo2, todo3]  (filter='all')│
  │                                                     │
  │  5. equal definido?                                 │
  │     NO (filteredTodosThread no tiene equal)         │
  │     finalValue = newValue  (nueva referencia)       │
  │                                                     │
  │  6. depEpochs = { 'todos': 4, 'filter': 1 }        │
  │                                                     │
  │  7. Object.is(prevEntry.value, finalValue)?         │
  │     → NO (nuevo array)                              │
  │     → store.epochs.set('filteredTodos', 6)  ↑       │
  │                                                     │
  │  8. dirty.delete('filteredTodos')                   │
  │     rebuildGraphEdges(...)                          │
  │     cache.set('filteredTodos', {                    │
  │       value: finalValue,                            │
  │       depEpochs: { 'todos': 4, 'filter': 1 }       │
  │     })                                              │
  │                                                     │
  │  9. return finalValue                               │
  └─────────────────────────────────────────────────────┘

  useSyncExternalStore:
    prevSnapshot = [todo1, todo2]
    newSnapshot  = [todo1, todo2, todo3]
    Object.is? → NO → React re-renderiza TodoList
```

---

## 6. Efecto del comparador equal

```
React llama getSnapshot para TodoStats:
  evaluateThread('stats', store)

  ┌─────────────────────────────────────────────────────┐
  │  statsThread.equal = (a, b) =>                      │
  │    a.total === b.total && a.done === b.done          │
  │                                                     │
  │  prevEntry.value = { total: 3, done: 1 }            │
  │                                                     │
  │  trackingRead('filteredTodos'):                     │
  │    → evaluateThread('filteredTodos')                │
  │    → retorna [todo1, todo2, todo3]                  │
  │                                                     │
  │  newValue = {                                       │
  │    total: 3,         ← mismo                       │
  │    done: 1,          ← mismo                       │
  │  }  ← nueva referencia de objeto                   │
  │                                                     │
  │  equal(prevEntry.value, newValue)?                  │
  │    → a.total (3) === b.total (3) → true             │
  │    → a.done  (1) === b.done  (1) → true             │
  │    → RETORNA TRUE                                   │
  │                                                     │
  │  finalValue = prevEntry.value  (referencia anterior)│
  │                                                     │
  │  Object.is(prevEntry.value, finalValue)?            │
  │    → SÍ (misma referencia)                         │
  │    → epoch NO se incrementa                         │
  │                                                     │
  │  cache.set('stats', {                               │
  │    value: prevEntry.value,  ← misma referencia      │
  │    depEpochs: { 'filteredTodos': 6 }                │
  │  })                                                 │
  └─────────────────────────────────────────────────────┘

  useSyncExternalStore:
    prevSnapshot = { total: 3, done: 1 }   (ref anterior)
    newSnapshot  = { total: 3, done: 1 }   (misma ref)
    Object.is? → SÍ → React NO re-renderiza TodoStats
```

---

## 7. Dependencia condicional — mutación del grafo

```
ANTES (mode = 'a'):
  resultThread.get = ({ read }) => {
    const mode = read(modeKnot)          // dep: 'mode'
    return read(knotA)                   // dep: 'knotA'
  }

  nodeDeps:
    'result' → { 'mode', 'knotA' }

  nodeSubscriptions:
    'mode'  → { 'result' }
    'knotA' → { 'result' }
    'knotB' → {}

EVENTO: setNodeValue('mode', 'b')
  dirty.add('result')
  notifyKey('mode')
  notifyKey('result')

EVALUACIÓN de resultThread:
  discoveredDeps = {}
  read(modeKnot) → 'b'      dep: 'mode'
  read(knotB)    → ...       dep: 'knotB'
  (knotA no se lee en esta rama)

  rebuildGraphEdges('result', { 'mode', 'knotB' }):
    oldDeps = { 'mode', 'knotA' }

    Eliminar aristas viejas:
      nodeSubscriptions('mode').delete('result')   ← pero se re-agrega
      nodeSubscriptions('knotA').delete('result')  ← desuscripción real

    Registrar aristas nuevas:
      nodeDeps('result') = { 'mode', 'knotB' }
      nodeSubscriptions('mode').add('result')
      nodeSubscriptions('knotB').add('result')     ← nueva suscripción

DESPUÉS (mode = 'b'):
  nodeDeps:
    'result' → { 'mode', 'knotB' }

  nodeSubscriptions:
    'mode'  → { 'result' }
    'knotA' → {}              ← vacío, ya no afecta a 'result'
    'knotB' → { 'result' }   ← activo
```

---

## 8. Ciclo de vida completo de un thread

```
TIEMPO ───────────────────────────────────────────────────────────────────▶

  Módulo carga:
    filteredTodosThread = thread({ key: 'filteredTodos', get: ... })
    ┌──────────────────────────────────────────────────────────────────────
    │  Definición existe en memoria
    │  Store: values={} epochs={} cache={} dirty={} graph={} listeners={}
    └──────────────────────────────────────────────────────────────────────

  Componente monta (TodoList):
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    ↓
    subscribeToNode('filteredTodos', notify, store)
      → listeners.get('filteredTodos') = { notify }
    ↓
    getSnapshot() → getNodeValue(filteredTodosThread)
      → evaluateThread: no cache, not dirty
      → ejecuta get(), descubre deps: {'todos','filter'}
      → rebuildGraphEdges: aristas construidas
      → cache.set('filteredTodos', { value: [...], depEpochs: {...} })
    ┌──────────────────────────────────────────────────────────────────────
    │  Store: listeners={'filteredTodos':{notify}}
    │         cache={'filteredTodos':{...}}
    │         graph.nodeDeps={'filteredTodos':{'todos','filter'}}
    │         graph.nodeSubscriptions={'todos':{'filteredTodos'},
    │                                  'filter':{'filteredTodos'}}
    └──────────────────────────────────────────────────────────────────────

  Knot cambia (dispatch.add):
    dirty.add('filteredTodos')
    notifyKey('filteredTodos') → llama notify
    ↓
    React: getSnapshot() → evaluateThread → re-evalúa → nuevo valor
    → component re-renderiza

  Componente desmonta (TodoList):
    cleanup de subscribeToNode:
      listeners.get('filteredTodos').delete(notify)
      size === 0 →
        listeners.delete('filteredTodos')
        cache.delete('filteredTodos')
        dirty.delete('filteredTodos')
        nodeDeps.delete('filteredTodos')
        nodeSubscriptions.get('todos').delete('filteredTodos')
        nodeSubscriptions.get('filter').delete('filteredTodos')
    ┌──────────────────────────────────────────────────────────────────────
    │  Store: listeners={} cache={} dirty={}
    │         graph.nodeDeps={}
    │         graph.nodeSubscriptions={'todos':{},'filter':{}}
    │  El thread es invisible para el sistema
    └──────────────────────────────────────────────────────────────────────
```

---

## 9. Flujo completo end-to-end (diagrama de secuencia)

```
  Usuario        TodoInput     dispatch    store      React      TodoList
     │               │            │          │          │            │
     │  click Add    │            │          │          │            │
     │──────────────▶│            │          │          │            │
     │               │dispatch.   │          │          │            │
     │               │add(todo)───▶          │          │            │
     │               │            │setNode   │          │            │
     │               │            │Value()───▶          │            │
     │               │            │          │write     │            │
     │               │            │          │incr epoch│            │
     │               │            │          │BFS dirty │            │
     │               │            │          │notify()──▶           │
     │               │            │          │          │schedule   │
     │               │            │          │          │re-render  │
     │               │            │          │          │           │
     │               │            │          │          │getSnapshot│
     │               │            │          │◀──────────────────────
     │               │            │          │evaluate  │            │
     │               │            │          │Thread()  │            │
     │               │            │          │ dirty?YES│            │
     │               │            │          │ run get()│            │
     │               │            │          │ equal?   │            │
     │               │            │          │ cache    │            │
     │               │            │          │──────────▶            │
     │               │            │          │          │new value?  │
     │               │            │          │          │YES→render──▶
     │               │            │          │          │            │
     │               │            │          │          │            │ render con
     │               │            │          │          │            │ lista nueva
```

---

## 10. Resumen visual de las estructuras del store

```
                    ┌─────────────────────────────────────┐
                    │              STORE                   │
                    │                                     │
  FUENTES DE VERDAD │  values: Map<key, value>            │
                    │  epochs: Map<key, number>           │
                    │                                     │
  GRAFO             │  graph:                             │
                    │    nodeDeps:                        │
                    │      thread → Set<dep>              │
                    │    nodeSubscriptions:               │
                    │      dep → Set<thread>              │
                    │                                     │
  CACHE             │  cache:                             │
                    │    thread → { value, depEpochs }    │
                    │  dirty: Set<thread>                 │
                    │                                     │
  REACT BRIDGE      │  listeners:                         │
                    │    node → Set<() => void>           │
                    └─────────────────────────────────────┘

  Flujo de escritura:
  values ──update──▶ epochs ──BFS──▶ dirty ──notify──▶ listeners
                                              │
                                              ▼
                                         React getSnapshot
                                              │
                                              ▼
                                    evaluateThread ──▶ cache
                                         │
                                         ▼
                                    rebuildGraphEdges ──▶ graph

  Flujo de lectura:
  listeners ◀── subscribe ◀── useSyncExternalStore ◀── hook
       │
       ▼ (en cleanup)
  dirty.delete / cache.delete / graph edges cleanup
```
