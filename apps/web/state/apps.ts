import { knot, bind } from '@repo/telar'

export type App = { id: string; name: string }

// Nodo A — knot simple
export const installedAppsKnot = knot<App[]>({
  key: 'installedApps',
  default: [
    { id: '1', name: 'VSCode' },
    { id: '2', name: 'Chrome' },
    { id: '3', name: 'Slack' },
  ],
})

// Nodo B — bind completamente independiente
export const recentAppsBind = bind({
  key: 'recentApps',
  default: [] as App[],
  reducers: {
    open:   (state, app: App) => [app, ...state.filter((a) => a.id !== app.id)].slice(0, 5),
    clear:  ()                => [],
  },
})
