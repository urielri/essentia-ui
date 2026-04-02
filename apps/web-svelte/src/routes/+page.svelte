<script lang="ts">
  import { EssentiaRoot, Rect } from 'essentia/ui'
</script>

<div class="stage">
  <EssentiaRoot>

    <!--
      ── Fase 2: SDF Rect ──────────────────────────────────────────
      Coordenadas en píxeles. Origen (0,0) = centro del canvas.
    -->

    <!-- Fila 1 — Radio de esquinas: 0 → 8 → 18 → pill -->
    <Rect width={110} height={52} radius={0}   color="#6c63ff" x={-255} y={100} />
    <Rect width={110} height={52} radius={8}   color="#6c63ff" x={-85}  y={100} />
    <Rect width={110} height={52} radius={18}  color="#6c63ff" x={85}   y={100} />
    <Rect width={110} height={52} radius={999} color="#6c63ff" x={255}  y={100} />

    <!-- Fila 2 — Paleta de colores -->
    <Rect width={110} height={52} radius={12} color="#ff6584" x={-255} y={20} />
    <Rect width={110} height={52} radius={12} color="#43c6ac" x={-85}  y={20} />
    <Rect width={110} height={52} radius={12} color="#f8b500" x={85}   y={20} />
    <Rect width={110} height={52} radius={12} color="#e8c3f8" x={255}  y={20} />

    <!-- Fila 3 — Degradado de opacidad: 100% → 8% -->
    <Rect width={110} height={52} radius={12} color="#ffffff" opacity={1.0}  x={-255} y={-60} />
    <Rect width={110} height={52} radius={12} color="#ffffff" opacity={0.6}  x={-85}  y={-60} />
    <Rect width={110} height={52} radius={12} color="#ffffff" opacity={0.3}  x={85}   y={-60} />
    <Rect width={110} height={52} radius={12} color="#ffffff" opacity={0.08} x={255}  y={-60} />

    <!-- Fila 4 — Tamaños variados -->
    <Rect width={52}  height={52}  radius={10} color="#ff6584" x={-255} y={-150} />
    <Rect width={110} height={52}  radius={10} color="#43c6ac" x={-140} y={-150} />
    <Rect width={200} height={52}  radius={10} color="#f8b500" x={10}   y={-150} />
    <Rect width={52}  height={100} radius={10} color="#6c63ff" x={170}  y={-126} />

  </EssentiaRoot>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #08080f;
  }

  .stage {
    width: 100vw;
    height: 100vh;
  }
</style>
