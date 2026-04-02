import type { IUniform } from 'three'
import { Vector2, Vector4 } from 'three'

export type SdfRectUniforms = {
  /** Tamaño del widget en píxeles. Debe coincidir con mesh.scale. */
  u_size: IUniform<Vector2>
  /** Radio de esquinas en píxeles. Máximo efectivo: min(width, height) / 2. */
  u_radius: IUniform<number>
  /** Color RGBA [0..1]. Alpha se combina con el SDF alpha para el borde. */
  u_color: IUniform<Vector4>
  /** Ancho del borde AA en píxeles. Recomendado: 1.0–2.0. */
  u_softness: IUniform<number>
}

export function createSdfRectUniforms(
  width: number,
  height: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  a: number,
  softness = 1.5,
): SdfRectUniforms {
  return {
    u_size: { value: new Vector2(width, height) },
    u_radius: { value: radius },
    u_color: { value: new Vector4(r, g, b, a) },
    u_softness: { value: softness },
  }
}
