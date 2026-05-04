import { describe, it, expect, vi } from 'vitest'
import { Mesh, PlaneGeometry, ShaderMaterial, Texture, Vector2, Vector4 } from 'three'
import { GlassNode } from '../glass-node.js'

const baseOptions = {
  width: 200,
  height: 100,
  resolutionW: 1920,
  resolutionH: 1080,
}

describe('GlassNode — construcción', () => {
  it('root es un Mesh con PlaneGeometry y ShaderMaterial', () => {
    const node = new GlassNode(baseOptions)
    expect(node.root).toBeInstanceOf(Mesh)
    expect(node.mesh).toBe(node.root)
    expect(node.geometry).toBeInstanceOf(PlaneGeometry)
    expect(node.material).toBeInstanceOf(ShaderMaterial)
  })

  it('aplica width y height a mesh.scale y u_size', () => {
    const node = new GlassNode(baseOptions)
    expect(node.mesh.scale.x).toBe(200)
    expect(node.mesh.scale.y).toBe(100)
    expect(node.uniforms.u_size.value).toEqual(new Vector2(200, 100))
  })

  it('inicializa bounds con width y height', () => {
    const node = new GlassNode(baseOptions)
    expect(node.bounds).toEqual({ width: 200, height: 100 })
  })

  it('inicializa u_resolution con resolutionW/H físicos', () => {
    const node = new GlassNode(baseOptions)
    expect(node.uniforms.u_resolution.value).toEqual(new Vector2(1920, 1080))
  })

  it('aplica defaults cuando no se proveen props opcionales', () => {
    const node = new GlassNode(baseOptions)
    expect(node.uniforms.u_radius.value).toBe(16)
    expect(node.uniforms.u_softness.value).toBe(0)
    expect(node.uniforms.u_ior.value).toBe(1.4)
    expect(node.uniforms.u_distortion.value).toBe(0.3)
    expect(node.uniforms.u_chromatic_aberration.value).toBe(0.015)
    expect(node.uniforms.u_env_intensity.value).toBe(0)
    expect(node.uniforms.u_blur.value).toBe(0)
    expect(node.uniforms.u_fresnel_strength.value).toBe(0.06)
    expect(node.uniforms.u_tint.value).toBeInstanceOf(Vector4)
    expect(node.uniforms.u_tint.value.w).toBe(0)
  })

  it('material está configurado para transparencia sin depthWrite', () => {
    const node = new GlassNode(baseOptions)
    expect(node.material.transparent).toBe(true)
    expect(node.material.depthWrite).toBe(false)
  })
})

describe('GlassNode — setSize', () => {
  it('actualiza bounds, mesh.scale y u_size atómicamente', () => {
    const node = new GlassNode(baseOptions)
    node.setSize(300, 150)

    expect(node.bounds).toEqual({ width: 300, height: 150 })
    expect(node.mesh.scale.x).toBe(300)
    expect(node.mesh.scale.y).toBe(150)
    expect(node.uniforms.u_size.value).toEqual(new Vector2(300, 150))
  })

  it('es chainable', () => {
    const node = new GlassNode(baseOptions)
    expect(node.setSize(50, 50)).toBe(node)
  })
})

