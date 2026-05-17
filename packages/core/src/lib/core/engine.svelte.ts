import { getContext, setContext } from 'svelte'
import type { Mesh, OrthographicCamera, Texture, WebGLRenderTarget } from 'three'

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
  /** Textura de entorno compartida por toda la escena. Asignada por EssentiaRoot. */
  envMap: Texture | null = $state(null)
  /** RenderTarget compartido de captura de fondo. Asignado por BackgroundCapture. */
  backgroundTarget: WebGLRenderTarget | null = $state(null)
  /**
   * Registro de meshes Glass activos en escena.
   * BackgroundCapture los oculta durante la captura para que no aparezcan en su propio fondo.
   * No es $state — no necesita reactividad, es un Set mutable de referencias.
   */
  glassMeshes: Set<Mesh> = new Set()
  /**
   * Registro de meshes foreground (Text, etc.) que deben excluirse de la captura de fondo.
   * Sin esto, los labels que están encima del Glass aparecen como fantasmas a través de él.
   * No es $state — es un Set mutable de referencias.
   */
  foregroundMeshes: Set<Mesh> = new Set()
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
