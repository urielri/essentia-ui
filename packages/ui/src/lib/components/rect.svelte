<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { Color, PlaneGeometry, ShaderMaterial } from 'three'
  import type { Mesh } from 'three'
  import vertexShader from '../shaders/sdf-rect.vert.glsl'
  import fragmentShader from '../shaders/sdf-rect.frag.glsl'
  import { createSdfRectUniforms } from '../shaders/sdf-rect.uniforms.js'

  interface Props {
    /** Ancho en píxeles (= unidades de mundo con cámara ortográfica 1:1) */
    width: number
    /** Alto en píxeles */
    height: number
    /** Radio de esquinas en píxeles. Máximo efectivo: min(width, height) / 2 */
    radius?: number
    /** Color CSS hex o nombre. Ej: '#1a1a2e', 'white' */
    color?: string
    /** Opacidad global [0..1] */
    opacity?: number
    /**
     * Suavidad del borde en píxeles (anti-aliasing).
     * Valores bajos = bordes más nítidos pero con posible aliasing.
     * Recomendado: 1.0–2.0
     */
    softness?: number
    /** Posición X en coordenadas de mundo (centro del rect) */
    x?: number
    /** Posición Y en coordenadas de mundo (centro del rect) */
    y?: number
    /**
     * Posición Z para ordenamiento de capas.
     * Z mayor = más cerca de la cámara (se renderiza encima).
     */
    z?: number
  }

  let {
    width,
    height,
    radius = 8,
    color = '#ffffff',
    opacity = 1,
    softness = 0,
    x = 0,
    y = 0,
    z = 0,
  }: Props = $props()

  const { invalidate } = useThrelte()

  // Geometría reutilizable — unit plane escalada vía mesh.scale
  // PlaneGeometry(1, 1) mantiene UV [0,1] correcto sin importar la escala del mesh
  const geometry = new PlaneGeometry(1, 1)

  // Parse color una sola vez en construcción
  const _c = new Color(color)

  const uniforms = createSdfRectUniforms(
    width,
    height,
    radius,
    _c.r,
    _c.g,
    _c.b,
    opacity,
    softness,
  )

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  })

  let mesh: Mesh | undefined = $state()

  $effect(() => {
    if (!mesh) return

    // Actualizar escala del mesh cuando cambia el tamaño
    mesh.scale.set(width, height, 1)

    // Actualizar uniforms — mutación directa, Three.js detecta el cambio
    uniforms.u_size.value.set(width, height)
    uniforms.u_radius.value = radius
    uniforms.u_softness.value = softness

    // Re-parsear color solo cuando cambia
    const c = new Color(color)
    uniforms.u_color.value.set(c.r, c.g, c.b, opacity)

    invalidate()
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
