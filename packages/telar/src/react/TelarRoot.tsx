'use client'

import { useRef, type ReactNode } from 'react'
import { TelarContext } from './context'
import { createStore } from '../core/store'
import type { Store } from '../core/types'

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
 */
export function TelarRoot({ children, store: externalStore, initialValues }: TelarRootProps) {
  const storeRef = useRef<Store | null>(null)

  if (storeRef.current === null) {
    const store = externalStore ?? createStore()
    if (initialValues) {
      for (const [key, value] of Object.entries(initialValues)) {
        store.values.set(key, value)
      }
    }
    storeRef.current = store
  }

  return (
    <TelarContext.Provider value={storeRef.current}>
      {children}
    </TelarContext.Provider>
  )
}
