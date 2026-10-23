<script lang="ts">
  import { useThrelte, useTask } from '@threlte/core'
  import { useEngine } from './engine.svelte.js'
  import type { Object3D } from 'three'
  import {
    createBackgroundRenderTarget,
    hideForBackgroundCapture,
    restoreBackgroundCapture,
  } from './background-capture.js'

  const { renderer, scene } = useThrelte()
  const engine = useEngine()

  const dpr0 = engine.viewport.dpr || 1
  const renderTarget = createBackgroundRenderTarget(
    Math.round((engine.viewport.width || 1) * dpr0),
    Math.round((engine.viewport.height || 1) * dpr0),
  )

  engine.backgroundTarget = renderTarget

  // Redimensionar cuando cambia el viewport (en píxeles físicos)
  $effect(() => {
    const { width: vw, height: vh, dpr } = engine.viewport
    const pw = Math.round(vw * dpr)
    const ph = Math.round(vh * dpr)
    if (vw > 0 && vh > 0 && (renderTarget.width !== pw || renderTarget.height !== ph)) {
      renderTarget.setSize(pw, ph)
    }
  })

  // Reutilizado entre frames para no alocar en el render loop.
  const hidden: Object3D[] = []

  // Captura de fondo una vez por frame, en mainStage (antes del renderStage de Threlte).
  // Oculta los Glass y lo que está delante de ellos → la textura capturada
  // solo contiene lo que el Glass debe refractar.
  useTask(
    () => {
      if (!engine.camera) return

      // matrixWorld al día para comparar z de mundo (render() lo actualizaría
      // recién después de decidir qué ocultar).
      scene.updateMatrixWorld()
      hideForBackgroundCapture(scene, engine.glassMeshes, hidden)

      const prevTarget = renderer.getRenderTarget()

      try {
        renderer.setRenderTarget(renderTarget)
        renderer.clear()
        renderer.render(scene, engine.camera)
      } finally {
        renderer.setRenderTarget(prevTarget)
        restoreBackgroundCapture(hidden)
      }
    },
    { autoInvalidate: false },
  )

  $effect(() => {
    return () => {
      renderTarget.dispose()
      engine.backgroundTarget = null
    }
  })
</script>
