<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import type { OrthographicCamera } from 'three'
  import { updateCameraFrustum } from './camera.js'
  import type { Engine } from './engine.svelte.js'

  interface Props {
    engine: Engine
  }

  let { engine }: Props = $props()

  const { size } = useThrelte()

  let ref: OrthographicCamera | undefined = $state()

  $effect(() => {
    if (!ref) return
    const { width, height } = $size
    updateCameraFrustum(ref, width, height)
    engine.viewport = {
      width,
      height,
      dpr: typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1,
    }
    engine.camera = ref
  })
</script>

<!--
  near/far en unidades de mundo. Con z=100 en cámara y objetos en z=0,
  hay 100 unidades de profundidad disponibles antes del near plane.
-->
<T.OrthographicCamera
  makeDefault
  near={0.1}
  far={1000}
  position.z={100}
  bind:ref={ref}
/>
