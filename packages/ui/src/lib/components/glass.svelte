<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { Color, PlaneGeometry, ShaderMaterial } from 'three'
  import type { Mesh, Texture } from 'three'
  import vertexShader from '../shaders/glass.vert.glsl'
  import fragmentShader from '../shaders/glass.frag.glsl'
  import { createGlassUniforms } from '../shaders/glass.uniforms.js'
  import {
    createBackgroundRenderTarget,
    installCaptureHook,
    uninstallCaptureHook,
  } from '../core/background-capture.js'
  import { useEngine } from '../core/engine.svelte.js'

  interface Props {
    width: number
    height: number
    /**
     * Radio de esquinas en píxeles.
     * @default 16
     */
    radius?: number
    /**
     * Índice de refracción. 1.0 = sin distorsión, 1.5 = vidrio estándar.
     * @default 1.4
     */
    ior?: number
    /**
     * Multiplicador de la intensidad de distorsión.
     * @default 0.3
     */
    distortion?: number
    /**
     * Desplazamiento cromático entre canales R y B. 0 = sin aberración.
     * @default 0.015
     */
    chromaticAberration?: number
    /**
     * Color de tinte CSS sobre el fondo refractado.
     * @default '#ffffff'
     */
    tint?: string
    /**
     * Opacidad del tinte [0..1]. 0 = glass puro sin tinte.
     * @default 0
     */
    tintOpacity?: number
    /** Suavidad del borde AA en píxeles. @default 1.5 */
    softness?: number
    /**
     * Textura equirectangular para IBL (cargada externamente con EXRLoader).
     * null = sin reflejo de entorno.
     */
    envMap?: Texture | null
    /**
     * Intensidad del reflejo del entorno [0..1].
     * @default 0
     */
    envIntensity?: number
    x?: number
    y?: number
    z?: number
  }

  let {
    width,
    height,
    radius = 16,
    ior = 1.4,
    distortion = 0.3,
    chromaticAberration = 0.015,
    tint = '#ffffff',
    tintOpacity = 0,
    softness = 1.5,
    envMap = null,
    envIntensity = 0,
    x = 0,
    y = 0,
    z = 0,
  }: Props = $props()

  const { invalidate } = useThrelte()
  const engine = useEngine()

  // Geometría unit plane — se escala vía mesh.scale igual que <Rect>
  const geometry = new PlaneGeometry(1, 1)

  // RenderTarget para captura de fondo
  const renderTarget = createBackgroundRenderTarget(
    engine.viewport.width || 1,
    engine.viewport.height || 1,
  )

  const _tint = new Color(tint)

  const uniforms = createGlassUniforms({
    width,
    height,
    resolutionW: engine.viewport.width || 1,
    resolutionH: engine.viewport.height || 1,
    radius,
    softness,
    ior,
    distortion,
    chromaticAberration,
    tintR: _tint.r,
    tintG: _tint.g,
    tintB: _tint.b,
    tintA: tintOpacity,
    background: renderTarget.texture,
    envMap,
    envIntensity,
  })

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  })

  let mesh: Mesh | undefined = $state()

  // Instalar/desinstalar hook de captura cuando el mesh esté listo
  $effect(() => {
    if (!mesh) return
    installCaptureHook(mesh, renderTarget)
    return () => uninstallCaptureHook(mesh!)
  })

  // Sincronizar uniforms y RenderTarget con cambios de props y viewport
  $effect(() => {
    if (!mesh) return

    const { width: vw, height: vh } = engine.viewport

    // Redimensionar RenderTarget si el viewport cambió
    if (renderTarget.width !== vw || renderTarget.height !== vh) {
      renderTarget.setSize(vw, vh)
    }

    mesh.scale.set(width, height, 1)

    uniforms.u_size.value.set(width, height)
    uniforms.u_resolution.value.set(vw, vh)
    uniforms.u_radius.value = radius
    uniforms.u_ior.value = ior
    uniforms.u_distortion.value = distortion
    uniforms.u_chromatic_aberration.value = chromaticAberration
    uniforms.u_softness.value = softness

    const c = new Color(tint)
    uniforms.u_tint.value.set(c.r, c.g, c.b, tintOpacity)

    uniforms.u_env_map.value = envMap
    uniforms.u_env_intensity.value = envIntensity

    invalidate()
  })

  // Cleanup al destruir el componente
  $effect(() => {
    return () => {
      renderTarget.dispose()
      geometry.dispose()
      material.dispose()
    }
  })
</script>

<T.Mesh
  position.x={x}
  position.y={y}
  position.z={z}
  scale.x={width}
  scale.y={height}
  scale.z={1}
  bind:ref={mesh}
>
  <T is={geometry} />
  <T is={material} />
</T.Mesh>
