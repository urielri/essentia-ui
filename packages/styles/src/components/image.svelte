<script lang="ts">
  import { T, useLoader, useThrelte } from '@threlte/core'
  import { useSuspense } from '@threlte/extras'
  import { PlaneGeometry, ShaderMaterial, TextureLoader, Vector2 } from 'three'
  import type { IUniform, Mesh, Texture } from 'three'
  import vertexShader from '../shaders/sdf-rect.vert.glsl'
  import fragmentShader from '../shaders/image.frag.glsl'

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

  const { invalidate, renderer } = useThrelte()

  // Loader compartido de TextureLoader. useLoader cachea por URL — si dos
  // <Image src="x"/> usan el mismo path, comparten la misma Texture en GPU.
  const loader = useLoader(TextureLoader)

  // Hook de Suspense: si el componente está dentro de un <Suspense> (ej. via
  // EssentiaRoot.loading), suspend() hace que el padre espere la carga.
  const suspend = useSuspense()

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

  // Carga reactiva de la textura. Reacciona a cambios de `src`:
  // - Si el src cambia, suscribimos a un nuevo store cacheado.
  // - colorSpace correcto vía transform (output del renderer).
  // - Cleanup: unsub. NO disponemos la Texture porque es propiedad del cache
  //   compartido — disponer aquí rompería otros <Image/> con el mismo src.
  $effect(() => {
    const store = loader.load(src, {
      transform: (tex) => {
        tex.colorSpace = renderer.outputColorSpace
        tex.needsUpdate = true
        return tex
      },
    })

    // Participar en Suspense: AsyncWritable es Promise-like.
    suspend(store as unknown as Promise<unknown>)

    const unsub = store.subscribe((tex) => {
      uniforms.u_texture.value = tex ?? null
      if (tex) invalidate()
    })

    return unsub
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

  // Cleanup: solo recursos propios (geometry, material). La textura vive en
  // el cache de useLoader y se libera cuando el cache se invalide.
  $effect(() => {
    return () => {
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
