import type { Mesh } from 'three'

/**
 * Key del contexto Svelte que componentes contenedores (Card, etc.) proveen
 * a sus hijos para indicar que deben registrarse como foreground.
 *
 * Los componentes dentro del contenedor (Text, GlassButton) detectan este
 * contexto y se registran en `engine.foregroundMeshes` para que
 * BackgroundCapture los excluya de la captura.
 */
export const FOREGROUND_CONTEXT_KEY = Symbol('essentia-foreground')

/**
 * Funciones de registro/desregistro que el contenedor provee via contexto.
 */
export type ForegroundContext = {
  register: (mesh: Mesh) => void
  unregister: (mesh: Mesh) => void
}
