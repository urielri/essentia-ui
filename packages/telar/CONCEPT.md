# Telar — Concepto y Visión

## ¿Qué es Telar?

Telar es un manejador de estado reactivo para React basado en un **grafo de dependencias dirigido**. Cada unidad de estado es un nudo (`knot`) en ese grafo. Cuando un nudo cambia, la actualización se propaga automáticamente hacia todos los nudos y componentes que dependen de él — y solo hacia ellos.

El nombre hace referencia al **telar mapuche** (*witral*), la herramienta ancestral de la Patagonia argentina con la que se teje la trama. En un telar, cada hilo tiene una posición precisa en el grafo del tejido — cambiar un hilo afecta el patrón completo. Así funciona Telar: vos definís los nudos y los hilos, la librería los teje en un grafo reactivo.

```
Tu app usa Telar
Telar teje los knots y threads
El resultado es la trama de estado de tu aplicación
```

---

## El problema que resuelve

Las soluciones actuales presentan compromisos que Telar busca eliminar:

| Problema | Cómo ocurre hoy |
|----------|----------------|
| Re-renders globales | Context API re-renderiza todos los consumidores ante cualquier cambio |
| Boilerplate de hidratación SSR | Jotai y Zustand requieren listar manualmente los átomos a hidratar |
| Estado acoplado al módulo | Zustand crea un singleton por módulo, inseguro en SSR |
| Derivaciones dispersas | Sin estado derivado, la lógica vive en `useMemo` duplicados por componente |
| Escritura sin restricciones | Los setters libres dificultan rastrear cómo cambia el estado |

Telar resuelve esto con tres primitivas simples, un grafo reactivo, e integración nativa con React Server Components.

---

## Modelo mental: el telar y su trama

Un telar teje hilos en una red donde cada nudo tiene una posición precisa. En Telar, cada unidad de estado es un **nudo** (`knot`). Los nudos se conectan entre sí a través de dependencias. Cuando un nudo cambia, la señal viaja por los hilos hacia los nudos que dependen de él.

```
knot(price) ──────┐
                  ├──→ thread(total) ──→ <CartSummary />
knot(quantity) ───┘
knot(discount) ───────────────────────→ <CartSummary />
                                      → <DiscountBadge />
```

`<DiscountBadge />` solo se re-renderiza cuando cambia `discount`. Nunca cuando cambia `price` o `quantity`.

---

## Las tres primitivas

### `knot` — Estado base

El nudo fundamental. Almacena un valor, acepta escritura libre. Es la fuente de verdad del grafo: no depende de ningún otro nudo, solo otros dependen de él.

```typescript
const priceKnot = knot({ key: 'price', default: 0 });

const [price, setPrice] = useKnot(priceKnot);
setPrice(150);
setPrice(prev => prev * 1.1);
```

**Propiedades:**
- Sin dependencias entrantes — es un vértice fuente en el grafo
- Escritura libre mediante valor directo o función actualizadora
- Puede persistirse declarativamente (`persist: 'localStorage'`)
- Puede tener historial de cambios (`history: true`)

---

### `thread` — Estado derivado

Un hilo que corre entre nudos y deriva su valor de ellos. Siempre de solo lectura — su valor se recalcula automáticamente cuando cualquier nudo del que depende cambia. Las dependencias se descubren en tiempo de ejecución, no se declaran.

```typescript
const totalThread = thread({
  key: 'total',
  get: ({ read }) => {
    const price    = read(priceKnot);
    const quantity = read(quantityKnot);
    return price * quantity;
  },
});

const total = useThread(totalThread);
```

**Propiedades:**
- Solo lectura — nunca se escribe directamente
- Cache automático: si las dependencias no cambiaron, devuelve el valor cacheado
- Dependencias condicionales: si el `read()` es condicional, el grafo se actualiza dinámicamente
- Puede depender de otros `thread` — los hilos se encadenan

---

### `bind` — Estado controlado

Un nudo ligado a transiciones nombradas. No expone un setter libre — el estado solo puede cambiar a través de acciones predefinidas. Hace que cada transición sea explícita, rastreable y predecible.

```typescript
const cartBind = bind({
  key: 'cart',
  default: [],
  reducers: {
    add:    (state, item) => [...state, item],
    remove: (state, id)   => state.filter(i => i.id !== id),
    clear:  ()            => [],
  },
});

const [cart, dispatch] = useBind(cartBind);
dispatch.add({ id: 1, name: 'Producto', price: 100 });
dispatch.remove(1);
dispatch.clear();
```

**Propiedades:**
- Solo acepta transiciones definidas en `reducers`
- `dispatch` es completamente tipado — TypeScript conoce qué acciones existen y qué argumentos esperan
- Hace el historial de cambios legible: cada acción tiene un nombre semántico

---

## Los hooks

```typescript
useKnot(knot)     // → [value, SetterOrUpdater<T>]
useThread(thread) // → T (readonly)
useBind(bind)     // → [state, Dispatch]
```

Hook unificado que infiere el tipo automáticamente:

```typescript
useTelar(knot)    // → [value, setter]
useTelar(thread)  // → value
useTelar(bind)    // → [state, dispatch]
```

---

