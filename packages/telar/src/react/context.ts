import { createContext, useContext } from 'react'
import type { Store } from '../core/types'

export const TelarContext = createContext<Store | null>(null)

export function useTelarStore(): Store {
  const store = useContext(TelarContext)
  if (!store) {
    throw new Error('[Telar] Los hooks de Telar deben usarse dentro de <TelarRoot> o <TelarRootProvider>')
  }
  return store
}
