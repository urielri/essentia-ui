<script lang="ts">
  import { useThrelte, useTask } from '@threlte/core'
  import { useEngine } from './engine.svelte.js'
  import { createBackgroundRenderTarget } from './background-capture.js'

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

  // Captura de fondo una vez por frame, en mainStage (antes del renderStage de Threlte).
  // Oculta todos los Glass registrados → la textura capturada no incluye Glass.
  useTask(
    () => {
      if (!engine.camera) return

      for (const m of engine.glassMeshes) m.visible = false
      for (const m of engine.foregroundMeshes) m.visible = false

      const prevTarget = renderer.getRenderTarget()

      try {
        renderer.setRenderTarget(renderTarget)
        renderer.clear()
        renderer.render(scene, engine.camera)
      } finally {
        renderer.setRenderTarget(prevTarget)
        for (const m of engine.glassMeshes) m.visible = true
        for (const m of engine.foregroundMeshes) m.visible = true
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
