'use client'

import { useRef, useContext, type ReactNode } from 'react'
import { TelarContext } from './context'
import { createStore } from '../core/store'
import type { Store } from '../core/types'

type TelarRootProviderProps = {
  children:        ReactNode
  /**
   * Valores iniciales para hidratar el store.
   * En entornos RSC llegan desde `TelarRoot` (Server Component) ya resueltos.
   * En Pages Router / getServerSideProps se pasan directamente desde el servidor.
   *
   * El guard `!has` evita sobreescribir valores que el usuario ya modificó en
   * renders posteriores (compat con streaming RSC legacy y Suspense).
   */
  initialValues?:  Record<string, unknown>
  /**
   * Store externo opcional. Útil para tests de integración o microfrontends
   * con stores compartidos. Si se omite, se crea un store aislado.
   */
  store?:          Store
}

/**
 * Proveedor del store de Telar para entornos sin React Server Components
 * (Pages Router, Vite, CRA) o como capa interna de `<TelarRoot>`.
 *
 * Crea el store una sola vez y lo hace disponible a todos los hooks de Telar
 * dentro del árbol. Para agregar persistencia Worker, envolver los hijos con
 * `<TelarPersistence>`.
 *
 * @example
 * // Pages Router / getServerSideProps
 * export default function Page({ initialValues }) {
 *   return (
 *     <TelarRootProvider initialValues={initialValues}>
 *       <App />
 *     </TelarRootProvider>
 *   )
 * }
 */
export function TelarRootProvider({
  children,
  initialValues,
  store: externalStore,
}: TelarRootProviderProps) {
  const existingStore = useContext(TelarContext)
  const storeRef      = useRef<Store | null>(null)

  if (storeRef.current === null && !existingStore) {
    storeRef.current = externalStore ?? createStore()
  }

  const store = existingStore ?? storeRef.current!

  if (initialValues) {
    for (const [key, value] of Object.entries(initialValues)) {
      if (!store.values.has(key)) {
        store.values.set(key, value)
      }
    }
  }

  // Si ya existe un store en el árbol (e.g. root layout provee un store global),
  // solo hidratar con initialValues y pasar children sin crear un nuevo contexto.
  if (existingStore) {
    return <>{children}</>
  }

  return (
    <TelarContext.Provider value={store}>
      {children}
    </TelarContext.Provider>
  )
}
