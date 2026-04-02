import { WebGLRenderTarget, LinearFilter, RGBAFormat, Color } from 'three'
import type { Mesh, Scene, Camera, WebGLRenderer } from 'three'

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
 * Instala el hook de captura de fondo en un mesh de glass.
 *
 * Antes de cada draw call del mesh:
 *   1. Lo oculta para que no aparezca en su propio fondo
 *   2. Renderiza la escena completa al RenderTarget
 *   3. Lo vuelve visible y restaura el render target original
 *
 * El renderTarget.texture queda actualizado y listo para el shader
 * antes de que Three.js ejecute el draw call del mesh.
 */
export function installCaptureHook(
  mesh: Mesh,
  renderTarget: WebGLRenderTarget,
): void {
  const _tmpColor = new Color()

  mesh.onBeforeRender = (
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera,
  ) => {
    const prevTarget = renderer.getRenderTarget()
    const prevClearAlpha = renderer.getClearAlpha()
    renderer.getClearColor(_tmpColor)

    mesh.visible = false

    renderer.setRenderTarget(renderTarget)
    renderer.clear()
    renderer.render(scene, camera)

    renderer.setRenderTarget(prevTarget)
    renderer.setClearColor(_tmpColor, prevClearAlpha)

    mesh.visible = true
  }
}

export function uninstallCaptureHook(mesh: Mesh): void {
  // Restaura el callback vacío por defecto de Three.js
  mesh.onBeforeRender = () => {}
}
