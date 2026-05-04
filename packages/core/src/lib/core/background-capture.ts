import { WebGLRenderTarget, LinearFilter, RGBAFormat } from 'three'

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