## Integración con React Server Components

Telar soporta inicialización desde el servidor de forma declarativa. En lugar de listar nudos manualmente para hidratar, cada Server Component declara qué nudos necesita prefetchear:

```typescript
// Definición compartida entre server y client
const userKnot = knot({
  key: 'user',
  default: null,
  server: async (ctx: ServerContext) => {
    return await db.users.findOne(ctx.session.userId);
  },
  sanitize: (user) => omit(user, ['passwordHash']),
});
```

```tsx
// Server Component
export default async function Page() {
  await prefetchKnot(userKnot);
  await prefetchKnot(cartKnot);

  return (
    <TelarRoot>
      <App />
    </TelarRoot>
  );
}

// Client Component — el knot ya tiene el valor del servidor
function UserProfile() {
  const [user] = useKnot(userKnot);
  // user nunca fue null — no hay loading state inicial
}
```

**Flujo:**
1. `prefetchKnot` ejecuta la función `server` del knot en el servidor
2. `TelarRoot` serializa los valores y los embebe en el HTML
3. El cliente hidrata el grafo con esos valores antes del primer render
4. A partir de ahí todo es reactivo en el cliente

---

## Grafo de dependencias — cómo funciona internamente

El grafo se representa con dos mapas que se apuntan mutuamente:

```
knotDeps:          quién lee a quién      → { thread_key: Set<knot_key> }
knotSubscriptions: quién depende de quién → { knot_key: Set<thread_key> }
```

Cuando un knot cambia:
1. Se marca como `dirty`
2. Se recorre `knotSubscriptions` en BFS para encontrar todos los threads afectados
3. Se invalida el cache de cada thread afectado
4. Solo se notifica a los componentes suscritos a nudos en el conjunto `dirty`

Los componentes que leen nudos no afectados **nunca se re-renderizan**.

---

## Store y aislamiento

El estado vive dentro del árbol de React, no en el módulo. Cada `TelarRoot` tiene su propio store aislado — sin leaks entre requests en SSR ni entre instancias en microfrontends:

```tsx
// App principal
<TelarRoot>
  <App />
</TelarRoot>

// Widget embebible con estado aislado
<TelarRoot store={createStore()}>
  <CheckoutWidget />
</TelarRoot>
```

---

## Diferenciadores vs alternativas

| | Recoil | Jotai | Zustand | **Telar** |
|---|---|---|---|---|
| Modelo | Grafo atómico | Grafo atómico | Store plana | Grafo de nudos |
| Mantenimiento | Abandonado | Activo | Activo | Activo |
| Hidratación SSR | Manual | Manual (`useHydrateAtoms`) | Manual | Declarativa (`prefetchKnot`) |
| Store en módulo | No | No | Sí (singleton) | No |
| Reducers nativos | No | No | Sí (en store) | Sí (en cada `bind`) |
| Estado derivado | Selectores | Átomos derivados | `useMemo` manual | `thread` |
| Integración RSC | No | No | No | Sí |
| Identidad cultural | — | Jotai = átomo en japonés | — | Telar mapuche argentino |

---

## Visión — Roadmap

### V1
- `knot` — estado base con setter libre
- `thread` — estado derivado con grafo de dependencias dinámico
- `bind` — estado con reducers tipados
- `TelarRoot` — store aislado por árbol React
- `prefetchKnot` — inicialización desde Server Components
- `useKnot` / `useThread` / `useBind` / `useTelar`

### V2
- **Validación con schema** — integración con Zod para validar el valor de un knot en escritura
- **Persistencia declarativa** — `persist: 'localStorage' | 'sessionStorage' | CustomAdapter`
- **Historial y undo/redo** — `history: true` habilita `useKnotHistory()`
- **Thread bidireccional** — `thread` con `write` para sincronización bidireccional

### V3
- **DevTools** — visualización del grafo en tiempo real, historial de cambios, time-travel
- **Threads async avanzados** — manejo de race conditions, cancelación, retry
- **Knot effects** — hooks de ciclo de vida por knot
- **WASM opt-in** — cómputo pesado en `thread` delegado a WebAssembly

---

## Oportunidades futuras

**Visualización del grafo**
Un panel de DevTools que muestre el grafo de nudos en tiempo real: qué knots existen, cómo están conectados, qué cambió y qué se propagó.

**Telar para React Native**
La arquitectura de nudos no tiene dependencia de DOM. Con los adapters correctos, Telar podría funcionar en React Native sin cambios en la API pública.

**Sincronización entre tabs**
Un adapter de persistencia que use `BroadcastChannel` para sincronizar knots entre múltiples tabs automáticamente.

**Knots live**
Un knot que mantiene su valor sincronizado con el servidor en tiempo real via WebSockets o SSE:

```typescript
const stockKnot = knot({
  key: 'stock',
  default: 0,
  live: (set) => {
    const ws = new WebSocket('/api/stock');
    ws.onmessage = (e) => set(JSON.parse(e.data).price);
    return () => ws.close();
  },
});
```

**Isomorfismo completo**
Que un `thread` pueda correr en el servidor para pre-computar estado derivado pesado y enviarlo al cliente ya calculado, sin ejecutar la función de derivación en el browser.
