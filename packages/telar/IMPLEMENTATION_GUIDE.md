# Telar — Guía de Implementación

Esta guía cubre todo lo que necesitás saber para integrar Telar en una aplicación real: desde la primera línea de código hasta patrones avanzados de performance, SSR y organización de archivos.

---

## Índice

1. [Instalación y setup](#1-instalación-y-setup)
2. [Regla fundamental: dónde definir los nodos](#2-regla-fundamental-dónde-definir-los-nodos)
3. [knot — estado mutable](#3-knot--estado-mutable)
4. [thread — estado derivado](#4-thread--estado-derivado)
5. [bind — estado con acciones](#5-bind--estado-con-acciones)
6. [Elegir el hook correcto](#6-elegir-el-hook-correcto)
7. [Organización de archivos](#7-organización-de-archivos)
8. [Patrones de performance](#8-patrones-de-performance)
9. [SSR — React Server Components](#9-ssr--react-server-components)
10. [SSR — getServerSideProps](#10-ssr--getserversideprops)
11. [Stores múltiples e isolación](#11-stores-múltiples-e-isolación)
12. [Errores comunes](#12-errores-comunes)

---

## 1. Instalación y setup

```bash
# Si usás un monorepo con workspaces
pnpm add @repo/telar
```

```tsx
// Importaciones disponibles
import { knot, thread, bind }             from '@repo/telar'
import { TelarRoot, useKnot, useThread,
         useBind, useDispatch, useTelar } from '@repo/telar/react'
import { createPrefetchContext }          from '@repo/telar/server'
```

**Envolver la app con `<TelarRoot>`:**

```tsx
// app/layout.tsx o el componente raíz de tu app
import { TelarRoot } from '@repo/telar/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TelarRoot>
          {children}
        </TelarRoot>
      </body>
    </html>
  )
}
```

`TelarRoot` crea un store reactivo aislado. Todos los hooks de Telar dentro del árbol se conectan a ese store.

---

## 2. Regla fundamental: dónde definir los nodos

**Los nodos se definen a nivel de módulo, fuera de los componentes.**

```typescript
// ✅ Correcto — nivel de módulo
const countKnot = knot({ key: 'count', default: 0 })

function Counter() {
  const [count, setCount] = useKnot(countKnot)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

```typescript
// ❌ Incorrecto — dentro del componente
function Counter() {
  const countKnot = knot({ key: 'count', default: 0 }) // ← se recrea en cada render
  const [count, setCount] = useKnot(countKnot)
}
```

**Por qué:** la definición del nodo (el objeto `KnotDef`, `ThreadDef` o `BindDef`) es la identidad del nodo. Si se recrea en cada render, el store no puede asociarla con sus suscriptores de forma estable.

**La excepción controlada — factories:**

Cuando necesitás nodos parametrizados (por ejemplo, un bind por ítem de una lista), usá una factory con cache:

```typescript
// ✅ Factory con cache — seguro
const itemBindCache = new Map<string, BindDef<ItemState, ItemReducers>>()

export function getItemBind(id: string) {
  if (!itemBindCache.has(id)) {
    itemBindCache.set(id, bind({
      key:      `item-${id}`,
      default:  { value: '', active: false },
      reducers: {
        setValue:  (state, value: string)   => ({ ...state, value }),
        setActive: (state, active: boolean) => ({ ...state, active }),
      },
    }))
  }
  return itemBindCache.get(id)!
}

// En el componente — la referencia del bind es estable
function ItemRow({ id }: { id: string }) {
  const [item, dispatch] = useBind(getItemBind(id))
  // ...
}
```

---

## 3. `knot` — estado mutable

```typescript
import { knot } from '@repo/telar'

const filterKnot  = knot({ key: 'filter',  default: 'all' as 'all' | 'active' | 'done' })
const searchKnot  = knot({ key: 'search',  default: '' })
const pageKnot    = knot({ key: 'page',    default: 1 })
```

**Escritura:**

```typescript
const [filter, setFilter] = useKnot(filterKnot)

setFilter('active')             // valor directo
setFilter(f => f === 'all' ? 'active' : 'all')  // función actualizadora
```

**Cuándo usar `knot`:**
- Estado simple sin lógica de transición
- Valores primitivos o pequeños objetos que cambian libremente
- Estado de UI local a una sección: filtros, tabs activos, valores de inputs controlados

---

## 4. `thread` — estado derivado

```typescript
import { thread } from '@repo/telar'

const filteredItemsThread = thread({
  key: 'filteredItems',
  get: ({ read }) => {
    const items  = read(itemsBind)
    const filter = read(filterKnot)
    const search = read(searchKnot)

    return items
      .filter(item => filter === 'all' || item.status === filter)
      .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
  },
})
```

**Lectura:**

```typescript
const filteredItems = useThread(filteredItemsThread)
```

**Dependencias dinámicas — threads condicionales:**

```typescript
const resultThread = thread({
  key: 'result',
  get: ({ read }) => {
    const mode = read(modeKnot)
    // Solo lee knotA o knotB según el modo — no ambos
    return mode === 'a' ? read(knotA) : read(knotB)
  },
})
```

Cuando `mode` cambia de `'a'` a `'b'`, el thread se desuscribe de `knotA` automáticamente y se suscribe a `knotB`. No hay actualizaciones innecesarias desde `knotA`.

**Comparador de igualdad para objetos derivados:**

```typescript
// Sin equal: re-renderiza aunque los valores sean iguales (nueva referencia de objeto)
const statsThread = thread({
  key: 'stats',
  get: ({ read }) => ({
    total: read(itemsBind).length,
    done:  read(itemsBind).filter(i => i.done).length,
  }),
  // Con equal: el componente solo re-renderiza si total o done cambian
  equal: (a, b) => a.total === b.total && a.done === b.done,
})
```

**Cuándo usar `thread`:**
- Valores calculados a partir de otros nodos
- Listas filtradas, ordenadas o agrupadas
- Totales, conteos, promedios
- Cualquier valor que podría expresarse como `useMemo` compartido entre componentes

---

## 5. `bind` — estado con acciones

```typescript
import { bind } from '@repo/telar'

const todosBind = bind({
  key:     'todos',
  default: [] as Todo[],
  reducers: {
    add:    (state, todo: Todo)    => [...state, todo],
    remove: (state, id: string)    => state.filter(t => t.id !== id),
    toggle: (state, id: string)    => state.map(t => t.id === id ? { ...t, done: !t.done } : t),
    clear:  ()                     => [],
  },
})
```

**Uso:**

```typescript
// Lectura + escritura
const [todos, dispatch] = useBind(todosBind)
dispatch.add({ id: '1', text: 'Comprar leche', done: false })
dispatch.toggle('1')
dispatch.clear()

// Solo escritura (sin suscripción — no re-renderiza al cambiar el estado)
const dispatch = useDispatch(todosBind)
dispatch.remove('1')
```

**Cuándo usar `bind`:**
- Colecciones (listas, sets, maps)
- Estado con transiciones nombradas y explícitas
- Cuando querés que el historial de cambios sea legible (`add`, `remove`, `toggle` en lugar de setters libres)
- Formularios multi-paso con acciones definidas por paso

**Cuándo usar `knot` en lugar de `bind`:**
- Estado simple sin lógica de transición (un string, un number, un boolean)
- Cuando el setter libre es más natural que definir reducers

---

## 6. Elegir el hook correcto

```
¿Necesitás leer el estado?
  └─ Sí → ¿Es un thread?
             └─ Sí → useThread(def)
             └─ No → ¿Es un bind?
                       └─ Sí → ¿También necesitás dispatch?
                                  └─ Sí → useBind(def)        → [state, dispatch]
                                  └─ No → useKnot(def)        → [state, setter]
               └─ Es un knot → useKnot(def)                   → [state, setter]

¿Solo necesitás escribir (sin leer)?
  └─ Es un bind → useDispatch(def)                             → dispatch
  └─ Es un knot → const [, setter] = useKnot(def)  (desestructurar el setter)
```

**Tabla resumen:**

| Hook | Retorna | Re-renderiza cuando... | Caso típico |
|---|---|---|---|
| `useKnot(knot)` | `[value, setter]` | El knot cambia | Input controlado, toggle, selector |
| `useThread(thread)` | `value` | El thread cambia (sus deps cambiaron y el valor es distinto) | Lista derivada, totales, stats |
| `useBind(bind)` | `[state, dispatch]` | El bind cambia | Lista mutable con acciones |
| `useDispatch(bind)` | `dispatch` | Nunca | Botón de acción, handler de formulario |
| `useTelar(any)` | Infiere según el nodo | Igual que el hook específico | API unificada |

**Regla clave:** si un componente solo escribe (no necesita mostrar el valor), usá `useDispatch`. Cada suscripción innecesaria es un re-render innecesario.

```typescript
// ❌ Se re-renderiza cuando la lista de todos cambia, aunque solo necesita agregar
function AddTodoInput() {
  const [, dispatch] = useBind(todosBind)
  // ...
}

// ✅ No se re-renderiza nunca por cambios en todosBind
function AddTodoInput() {
  const dispatch = useDispatch(todosBind)
  // ...
}
```

---

## 7. Organización de archivos

### Estructura recomendada para un feature

```
feature/
  state/
    todos.ts          ← definiciones de knots, threads y binds
  components/
    TodoList.tsx      ← useThread(filteredTodosThread)
    TodoItem.tsx      ← useDispatch(todosBind) — solo escribe
    TodoInput.tsx     ← useDispatch(todosBind) — solo escribe
    TodoFilter.tsx    ← useKnot(filterKnot)
    TodoStats.tsx     ← useThread(statsThread)
  TodoApp.tsx         ← <TelarRoot> + layout
```

### El archivo de estado

```typescript
// state/todos.ts
import { knot, thread, bind } from '@repo/telar'

// ── Tipos ──────────────────────────────────────────────────────
export type Filter = 'all' | 'active' | 'done'
export type Todo   = { id: string; text: string; done: boolean }

// ── Nodos fuente ───────────────────────────────────────────────
export const filterKnot = knot<Filter>({ key: 'filter', default: 'all' })

export const todosBind = bind({
  key:     'todos',
  default: [] as Todo[],
  reducers: {
    add:    (state, todo: Todo)  => [...state, todo],
    remove: (state, id: string)  => state.filter(t => t.id !== id),
    toggle: (state, id: string)  => state.map(t =>
                                      t.id === id ? { ...t, done: !t.done } : t),
  },
})

// ── Nodos derivados ────────────────────────────────────────────
export const filteredTodosThread = thread({
  key: 'filteredTodos',
  get: ({ read }) => {
    const todos  = read(todosBind)
    const filter = read(filterKnot)
    if (filter === 'active') return todos.filter(t => !t.done)
    if (filter === 'done')   return todos.filter(t =>  t.done)
    return todos
  },
})

export const statsThread = thread({
  key:   'stats',
  get:   ({ read }) => {
    const todos = read(todosBind)
    return { total: todos.length, done: todos.filter(t => t.done).length }
  },
  equal: (a, b) => a.total === b.total && a.done === b.done,
})
```

### Convenciones de nombres

| Tipo | Sufijo recomendado | Ejemplo |
|---|---|---|
| `knot` | `Knot` | `filterKnot`, `searchKnot` |
| `thread` | `Thread` | `filteredTodosThread`, `statsThread` |
| `bind` | `Bind` | `todosBind`, `cartBind` |
| Factory de bind | `get` + nombre + `Bind` | `getSquareBind(id)` |

---

## 8. Patrones de performance

### Patrón 1 — Separar lectura de escritura

El principio más importante: los componentes que solo escriben no deben suscribirse al estado.

```typescript
// Lista de ítems (lee)
function ItemList() {
  const items = useThread(filteredItemsThread)
  return <ul>{items.map(i => <ItemRow key={i.id} id={i.id} />)}</ul>
}

// Fila individual (lee su propio estado + escribe)
function ItemRow({ id }: { id: string }) {
  const [item, dispatch] = useBind(getItemBind(id))
  return (
    <li>
      {item.value}
      <button onClick={() => dispatch.remove()}>×</button>
    </li>
  )
}

// Input de agregar (solo escribe)
function AddItemInput() {
  const dispatch = useDispatch(itemsBind)  // ← no re-renderiza al cambiar la lista
  const [text, setText] = useState('')
  return (
    <input
      value={text}
      onChange={e => setText(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          dispatch.add({ id: crypto.randomUUID(), value: text })
          setText('')
        }
      }}
    />
  )
}
```

### Patrón 2 — Un bind por ítem para listas grandes

Cuando tenés una lista de ítems que se editan independientemente, **no** metas todo en un bind compartido. Cada ítem debe tener su propio bind.

```typescript
// ❌ Problemático con listas grandes: cambiar un ítem notifica a todos los componentes
const itemsBind = bind({
  key: 'items',
  default: [] as Item[],
  reducers: {
    update: (state, { id, value }) => state.map(i => i.id === id ? { ...i, value } : i),
    // ...
  },
})

// ✅ Correcto: cada ítem tiene su propio nodo → cambios aislados
const itemBindCache = new Map<string, BindDef<ItemState, ItemReducers>>()

function getItemBind(id: string) {
  if (!itemBindCache.has(id)) {
    itemBindCache.set(id, bind({
      key:      `item-${id}`,
      default:  { value: '', active: false },
      reducers: {
        setValue:  (state, v: string)  => ({ ...state, value: v }),
        setActive: (state, a: boolean) => ({ ...state, active: a }),
        remove:    ()                  => ({ value: '', active: false }), // señal
      },
    }))
  }
  return itemBindCache.get(id)!
}

// Lista maestra: solo trackea IDs
const itemIdsBind = bind({
  key:     'itemIds',
  default: [] as string[],
  reducers: {
    add:    (state, id: string) => [...state, id],
    remove: (state, id: string) => state.filter(i => i !== id),
  },
})
```

Con esta arquitectura: cambiar el valor del ítem `'abc'` solo notifica al componente `ItemRow` que lee `getItemBind('abc')`. Los otros 199 ítems no se enteran.

### Patrón 3 — `equal` para objetos derivados

Cuando un thread retorna un objeto nuevo en cada evaluación, usá `equal` para evitar re-renders cuando los datos son estructuralmente iguales.

```typescript
// Sin equal: nuevo objeto en cada render → siempre re-renderiza
const statsThread = thread({
  key: 'stats',
  get: ({ read }) => ({ total: read(todosBind).length }),
})

// Con equal: mismo objeto si los datos son iguales → sin re-render innecesario
const statsThread = thread({
  key:   'stats',
  get:   ({ read }) => ({ total: read(todosBind).length }),
  equal: (a, b) => a.total === b.total,
})
```

**Regla:** si el `get` de tu thread retorna `{}`, `[]`, o cualquier objeto/array construido dentro de la función, considerá agregar `equal`.

### Patrón 4 — Threads para aislar partes del árbol

Un thread con `equal` actúa como un "escudo" entre una fuente de datos ruidosa y un componente que solo le importa una fracción de esos datos.

```typescript
// userKnot puede cambiar por muchas razones (last_seen, notifications, etc.)
const userKnot = knot({ key: 'user', default: null as User | null })

// Este thread solo cambia cuando cambia el nombre o avatar — no el resto del user
const userDisplayThread = thread({
  key:   'userDisplay',
  get:   ({ read }) => {
    const user = read(userKnot)
    return { name: user?.name ?? '', avatar: user?.avatar ?? '' }
  },
  equal: (a, b) => a.name === b.name && a.avatar === b.avatar,
})

// UserAvatar solo re-renderiza cuando cambia nombre o avatar
function UserAvatar() {
  const { name, avatar } = useThread(userDisplayThread)
  return <img src={avatar} alt={name} />
}
```

---

## 9. SSR — React Server Components

Para pasar datos del servidor al cliente sin loading state inicial:

**1. Definir la lógica de servidor en el knot:**

```typescript
// state/user.ts
import { knot } from '@repo/telar'

export const userKnot = knot({
  key:     'user',
  default: null as User | null,
  // La función server se ejecuta SOLO en el servidor
  server:  async (ctx: ServerContext) => {
    return await db.users.findOne(ctx.session.userId)
  },
  // sanitize elimina campos sensibles antes de serializar al cliente
  sanitize: (user) => user ? omit(user, ['passwordHash', 'sessionToken']) : null,
})
```

**2. Prefetch en el Server Component:**

```tsx
// app/dashboard/page.tsx (Server Component)
import { createPrefetchContext } from '@repo/telar/server'
import { userKnot }              from '@/state/user'
import { cartKnot }              from '@/state/cart'
import { DashboardClient }       from './DashboardClient'

export default async function DashboardPage() {
  const prefetch = createPrefetchContext({ session: await getSession() })

  // Los fetches pueden correr en paralelo
  await Promise.all([
    prefetch(userKnot),
    prefetch(cartKnot),
  ])

  return <DashboardClient initialValues={prefetch.flush()} />
}
```

**3. Pasar al TelarRoot:**

```tsx
// app/dashboard/DashboardClient.tsx
'use client'

import { TelarRoot } from '@repo/telar/react'

export function DashboardClient({ initialValues }) {
  return (
    <TelarRoot initialValues={initialValues}>
      <Dashboard />
    </TelarRoot>
  )
}

// En cualquier componente del árbol:
function UserGreeting() {
  const [user] = useKnot(userKnot)
  // user nunca es null aquí — llegó hidratado del servidor
  return <p>Hola, {user.name}</p>
}
```

**Flujo:**

```
Server Component
  └─ createPrefetchContext()
  └─ prefetch(userKnot) → ejecuta userKnot.server() → aplica sanitize
  └─ prefetch.flush() → { 'user': { id: 1, name: 'Ana' } }
  └─ pasa como prop a DashboardClient

Client Component (DashboardClient)
  └─ <TelarRoot initialValues={{ 'user': { id: 1, name: 'Ana' } }}>
  └─ TelarRoot precarga store.values antes del primer render
  └─ UserGreeting lee user → ya tiene el valor → sin loading state
```

---

## 10. SSR — getServerSideProps

Para apps Next.js Pages Router o frameworks con `getServerSideProps`:

```typescript
// pages/dashboard.tsx
import { createPrefetchContext } from '@repo/telar/server'
import { userKnot, cartKnot }    from '@/state'
import { TelarRoot }             from '@repo/telar/react'

export async function getServerSideProps(ctx) {
  const prefetch = createPrefetchContext({ session: ctx.req.session })

  await Promise.all([
    prefetch(userKnot),
    prefetch(cartKnot),
  ])

  return { props: { initialValues: prefetch.flush() } }
}

export default function DashboardPage({ initialValues }) {
  return (
    <TelarRoot initialValues={initialValues}>
      <Dashboard />
    </TelarRoot>
  )
}
```

**Importante:** `createPrefetchContext` crea un cache local por request. Cada llamada retorna un nuevo contexto aislado — no hay estado compartido entre requests concurrentes.

---

## 11. Stores múltiples e isolación

### Cada `<TelarRoot>` es un store independiente

```tsx
// Los mismos knots, distintos valores en cada árbol
<TelarRoot>
  <CheckoutWidget />    {/* cart, user con sus valores */}
</TelarRoot>

<TelarRoot>
  <PreviewWidget />     {/* cart, user con valores diferentes e independientes */}
</TelarRoot>
```

### Store externo para tests o microfrontends

```typescript
import { createStore } from '@repo/telar'
import { TelarRoot }   from '@repo/telar/react'

// En tests
const testStore = createStore()
testStore.values.set('user', { id: 'test-user', name: 'Test' })

render(
  <TelarRoot store={testStore}>
    <UserProfile />
  </TelarRoot>
)
```

---

## 12. Errores comunes

### Error 1 — Definir nodos dentro de componentes

```typescript
// ❌ El nodo se recrea en cada render — el store no puede mantener su estado
function MyComponent() {
  const myKnot = knot({ key: 'my', default: 0 }) // ERROR
  const [val] = useKnot(myKnot)
}

// ✅ Definir a nivel de módulo
const myKnot = knot({ key: 'my', default: 0 })
function MyComponent() {
  const [val] = useKnot(myKnot)
}
```

---

### Error 2 — Usar `useBind` cuando solo necesitás escribir

```typescript
// ❌ Se re-renderiza cada vez que todosBind cambia, aunque solo use dispatch
function AddButton() {
  const [, dispatch] = useBind(todosBind)
  return <button onClick={() => dispatch.add(newTodo)}>Agregar</button>
}

// ✅ useDispatch no registra suscripción — no re-renderiza nunca
function AddButton() {
  const dispatch = useDispatch(todosBind)
  return <button onClick={() => dispatch.add(newTodo)}>Agregar</button>
}
```

---

### Error 3 — Un bind monolítico para listas grandes con edición por ítem

```typescript
// ❌ Cambiar el nombre de cualquier producto → todos los ProductRow re-renderizan
const productsBind = bind({
  key: 'products',
  default: [] as Product[],
  reducers: {
    updateName: (state, { id, name }) => state.map(p => p.id === id ? { ...p, name } : p),
  },
})

// ✅ Cada producto tiene su propio nodo — cambios completamente aislados
function getProductBind(id: string) { /* factory con cache */ }
```

---

### Error 4 — Thread sin `equal` retornando objetos

```typescript
// ❌ Nuevo objeto en cada evaluación → siempre re-renderiza aunque los datos sean iguales
const metaThread = thread({
  key: 'meta',
  get: ({ read }) => ({ count: read(listBind).length, label: 'items' }),
})

// ✅ equal evita re-renders cuando los datos son structuralmente iguales
const metaThread = thread({
  key:   'meta',
  get:   ({ read }) => ({ count: read(listBind).length, label: 'items' }),
  equal: (a, b) => a.count === b.count,
})
```

---

### Error 5 — Keys duplicadas entre nodos

```typescript
// ❌ Dos nodos con la misma key comparten el mismo slot en el store
const userKnot  = knot({ key: 'data', default: null })
const priceKnot = knot({ key: 'data', default: 0 })    // colisión

// ✅ Keys únicas y descriptivas
const userKnot  = knot({ key: 'user',  default: null })
const priceKnot = knot({ key: 'price', default: 0 })
```

Para factories, incluí el ID en la key:

```typescript
bind({ key: `product-${id}`, ... })  // 'product-abc123'
bind({ key: `item-state-${id}`, ... })  // 'item-state-abc123'
```

---

### Error 6 — Leer un thread desde `getServerSideProps` o código de servidor

Los hooks (`useThread`, `useKnot`, etc.) son exclusivos de React. Para obtener valores en el servidor, usá `createPrefetchContext`:

```typescript
// ❌ Los hooks no funcionan fuera de componentes React
export async function getServerSideProps() {
  const value = useThread(myThread) // ERROR
}

// ✅ Usá el knot con server function + createPrefetchContext
export async function getServerSideProps(ctx) {
  const prefetch = createPrefetchContext(ctx)
  await prefetch(myKnot)  // ejecuta myKnot.server(ctx)
  return { props: { initialValues: prefetch.flush() } }
}
```
