'use client'

import { useRef, type ReactNode } from 'react'
import { TelarContext } from './context'
import { createStore } from '../core/store'
import type { Store } from '../core/types'

type TelarRootProps = {
  children: ReactNode
  /** Store externo opcional — útil para múltiples instancias aisladas */
  store?: Store
}

export function TelarRoot({ children, store: externalStore }: TelarRootProps) {
  const storeRef = useRef<Store | null>(null)

  if (storeRef.current === null) {
    storeRef.current = externalStore ?? createStore()
  }

  return (
    <TelarContext.Provider value={storeRef.current}>
      {children}
    </TelarContext.Provider>
  )
}
