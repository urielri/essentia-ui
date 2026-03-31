# Telar

Manejador de estado reactivo para React basado en un grafo de dependencias dirigido.

Cada unidad de estado es un **nudo** (`knot`) en ese grafo. Cuando un nudo cambia, la actualización se propaga automáticamente hacia todos los nudos y componentes que dependen de él — y solo hacia ellos.

---

## Instalación

```bash
# En tu workspace
"@repo/telar": "*"
```

---

## Inicio rápido

```tsx
// 1. Definí los nodos (fuera de los componentes, a nivel de módulo)
import { knot, thread } from '@repo/telar'

const countKnot = knot({ key: 'count', default: 0 })

const doubleThread = thread({
  key: 'double',
  get: ({ read }) => read(countKnot) * 2,
})

// 2. Envolvé tu app con TelarRootProvider
import { TelarRootProvider } from '@repo/telar/react'

function App() {
  return (
    <TelarRootProvider>
      <Counter />
      <Display />
    </TelarRootProvider>
  )
}

// 3. Usá los hooks en tus componentes
import { useKnot, useThread } from '@repo/telar/react'

function Counter() {
  const [count, setCount] = useKnot(countKnot)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

function Display() {
  const double = useThread(doubleThread)
  return <p>El doble es: {double}</p>
}
```

---

## Las tres primitivas

### `knot` — Estado base

El nudo fundamental del grafo. Almacena un valor y permite escritura libre.

```typescript
import { knot } from '@repo/telar'

const userKnot = knot({
  key: 'user',    // identificador único en el store
  default: null,  // valor cuando nunca fue escrito
})

const filterKnot = knot<'all' | 'active' | 'completed'>({
  key: 'filter',
  default: 'all',
})
```

**Cuándo usarlo:**
- Estado que se escribe directamente desde la UI (input, toggle, selección)
- Valores que no dependen de ningún otro estado

---

### `thread` — Estado derivado

Un nudo de solo lectura cuyo valor se calcula a partir de otros nudos.
Se recalcula automáticamente cuando sus dependencias cambian.
Las dependencias se descubren en tiempo de ejecución — no se declaran.

```typescript
import { thread } from '@repo/telar'

const filteredTodosThread = thread({
  key: 'filteredTodos',
  get: ({ read }) => {
    const todos  = read(todosKnot)   // dependencia registrada automáticamente
    const filter = read(filterKnot)  // idem
    if (filter === 'active')    return todos.filter(t => !t.completed)
    if (filter === 'completed') return todos.filter(t =>  t.completed)
    return todos
  },
})

// Los threads pueden depender de otros threads
const statsThread = thread({
  key: 'stats',
  get: ({ read }) => {
    const todos = read(todosKnot)
    return {
      total:     todos.length,
      completed: todos.filter(t => t.completed).length,
      active:    todos.filter(t => !t.completed).length,
    }
  },
})
```

**Cuándo usarlo:**
- Valores calculados a partir de otro estado (listas filtradas, totales, formateo)
- Lógica que hoy viviría en `useMemo` duplicada en múltiples componentes
- Estado que nunca se escribe directamente

---

### `bind` — Estado con reducers

Un nudo ligado a transiciones nombradas. Solo puede modificarse a través
de acciones predefinidas — no tiene setter libre.

```typescript
import { bind } from '@repo/telar'

const todosBind = bind({
  key: 'todos',
  default: [] as Todo[],
  reducers: {
    add:    (state, todo: Todo)  => [...state, todo],
    toggle: (state, id: string)  => state.map(t =>
                                      t.id === id ? { ...t, completed: !t.completed } : t),
    remove: (state, id: string)  => state.filter(t => t.id !== id),
    clear:  ()                   => [],
  },
})
```

**Cuándo usarlo:**
- Estado con múltiples formas de ser modificado
- Cuando querés que cada cambio tenga un nombre semántico
- Flujos tipo Redux/useReducer pero sin boilerplate

---

## Hooks

### `useKnot(def)` → `[value, setter]`

Lee y escribe un knot. El setter acepta valor directo o función actualizadora.

```typescript
const [filter, setFilter] = useKnot(filterKnot)

setFilter('active')
setFilter(prev => prev === 'all' ? 'active' : 'all')
```

**Se re-renderiza cuando:** el valor del knot cambia.

---

### `useThread(def)` → `value`

Lee un thread derivado. Solo lectura — no expone setter.

```typescript
const filteredTodos = useThread(filteredTodosThread)
const { total, active, completed } = useThread(statsThread)
```

**Se re-renderiza cuando:** alguna dependencia del thread cambia y el valor recalculado difiere.

---

### `useBind(def)` → `[value, dispatch]`

Lee el estado de un bind y recibe un dispatch con todas sus acciones tipadas.

```typescript
const [todos, dispatch] = useBind(todosBind)

dispatch.add({ id: '1', text: 'Nueva tarea', completed: false })
dispatch.toggle('1')
dispatch.remove('1')
dispatch.clear()
```

**Se re-renderiza cuando:** el estado del bind cambia.

---

### `useDispatch(def)` → `dispatch`

Retorna solo el dispatch de un bind, **sin suscribirse al valor**.
El componente nunca se re-renderiza cuando el estado cambia.

```typescript
function AddButton() {
  const dispatch = useDispatch(todosBind)
  return <button onClick={() => dispatch.add(newTodo)}>Agregar</button>
}
```

**Usar cuando:** el componente solo necesita disparar acciones, no leer el estado.

---

### `useTelar(def)` → inferido

Hook unificado. Infiere el tipo de retorno según el tipo de nodo.

