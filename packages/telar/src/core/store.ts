import type { Store, AnyNode, SetterOrUpdater, ThreadDef } from './types'
import { getDirtyNodes, rebuildGraphEdges } from './graph'

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createStore(): Store {
  return {
    values: new Map(),
    graph: {
      nodeDeps: new Map(),
      nodeSubscriptions: new Map(),
    },
    listeners: new Map(),
    cache: new Map(),
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
 * Si el cache es válido (no fue invalidado), retorna el valor cacheado.
 * Si no, re-evalúa, reconstruye las aristas del grafo y cachea el resultado.
 */
function evaluateThread<T>(node: ThreadDef<T>, store: Store): T {
  if (store.cache.has(node.key)) {
    return store.cache.get(node.key) as T
  }

  const discoveredDeps = new Set<string>()

  const trackingRead = <U>(dep: AnyNode<U>): U => {
    discoveredDeps.add(dep.key)
    return getNodeValue(dep, store)
  }

  const value = node.get({ read: trackingRead })

  rebuildGraphEdges(store.graph, node.key, discoveredDeps)
  store.cache.set(node.key, value)

  return value
}

/**
 * Retorna el valor por defecto de un nodo sin acceder al store.
 * Usado como getServerSnapshot en useSyncExternalStore.
 */
export function getDefaultValue<T>(node: AnyNode<T>): T {
  if (node._brand === 'thread') {
    const read = <U>(dep: AnyNode<U>): U => getDefaultValue(dep)
    return node.get({ read })
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

  // Invalida el cache de todos los threads afectados (BFS)
  const dirty = getDirtyNodes(key, store.graph)
  for (const dirtyKey of dirty) {
    store.cache.delete(dirtyKey)
  }

  // Notifica componentes suscritos al nodo cambiado y a los afectados
  notifyKey(key, store)
  for (const dirtyKey of dirty) {
    notifyKey(dirtyKey, store)
  }
}

// ─── Subscribe ───────────────────────────────────────────────────────────────

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

// ─── Internal ────────────────────────────────────────────────────────────────

function notifyKey(key: string, store: Store): void {
  const listeners = store.listeners.get(key)
  if (!listeners?.size) return
  for (const listener of listeners) {
    listener()
  }
}
