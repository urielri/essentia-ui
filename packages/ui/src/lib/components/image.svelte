<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { PlaneGeometry, ShaderMaterial, TextureLoader } from 'three'
  import type { Mesh, Texture } from 'three'
  import vertexShader from '../shaders/sdf-rect.vert.glsl'
  import fragmentShader from '../shaders/image.frag.glsl'
  import type { IUniform } from 'three'
  import { Vector2 } from 'three'
  import { useEngine } from '../core/engine.svelte.js'

  interface Props {
    /** URL de la imagen. Puede ser una ruta relativa, absoluta o import de Vite. */
    src: string
    width: number
    height: number
    /** Radio de esquinas en píxeles. @default 0 */
    radius?: number
    /** Opacidad global [0..1]. @default 1 */
    opacity?: number
    /** Suavidad del borde AA en píxeles. @default 1.5 */
    softness?: number
    x?: number
    y?: number
    z?: number
  }

  let {
    src,
    width,
    height,
    radius = 0,
    opacity = 1,
    softness = 1.5,
    x = 0,
    y = 0,
    z = 0,
  }: Props = $props()

  const { invalidate } = useThrelte()
  const engine = useEngine()

  const geometry = new PlaneGeometry(1, 1)

  type ImageUniforms = {
    u_texture: IUniform<Texture | null>
    u_size: IUniform<Vector2>
    u_radius: IUniform<number>
    u_softness: IUniform<number>
    u_opacity: IUniform<number>
  }

  const uniforms: ImageUniforms = {
    u_texture: { value: null },
    u_size: { value: new Vector2(width, height) },
    u_radius: { value: radius },
    u_softness: { value: softness },
    u_opacity: { value: opacity },
  }

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  })

  // Cargar textura cuando cambia src
  $effect(() => {
    new TextureLoader().load(src, (tex) => {
      uniforms.u_texture.value = tex
      invalidate()
    })
  })

  let mesh: Mesh | undefined = $state()

  $effect(() => {
    if (!mesh) return

    mesh.scale.set(width, height, 1)
    mesh.position.set(x, y, z)

    uniforms.u_size.value.set(width, height)
    uniforms.u_radius.value = radius
    uniforms.u_softness.value = softness
    uniforms.u_opacity.value = opacity

    invalidate()
  })

  $effect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
      uniforms.u_texture.value?.dispose()
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