```typescript
useTelar(knot)    // → [value, setter]
useTelar(thread)  // → value
useTelar(bind)    // → [value, dispatch]
```

---

## Tabla de selección de hooks

| Necesito... | Hook |
|---|---|
| Leer y escribir estado simple | `useKnot` |
| Solo leer estado derivado | `useThread` |
| Leer estado + acciones nombradas | `useBind` |
| Solo disparar acciones (sin leer) | `useDispatch` |
| API unificada con inferencia automática | `useTelar` |

---

## Aislamiento con `TelarRootProvider`

Cada `<TelarRootProvider>` crea su propio store. Dos árboles nunca comparten estado
aunque usen los mismos nodos. Esto es fundamental para SSR: no hay singletons
globales que filtren estado entre requests.

```tsx
<TelarRootProvider>
  <AppA />   {/* store A */}
</TelarRootProvider>

<TelarRootProvider>
  <AppB />   {/* store B — completamente independiente */}
</TelarRootProvider>
```

---

## Integración con el servidor

### React Server Components (Next.js App Router)

```typescript
// state/user.ts — definición compartida
import { knot } from '@repo/telar'
import type { ServerKnotDef } from '@repo/telar/server'

export const userKnot: ServerKnotDef<User | null> = {
  ...knot({ key: 'user', default: null }),
  server:   async (ctx) => await db.users.findOne(ctx.userId),
  sanitize: (user) => ({ ...user, passwordHash: undefined }),
}
```

```tsx
// app/page.tsx — Server Component
import { Suspense }  from 'react'
import { TelarRoot } from '@repo/telar/react-server'
import { userKnot }  from '../state/user'

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TelarRoot prefetchNodes={[userKnot]}>
        <App />
      </TelarRoot>
    </Suspense>
  )
}

// components/UserProfile.tsx — Client Component
function UserProfile() {
  const [user] = useKnot(userKnot)
  // user nunca fue null — sin loading state inicial
}
```

### SSR tradicional con `getServerSideProps`

```typescript
import { createPrefetchContext } from '@repo/telar/server'
import { TelarRootProvider }     from '@repo/telar/react'

export async function getServerSideProps(ctx) {
  const prefetch = createPrefetchContext(ctx)

  await prefetch(userKnot)
  await prefetch(cartKnot)

  return { props: { initialValues: prefetch.flush() } }
}

export default function Page({ initialValues }) {
  return (
    <TelarRootProvider initialValues={initialValues}>
      <App />
    </TelarRootProvider>
  )
}
```

---

## Casos de uso

### Filtros y búsqueda

```typescript
const productsKnot = knot({ key: 'products', default: [] as Product[] })
const searchKnot   = knot({ key: 'search',   default: '' })
const categoryKnot = knot({ key: 'category', default: 'all' })

const filteredProductsThread = thread({
  key: 'filteredProducts',
  get: ({ read }) => {
    const products = read(productsKnot)
    const search   = read(searchKnot).toLowerCase()
    const category = read(categoryKnot)

    return products
      .filter(p => category === 'all' || p.category === category)
      .filter(p => p.name.toLowerCase().includes(search))
  },
})
```

### Carrito de compras

```typescript
const cartBind = bind({
  key: 'cart',
  default: [] as CartItem[],
  reducers: {
    add:       (state, product: Product) => [...state, { ...product, qty: 1 }],
    increment: (state, id: string)       => state.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i),
    decrement: (state, id: string)       => state.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
                                                 .filter(i => i.qty > 0),
    clear:     ()                        => [],
  },
})

const cartTotalThread = thread({
  key: 'cartTotal',
  get: ({ read }) => read(cartBind).reduce((sum, i) => sum + i.price * i.qty, 0),
})
```

### Formulario multi-step

```typescript
const stepKnot = knot<1 | 2 | 3>({ key: 'step', default: 1 })

const formBind = bind({
  key: 'form',
  default: { name: '', email: '', plan: '' },
  reducers: {
    setName:  (s, name: string)  => ({ ...s, name }),
    setEmail: (s, email: string) => ({ ...s, email }),
    setPlan:  (s, plan: string)  => ({ ...s, plan }),
    reset:    ()                 => ({ name: '', email: '', plan: '' }),
  },
})

const isStepValidThread = thread({
  key: 'isStepValid',
  get: ({ read }) => {
    const step = read(stepKnot)
    const form = read(formBind)
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) return /\S+@\S+/.test(form.email)
    return form.plan !== ''
  },
})
```

---

## Persistencia MPA con Worker

Para apps multi-página (MPA) que necesitan sobrevivir navegaciones completas, Telar ofrece persistencia vía Web Worker + IndexedDB. `TelarPersistence` es un Client Component que conecta el Worker, lee nodos `uiCache` síncronamente desde `sessionStorage` en el render (eliminando el flash de defaults), y recibe el snapshot completo del Worker al montar.

```tsx
import { createTelarWorker }                    from '@repo/telar/worker'
import { TelarRootProvider, TelarPersistence }  from '@repo/telar/react'

const worker = createTelarWorker()

function App() {
  return (
    <TelarRootProvider>
      <TelarPersistence worker={worker} persistedNodes={[themeKnot, cartBind]}>
        <Router />
      </TelarPersistence>
    </TelarRootProvider>
  )
}
```

Ver [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) sección 13 para el setup completo con `nodeConstraints`, `storeVersion` y el patrón de tema sin flash en SSR.

---

## Documentación adicional

- [CONCEPT.md](./CONCEPT.md) — Visión, diferenciadores y roadmap
- [CORE.md](./CORE.md) — Documentación técnica detallada del motor interno
