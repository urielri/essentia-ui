'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { TelarContext } from './context'
import { createStore, hydrateStore } from '../core/store'
import type { Store } from '../core/types'
import type { MainToWorker, WorkerToMain, NodeMeta, NodeValueType, NodeConstraints } from '../worker/worker-messages'

/**
 * Nodos que el Worker puede persistir (knots y binds, no threads).
 * Solo requiere key y default — suficiente para construir NodeMeta.
 * El flag `uiCache` indica que el valor también se cachea en sessionStorage
 * para hidratación síncrona en el primer render.
 */
type PersistableNode = { key: string; default: unknown; uiCache?: boolean }

const SS_PREFIX      = 'telar:'
const SS_VERSION_KEY = 'telar:store-version'

function readUiCache(
  nodes:        readonly PersistableNode[],
  storeVersion: string | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const uiNodes = nodes.filter(n => n.uiCache)
  if (uiNodes.length === 0) return result

  // Si la versión cambió, limpiar entradas viejas y no usarlas
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
      // Validación mínima de tipo contra el default del nodo
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

type TelarRootProps = {
  children: ReactNode
  /**
   * Store externo opcional.
   * Útil para pasar un store pre-construido a un árbol React, por ejemplo
   * en tests de integración o en microfrontends con stores compartidos.
   * Si se omite, `TelarRoot` crea su propio store aislado.
   */
  store?: Store
  /**
   * Valores iniciales para hidratar el store antes del primer render.
   * Proviene de `prefetch.flush()` en entornos SSR.
   *
   * Uso con React Server Components:
   * ```tsx
   * const prefetch = createPrefetchContext()
   * await prefetch(userKnot)
   * return <TelarRoot initialValues={prefetch.flush()}><App /></TelarRoot>
   * ```
   *
   * Uso con getServerSideProps:
   * ```tsx
   * return { props: { initialValues: prefetch.flush() } }
   * // ...
   * <TelarRoot initialValues={initialValues}><App /></TelarRoot>
   * ```
   */
  initialValues?: Record<string, unknown>
  /**
   * Worker dedicado para persistir el store en IndexedDB.
   * Permite que el estado sobreviva navegaciones (MPA) y recargas de página.
   *
   * Cada instancia de Worker es independiente — dos tabs con su propio Worker
   * nunca comparten estado. Para crear el Worker usar `createTelarWorker()`.
   *
   * @example
   * import { createTelarWorker } from '@repo/telar/worker'
   *
   * const worker = createTelarWorker()
   *
   * function Root() {
   *   return (
   *     <TelarRoot worker={worker}>
   *       <App />
   *     </TelarRoot>
   *   )
   * }
   */
  worker?: Worker
  /**
   * Lista de nodos (knots y binds) que el Worker debe persistir.
   * Cuando se provee, el Worker recibe la lista blanca de keys válidas
   * y el tipo esperado de cada valor — rechaza cualquier key o tipo fuera
   * de esta lista al hidratar desde IndexedDB.
   *
   * Solo acepta `KnotDef` y `BindDef` (no `ThreadDef` — los threads son
   * derivados y no necesitan persistirse).
   *
   * @example
   * <TelarRoot worker={worker} persistedNodes={[themeKnot, noteKnot, counterBind]}>
   */
  persistedNodes?: readonly PersistableNode[]
  /**
   * Restricciones de valor por key. Se envían al Worker junto con `persistedNodes`
   * y se aplican al leer de IndexedDB, después de la validación de tipo.
   * Mitiga el impacto de XSS que logre escribir valores válidos en IndexedDB.
   *
   * @example
   * nodeConstraints={{
   *   'wd-theme':   { allowedValues: THEMES },
   *   'wd-note':    { maxLength: 10_000 },
   *   'wd-counter': { min: 0, max: 9_999 },
   * }}
   */
  nodeConstraints?: Record<string, NodeConstraints>
  /**
   * Versión del esquema del store. Si cambia respecto a la versión almacenada
   * en IndexedDB, el Worker limpia toda la base de datos antes de responder
   * el snapshot — evitando que datos de versiones anteriores contaminen
   * el esquema nuevo.
   *
   * Incrementar cuando cambien keys, tipos o estructura de los nodos persistidos.
   *
   * @example
   * <TelarRoot worker={worker} storeVersion="2" persistedNodes={[...]}>
   */
  storeVersion?: string
  /**
   * Modo de persistencia del store en IndexedDB.
   *
   * - `'session'` (default) — los datos sobreviven recargas y navegación MPA
   *   dentro del mismo tab, pero se descartan al cerrar el navegador o el tab.
   *   Implementado con un identificador de sesión en `sessionStorage`.
   *
   * - `'permanent'` — los datos persisten entre sesiones del navegador.
   *
   * @example
   * <TelarRoot worker={worker} persistence="permanent" persistedNodes={[...]}>
   */
  persistence?: 'session' | 'permanent'
}

/**
 * Proveedor del store de Telar.
 *
 * Crea un store reactivo aislado y lo hace disponible a todos los hooks
 * de Telar (`useKnot`, `useThread`, `useBind`, `useDispatch`, `useTelar`)
 * dentro del árbol React que envuelve.
 *
 * Cada `<TelarRoot>` tiene su propio store — dos instancias nunca comparten
 * estado, aunque usen los mismos nodos. Esto garantiza que no haya
 * singletons globales que filtren estado entre requests en SSR.
 *
 * El store se crea una sola vez (en el primer render) usando `useRef`,
 * por lo que `TelarRoot` nunca causa re-renders en sus hijos por sí solo.
 *
 * @example
 * // Uso básico
 * function App() {
 *   return (
 *     <TelarRoot>
 *       <MyApp />
 *     </TelarRoot>
 *   )
 * }
 *
 * @example
 * // Con hidratación SSR
 * export default function Page({ initialValues }) {
 *   return (
 *     <TelarRoot initialValues={initialValues}>
 *       <MyApp />
 *     </TelarRoot>
 *   )
 * }
 *
 * @example
 * // Con Worker para persistencia MPA
 * const worker = createTelarWorker()
 *
 * function App() {
 *   return (
 *     <TelarRoot worker={worker}>
 *       <MyApp />
 *     </TelarRoot>
 *   )
 * }
 */
export function TelarRoot({ children, store: externalStore, initialValues, worker, persistedNodes, nodeConstraints, storeVersion, persistence = 'session' }: TelarRootProps) {
  const storeRef    = useRef<Store | null>(null)
  const uiCacheKeys = useRef(
    new Set((persistedNodes ?? []).filter(n => n.uiCache).map(n => n.key))
  )

  if (storeRef.current === null) {
    const store = externalStore ?? createStore()

    // Hidratación síncrona desde sessionStorage (uiCache) — elimina el flash.
    // Se ejecuta antes del primer render, sin esperar al Worker.
    // Solo para estado de UI no sensible; los valores no están cifrados.
    if (typeof window !== 'undefined' && persistedNodes) {
      const cached = readUiCache(persistedNodes, storeVersion)
      for (const [key, value] of Object.entries(cached)) {
        store.values.set(key, value)
      }
    }

    storeRef.current = store
  }

  // Aplicar initialValues fuera del bloque de creación para cubrir el caso de
  // Next.js Streaming RSC: el server component async puede causar que TelarRoot
  // renderice primero con initialValues vacío (Suspense placeholder) y luego con
  // los datos reales. El guard !has evita sobreescribir valores que el usuario
  // ya modificó en renders posteriores.
  if (initialValues) {
    for (const [key, value] of Object.entries(initialValues)) {
      if (!storeRef.current.values.has(key)) {
        storeRef.current.values.set(key, value)
      }
    }
  }

  useEffect(() => {
    if (!worker) return
    const store = storeRef.current!

    // Recibir snapshot desde el Worker e hidratar el store local.
    // Usa addEventListener (no onmessage) para que otros listeners externos
    // puedan coexistir sobre el mismo Worker.
    const onMessage = (event: MessageEvent<WorkerToMain>) => {
      const msg = event.data
      if (msg.type === 'snapshot') {
        hydrateStore(msg.data, store)
        // Sincronizar uiCache con los valores que llegaron del Worker
        // (pueden diferir de lo que había en sessionStorage)
        for (const key of uiCacheKeys.current) {
          if (key in msg.data) {
            try { sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(msg.data[key])) } catch {}
          }
        }
      }
    }

    worker.addEventListener('message', onMessage)

    // Interceptar escrituras: persistir en Worker (→ IDB) y actualizar uiCache
    store.onWrite = (key, value) => {
      worker.postMessage({ type: 'persist', key, value } satisfies MainToWorker)
      if (uiCacheKeys.current.has(key)) {
        try { sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(value)) } catch {}
      }
    }

    // Enviar 'init' con la lista blanca de nodos antes de pedir el snapshot.
    // El Worker usará esto para validar keys y tipos al leer de IndexedDB.
    if (persistedNodes && persistedNodes.length > 0) {
      // En modo session, generar/recuperar un ID de sesión desde sessionStorage.
      // El mismo ID se usa durante toda la visita (recargas y navegación MPA
      // del mismo tab lo conservan). Al cerrar el tab/navegador, sessionStorage
      // se limpia → nuevo ID → entradas anteriores descartadas por el Worker.
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

    // Solicitar el snapshot almacenado
    worker.postMessage({ type: 'get-snapshot' } satisfies MainToWorker)

    return () => {
      store.onWrite = undefined
      worker.removeEventListener('message', onMessage)
    }
  }, [worker])

  // Sin Worker: escribir uiCache en sessionStorage y limpiar sesión huérfana
  useEffect(() => {
    if (worker) return
    // telar-session-id solo se escribe cuando hay worker en modo session.
    // Si está presente y no hay worker, la sesión anterior quedó huérfana:
    // borrar el session ID y la IDB de esa sesión.
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
    const store = storeRef.current!
    store.onWrite = (key, value) => {
      if (uiCacheKeys.current.has(key)) {
        try { sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(value)) } catch {}
      }
    }
    return () => { store.onWrite = undefined }
  }, [worker, persistence])

  return (
    <TelarContext.Provider value={storeRef.current}>
      {children}
    </TelarContext.Provider>
  )
}
