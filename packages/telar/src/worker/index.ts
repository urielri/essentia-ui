import type { MainToWorker } from './worker-messages'

/**
 * Crea un Dedicated Worker para persistir el store de Telar en IndexedDB.
 *
 * Cada llamada retorna una instancia nueva e independiente.
 * Para aislar el store entre tabs, crear el Worker fuera del ciclo de render
 * (a nivel de módulo o en el punto de entrada de la app).
 *
 * Requiere soporte del bundler para el patrón `new URL(..., import.meta.url)`
 * (Vite, webpack 5, esbuild).
 *
 * @example
 * import { createTelarWorker } from '@repo/telar/worker'
 *
 * const worker = createTelarWorker()
 *
 * function App() {
 *   return (
 *     <TelarRoot worker={worker}>
 *       <MyApp />
 *     </TelarRoot>
 *   )
 * }
 */
export function createTelarWorker(): Worker {
  return new Worker(new URL('./store.worker.ts', import.meta.url), { type: 'module' })
}

/**
 * Invalida el store persistido en IndexedDB y, opcionalmente,
 * limpia las entradas `uiCache` de sessionStorage.
 *
 * - Sin `keys`: borra todos los valores almacenados en IDB.
 * - Con `keys`: borra solo las entradas indicadas en IDB.
 * - Con `uiCacheNodes`: borra también las entradas de sessionStorage
 *   correspondientes a esos nodos.
 *
 * El store en memoria del main thread no se modifica — los componentes
 * siguen mostrando sus valores actuales hasta que la app se recargue
 * o se reseteen los nodos manualmente.
 *
 * Casos de uso típicos: logout, reset de la aplicación, cambio de usuario.
 *
 * @example
 * // Logout — borrar todo (IDB + uiCache)
 * invalidatePersistedStore(worker, undefined, [themeKnot, noteKnot])
 *
 * // Borrar solo entradas específicas
 * invalidatePersistedStore(worker, ['cart', 'session'], [cartBind])
 */
export function invalidatePersistedStore(
  worker:        Worker,
  keys?:         string[],
  uiCacheNodes?: readonly { key: string }[],
): void {
  worker.postMessage({ type: 'clear', keys } satisfies MainToWorker)
  if (uiCacheNodes) {
    for (const node of uiCacheNodes) {
      try { sessionStorage.removeItem('telar:' + node.key) } catch {}
    }
  }
}
