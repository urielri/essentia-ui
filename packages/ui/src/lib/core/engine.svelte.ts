import { getContext, setContext } from 'svelte'
import type { OrthographicCamera } from 'three'

const ENGINE_KEY = Symbol('essentia-engine')

export type Viewport = {
  width: number
  height: number
  /** Device pixel ratio del canvas actual */
  dpr: number
}

/**
 * Estado global del engine. Creado una vez por EssentiaRoot
 * y compartido hacia abajo via Svelte context.
 *
 * Se accede con useEngine() dentro del árbol de componentes.
 */
export class Engine {
  viewport: Viewport = $state({ width: 0, height: 0, dpr: 1 })
  tick: number = $state(0)
  camera: OrthographicCamera | null = $state(null)
}

export function createEngine(): Engine {
  const engine = new Engine()
  setContext(ENGINE_KEY, engine)
  return engine
}

export function useEngine(): Engine {
  const engine = getContext<Engine | undefined>(ENGINE_KEY)
  if (!engine) {
    throw new Error('[Essentia] useEngine() debe llamarse dentro de un EssentiaRoot')
  }
  return engine
}
