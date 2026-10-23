import { WebGLRenderTarget, LinearFilter, RGBAFormat } from 'three'
import type { Object3D } from 'three'

/**
 * Crea un WebGLRenderTarget configurado para captura de fondo.
 * LinearFilter para sampling suave. Sin mipmap (UI a resolución nativa).
 */
export function createBackgroundRenderTarget(
  width: number,
  height: number,
): WebGLRenderTarget {
  return new WebGLRenderTarget(width, height, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBAFormat,
    generateMipmaps: false,
  })
}

/**
 * Prepara la escena para la captura de fondo: oculta los Glass y todo
 * renderable que quede delante del Glass más profundo (z de mundo mayor).
 * Sin esto, el texto o las primitivas apiladas sobre un Glass entran en la
 * textura de fondo y el Glass los refracta como una copia desplazada.
 *
 * Los objetos a la misma z que el Glass siguen capturándose (hermanos de
 * fondo con z por defecto). Asume `matrixWorld` actualizado.
 *
 * @param hidden array reutilizable (sin allocations por frame); se vacía y
 *   recibe los objetos ocultados para `restoreBackgroundCapture`.
 */
export function hideForBackgroundCapture(
  scene: Object3D,
  glassMeshes: Iterable<Object3D>,
  hidden: Object3D[],
): void {
  hidden.length = 0

  let minGlassZ = Infinity
  for (const m of glassMeshes) {
    if (!m.visible) continue
    minGlassZ = Math.min(minGlassZ, m.matrixWorld.elements[14])
    m.visible = false
    hidden.push(m)
  }
  if (minGlassZ === Infinity) return

  scene.traverseVisible((obj) => {
    if (!isRenderable(obj)) return
    if (obj.matrixWorld.elements[14] <= minGlassZ) return
    obj.visible = false
    hidden.push(obj)
  })
}

/**
 * Restaura la visibilidad de los objetos ocultados por
 * `hideForBackgroundCapture`.
 */
export function restoreBackgroundCapture(hidden: Object3D[]): void {
  for (const obj of hidden) obj.visible = true
  hidden.length = 0
}

function isRenderable(obj: Object3D): boolean {
  const o = obj as Object3D & {
    isMesh?: boolean
    isLine?: boolean
    isPoints?: boolean
    isSprite?: boolean
  }
  return !!(o.isMesh || o.isLine || o.isPoints || o.isSprite)
}
