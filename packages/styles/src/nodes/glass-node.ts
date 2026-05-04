import { Color, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Texture } from 'three'
import vertexShader from '../shaders/glass.vert.glsl'
import fragmentShader from '../shaders/glass.frag.glsl'
import { createGlassUniforms, type GlassUniforms } from '../shaders/glass.uniforms.js'
import { EssentiaNode } from 'essentia-core'

/**
 * Opciones de construcción del GlassNode.
 * Todos los campos visuales son opcionales con defaults sensatos.
 *
 * `resolutionW`/`resolutionH` deben pasarse en **píxeles físicos**
 * (CSS pixels × DPR). Es responsabilidad del shell (componente Svelte)
 * sincronizar estos valores con el viewport real.
 */
export type GlassNodeOptions = {
  width: number
  height: number
  /** Resolución del canvas en píxeles físicos (CSS × DPR). */
  resolutionW: number
  resolutionH: number
  /** Radio de esquinas en píxeles. @default 16 */
  radius?: number
  /** Suavidad del borde AA en píxeles. @default 0 (DPR-aware vía fwidth) */
  softness?: number
  /** Índice de refracción. @default 1.4 */
  ior?: number
  /** Multiplicador de la intensidad de distorsión. @default 0.3 */
  distortion?: number
  /** Desplazamiento cromático entre canales R y B. @default 0.015 */
  chromaticAberration?: number
  /** Color de tinte CSS. @default '#ffffff' */
  tint?: string
  /** Opacidad del tinte [0..1]. @default 0 */
  tintOpacity?: number
  /** Textura de fondo capturada (refracción). @default null */
  background?: Texture | null
  /** Textura equirectangular de entorno (IBL). @default null */
  envMap?: Texture | null
  /** Intensidad del reflejo del entorno [0..1]. @default 0 */
  envIntensity?: number
  /** Radio del kernel de blur en píxeles. @default 0 */
  blur?: number
  /** Intensidad del brillo Fresnel en los bordes. @default 0.06 */
  fresnelStrength?: number
}

/**
 * Nodo de UI que renderiza un panel de cristal líquido con refracción,
 * SDF rounded corners, blur opcional, IBL y aberración cromática.
 *
 * Encapsula la creación y disposición de los recursos GPU (geometry, material,
 * uniforms) y expone una API tipada para mutar cada parámetro visual.
 *
 * El `root` del nodo es directamente el `Mesh` — esto permite que el scene graph
 * de Three.js herede transformaciones desde un padre `EssentiaNode` sin nodos
 * intermedios.
 */
export class GlassNode extends EssentiaNode {
  readonly mesh: Mesh
  readonly material: ShaderMaterial
  readonly geometry: PlaneGeometry
  readonly uniforms: GlassUniforms

  constructor(options: GlassNodeOptions) {
    const geometry = new PlaneGeometry(1, 1)
    const tintColor = new Color(options.tint ?? '#ffffff')

    const uniforms = createGlassUniforms({
      width: options.width,
      height: options.height,
      resolutionW: options.resolutionW,
      resolutionH: options.resolutionH,
      radius: options.radius ?? 16,
      softness: options.softness ?? 0,
      ior: options.ior ?? 1.4,
      distortion: options.distortion ?? 0.3,
      chromaticAberration: options.chromaticAberration ?? 0.015,
      tintR: tintColor.r,
      tintG: tintColor.g,
      tintB: tintColor.b,
      tintA: options.tintOpacity ?? 0,
      background: options.background ?? null,
      envMap: options.envMap ?? null,
      envIntensity: options.envIntensity ?? 0,
      blur: options.blur ?? 0,
      fresnelStrength: options.fresnelStrength ?? 0.06,
    })

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    })

    const mesh = new Mesh(geometry, material)
    mesh.scale.set(options.width, options.height, 1)

    super(mesh)

    this.mesh = mesh
    this.material = material
    this.geometry = geometry
    this.uniforms = uniforms

    // Bounds iniciales coherentes con el tamaño del mesh
    super.setSize(options.width, options.height)

    // Registrar recursos GPU para liberación automática en destroy()
    this.addDisposable(geometry)
    this.addDisposable(material)
  }

  /**
   * Actualiza el tamaño del nodo (bounds + escala del mesh + uniform u_size).
   * Override de EssentiaNode.setSize para mantener GPU y bounds sincronizados.
   */
  override setSize(width: number, height: number): this {
    super.setSize(width, height)
    this.mesh.scale.set(width, height, 1)
    this.uniforms.u_size.value.set(width, height)
    return this
  }

  /**
   * Actualiza la resolución del canvas en píxeles físicos.
   * Crítico para el sampling correcto del backgroundTarget bajo DPR > 1.
   */
  setResolution(physicalWidth: number, physicalHeight: number): this {
    this.uniforms.u_resolution.value.set(physicalWidth, physicalHeight)
    return this
  }

  setRadius(radius: number): this {
    this.uniforms.u_radius.value = radius
    return this
  }

  setSoftness(softness: number): this {
    this.uniforms.u_softness.value = softness
    return this
  }

  setIor(ior: number): this {
    this.uniforms.u_ior.value = ior
    return this
  }

  setDistortion(distortion: number): this {
    this.uniforms.u_distortion.value = distortion
    return this
  }

  setChromaticAberration(amount: number): this {
    this.uniforms.u_chromatic_aberration.value = amount
    return this
  }

  /**
   * Actualiza el tinte. El alpha del Vector4 es la opacidad del tinte
   * (0 = vidrio puro, 1 = color sólido sobre el fondo refractado).
   */
  setTint(color: string, opacity: number): this {
    const c = new Color(color)
    this.uniforms.u_tint.value.set(c.r, c.g, c.b, opacity)
    return this
  }

  setBackgroundTexture(texture: Texture | null): this {
    this.uniforms.u_background.value = texture
    return this
  }

  setEnvMap(texture: Texture | null): this {
    this.uniforms.u_env_map.value = texture
    return this
  }

  setEnvIntensity(intensity: number): this {
    this.uniforms.u_env_intensity.value = intensity
    return this
  }

  setBlur(radiusPx: number): this {
    this.uniforms.u_blur.value = radiusPx
    return this
  }

  setFresnelStrength(strength: number): this {
    this.uniforms.u_fresnel_strength.value = strength
    return this
  }
}
