import type { Store, AnyNode, SetterOrUpdater, ThreadDef } from './types'
import { getDirtyNodes, rebuildGraphEdges } from './graph'

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createStore(): Store {
  return {
    values: new Map(),
    epochs: new Map(),
    graph: {
      nodeDeps: new Map(),
      nodeSubscriptions: new Map(),
    },
    listeners: new Map(),
    cache: new Map(),
    dirty: new Set(),
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getNodeValue<T>(node: AnyNode<T>, store: Store): T {
  if (node._brand === 'thread') {
    return evaluateThread(node as ThreadDef<T>, store)
  }

  return store.values.has(node.key)
    ? (store.values.get(node.key) as T)
    : node.default
}

/**
 * Evalúa un thread con tracking de dependencias.
 *
 * Flujo sin gate:
 * 1. Si el thread NO está en `store.dirty` y tiene cache → retorna cache.
 * 2. Si está dirty → re-evalúa, captura depEpochs, aplica `equal`, limpia dirty.
 * 3. Si el valor nuevo es igual al previo según `equal` → preserva referencia vieja.
 * 4. Si el valor cambió → incrementa el epoch del thread para que deps downstream
 *    detecten el cambio sin necesidad de re-evaluarse ellos mismos.
 *
 * Flujo con gate:
 * 1. Evalúa `gate` con tracking → registra deps del gate en discoveredDeps.
 * 2. Si gate retorna false → congela el valor cacheado (o `node.default` si no
 *    hay cache). Solo las deps del gate quedan activas en el grafo — cambios en
 *    los nodos de `get` son ignorados hasta que el gate se abra.
 * 3. Si gate retorna true → evalúa `get` normalmente acumulando sus deps
 *    junto a las del gate.
 */
function evaluateThread<T>(node: ThreadDef<T>, store: Store): T {
  // Fast path: cache válido
  if (!store.dirty.has(node.key) && store.cache.has(node.key)) {
    return store.cache.get(node.key)!.value as T
  }

  const prevEntry      = store.cache.get(node.key)
  const discoveredDeps = new Set<string>()

  const trackingRead = <U>(dep: AnyNode<U>): U => {
    discoveredDeps.add(dep.key)
    return getNodeValue(dep, store)
  }

  // ── gate ────────────────────────────────────────────────────────────────────
  if (node.gate !== undefined) {
    const open = node.gate({ read: trackingRead })  // acumula deps del gate

    if (!open) {
      // Gate cerrado: congelar valor previo sin re-evaluar get.
      // discoveredDeps solo tiene deps del gate → el grafo las preserva,
      // ignorando las deps de get hasta que el gate se abra.
      const frozenValue = prevEntry !== undefined
        ? (prevEntry.value as T)
        : (node.default as T)

      const depEpochs = new Map<string, number>()
      for (const depKey of discoveredDeps) {
        const epoch = store.epochs.get(depKey)
        if (epoch !== undefined) depEpochs.set(depKey, epoch)
      }

      store.dirty.delete(node.key)
      rebuildGraphEdges(store.graph, node.key, discoveredDeps)
      store.cache.set(node.key, { value: frozenValue, depEpochs })
      return frozenValue
    }
    // Gate abierto: discoveredDeps ya tiene las deps del gate.
    // get acumulará las suyas vía el mismo trackingRead.
  }
  // ────────────────────────────────────────────────────────────────────────────

  const newValue = node.get({ read: trackingRead })

  // Si `equal` retorna true, preservamos la referencia anterior.
  // Esto garantiza que useSyncExternalStore reciba la misma referencia
  // y no dispare un re-render innecesario.
  const finalValue: T =
    prevEntry !== undefined &&
    node.equal !== undefined &&
    node.equal(prevEntry.value as T, newValue)
      ? (prevEntry.value as T)
      : newValue

  // Captura epochs de deps directas (solo knots/binds tienen epoch propio)
  const depEpochs = new Map<string, number>()
  for (const depKey of discoveredDeps) {
    const epoch = store.epochs.get(depKey)
    if (epoch !== undefined) depEpochs.set(depKey, epoch)
  }

  // Incrementa el epoch del thread solo si el valor cambió.
  // Esto permite que threads downstream detecten que este thread no varió
  // sin necesidad de re-evaluarlo.
  if (prevEntry === undefined || !Object.is(prevEntry.value, finalValue)) {
    store.epochs.set(node.key, (store.epochs.get(node.key) ?? 0) + 1)
  }

  store.dirty.delete(node.key)
  rebuildGraphEdges(store.graph, node.key, discoveredDeps)
  store.cache.set(node.key, { value: finalValue, depEpochs })

  return finalValue
}

/**
 * Cache de defaults para threads. Keyed por la definición del nodo (referencia
 * de objeto) para garantizar estabilidad referencial entre llamadas.
 * Necesario porque React exige que getServerSnapshot retorne la misma
 * referencia si los datos no cambiaron — de lo contrario entra en loop.
 */
const defaultCache = new WeakMap<object, unknown>()

/**
 * Retorna el valor por defecto de un nodo sin acceder al store.
 * Usado como getServerSnapshot en useSyncExternalStore.
 *
 * Para threads: el resultado se cachea en defaultCache para que React
 * reciba la misma referencia en llamadas sucesivas (requisito de hidratación).
 */
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

// ─── Write ────────────────────────────────────────────────────────────────────

export function setNodeValue<T>(
  key: string,
  next: SetterOrUpdater<T>,
  store: Store,
  defaultValue: T,
): void {
  const current = store.values.has(key)
    ? (store.values.get(key) as T)
    : defaultValue

  const newValue =
    typeof next === 'function'
      ? (next as (prev: T) => T)(current)
      : next

  if (Object.is(current, newValue)) return

  store.values.set(key, newValue)
  store.onWrite?.(key, newValue)

  // Incrementa el epoch del nodo escrito
  store.epochs.set(key, (store.epochs.get(key) ?? 0) + 1)

  // Marca como dirty todos los threads afectados (BFS).
  // No borramos el cache — se preserva el valor previo para la comparación
  // con `equal` durante la próxima evaluación.
  const dirtyThreads = getDirtyNodes(key, store.graph)
  for (const dirtyKey of dirtyThreads) {
    store.dirty.add(dirtyKey)
  }

  // Notifica componentes suscritos al nodo cambiado y a los afectados
  notifyKey(key, store)
  for (const dirtyKey of dirtyThreads) {
    notifyKey(dirtyKey, store)
  }
}

// ─── Subscribe ───────────────────────────────────────────────────────────────

/**
 * Suscribe un callback al nodo identificado por `key`.
 * Retorna una función de cleanup que elimina el listener del store.
 */
export function subscribeToNode(
  key: string,
  listener: () => void,
  store: Store,
): () => void {
  if (!store.listeners.has(key)) {
    store.listeners.set(key, new Set())
  }
  store.listeners.get(key)!.add(listener)

  return () => {
    store.listeners.get(key)?.delete(listener)
  }
}

// ─── Hydration ───────────────────────────────────────────────────────────────

/**
 * Hidrata el store con un snapshot clave/valor y notifica a los componentes
 * suscritos a cada nodo. Usado por TelarRoot al recibir el snapshot del Worker.
 */
export function hydrateStore(snapshot: Record<string, unknown>, store: Store): void {
  for (const [key, value] of Object.entries(snapshot)) {
    // Reutilizamos setNodeValue pasando el valor directo.
    // defaultValue no se usa cuando next no es función.
    setNodeValue(key, value as never, store, undefined as never)
  }
}

// ─── Internal ────────────────────────────────────────────────────────────────

function notifyKey(key: string, store: Store): void {
  const listeners = store.listeners.get(key)
  if (!listeners?.size) return
  for (const listener of listeners) {
    listener()
  }
}
