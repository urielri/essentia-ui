import { knot, bind } from '@repo/telar'

export const THEMES = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
]

export function nextTheme(current: string): string {
  const idx = THEMES.indexOf(current)
  return THEMES[(idx + 1) % THEMES.length]!
}

export const themeKnot = knot({
  key:     'wd-theme',
  default: THEMES[0]!,
  uiCache: true,          // tema se hidrata síncronamente — sin flash de color
})

export const noteKnot = knot({
  key:     'wd-note',
  default: '',
})

export const counterBind = bind({
  key:     'wd-counter',
  default: 0,
  reducers: {
    increment: (state) => state + 1,
    decrement: (state) => Math.max(0, state - 1),
    reset:     ()      => 0,
  },
})

/** Lista de nodos a persistir — se pasa a TelarRoot como `persistedNodes`. */
export const PERSISTED_NODES = [themeKnot, noteKnot, counterBind] as const
