<script lang="ts">
  // Imports separados por capa: core (runtime), styles (visual primitives),
  // ui (layout). Cada paquete expone una responsabilidad ortogonal.
  import { useEngine } from 'essentia-core'
  import { Rect, Glass } from 'essentia-styles'
  import { Flex, Box, Align, tailwindParser } from 'essentia-ui'

  const engine = useEngine()

  // Background scenery — varios Rects de colores para visualizar refracción.
  // Distribuidos por todo el viewport para que cualquier Glass refracte algo
  // distinto según su posición.
  const sceneryRects = [
    { x: -300, y: 200, w: 200, h: 280, color: '#ff3366' },
    { x: 300, y: 200, w: 220, h: 240, color: '#33ddff' },
    { x: -250, y: -200, w: 180, h: 200, color: '#33ff88' },
    { x: 280, y: -180, w: 200, h: 220, color: '#ffaa33' },
    { x: 0, y: 0, w: 320, h: 80, color: '#9933ff' },
  ]
</script>

<!--
  Background scenery — fuera del Flex, en world space absoluto.
  Sirve para ver claramente la refracción de los Glass de Flex.
-->
{#each sceneryRects as r, i (i)}
  <Rect x={r.x} y={r.y} z={-1} width={r.w} height={r.h} color={r.color} />
{/each}

<!--
  Flex root sized al viewport. Centramos con `<Align x=0 y=0>` que mide el
  bounding box del subtree y posiciona el group para que su centro caiga en
  (0, 0, 0). `onreflow` re-ejecuta align cada vez que el layout cambia.
  Esto evita el cálculo manual de offsets contra el sistema de coordenadas
  interno de Yoga + threlte/flex.
-->
{#if engine.viewport.width > 0 && engine.viewport.height > 0}
  {@const vw = engine.viewport.width}
  {@const vh = engine.viewport.height}

  <Align x={0} y={0}>
    {#snippet children({ align })}
      <Flex
        width={vw}
        height={vh}
        classParser={tailwindParser}
        class="flex-row items-center justify-center gap-40 p-40"
        onreflow={align}
      >
        <Box flex={1} height={300}>
          {#snippet children({ width, height })}
            <Glass
              {width}
              {height}
              radius={24}
              ior={1.42}
              distortion={0.35}
              chromaticAberration={0.02}
              blur={4}
              fresnelStrength={0.12}
              cursor="pointer"
              onclick={() => console.log('Glass A clicked')}
            />
          {/snippet}
        </Box>

        <Box flex={1} height={300}>
          {#snippet children({ width, height })}
            <Glass
              {width}
              {height}
              radius={24}
              ior={1.42}
              distortion={0.35}
              chromaticAberration={0.02}
              blur={4}
              fresnelStrength={0.12}
              cursor="pointer"
            />
          {/snippet}
        </Box>

        <Box flex={1} height={300}>
          {#snippet children({ width, height })}
            <Glass
              {width}
              {height}
              radius={24}
              ior={1.42}
              distortion={0.35}
              chromaticAberration={0.02}
              blur={4}
              fresnelStrength={0.12}
              cursor="pointer"
            />
          {/snippet}
        </Box>
      </Flex>
    {/snippet}
  </Align>
{/if}
