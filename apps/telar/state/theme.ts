import { knot } from '@repo/telar'

export type AppTheme = 'dark' | 'soft'

export const appThemeKnot = knot<AppTheme>({
  key:     'app-theme',
  default: 'dark',
  uiCache: true,
})
