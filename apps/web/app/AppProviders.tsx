'use client'

import { useEffect, type ReactNode } from 'react'
import { TelarRootProvider, TelarPersistence, useKnot } from '@repo/telar/react'
import { appThemeKnot } from '../state/theme'

function ThemeSync() {
  const [theme] = useKnot(appThemeKnot)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TelarRootProvider>
      <TelarPersistence persistedNodes={[appThemeKnot]}>
        <ThemeSync />
        {children}
      </TelarPersistence>
    </TelarRootProvider>
  )
}
