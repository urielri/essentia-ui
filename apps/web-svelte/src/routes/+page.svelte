<script lang="ts">
  import { EssentiaRoot, Rect, Glass } from 'essentia/ui'
</script>

<div class="stage">
  <EssentiaRoot>

    <!--
      ── Fondo — capa de rects (z = 0) ────────────────────────────
      Estos rects son el "contenido" que el glass va a refractar.
    -->

    <!-- Grid de colores distribuido en el fondo -->
    <Rect width={160} height={160} radius={20} color="#6c63ff" x={-300} y={160}  />
    <Rect width={160} height={160} radius={20} color="#ff6584" x={-120} y={160}  />
    <Rect width={160} height={160} radius={20} color="#43c6ac" x={60}   y={160}  />
    <Rect width={160} height={160} radius={20} color="#f8b500" x={240}  y={160}  />

    <Rect width={160} height={160} radius={80} color="#e8c3f8" x={-300} y={-20}  />
    <Rect width={160} height={160} radius={80} color="#ff6584" x={-120} y={-20}  />
    <Rect width={160} height={160} radius={80} color="#43c6ac" x={60}   y={-20}  />
    <Rect width={160} height={160} radius={80} color="#6c63ff" x={240}  y={-20}  />

    <Rect width={160} height={160} radius={0}  color="#f8b500" x={-300} y={-200} />
    <Rect width={160} height={160} radius={0}  color="#6c63ff" x={-120} y={-200} />
    <Rect width={160} height={160} radius={0}  color="#e8c3f8" x={60}   y={-200} />
    <Rect width={160} height={160} radius={0}  color="#ff6584" x={240}  y={-200} />

    <!--
      ── Fase 3: Glass (z = 1, delante del fondo) ──────────────────
      El glass captura lo que hay detrás y aplica refracción IOR.

      Variaciones de izquierda a derecha:
        - IOR y distortion crecientes
        - Aberración cromática creciente
        - Con tinte sutil
    -->

    <!-- Fila superior: variaciones de IOR -->
    <Glass width={140} height={60} radius={14}
      ior={1.1} distortion={0.2} chromaticAberration={0}
      x={-240} y={80} z={1} />

    <Glass width={140} height={60} radius={14}
      ior={1.3} distortion={0.3} chromaticAberration={0.01}
      x={-80} y={80} z={1} />

    <Glass width={140} height={60} radius={14}
      ior={1.5} distortion={0.4} chromaticAberration={0.02}
      x={80} y={80} z={1} />

    <Glass width={140} height={60} radius={14}
      ior={1.8} distortion={0.5} chromaticAberration={0.04}
      x={240} y={80} z={1} />

    <!-- Fila central: glass con tinte -->
    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#6c63ff" tintOpacity={0.15}
      x={-240} y={-20} z={1} />

    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#ff6584" tintOpacity={0.15}
      x={-80} y={-20} z={1} />

    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#43c6ac" tintOpacity={0.15}
      x={80} y={-20} z={1} />

    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#f8b500" tintOpacity={0.15}
      x={240} y={-20} z={1} />

    <!-- Panel grande: glass que cubre múltiples rects del fondo -->
    <Glass width={360} height={100} radius={20}
      ior={1.4} distortion={0.25} chromaticAberration={0.02}
      x={-60} y={-160} z={1} />

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
