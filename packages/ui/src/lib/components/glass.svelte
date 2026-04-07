<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { GlassNode } from '../nodes/glass-node.js'
  import { useEngine } from '../core/engine.svelte.js'

  interface Props {
    width: number
    height: number
    /** Radio de esquinas en píxeles. @default 16 */
    radius?: number
    /** Índice de refracción. 1.0 = sin distorsión, 1.5 = vidrio estándar. @default 1.4 */
    ior?: number
    /** Multiplicador de la intensidad de distorsión. @default 0.3 */
    distortion?: number
    /** Desplazamiento cromático entre canales R y B. 0 = sin aberración. @default 0.015 */
    chromaticAberration?: number
    /** Color de tinte CSS sobre el fondo refractado. @default '#ffffff' */
    tint?: string
    /** Opacidad del tinte [0..1]. 0 = glass puro sin tinte. @default 0 */
    tintOpacity?: number
    /** Suavidad del borde AA en píxeles. @default 0 */
    softness?: number
    /**
     * Intensidad del reflejo del entorno [0..1].
     * Usa engine.envMap como fuente (asignado por EssentiaRoot).
     * @default 0
     */
    envIntensity?: number
    /**
     * Radio del kernel de blur en píxeles (frosted glass).
     * 0 = sin blur, valores típicos: 4–20.
     * @default 0
     */
    blur?: number
    /** Intensidad del brillo Fresnel en los bordes [0..1+]. @default 0.06 */
    fresnelStrength?: number
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
    softness = 0,
    envIntensity = 0,
    blur = 0,
    fresnelStrength = 0.06,
    x = 0,
    y = 0,
    z = 0,
  }: Props = $props()

  const { invalidate } = useThrelte()
  const engine = useEngine()

  // Construcción una sola vez. El shell solo orquesta props → setters del nodo.
  const dpr0 = engine.viewport.dpr || 1
  const node = new GlassNode({
    width,
    height,
    resolutionW: (engine.viewport.width || 1) * dpr0,
    resolutionH: (engine.viewport.height || 1) * dpr0,
    radius,
    softness,
    ior,
    distortion,
    chromaticAberration,
    tint,
    tintOpacity,
    background: engine.backgroundTarget?.texture ?? null,
    envMap: engine.envMap,
    envIntensity,
    blur,
    fresnelStrength,
  })

  // Registrar el mesh en el engine para que BackgroundCapture lo oculte
  // durante la captura del fondo. La API del engine sigue siendo Set<Mesh>.
  $effect(() => {
    engine.glassMeshes.add(node.mesh)
    return () => {
      engine.glassMeshes.delete(node.mesh)
    }
  })

  // Sync reactivo: props + viewport → setters del nodo.
  // Single $effect — todos los setters son baratos y atómicos.
  $effect(() => {
    const { width: vw, height: vh, dpr } = engine.viewport

    node.setSize(width, height)
    node.setPosition(x, y, z)
    node.setResolution(vw * dpr, vh * dpr)
    node.setRadius(radius)
    node.setSoftness(softness)
    node.setIor(ior)
    node.setDistortion(distortion)
    node.setChromaticAberration(chromaticAberration)
    node.setTint(tint, tintOpacity)
    node.setBackgroundTexture(engine.backgroundTarget?.texture ?? null)
    node.setEnvMap(engine.envMap)
    node.setEnvIntensity(envIntensity)
    node.setBlur(blur)
    node.setFresnelStrength(fresnelStrength)

    invalidate()
  })

  // Cleanup: destroy() libera geometry + material vía disposables registrados
  // en el constructor del nodo.
  $effect(() => {
    return () => {
      node.destroy()
    }
  })
</script>

<T is={node.root} />
