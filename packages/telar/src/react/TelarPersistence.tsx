'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { useTelarStore } from './context'
import { hydrateStore } from '../core/store'
import type { MainToWorker, WorkerToMain, NodeMeta, NodeValueType, NodeConstraints } from '../worker/worker-messages'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PersistableNode = { key: string; default: unknown; uiCache?: boolean }

// ─── sessionStorage helpers ───────────────────────────────────────────────────

const SS_PREFIX      = 'telar:'
const SS_VERSION_KEY = 'telar:store-version'

function readUiCache(
  nodes:        readonly PersistableNode[],
  storeVersion: string | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const uiNodes = nodes.filter(n => n.uiCache)
  if (uiNodes.length === 0) return result

  const storedVersion = sessionStorage.getItem(SS_VERSION_KEY)
  if (storeVersion !== undefined && storedVersion !== storeVersion) {
    for (const n of uiNodes) sessionStorage.removeItem(SS_PREFIX + n.key)
    sessionStorage.setItem(SS_VERSION_KEY, storeVersion)
    return result
  }

  for (const node of uiNodes) {
    const raw = sessionStorage.getItem(SS_PREFIX + node.key)
    if (raw === null) continue
    try {
      const parsed = JSON.parse(raw)
      const expectedType = node.default === null ? 'null'
        : Array.isArray(node.default)             ? 'array'
        : typeof node.default
      const parsedType   = parsed === null        ? 'null'
        : Array.isArray(parsed)                   ? 'array'
        : typeof parsed
      if (parsedType === expectedType) result[node.key] = parsed
    } catch { /* JSON inválido — descartar */ }
  }
  return result
}

function inferValueType(value: unknown): NodeValueType {
  if (value === null)        return 'null'
  if (Array.isArray(value))  return 'array'
  return typeof value as NodeValueType
}

