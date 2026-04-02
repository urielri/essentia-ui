import type { IUniform, Texture } from 'three'
import { Vector2, Vector4 } from 'three'

export type GlassUniforms = {
  u_background: IUniform<Texture | null>
  u_resolution: IUniform<Vector2>
  u_size: IUniform<Vector2>
  u_radius: IUniform<number>
  u_softness: IUniform<number>
  u_ior: IUniform<number>
  u_distortion: IUniform<number>
  u_chromatic_aberration: IUniform<number>
  u_tint: IUniform<Vector4>
}

export type GlassUniformsParams = {
  width: number
  height: number
  resolutionW: number
  resolutionH: number
  radius: number
  softness: number
  ior: number
  distortion: number
  chromaticAberration: number
  tintR: number
  tintG: number
  tintB: number
  tintA: number
  background: Texture | null
}

export function createGlassUniforms(p: GlassUniformsParams): GlassUniforms {
  return {
    u_background: { value: p.background },
    u_resolution: { value: new Vector2(p.resolutionW, p.resolutionH) },
    u_size: { value: new Vector2(p.width, p.height) },
    u_radius: { value: p.radius },
    u_softness: { value: p.softness },
    u_ior: { value: p.ior },
    u_distortion: { value: p.distortion },
    u_chromatic_aberration: { value: p.chromaticAberration },
    u_tint: { value: new Vector4(p.tintR, p.tintG, p.tintB, p.tintA) },
  }
}
