'use client'

import { useKnot } from '@repo/telar/react'
import { appThemeKnot } from '../state/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useKnot(appThemeKnot)
  return (
    <button
      className="db-theme-toggle"
      onClick={() => setTheme(t => t === 'dark' ? 'soft' : 'dark')}
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? '☀︎' : '●'}
    </button>
  )
}
