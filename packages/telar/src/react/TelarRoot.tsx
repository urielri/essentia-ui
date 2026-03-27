'use client'

import { useRef, type ReactNode } from 'react'
import { TelarContext } from './context'
import { createStore } from '../core/store'
import type { Store } from '../core/types'

type TelarRootProps = {
  children: ReactNode
  /** Store externo opcional — útil para múltiples instancias aisladas */
  store?: Store
  /**
   * Valores iniciales para hidratar el store antes del primer render.
   * Proviene de prefetch.flush() en entornos SSR tradicionales
   * (getServerSideProps, loaders, etc.).
   */
  initialValues?: Record<string, unknown>
}

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