function buildNodeMeta(node: PersistableNode, constraints?: NodeConstraints): NodeMeta {
  return {
    key:         node.key,
    valueType:   inferValueType(node.default),
    constraints,
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

type TelarPersistenceProps = {
  children:          ReactNode
  /**
   * Worker dedicado para persistir el store en IndexedDB.
   * Usar `createTelarWorker()` para instanciarlo.
   *
   * @example
   * import { createTelarWorker } from '@repo/telar/worker'
   * const worker = createTelarWorker()
   *
   * <TelarPersistence worker={worker} persistedNodes={[themeKnot]}>
   *   <App />
   * </TelarPersistence>
   */
  worker?:           Worker
  /**
   * Lista de nodos que el Worker debe persistir y/o cachear en sessionStorage.
   * Los nodos con `uiCache: true` se hidratan síncronamente antes del primer
   * render de los hijos — elimina el flash de defaults en navegación MPA.
   */
  persistedNodes?:   readonly PersistableNode[]
  /**
   * Restricciones de valor por key. Se envían al Worker junto con `persistedNodes`
   * y se aplican al leer de IndexedDB.
   *
   * @example
   * nodeConstraints={{ 'theme': { allowedValues: ['dark', 'soft'] } }}
   */
  nodeConstraints?:  Record<string, NodeConstraints>
  /**
   * Versión del esquema. Si cambia, el Worker limpia IndexedDB y el uiCache
   * de sessionStorage se descarta — evita contaminación de versiones anteriores.
   */
  storeVersion?:     string
  /**
   * Modo de persistencia.
   * - `'session'` (default) — datos sobreviven recargas del mismo tab.
   * - `'permanent'` — datos persisten entre sesiones del navegador.
   */
  persistence?:      'session' | 'permanent'
}

/**
 * Conecta el store del árbol con un Worker de persistencia IndexedDB y/o
 * habilita el caché rápido en sessionStorage (`uiCache`).
 *
 * Debe colocarse dentro de `<TelarRoot>` o `<TelarRootProvider>` y envolver
 * a los componentes que consumen el store. El orden importa: `TelarPersistence`
 * lee el uiCache síncronamente en su render, antes de que sus hijos ejecuten
 * `useSyncExternalStore` — esto garantiza que el store ya tenga los valores
 * correctos cuando los componentes hijos renderizan por primera vez.
 *
 * @example
 * // SSR + persistencia Worker
 * <TelarRoot prefetchNodes={[profileKnot]}>
 *   <TelarPersistence worker={worker} persistedNodes={[themeKnot]} storeVersion="2">
 *     <App />
 *   </TelarPersistence>
 * </TelarRoot>
 *
 * @example
 * // Solo uiCache, sin Worker
 * <TelarRootProvider>
 *   <TelarPersistence persistedNodes={[themeKnot]}>
 *     <App />
 *   </TelarPersistence>
 * </TelarRootProvider>
 */
export function TelarPersistence({
  children,
  worker,
  persistedNodes,
  nodeConstraints,
  storeVersion,
  persistence = 'session',
}: TelarPersistenceProps) {
  const store = useTelarStore()

  // uiCache READ — síncrono en el render body, antes de que los hijos rendericen.
  // Escribe directamente en store.values (sin notificar) para que useSyncExternalStore
  // en los hijos recoja los valores correctos en su primer snapshot.
  const uiApplied = useRef(false)
  if (!uiApplied.current && typeof window !== 'undefined' && persistedNodes) {
    const cached = readUiCache(persistedNodes, storeVersion)
    for (const [key, value] of Object.entries(cached)) {
      if (!store.values.has(key)) store.values.set(key, value)
    }
    uiApplied.current = true
  }

  const uiCacheKeys = useRef(
    new Set((persistedNodes ?? []).filter(n => n.uiCache).map(n => n.key))
  )

  // Worker: init + snapshot + onWrite
  useEffect(() => {
    if (!worker) return

    const onMessage = (event: MessageEvent<WorkerToMain>) => {
      const msg = event.data
      if (msg.type === 'snapshot') {
        hydrateStore(msg.data, store)
        for (const key of uiCacheKeys.current) {
          if (key in msg.data) {
            try { sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(msg.data[key])) } catch {}
          }
        }
      }
    }

    worker.addEventListener('message', onMessage)

    store.onWrite = (key, value) => {
      worker.postMessage({ type: 'persist', key, value } satisfies MainToWorker)
      if (uiCacheKeys.current.has(key)) {
        try { sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(value)) } catch {}
      }
    }

    if (persistedNodes && persistedNodes.length > 0) {
      let resolvedSessionId: string | undefined
      if (persistence === 'session') {
        const stored = sessionStorage.getItem('telar-session-id')
        resolvedSessionId = stored ?? crypto.randomUUID()
        if (!stored) sessionStorage.setItem('telar-session-id', resolvedSessionId)
      }

      worker.postMessage({
        type:        'init',
        nodes:       persistedNodes.map(n => buildNodeMeta(n, nodeConstraints?.[n.key])),
        version:     storeVersion,
        persistence,
        sessionId:   resolvedSessionId,
      } satisfies MainToWorker)
    }

    worker.postMessage({ type: 'get-snapshot' } satisfies MainToWorker)

    return () => {
      store.onWrite = undefined
      worker.removeEventListener('message', onMessage)
    }
  }, [worker])

  // Sin Worker: orphaned session cleanup + uiCache writes
  useEffect(() => {
    if (worker) return

    if (persistence === 'session') {
      try {
        const orphanedSession = sessionStorage.getItem('telar-session-id')
        if (orphanedSession) {
          sessionStorage.removeItem('telar-session-id')
          indexedDB.deleteDatabase('telar-store')
          indexedDB.deleteDatabase('telar-keystore')
        }
      } catch {}
    }

    if (uiCacheKeys.current.size === 0) return

    store.onWrite = (key, value) => {
      if (uiCacheKeys.current.has(key)) {
        try { sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(value)) } catch {}
      }
    }

    return () => { store.onWrite = undefined }
  }, [worker, persistence])

  return <>{children}</>
}