describe('GlassNode — setters de uniforms', () => {
  it('setResolution actualiza u_resolution', () => {
    const node = new GlassNode(baseOptions)
    node.setResolution(2560, 1440)
    expect(node.uniforms.u_resolution.value).toEqual(new Vector2(2560, 1440))
  })

  it('setRadius actualiza u_radius', () => {
    const node = new GlassNode(baseOptions)
    node.setRadius(32)
    expect(node.uniforms.u_radius.value).toBe(32)
  })

  it('setSoftness actualiza u_softness', () => {
    const node = new GlassNode(baseOptions)
    node.setSoftness(2)
    expect(node.uniforms.u_softness.value).toBe(2)
  })

  it('setIor actualiza u_ior', () => {
    const node = new GlassNode(baseOptions)
    node.setIor(1.5)
    expect(node.uniforms.u_ior.value).toBe(1.5)
  })

  it('setDistortion actualiza u_distortion', () => {
    const node = new GlassNode(baseOptions)
    node.setDistortion(0.5)
    expect(node.uniforms.u_distortion.value).toBe(0.5)
  })

  it('setChromaticAberration actualiza u_chromatic_aberration', () => {
    const node = new GlassNode(baseOptions)
    node.setChromaticAberration(0.05)
    expect(node.uniforms.u_chromatic_aberration.value).toBe(0.05)
  })

  it('setTint parsea el color y aplica opacity como alpha', () => {
    const node = new GlassNode(baseOptions)
    node.setTint('#ff0000', 0.5)
    const v = node.uniforms.u_tint.value
    expect(v.x).toBeCloseTo(1)
    expect(v.y).toBeCloseTo(0)
    expect(v.z).toBeCloseTo(0)
    expect(v.w).toBe(0.5)
  })

  it('setEnvIntensity actualiza u_env_intensity', () => {
    const node = new GlassNode(baseOptions)
    node.setEnvIntensity(0.8)
    expect(node.uniforms.u_env_intensity.value).toBe(0.8)
  })

  it('setBlur actualiza u_blur', () => {
    const node = new GlassNode(baseOptions)
    node.setBlur(12)
    expect(node.uniforms.u_blur.value).toBe(12)
  })

  it('setFresnelStrength actualiza u_fresnel_strength', () => {
    const node = new GlassNode(baseOptions)
    node.setFresnelStrength(0.2)
    expect(node.uniforms.u_fresnel_strength.value).toBe(0.2)
  })

  it('setBackgroundTexture acepta Texture o null', () => {
    const node = new GlassNode(baseOptions)
    const tex = new Texture()
    node.setBackgroundTexture(tex)
    expect(node.uniforms.u_background.value).toBe(tex)
    node.setBackgroundTexture(null)
    expect(node.uniforms.u_background.value).toBeNull()
  })

  it('setEnvMap acepta Texture o null', () => {
    const node = new GlassNode(baseOptions)
    const tex = new Texture()
    node.setEnvMap(tex)
    expect(node.uniforms.u_env_map.value).toBe(tex)
    node.setEnvMap(null)
    expect(node.uniforms.u_env_map.value).toBeNull()
  })

  it('todos los setters son chainable', () => {
    const node = new GlassNode(baseOptions)
    expect(node.setResolution(1, 1)).toBe(node)
    expect(node.setRadius(0)).toBe(node)
    expect(node.setSoftness(0)).toBe(node)
    expect(node.setIor(1)).toBe(node)
    expect(node.setDistortion(0)).toBe(node)
    expect(node.setChromaticAberration(0)).toBe(node)
    expect(node.setTint('#000', 0)).toBe(node)
    expect(node.setBackgroundTexture(null)).toBe(node)
    expect(node.setEnvMap(null)).toBe(node)
    expect(node.setEnvIntensity(0)).toBe(node)
    expect(node.setBlur(0)).toBe(node)
    expect(node.setFresnelStrength(0)).toBe(node)
  })
})

describe('GlassNode — destroy', () => {
  it('libera geometry y material vía dispose()', () => {
    const node = new GlassNode(baseOptions)
    const geomSpy = vi.spyOn(node.geometry, 'dispose')
    const matSpy = vi.spyOn(node.material, 'dispose')

    node.destroy()

    expect(geomSpy).toHaveBeenCalledTimes(1)
    expect(matSpy).toHaveBeenCalledTimes(1)
  })

  it('puede llamarse dos veces sin volver a disponer', () => {
    const node = new GlassNode(baseOptions)
    const geomSpy = vi.spyOn(node.geometry, 'dispose')

    node.destroy()
    node.destroy()

    expect(geomSpy).toHaveBeenCalledTimes(1)
  })
})
